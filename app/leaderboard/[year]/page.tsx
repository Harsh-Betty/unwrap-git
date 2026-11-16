import { notFound } from "next/navigation";
import { LeaderboardView } from "@/components/LeaderboardView";
import { parseYear } from "@/lib/year";

export default async function LeaderboardYearPage(
  props: PageProps<"/leaderboard/[year]">
) {
  const { year: yearParam } = await props.params;
  const year = parseYear(yearParam);
  if (year === null) notFound();
  return <LeaderboardView year={year} />;
}
