import { notFound } from "next/navigation";
import { LeaderboardView } from "@/components/LeaderboardView";
import type { Metadata } from "next";
import { currentYear, parseYear } from "@/lib/year";

export async function generateMetadata(
  props: PageProps<"/leaderboard/[year]">
): Promise<Metadata> {
  const { year: yearParam } = await props.params;
  const year = parseYear(yearParam);
  if (year === null) return {};
  return {
    title: `GitHub contributions leaderboard ${year}`,
    description: `The most active developers unwrapped on Unwrap Git in ${year}, ranked by GitHub contributions, with commits, streaks and top languages.`,
    alternates: {
      canonical: year === currentYear() ? "/leaderboard" : `/leaderboard/${year}`,
    },
  };
}

export default async function LeaderboardYearPage(
  props: PageProps<"/leaderboard/[year]">
) {
  const { year: yearParam } = await props.params;
  const year = parseYear(yearParam);
  if (year === null) notFound();
  return <LeaderboardView year={year} />;
}
