import { formatPeakDate } from "@/lib/analytics";
import { compact } from "@/lib/archetype";
import type { UserStats } from "@/lib/github";

interface Fact {
  label: string;
  value: React.ReactNode;
}

export function FunFacts({ stats }: { stats: UserStats }) {
  const { insights, commitSample, popularPullRequest } = stats;
  const facts: Fact[] = [];

  if (insights.busiestWeek.count > 0) {
    facts.push({
      label: "Busiest week",
      value: `${compact(insights.busiestWeek.count)} contributions, week of ${formatPeakDate(insights.busiestWeek.start)}`,
    });
  }
  if (insights.longestBreak > 0) {
    facts.push({
      label: "Longest break",
      value: `${insights.longestBreak} ${insights.longestBreak === 1 ? "day" : "days"} without a contribution`,
    });
  }
  const quarters = insights.quarters;
  const bestQuarter = quarters.indexOf(Math.max(...quarters));
  if (quarters[bestQuarter] > 0) {
    facts.push({
      label: "Strongest quarter",
      value: `Q${bestQuarter + 1}, with ${compact(quarters[bestQuarter])} contributions`,
    });
  }
  if (popularPullRequest) {
    facts.push({
      label: "Most popular pull request",
      value: (
        <>
          &ldquo;{popularPullRequest.title}&rdquo;{" "}
          <span className="text-terminal/70">in {popularPullRequest.repo}</span>
        </>
      ),
    });
  }

  const words = commitSample?.topWords ?? [];
  if (facts.length === 0 && words.length === 0) return null;

  return (
    <section
      aria-labelledby="fun-facts-title"
      className="p-4 bg-terminal-bg rounded border border-terminal/15"
    >
      <h2 id="fun-facts-title" className="text-terminal font-bold">
        Fun facts
      </h2>
      <dl className="mt-3 space-y-3 text-sm">
        {facts.map((fact) => (
          <div key={fact.label}>
            <dt className="text-terminal/70 text-xs">{fact.label}</dt>
            <dd className="text-terminal/90">{fact.value}</dd>
          </div>
        ))}
      </dl>
      {words.length > 0 && (
        <div className="mt-4">
          <p className="text-terminal/70 text-xs">
            Words you wrote most in commit messages
          </p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {words.map((word) => (
              <li
                key={word.word}
                className="px-2 py-1 text-xs rounded border border-terminal/30 text-terminal"
              >
                {word.word}{" "}
                <span className="text-terminal/70 tabular-nums">
                  ×{word.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
