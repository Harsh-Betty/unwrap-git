"use server";
import { fetchUserStats, type UserStats } from "@/lib/github";
import { checkRateLimit } from "@/lib/rate-limiter";
import { headers } from "next/headers";

export interface StatsResult {
  success: boolean;
  data?: UserStats;
  error?: string;
  rateLimited?: boolean;
  resetIn?: number;
}

export async function getPublicStats(username: string): Promise<StatsResult> {
  // client IP for rate limiting
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0] ?? "unknown";

  const rateLimit = checkRateLimit(ip);
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
