import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "./auth";
import { cacheGet, cacheSet } from "./cache";
import {
  fetchUserStats,
  GitHubRateLimitError,
  GitHubUserNotFoundError,
  type UserStats,
} from "./github";
import { recordLeaderboardEntry } from "./leaderboard";
import { checkRateLimit } from "./rate-limiter";
import { normalizeUsername } from "./username";
import { currentYear, isValidYear } from "./year";

export type StatsResult =
  | { ok: true; data: UserStats }
  | {
      ok: false;
      reason: "invalid" | "not_found" | "rate_limited" | "github_busy" | "error";
      // seconds until the visitor can try again, when rate limited
      resetIn?: number;
    };

const HOUR = 60 * 60;
const TTL = {
  // A year in progress changes all day.
  currentYear: 2 * HOUR,
  // A finished year barely changes (late pushes, repository transfers).
  pastYear: 14 * 24 * HOUR,
  notFound: 10 * 60,
};

type CacheEntry = { stats: UserStats } | { notFound: true };

// True when the signed-in user is looking at their own profile. Reads the
// session from its signed cookie cache, so it normally costs no database call.
async function isOwnProfile(
  login: string,
  requestHeaders: Headers
): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: requestHeaders });
    return session?.user.name?.toLowerCase() === login.toLowerCase();
  } catch (error) {
    console.error("Could not read the session:", error);
    return false;
  }
}

// The signed-in user's GitHub token. Only called on a cache miss for their own
// profile, because it reads the account table.
async function ownToken(requestHeaders: Headers): Promise<string | undefined> {
  try {
    const accounts = await auth.api.listUserAccounts({
      headers: requestHeaders,
    });
    const github = accounts.find((account) => account.providerId === "github");
    if (!github) {
      console.warn("Signed-in user has no GitHub account row; using public data");
      return undefined;
    }
    const token = await auth.api.getAccessToken({
      body: { accountId: github.id },
      headers: requestHeaders,
    });
    if (!token.accessToken) {
      console.warn("GitHub account has no access token; using public data");
    }
    return token.accessToken || undefined;
  } catch (error) {
    console.error("Could not read the GitHub token, using public data:", error);
    return undefined;
  }
}

function cacheKey(login: string, year: number, scope: "self" | "pub"): string {
  // "self" entries hold private contribution counts and are only ever read
  // back for that same signed-in user.
  return `stats:v2:${login.toLowerCase()}:${year}:${scope}`;
}

function fromCache(entry: CacheEntry): StatsResult {
  return "stats" in entry
    ? { ok: true, data: entry.stats }
    : { ok: false, reason: "not_found" };
}

// Order matters for cost: a cache hit is a single Redis read, and only a miss
// spends a rate-limit check and GitHub API points.
//
// Wrapped in React `cache` so metadata and the page share one lookup.
export const getStats = cache(
  async (username: string, year: number): Promise<StatsResult> => {
    const login = normalizeUsername(username);
    if (!login || !isValidYear(year)) return { ok: false, reason: "invalid" };

    const requestHeaders = await headers();

    // Own profile: the private-inclusive copy if cached, else fetch the token.
    // No token (or a failed lookup) falls back to the shared public copy.
    const self = await isOwnProfile(login, requestHeaders);
    if (self) {
      const cachedSelf = await cacheGet<CacheEntry>(cacheKey(login, year, "self"));
      if (cachedSelf) return fromCache(cachedSelf);
    }
    const token = self ? await ownToken(requestHeaders) : undefined;
    const key = cacheKey(login, year, token ? "self" : "pub");

    if (!token) {
      const cached = await cacheGet<CacheEntry>(key);
      if (cached) return fromCache(cached);
    }

    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(ip);
    if (!limit.allowed) {
      return { ok: false, reason: "rate_limited", resetIn: limit.resetIn };
    }

    try {
      const stats = await fetchUserStats({ login, year, token });
      // Everyone whose stats are fetched joins that year's leaderboard. The
      // write runs after the response is sent, so it never slows the page,
      // and a database hiccup cannot cost the visitor their page.
      after(() =>
        recordLeaderboardEntry(stats).catch((error: unknown) =>
          console.error("Leaderboard write failed:", error)
        )
      );
      await cacheSet(
        key,
        { stats } satisfies CacheEntry,
        year === currentYear() ? TTL.currentYear : TTL.pastYear
      );
      return { ok: true, data: stats };
    } catch (error) {
      if (error instanceof GitHubUserNotFoundError) {
        await cacheSet(
          key,
          { notFound: true } satisfies CacheEntry,
          TTL.notFound
        );
        return { ok: false, reason: "not_found" };
      }
      if (error instanceof GitHubRateLimitError) {
        return { ok: false, reason: "github_busy" };
      }
      console.error("Error fetching stats:", error);
      return { ok: false, reason: "error" };
    }
  }
);
