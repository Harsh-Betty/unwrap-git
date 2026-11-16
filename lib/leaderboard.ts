import "server-only";
import { unstable_cache } from "next/cache";
import { pool } from "./auth";
import type { UserStats } from "./github";

export interface LeaderboardEntry {
  username: string;
  name: string | null;
  avatarUrl: string | null;
  totalContributions: number;
  totalCommits: number;
  topLanguage: string;
  longestStreak: number;
}

export interface LeaderboardRank {
  rank: number;
  total: number;
}

export const LEADERBOARD_TAG = "leaderboard";
const REVALIDATE_SECONDS = 5 * 60;
const PAGE_SIZE = 100;

// Called once per fresh GitHub fetch (never on a cache hit), so each user and
// year costs at most one write per cache lifetime.
//
// A lookup made without the user's token must not lower a row that came from
// their own token: that row includes private contributions the public one
// cannot see. A user who hid themselves stays hidden in every year.
export async function recordLeaderboardEntry(stats: UserStats): Promise<void> {
  if (stats.contributions.total === 0) return;

  await pool.query(
    `insert into public.leaderboard_stats
       (username, name, year, total_commits, total_contributions, top_language,
        avatar_url, longest_streak, includes_private, hidden, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9,
       exists (
         select 1 from public.leaderboard_stats
         where lower(username) = lower($1) and hidden
       ),
       now())
     on conflict (lower(username), year) do update set
       username = excluded.username,
       name = excluded.name,
       total_commits = excluded.total_commits,
       total_contributions = excluded.total_contributions,
       top_language = excluded.top_language,
       avatar_url = excluded.avatar_url,
       longest_streak = excluded.longest_streak,
       includes_private = excluded.includes_private,
       updated_at = now()
     where excluded.includes_private
        or not leaderboard_stats.includes_private
        or excluded.total_contributions >= leaderboard_stats.total_contributions`,
    [
      stats.user.login,
      stats.user.name,
      stats.year,
      stats.contributions.commits,
      stats.contributions.total,
      stats.languages[0]?.name ?? "Unknown",
      stats.user.avatarUrl,
      stats.insights.longestStreak,
      stats.includesPrivate,
    ]
  );
}

export const getLeaderboard = unstable_cache(
  async (year: number): Promise<LeaderboardEntry[]> => {
    const { rows } = await pool.query(
      `select username, name, avatar_url, total_contributions, total_commits,
              top_language, longest_streak
       from public.leaderboard_stats
       where year = $1 and not hidden
       order by total_contributions desc, username asc
       limit $2`,
      [year, PAGE_SIZE]
    );
    return rows.map((row) => ({
      username: row.username,
      name: row.name,
      avatarUrl: row.avatar_url,
      totalContributions: row.total_contributions,
      totalCommits: row.total_commits,
      topLanguage: row.top_language,
      longestStreak: row.longest_streak,
    }));
  },
  ["leaderboard-entries"],
  { revalidate: REVALIDATE_SECONDS, tags: [LEADERBOARD_TAG] }
);

// Years that have at least one visible entry, newest first.
export const getLeaderboardYears = unstable_cache(
  async (): Promise<number[]> => {
    const { rows } = await pool.query(
      `select distinct year from public.leaderboard_stats
       where not hidden order by year desc`
    );
    return rows.map((row) => row.year as number);
  },
  ["leaderboard-years"],
  { revalidate: REVALIDATE_SECONDS, tags: [LEADERBOARD_TAG] }
);

// Position among everyone unwrapped for that year, or null when the user is
// not listed (hidden, or no contributions).
export const getLeaderboardRank = unstable_cache(
  async (login: string, year: number): Promise<LeaderboardRank | null> => {
    const { rows } = await pool.query(
      `select
         (select count(*)::int from public.leaderboard_stats o
            where o.year = me.year and not o.hidden
              and o.total_contributions > me.total_contributions) + 1 as rank,
         (select count(*)::int from public.leaderboard_stats o
            where o.year = me.year and not o.hidden) as total
       from public.leaderboard_stats me
       where lower(me.username) = lower($1) and me.year = $2 and not me.hidden`,
      [login, year]
    );
    return rows[0] ? { rank: rows[0].rank, total: rows[0].total } : null;
  },
  ["leaderboard-rank"],
  { revalidate: REVALIDATE_SECONDS, tags: [LEADERBOARD_TAG] }
);

export async function isHiddenFromLeaderboard(login: string): Promise<boolean> {
  const { rows } = await pool.query(
    `select 1 from public.leaderboard_stats
     where lower(username) = lower($1) and hidden limit 1`,
    [login]
  );
  return rows.length > 0;
}

export async function setHiddenFromLeaderboard(
  login: string,
  hidden: boolean,
  year: number
): Promise<void> {
  const { rowCount } = await pool.query(
    `update public.leaderboard_stats set hidden = $2, updated_at = now()
     where lower(username) = lower($1)`,
    [login, hidden]
  );
  // Someone who hides before ever being looked up has no row to flag yet.
  // Store an empty hidden row so their first lookup stays hidden too.
  if (hidden && rowCount === 0) {
    await pool.query(
      `insert into public.leaderboard_stats (username, year, hidden)
       values ($1, $2, true)
       on conflict (lower(username), year) do update set hidden = true`,
      [login, year]
    );
  }
}
