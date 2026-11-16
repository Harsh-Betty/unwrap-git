"use server";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { LEADERBOARD_TAG, setHiddenFromLeaderboard } from "@/lib/leaderboard";
import { currentYear } from "@/lib/year";

// Only ever changes the signed-in user's own rows: the login comes from the
// session, never from the client.
export async function setLeaderboardVisibility(
  hidden: boolean
): Promise<{ success: boolean }> {
  const session = await auth.api.getSession({ headers: await headers() });
  const login = session?.user.name;
  if (!login) return { success: false };

  await setHiddenFromLeaderboard(login, hidden === true, currentYear());
  updateTag(LEADERBOARD_TAG);
  return { success: true };
}
