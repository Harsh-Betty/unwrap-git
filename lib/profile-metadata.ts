import "server-only";
import type { Metadata } from "next";
import { getArchetype } from "./archetype";
import { getStats } from "./stats";
import { profilePath } from "./year";

function plural(count: number, word: string): string {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

// Shares the page's stats lookup (getStats is wrapped in React cache), so
// metadata costs no extra GitHub or Redis call.
export async function profileMetadata(
  login: string,
  year: number
): Promise<Metadata> {
  const result = await getStats(login, year);
  if (!result.ok) {
    return {
      title: result.reason === "not_found" ? "User not found" : `@${login}`,
      robots: { index: false, follow: true },
    };
  }

  const stats = result.data;
  const { user, contributions, insights, languages } = stats;
  const name = user.name ? `${user.name} (@${user.login})` : `@${user.login}`;
  const period = stats.isYtd ? `${year} so far` : `${year}`;
  const top = languages[0];
  const archetype = getArchetype(stats);

  const description = [
    `${name} made ${plural(contributions.total, "contribution")} on GitHub in ${period}:`,
    `${plural(contributions.commits, "commit")}, ${plural(contributions.pullRequests, "pull request")} and ${plural(contributions.pullRequestReviews, "review")}.`,
    top ? `Top language: ${top.name}.` : "",
    `Longest streak: ${plural(insights.longestStreak, "day")}.`,
    `Coding personality: ${archetype.title}.`,
  ]
    .filter(Boolean)
    .join(" ");
  const title = `${name}: GitHub Wrapped ${year}`;
  const path = profilePath(user.login, year);

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "profile", title, description, url: path, username: user.login },
    twitter: { card: "summary_large_image", title, description },
  };
}
