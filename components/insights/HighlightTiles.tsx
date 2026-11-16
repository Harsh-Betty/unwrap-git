import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { compact } from "@/lib/archetype";
import type { UserStats } from "@/lib/github";

interface Tile {
  label: string;
  value: string;
  detail?: React.ReactNode;
}

function YearOverYear({ stats }: { stats: UserStats }) {
  const previous = stats.contributions.previousYearTotal;
  const current = stats.contributions.total;
  const period = stats.isYtd ? `same point in ${stats.year - 1}` : `${stats.year - 1}`;
  if (previous === 0) {
    return <span>Nothing in the {period}</span>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus;
  return (
    <span className="inline-flex items-center gap-1">
      <Icon className="w-3.5 h-3.5" aria-hidden="true" />
      {change > 0 ? "+" : ""}
      {change}% vs {period}
    </span>
  );
}

// Headline numbers as stat tiles: one value per tile, with the context that
// makes it mean something underneath.
export function HighlightTiles({ stats }: { stats: UserStats }) {
  const { contributions, commitSample } = stats;
  const merged = contributions.mergedPullRequests;

  const tiles: Tile[] = [
    {
      label: "Contributions",
      value: compact(contributions.total),
      detail: <YearOverYear stats={stats} />,
    },
    {
      label: "Pull requests merged",
      value: merged === null ? "–" : compact(merged),
      detail:
        merged !== null && contributions.pullRequests > 0
          ? `of ${compact(contributions.pullRequests)} opened`
          : undefined,
    },
    {
      label: "Repositories",
      value: compact(contributions.reposContributedTo),
      detail: "with your commits",
    },
  ];

  if (commitSample) {
    tiles.push({
      label: "Lines changed",
      value: `+${compact(commitSample.additions)}`,
      detail: `−${compact(commitSample.deletions)} in ${compact(commitSample.commits)} sampled commits`,
    });
  } else {
    tiles.push({
      label: "Reviews",
      value: compact(contributions.pullRequestReviews),
      detail: "pull requests reviewed",
    });
  }

  return (
    <dl className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex flex-col p-3 bg-terminal-bg rounded border border-terminal/15"
        >
          <dt className="text-terminal/70 text-xs order-1">{tile.label}</dt>
          <dd className="text-terminal text-2xl font-bold tabular-nums order-0">
            {tile.value}
          </dd>
          {tile.detail && (
            <dd className="text-terminal/70 text-xs mt-1 order-2">
              {tile.detail}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
