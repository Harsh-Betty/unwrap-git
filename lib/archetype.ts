import type { UserStats } from "./github";

export interface Archetype {
  title: string;
  // One line on why, in plain words, built from the user's own numbers.
  reason: string;
}

function share(part: number, whole: number): number {
  return whole > 0 ? part / whole : 0;
}

function sumHours(hours: number[], from: number, to: number): number {
  // Inclusive range that may wrap past midnight (e.g. 22 to 3).
  let total = 0;
  for (let h = from; h !== (to + 1) % 24; h = (h + 1) % 24) total += hours[h];
  return total;
}

// The first rule that matches wins, so the order runs from the most
// distinctive habit to the most common one.
export function getArchetype(stats: UserStats): Archetype {
  const { insights, languages, contributions, commitSample, repos } = stats;
  const sampled = commitSample?.commits ?? 0;

  if (commitSample && sampled >= 30) {
    const night = share(sumHours(commitSample.hours, 22, 3), sampled);
    if (night >= 0.3) {
      return {
        title: "Night Owl",
        reason: `${Math.round(night * 100)}% of sampled commits landed between 10 pm and 4 am`,
      };
    }
    const early = share(sumHours(commitSample.hours, 5, 8), sampled);
    if (early >= 0.25) {
      return {
        title: "Early Bird",
        reason: `${Math.round(early * 100)}% of sampled commits landed between 5 and 9 am`,
      };
    }
  }

  if (insights.weekendWarrior >= 35) {
    return {
      title: "Weekend Warrior",
      reason: `${insights.weekendWarrior}% of contributions happened on weekends`,
    };
  }

  const reviewShare = share(contributions.pullRequestReviews, contributions.total);
  if (contributions.pullRequestReviews >= 25 && reviewShare >= 0.2) {
    return {
      title: "The Reviewer",
      reason: `${contributions.pullRequestReviews.toLocaleString("en-US")} pull request reviews`,
    };
  }

  const repoTotal = repos.reduce((sum, repo) => sum + repo.total, 0);
  const othersTotal = repos
    .filter((repo) => !repo.isOwn)
    .reduce((sum, repo) => sum + repo.total, 0);
  if (repoTotal >= 20 && share(othersTotal, repoTotal) >= 0.5) {
    return {
      title: "Open Sourcerer",
      reason: `${Math.round(share(othersTotal, repoTotal) * 100)}% of work went to other people's repositories`,
    };
  }

  if (insights.longestStreak >= 30) {
    return {
      title: "Marathoner",
      reason: `${insights.longestStreak} days in a row without missing one`,
    };
  }

  if (
    insights.peakDay.count >= Math.max(20, insights.averagePerDay * 10) &&
    insights.codeDedication < 40
  ) {
    return {
      title: "Sprinter",
      reason: `Short bursts, like ${insights.peakDay.count} contributions in a single day`,
    };
  }

  if (languages.length >= 5 && (languages[0]?.share ?? 1) < 0.5) {
    return {
      title: "Polyglot",
      reason: `${languages.length} languages, none above half`,
    };
  }

  if (insights.codeDedication >= 70) {
    return {
      title: "The Relentless",
      reason: `Active on ${insights.codeDedication}% of days`,
    };
  }

  const top = languages[0];
  return top
    ? {
        title: `${top.name} Specialist`,
        reason: `${Math.round(top.share * 100)}% of commits were ${top.name}`,
      }
    : { title: "Explorer", reason: "Still finding a favourite language" };
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? "am" : "pm";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return `${twelve} ${suffix}`;
}

export function compact(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);
}
