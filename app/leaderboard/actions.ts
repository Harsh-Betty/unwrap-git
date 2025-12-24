"use server";
import { supabase, type LeaderboardEntry } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import type { UserStats } from "@/lib/github";
import { headers } from "next/headers";

export interface LeaderboardResult {
  success: boolean;
  data?: LeaderboardEntry[];
  error?: string;
}

export interface JoinLeaderboardResult {
  success: boolean;
  error?: string;
}

export async function getLeaderboard(limit = 50): Promise<LeaderboardResult> {
  try {
    const { data, error } = await supabase
      .from("leaderboard_stats")
      .select("*")
      .order("total_contributions", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Leaderboard fetch error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as LeaderboardEntry[] };
  } catch (err) {
    console.error("Leaderboard error:", err);
    return { success: false, error: "Failed to fetch leaderboard" };
  }
}

export async function checkUserInLeaderboard(
  username: string
): Promise<{ exists: boolean }> {
  try {
    const { data } = await supabase
      .from("leaderboard_stats")
      .select("id")
      .eq("username", username)
      .single();

    return { exists: !!data };
  } catch {
    return { exists: false };
  }
}

export async function joinLeaderboard(
  stats: UserStats
): Promise<JoinLeaderboardResult> {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) {
    return {
      success: false,
      error: "You must be logged in to join the leaderboard",
    };
  }

  try {
    // check if user already joined
    const { data: existing } = await supabase
      .from("leaderboard_stats")
      .select("id")
      .eq("username", stats.user.login)
      .single();

    const leaderboardData = {
      username: stats.user.login,
      total_commits: stats.contributions.commits,
      total_contributions: stats.contributions.total,
      top_language: stats.languages[0]?.name || "Unknown",
      avatar_url: stats.user.avatarUrl,
      opt_in_date: new Date().toISOString(),
    };

    if (existing) {
      // update existing entry
      const { error } = await supabase
        .from("leaderboard_stats")
        .update(leaderboardData)
        .eq("id", existing.id);

      if (error) {
        console.error("Leaderboard update error:", error);
        return { success: false, error: error.message };
      }
    } else {
      // insert new entry
      const { error } = await supabase
        .from("leaderboard_stats")
        .insert(leaderboardData);

      if (error) {
        console.error("Leaderboard insert error:", error);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (err) {
    console.error("Join leaderboard error:", err);
    return { success: false, error: "Failed to join leaderboard" };
  }
}

// leave leaderboard
export async function leaveLeaderboard(): Promise<JoinLeaderboardResult> {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session?.user) {
    return { success: false, error: "You must be logged in" };
  }

  try {
    const { error } = await supabase
      .from("leaderboard_stats")
      .delete()
      .eq("username", session.user.name);

    if (error) {
      console.error("Leaderboard delete error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Leave leaderboard error:", err);
    return { success: false, error: "Failed to leave leaderboard" };
  }
}
