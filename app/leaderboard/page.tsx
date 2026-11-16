import { LeaderboardView } from "@/components/LeaderboardView";
import { currentYear } from "@/lib/year";

export default function LeaderboardPage() {
  return <LeaderboardView year={currentYear()} />;
}
