import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "./auth";
import { cacheGet, cacheSet } from "./cache";
import {
  fetchUserStats,
  GitHubRateLimitError,
  GitHubUserNotFoundError,
  type UserStats,
} from "./github";
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

// The signed-in user's GitHub token, only when they are viewing themselves.
async function ownToken(
  login: string,
  requestHeaders: Headers
): Promise<string | undefined> {
  try {
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (session?.user.name?.toLowerCase() !== login.toLowerCase()) {
      return undefined;
    }
    const accounts = await auth.api.listUserAccounts({
      headers: requestHeaders,
    });
    const github = accounts.find((account) => account.providerId === "github");
    if (!github) return undefined;
    const token = await auth.api.getAccessToken({
      body: { accountId: github.id },
      headers: requestHeaders,
    });
    return token.accessToken || undefined;
  } catch (error) {
    console.error("Could not read the GitHub token, using public data:", error);
    return undefined;
  }
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
    const token = await ownToken(login, requestHeaders);

    // "self" entries hold private contribution counts and are only ever read
    // back for that same signed-in user.
    const key = `stats:v2:${login.toLowerCase()}:${year}:${token ? "self" : "pub"}`;

    const cached = await cacheGet<CacheEntry>(key);
    if (cached) {
      return "stats" in cached
        ? { ok: true, data: cached.stats }
        : { ok: false, reason: "not_found" };
    }

    const ip =
      requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = await checkRateLimit(ip);
    if (!limit.allowed) {
      return { ok: false, reason: "rate_limited", resetIn: limit.resetIn };
    }

    try {
      const stats = await fetchUserStats({ login, year, token });
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
