import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  retry: { enabled: true },
  throttle: {
    onRateLimit: (
      retryAfter: number,
      options: { method: string; url: string; request: { retryCount: number } }
    ) => {
      console.warn(`Rate limit hit for ${options.method} ${options.url}`);
      if (options.request.retryCount <= 2) {
        console.log(`Retrying after ${retryAfter} seconds...`);
        return true;
      }
      return false;
    },
    onSecondaryRateLimit: (
      retryAfter: number,
      options: { method: string; url: string }
    ) => {
      console.warn(
        `Secondary rate limit hit for ${options.method} ${options.url}`
      );
      return false;
    },
  },
});

// GQL query - user contributions
const CONTRIBUTIONS_QUERY = `
  query($username: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $username) {
      login
      name
      avatarUrl
      bio
      location
      company
      twitterUsername
      followers {
        totalCount
      }
      following {
        totalCount
      }
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        restrictedContributionsCount
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              weekday
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            nameWithOwner
            isPrivate
            primaryLanguage {
              name
              color
            }
          }
          contributions {
            totalCount
          }
        }
      }
      repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}, ownerAffiliations: OWNER) {
        nodes {
          name
          primaryLanguage {
            name
            color
          }
          stargazerCount
        }
      }
    }
  }
`;

import { computeInsights, type Insights } from "./analytics";

// simple in-memory cache with TTL
const statsCache = new Map<string, { data: UserStats; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedStats(key: string): UserStats | null {
  const cached = statsCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  statsCache.delete(key);
  return null;
}

function setCachedStats(key: string, data: UserStats): void {
  statsCache.set(key, { data, timestamp: Date.now() });
}

export interface UserStats {
  user: {
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    twitterUsername: string | null;
    followers: number;
    following: number;
  };
  contributions: {
    total: number;
    commits: number;
    issues: number;
    pullRequests: number;
    pullRequestReviews: number;
    repositories: number;
    restricted: number;
  };
  calendar: {
    date: string;
    count: number;
    weekday: number;
  }[];
  languages: {
    name: string;
    color: string;
    repoCount: number;
    commitCount: number;
  }[];
  topRepos: {
    name: string;
    language: string | null;
    stars: number;
  }[];
  insights: Insights;
}

export async function fetchUserStats(username: string): Promise<UserStats> {
  // check cache first
  const cacheKey = `public:${username}`;
  const cached = getCachedStats(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const startOf2025 = new Date("2025-01-01T00:00:00Z");
  const endDate =
    now > new Date("2025-12-31T23:59:59Z")
      ? new Date("2025-12-31T23:59:59Z")
      : now;

  const response = await octokit.graphql<{
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      bio: string | null;
      location: string | null;
      company: string | null;
      twitterUsername: string | null;
      followers: { totalCount: number };
      following: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        totalRepositoryContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              date: string;
              contributionCount: number;
              weekday: number;
            }[];
          }[];
        };
        commitContributionsByRepository: {
          repository: {
            name: string;
            nameWithOwner: string;
            isPrivate: boolean;
            primaryLanguage: { name: string; color: string } | null;
          };
          contributions: { totalCount: number };
        }[];
      };
      repositories: {
        nodes: {
          name: string;
          primaryLanguage: { name: string; color: string } | null;
          stargazerCount: number;
        }[];
      };
    };
  }>(CONTRIBUTIONS_QUERY, {
    username,
    from: startOf2025.toISOString(),
    to: endDate.toISOString(),
  });

  const { user } = response;
  const { contributionsCollection } = user;

  const calendar = contributionsCollection.contributionCalendar.weeks.flatMap(
    (week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        weekday: day.weekday,
      }))
  );

  const languageMap = new Map<
    string,
    { color: string; repoCount: number; commitCount: number }
  >();
  for (const repo of contributionsCollection.commitContributionsByRepository) {
    const lang = repo.repository.primaryLanguage;
    if (lang) {
      const existing = languageMap.get(lang.name) || {
        color: lang.color,
        repoCount: 0,
        commitCount: 0,
      };
      existing.repoCount++;
      existing.commitCount += repo.contributions.totalCount;
      languageMap.set(lang.name, existing);
    }
  }

  const languages = Array.from(languageMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.commitCount - a.commitCount);

  const topRepos = user.repositories.nodes.slice(0, 5).map((repo) => ({
    name: repo.name,
    language: repo.primaryLanguage?.name ?? null,
    stars: repo.stargazerCount,
  }));

  const insights = computeInsights(calendar);

  const result: UserStats = {
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      company: user.company,
      twitterUsername: user.twitterUsername,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
    },
    contributions: {
      total: contributionsCollection.contributionCalendar.totalContributions,
      commits: contributionsCollection.totalCommitContributions,
      issues: contributionsCollection.totalIssueContributions,
      pullRequests: contributionsCollection.totalPullRequestContributions,
      pullRequestReviews:
        contributionsCollection.totalPullRequestReviewContributions,
      repositories: contributionsCollection.totalRepositoryContributions,
      restricted: contributionsCollection.restrictedContributionsCount,
    },
    calendar,
    languages,
    topRepos,
    insights,
  };

  setCachedStats(`public:${username}`, result);
  return result;
}

// fetch stats with user's access token (includes private repos)
export async function fetchUserStatsWithToken(
  username: string,
  accessToken: string
): Promise<UserStats> {
  // check cache first
  const cacheKey = `auth:${username}`;
  const cached = getCachedStats(cacheKey);
  if (cached) return cached;

  const userOctokit = new Octokit({
    auth: accessToken,
    retry: { enabled: true },
  });

  const now = new Date();
  const startOf2025 = new Date("2025-01-01T00:00:00Z");
  const endDate =
    now > new Date("2025-12-31T23:59:59Z")
      ? new Date("2025-12-31T23:59:59Z")
      : now;

  const response = await userOctokit.graphql<{
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      bio: string | null;
      location: string | null;
      company: string | null;
      twitterUsername: string | null;
      followers: { totalCount: number };
      following: { totalCount: number };
      contributionsCollection: {
        totalCommitContributions: number;
        totalIssueContributions: number;
        totalPullRequestContributions: number;
        totalPullRequestReviewContributions: number;
        totalRepositoryContributions: number;
        restrictedContributionsCount: number;
        contributionCalendar: {
          totalContributions: number;
          weeks: {
            contributionDays: {
              date: string;
              contributionCount: number;
              weekday: number;
            }[];
          }[];
        };
        commitContributionsByRepository: {
          repository: {
            name: string;
            nameWithOwner: string;
            isPrivate: boolean;
            primaryLanguage: { name: string; color: string } | null;
          };
          contributions: { totalCount: number };
        }[];
      };
      repositories: {
        nodes: {
          name: string;
          primaryLanguage: { name: string; color: string } | null;
          stargazerCount: number;
        }[];
      };
    };
  }>(CONTRIBUTIONS_QUERY, {
    username,
    from: startOf2025.toISOString(),
    to: endDate.toISOString(),
  });

  const { user } = response;
  const { contributionsCollection } = user;

  const calendar = contributionsCollection.contributionCalendar.weeks.flatMap(
    (week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        weekday: day.weekday,
      }))
  );

  const languageMap = new Map<
    string,
    { color: string; repoCount: number; commitCount: number }
  >();
  for (const repo of contributionsCollection.commitContributionsByRepository) {
    const lang = repo.repository.primaryLanguage;
    if (lang) {
      const existing = languageMap.get(lang.name) || {
        color: lang.color,
        repoCount: 0,
        commitCount: 0,
      };
      existing.repoCount++;
      existing.commitCount += repo.contributions.totalCount;
      languageMap.set(lang.name, existing);
    }
  }

  const languages = Array.from(languageMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.commitCount - a.commitCount);

  const topRepos = user.repositories.nodes.slice(0, 5).map((repo) => ({
    name: repo.name,
    language: repo.primaryLanguage?.name ?? null,
    stars: repo.stargazerCount,
  }));

  const insights = computeInsights(calendar);

  const result: UserStats = {
    user: {
      login: user.login,
      name: user.name,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      location: user.location,
      company: user.company,
      twitterUsername: user.twitterUsername,
      followers: user.followers.totalCount,
      following: user.following.totalCount,
    },
    contributions: {
      total: contributionsCollection.contributionCalendar.totalContributions,
      commits: contributionsCollection.totalCommitContributions,
      issues: contributionsCollection.totalIssueContributions,
      pullRequests: contributionsCollection.totalPullRequestContributions,
      pullRequestReviews:
        contributionsCollection.totalPullRequestReviewContributions,
      repositories: contributionsCollection.totalRepositoryContributions,
      restricted: contributionsCollection.restrictedContributionsCount,
    },
    calendar,
    languages,
    topRepos,
    insights,
  };

  setCachedStats(`auth:${username}`, result);
  return result;
}
