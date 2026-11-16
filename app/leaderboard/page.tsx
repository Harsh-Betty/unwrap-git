import { LeaderboardView } from "@/components/LeaderboardView";
import type { Metadata } from "next";
import { currentYear } from "@/lib/year";

export function generateMetadata(): Metadata {
  const year = currentYear();
  return {
    title: `GitHub contributions leaderboard ${year}`,
    description: `The most active developers unwrapped on Unwrap Git in ${year}, ranked by GitHub contributions, with commits, streaks and top languages.`,
    alternates: { canonical: "/leaderboard" },
  };
}

export default function LeaderboardPage() {
  return <LeaderboardView year={currentYear()} />;
}
