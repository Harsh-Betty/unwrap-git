import { Octokit } from "octokit";
import {
  computeInsights,
  type CalendarDay,
  type Insights,
} from "./analytics";
import { yearRange } from "./year";

export class GitHubUserNotFoundError extends Error {
  constructor(login: string) {
    super(`GitHub user "${login}" not found`);
    this.name = "GitHubUserNotFoundError";
  }
}

export class GitHubRateLimitError extends Error {
  constructor() {
    super("GitHub API rate limit exceeded");
    this.name = "GitHubRateLimitError";
  }
}

function createClient(auth: string | undefined): Octokit {
  return new Octokit({
    auth,
    retry: { enabled: true },
    // The throttling plugin sends GraphQL requests one per second through a
    // queue shared by every visitor on the instance. That serialised the
    // parallel commit-sample requests (the later ones timed out while still
    // queued) and made concurrent visitors wait on each other. Requests are
    // already limited per visitor by our own rate limiter, and rate-limit
    // responses from GitHub are turned into GitHubRateLimitError below.
    throttle: { enabled: false },
  });
}

// Shared client for public lookups, using the app's own token.
const appClient = createClient(process.env.GITHUB_ACCESS_TOKEN);

const REPO_FIELDS = `
  name
  nameWithOwner
  url
  isPrivate
  isFork
  stargazerCount
  owner { login }
`;

// Everything here is readable with the `read:user` scope (or no user token at
// all): profile, contribution calendar and per-repository contribution counts
// for repositories the token can see.
const STATS_QUERY = `
  query(
    $login: String!
    $from: DateTime!
    $to: DateTime!
    $prevFrom: DateTime!
    $prevTo: DateTime!
    $mergedQuery: String!
  ) {
    user(login: $login) {
      id
      login
      name
      avatarUrl
      bio
      location
      company
      twitterUsername
      createdAt
      followers { totalCount }
      following { totalCount }
      contributionsCollection(from: $from, to: $to) {
        contributionYears
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoryContributions
        totalRepositoriesWithContributedCommits
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
            ${REPO_FIELDS}
            languages(first: 8, orderBy: { field: SIZE, direction: DESC }) {
              edges {
                size
                node { name color }
              }
            }
          }
          contributions { totalCount }
        }
        pullRequestContributionsByRepository(maxRepositories: 25) {
          repository { ${REPO_FIELDS} }
          contributions { totalCount }
        }
        issueContributionsByRepository(maxRepositories: 25) {
          repository { ${REPO_FIELDS} }
          contributions { totalCount }
        }
        pullRequestReviewContributionsByRepository(maxRepositories: 25) {
          repository { ${REPO_FIELDS} }
          contributions { totalCount }
        }
        popularPullRequestContribution {
          pullRequest {
            title
            url
            repository { nameWithOwner isPrivate }
          }
        }
      }
      previous: contributionsCollection(from: $prevFrom, to: $prevTo) {
        contributionCalendar { totalContributions }
      }
      repositories(
        first: 5
        orderBy: { field: STARGAZERS, direction: DESC }
        ownerAffiliations: OWNER
        isFork: false
        privacy: PUBLIC
      ) {
        nodes {
          name
          url
          primaryLanguage { name }
          stargazerCount
        }
      }
    }
    merged: search(query: $mergedQuery, type: ISSUE, first: 1) {
      issueCount
    }
  }
`;

interface RepoNode {
  name: string;
  nameWithOwner: string;
  url: string;
  isPrivate: boolean;
  isFork: boolean;
  stargazerCount: number;
  owner: { login: string };
}

interface RepoContribution<R = RepoNode> {
  repository: R;
  contributions: { totalCount: number };
}

interface LanguageEdge {
  size: number;
  node: { name: string; color: string | null };
}

interface StatsQueryResponse {
  user: {
    id: string;
    login: string;
    name: string | null;
    avatarUrl: string;
    bio: string | null;
    location: string | null;
    company: string | null;
    twitterUsername: string | null;
    createdAt: string;
    followers: { totalCount: number };
    following: { totalCount: number };
    contributionsCollection: {
      contributionYears: number[];
      totalCommitContributions: number;
      totalIssueContributions: number;
      totalPullRequestContributions: number;
      totalPullRequestReviewContributions: number;
      totalRepositoryContributions: number;
      totalRepositoriesWithContributedCommits: number;
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
      commitContributionsByRepository: RepoContribution<
        RepoNode & { languages: { edges: LanguageEdge[] | null } | null }
      >[];
      pullRequestContributionsByRepository: RepoContribution[];
      issueContributionsByRepository: RepoContribution[];
      pullRequestReviewContributionsByRepository: RepoContribution[];
      popularPullRequestContribution: {
        pullRequest: {
          title: string;
          url: string;
          repository: { nameWithOwner: string; isPrivate: boolean };
        };
      } | null;
    };
    previous: { contributionCalendar: { totalContributions: number } };
    repositories: {
      nodes: {
        name: string;
        url: string;
        primaryLanguage: { name: string } | null;
        stargazerCount: number;
      }[];
    };
  } | null;
  merged: { issueCount: number } | null;
}

export interface LanguageStat {
  name: string;
  color: string;
  // Share of the year's attributable commits, 0 to 1.
  share: number;
  // Commits attributed to this language (a repository's commits are split
  // across its languages by size).
  commitCount: number;
  // Repositories where this is the largest language.
  repoCount: number;
}

export interface RepoActivity {
  name: string;
  nameWithOwner: string;
  url: string;
  owner: string;
  isOwn: boolean;
  isPrivate: boolean;
  isFork: boolean;
  stars: number;
  commits: number;
  pullRequests: number;
  issues: number;
  reviews: number;
  total: number;
}

export interface CommitSample {
  // Commits sampled (at most 100 per repository) and how many repositories.
  commits: number;
  repos: number;
  // Commits per hour of day in the author's own timezone.
  hours: number[];
  // Commits per weekday (0 = Sunday) and hour.
  weekdayHours: number[][];
  additions: number;
  deletions: number;
  topWords: { word: string; count: number }[];
}

export interface UserStats {
  year: number;
  isYtd: boolean;
  range: { from: string; to: string };
  fetchedAt: string;
  // True when fetched with the user's own token, which adds their private
  // contribution counts.
  includesPrivate: boolean;
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
    createdAt: string;
  };
  // Years with at least one contribution, newest first.
  years: number[];
  contributions: {
    total: number;
    commits: number;
    issues: number;
    pullRequests: number;
    pullRequestReviews: number;
    repositories: number;
    // Contributions in repositories the token cannot see. They count towards
    // the totals but cannot be attributed to a repository or language.
    restricted: number;
    mergedPullRequests: number | null;
    reposContributedTo: number;
    // Total for the same date range one year earlier.
    previousYearTotal: number;
  };
  calendar: CalendarDay[];
  languages: LanguageStat[];
  // Repositories worked in during the year, busiest first.
  repos: RepoActivity[];
  // Most starred repositories the user owns (all time).
  topRepos: {
    name: string;
    url: string;
    language: string | null;
    stars: number;
  }[];
  popularPullRequest: { title: string; url: string; repo: string } | null;
  commitSample: CommitSample | null;
  insights: Insights;
}

const FALLBACK_LANGUAGE_COLOR = "#ffb000";

type Collection = NonNullable<
  StatsQueryResponse["user"]
>["contributionsCollection"];

// Drops every private repository before anything is derived from the
// collection. A token can see private repositories (the app token's owner's,
// their organisations', or a signed-in user's own), and their names, counts,
// languages and PR titles must never reach a page or the cache. Private work
// still counts towards the totals, just without being attributed.
function publicOnly(collection: Collection): Collection {
  const visible = <T extends RepoContribution<RepoNode>>(list: T[]) =>
    list.filter((entry) => !entry.repository.isPrivate);
  return {
    ...collection,
    commitContributionsByRepository: visible(
      collection.commitContributionsByRepository
    ),
    pullRequestContributionsByRepository: visible(
      collection.pullRequestContributionsByRepository
    ),
    issueContributionsByRepository: visible(
      collection.issueContributionsByRepository
    ),
    pullRequestReviewContributionsByRepository: visible(
      collection.pullRequestReviewContributionsByRepository
    ),
    popularPullRequestContribution:
      collection.popularPullRequestContribution?.pullRequest.repository
        .isPrivate
        ? null
        : collection.popularPullRequestContribution,
  };
}

function computeLanguages(
  repos: Collection["commitContributionsByRepository"]
): LanguageStat[] {
  const totals = new Map<
    string,
    { color: string; weight: number; repoCount: number }
  >();

  for (const { repository, contributions } of repos) {
    const edges = repository.languages?.edges ?? [];
    const repoSize = edges.reduce((sum, edge) => sum + edge.size, 0);
    if (repoSize === 0) continue;

    edges.forEach((edge, index) => {
      const entry = totals.get(edge.node.name) ?? {
        color: edge.node.color ?? FALLBACK_LANGUAGE_COLOR,
        weight: 0,
        repoCount: 0,
      };
      entry.weight += contributions.totalCount * (edge.size / repoSize);
      // Edges are ordered by size, so the first one is the main language.
      if (index === 0) entry.repoCount++;
      totals.set(edge.node.name, entry);
    });
  }

  const totalWeight = [...totals.values()].reduce(
    (sum, entry) => sum + entry.weight,
    0
  );
  if (totalWeight === 0) return [];

  return [...totals.entries()]
    .map(([name, entry]) => ({
      name,
      color: entry.color,
      share: entry.weight / totalWeight,
      commitCount: Math.round(entry.weight),
      repoCount: entry.repoCount,
    }))
    .filter((language) => language.share >= 0.005)
    .sort((a, b) => b.share - a.share);
}

function computeRepos(
  login: string,
  collection: Collection
): RepoActivity[] {
  const repos = new Map<string, RepoActivity>();

  const add = (
    list: RepoContribution[],
    field: "commits" | "pullRequests" | "issues" | "reviews"
  ) => {
    for (const { repository, contributions } of list) {
      const entry = repos.get(repository.nameWithOwner) ?? {
        name: repository.name,
        nameWithOwner: repository.nameWithOwner,
        url: repository.url,
        owner: repository.owner.login,
        isOwn: repository.owner.login.toLowerCase() === login.toLowerCase(),
        isPrivate: repository.isPrivate,
        isFork: repository.isFork,
        stars: repository.stargazerCount,
        commits: 0,
        pullRequests: 0,
        issues: 0,
        reviews: 0,
        total: 0,
      };
      entry[field] += contributions.totalCount;
      entry.total += contributions.totalCount;
      repos.set(repository.nameWithOwner, entry);
    }
  };

  add(collection.commitContributionsByRepository, "commits");
  add(collection.pullRequestContributionsByRepository, "pullRequests");
  add(collection.issueContributionsByRepository, "issues");
  add(collection.pullRequestReviewContributionsByRepository, "reviews");

  return [...repos.values()].sort((a, b) => b.total - a.total).slice(0, 25);
}

const SAMPLE_REPOS = 6;
const SAMPLE_COMMITS_PER_REPO = 100;
const SAMPLE_TIMEOUT_MS = 4000;

const STOP_WORDS = new Set(
  "the and for with from this that into not are was were has have had but all can will out its use used using via per you your our their when then than too also add adds added update updates updated fix fixes fixed merge branch pull request feat chore docs refactor test tests style perf build revert wip remove removed removes change changes changed make makes made new some more".split(
    " "
  )
);

function topWords(headlines: string[]): CommitSample["topWords"] {
  const counts = new Map<string, number>();
  for (const headline of headlines) {
    // Count each word once per commit so one long message cannot dominate.
    const words = new Set(
      headline
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(
          (word) =>
            word.length >= 3 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)
        )
    );
    for (const word of words) counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));
}

interface CommitNode {
  // GitTimestamp: unlike DateTime it keeps the author's own UTC offset, so
  // the hour is the local hour the commit was written at.
  author: { date: string } | null;
  additions: number;
  deletions: number;
  messageHeadline: string;
}

interface CommitSampleResponse {
  repository: {
    defaultBranchRef: {
      target: { history?: { nodes: CommitNode[] } } | null;
    } | null;
  } | null;
}

const COMMIT_SAMPLE_QUERY = `
  query(
    $userId: ID!
    $owner: String!
    $name: String!
    $since: GitTimestamp!
    $until: GitTimestamp!
  ) {
    repository(owner: $owner, name: $name) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(
              first: ${SAMPLE_COMMITS_PER_REPO}
              since: $since
              until: $until
              author: { id: $userId }
            ) {
              nodes {
                author { date }
                additions
                deletions
                messageHeadline
              }
            }
          }
        }
      }
    }
  }
`;

// Reads up to 100 of the user's commits from each of their busiest visible
// repositories. This is what makes time-of-day insights possible: the
// contribution calendar only has per-day counts.
//
// One request per repository, in parallel and each with its own deadline:
// walking history filtered by author can be slow on very large repositories,
// and a slow one must not hold up or sink the others.
async function fetchCommitSample(
  client: Octokit,
  userId: string,
  repos: RepoActivity[],
  range: { from: Date; to: Date }
): Promise<CommitSample | null> {
  const targets = repos
    .filter((repo) => repo.commits > 0 && !repo.isPrivate)
    .sort((a, b) => b.commits - a.commits)
    .slice(0, SAMPLE_REPOS);
  if (targets.length === 0) return null;

  const results = await Promise.allSettled(
    targets.map((repo) =>
      client.graphql<CommitSampleResponse>(COMMIT_SAMPLE_QUERY, {
        userId,
        owner: repo.owner,
        name: repo.name,
        since: range.from.toISOString(),
        until: range.to.toISOString(),
        request: {
          retries: 0,
          signal: AbortSignal.timeout(SAMPLE_TIMEOUT_MS),
        },
      })
    )
  );

  const perRepo = results.map((result) =>
    result.status === "fulfilled"
      ? (result.value.repository?.defaultBranchRef?.target?.history?.nodes ??
        [])
      : []
  );
  const commits = perRepo.flat();
  if (commits.length === 0) return null;

  const hours = Array.from({ length: 24 }, () => 0);
  const weekdayHours = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => 0)
  );
  for (const commit of commits) {
    const stamp = commit.author?.date;
    if (!stamp) continue;
    // Read the wall-clock date and hour straight from the string so the
    // author's offset is respected, not the server's.
    const hour = Number(stamp.slice(11, 13));
    const weekday = new Date(`${stamp.slice(0, 10)}T00:00:00Z`).getUTCDay();
    if (Number.isNaN(hour) || Number.isNaN(weekday)) continue;
    hours[hour]++;
    weekdayHours[weekday][hour]++;
  }

  return {
    commits: commits.length,
    repos: perRepo.filter((nodes) => nodes.length > 0).length,
    hours,
    weekdayHours,
    additions: commits.reduce((sum, commit) => sum + commit.additions, 0),
    deletions: commits.reduce((sum, commit) => sum + commit.deletions, 0),
    topWords: topWords(
      commits
        .map((commit) => commit.messageHeadline)
        .filter((headline) => !headline.startsWith("Merge "))
    ),
  };
}

function isRateLimit(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const status = (error as { status?: number }).status;
  return (
    status === 429 ||
    /rate limit/i.test(error.message) ||
    (status === 403 && /limit/i.test(error.message))
  );
}

// A GraphQL response can carry both data and errors (for example when the
// search part is throttled). Use whatever data came back.
function partialData(error: unknown): StatsQueryResponse | null {
  const data = (error as { data?: StatsQueryResponse | null }).data;
  return data?.user ? data : null;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface FetchUserStatsOptions {
  login: string;
  year: number;
  // The user's own OAuth token. Only pass it when the signed-in user is
  // looking at their own profile.
  token?: string;
}

export async function fetchUserStats({
  login,
  year,
  token,
}: FetchUserStatsOptions): Promise<UserStats> {
  const client = token ? createClient(token) : appClient;
  const { from, to, isYtd } = yearRange(year);

  // Compare with the same slice of the previous year, so a year in progress
  // is not measured against a full one.
  const prevFrom = new Date(Date.UTC(year - 1, 0, 1));
  const prevTo = new Date(to);
  prevTo.setUTCFullYear(year - 1);

  const variables = {
    login,
    from: from.toISOString(),
    to: to.toISOString(),
    prevFrom: prevFrom.toISOString(),
    prevTo: prevTo.toISOString(),
    // Public lookups count public PRs only: the app token may see private ones.
    mergedQuery: `author:${login} is:pr is:merged${token ? "" : " is:public"} merged:${isoDay(from)}..${isoDay(to)}`,
  };

  const response = await client
    .graphql<StatsQueryResponse>(STATS_QUERY, variables)
    .catch((error: unknown) => {
      const partial = partialData(error);
      if (partial) return partial;
      if (
        error instanceof Error &&
        error.message.includes("Could not resolve to a User")
      ) {
        throw new GitHubUserNotFoundError(login);
      }
      if (isRateLimit(error)) throw new GitHubRateLimitError();
      throw error;
    });

  const { user } = response;
  if (!user) throw new GitHubUserNotFoundError(login);
  const collection = publicOnly(user.contributionsCollection);

  const calendar: CalendarDay[] = collection.contributionCalendar.weeks.flatMap(
    (week) =>
      week.contributionDays.map((day) => ({
        date: day.date,
        count: day.contributionCount,
        weekday: day.weekday,
      }))
  );

  const repos = computeRepos(user.login, collection);

  // Nice-to-have data: never fail the whole page over it.
  const commitSample = await fetchCommitSample(client, user.id, repos, {
    from,
    to,
  }).catch((error: unknown) => {
    console.warn("Commit sample unavailable:", error);
    return null;
  });

  return {
    year,
    isYtd,
    range: { from: from.toISOString(), to: to.toISOString() },
    fetchedAt: new Date().toISOString(),
    includesPrivate: Boolean(token),
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
      createdAt: user.createdAt,
    },
    years: [...collection.contributionYears].sort((a, b) => b - a),
    contributions: {
      total: collection.contributionCalendar.totalContributions,
      commits: collection.totalCommitContributions,
      issues: collection.totalIssueContributions,
      pullRequests: collection.totalPullRequestContributions,
      pullRequestReviews: collection.totalPullRequestReviewContributions,
      repositories: collection.totalRepositoryContributions,
      restricted: collection.restrictedContributionsCount,
      mergedPullRequests: response.merged?.issueCount ?? null,
      reposContributedTo: collection.commitContributionsByRepository.length,
      previousYearTotal: user.previous.contributionCalendar.totalContributions,
    },
    calendar,
    languages: computeLanguages(collection.commitContributionsByRepository),
    repos,
    topRepos: user.repositories.nodes.map((repo) => ({
      name: repo.name,
      url: repo.url,
      language: repo.primaryLanguage?.name ?? null,
      stars: repo.stargazerCount,
    })),
    popularPullRequest: collection.popularPullRequestContribution
      ? {
          title: collection.popularPullRequestContribution.pullRequest.title,
          url: collection.popularPullRequestContribution.pullRequest.url,
          repo: collection.popularPullRequestContribution.pullRequest.repository
            .nameWithOwner,
        }
      : null,
    commitSample,
    insights: computeInsights(calendar),
  };
}
