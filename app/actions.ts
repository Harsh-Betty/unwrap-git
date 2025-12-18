"use server";
import { auth } from "@/lib/auth";
import {
  fetchUserStats,
  fetchUserStatsWithToken,
  type UserStats,
} from "@/lib/github";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";

export interface StatsResult {
  success: boolean;
  data?: UserStats;
  error?: string;
  rateLimited?: boolean;
  resetIn?: number;
  isAuthenticated?: boolean;
}

export async function getPublicStats(username: string): Promise<StatsResult> {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] ?? "unknown";

  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.resetIn} second(s).`,
      rateLimited: true,
      resetIn: rateLimit.resetIn,
    };
  }

  if (!username || username.trim() === "") {
    return {
      success: false,
      error: "Username is required",
    };
  }

  const cleanUsername = username.trim().replace(/^@/, "");

  if (
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername)
  ) {
    return {
      success: false,
      error: "Invalid GitHub username format",
    };
  }

  try {
    const stats = await fetchUserStats(cleanUsername);
    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);

    if (error instanceof Error) {
      if (error.message.includes("Could not resolve to a User")) {
        return {
          success: false,
          error: `User "${cleanUsername}" not found`,
        };
      }
      if (error.message.includes("rate limit")) {
        return {
          success: false,
          error: "GitHub API rate limit exceeded. Please try again later.",
          rateLimited: true,
        };
      }
    }

    return {
      success: false,
      error: "Failed to fetch GitHub stats. Please try again.",
    };
  }
}

export async function getAuthenticatedStats(
  username: string
): Promise<StatsResult> {
  const headersList = await headers();

  // get session from Better Auth
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    // fall back to public stats if not authenticated
    return getPublicStats(username);
  }

  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] ?? "unknown";

  const rateLimit = await checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again in ${rateLimit.resetIn} second(s).`,
      rateLimited: true,
      resetIn: rateLimit.resetIn,
    };
  }

  if (!username || username.trim() === "") {
    return {
      success: false,
      error: "Username is required",
    };
  }

  const cleanUsername = username.trim().replace(/^@/, "");

  if (
    !/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(cleanUsername)
  ) {
    return {
      success: false,
      error: "Invalid GitHub username format",
    };
  }

  try {
    // get the access token from the account linked to the session
    // Better Auth stores OAuth tokens in the account table
    const accounts = await auth.api.listUserAccounts({
      headers: headersList,
    });

    // Better Auth stores accessToken in DB but doesn't expose it in the default type
    const githubAccount = accounts?.find(
      (acc: { providerId: string }) => acc.providerId === "github"
    ) as { providerId: string; accessToken?: string } | undefined;

    if (githubAccount?.accessToken) {
      const stats = await fetchUserStatsWithToken(
        cleanUsername,
        githubAccount.accessToken
      );
      return {
        success: true,
        data: stats,
        isAuthenticated: true,
      };
    }

    // fall back to public stats if no GitHub token
    return getPublicStats(username);
  } catch (error) {
    console.error("Error fetching authenticated stats:", error);

    if (error instanceof Error) {
      if (error.message.includes("Could not resolve to a User")) {
        return {
          success: false,
          error: `User "${cleanUsername}" not found`,
        };
      }
      if (error.message.includes("rate limit")) {
        return {
          success: false,
          error: "GitHub API rate limit exceeded. Please try again later.",
          rateLimited: true,
        };
      }
    }

    return {
      success: false,
      error: "Failed to fetch GitHub stats. Please try again.",
    };
  }
}
