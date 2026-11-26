-- Leaderboard: one row per user per year, filled automatically.
--
-- Safe to run before the new code is deployed: `year` defaults to 2025, which
-- is what the previous version of the app always stored, so its inserts and
-- updates keep working until the deploy.

begin;

alter table public.leaderboard_stats
  add column if not exists year integer not null default 2025,
  add column if not exists name text,
  add column if not exists longest_streak integer not null default 0,
  add column if not exists includes_private boolean not null default false,
  add column if not exists hidden boolean not null default false;

update public.leaderboard_stats
  set updated_at = coalesce(updated_at, created_at, now())
  where updated_at is null;
alter table public.leaderboard_stats
  alter column updated_at set default now(),
  alter column updated_at set not null;

-- A user can now have one row per year, matched case-insensitively because
-- GitHub logins are.
alter table public.leaderboard_stats
  drop constraint if exists leaderboard_stats_username_key;
drop index if exists public.idx_leaderboard_username;
drop index if exists public.idx_leaderboard_contributions;

create unique index if not exists leaderboard_stats_username_year_key
  on public.leaderboard_stats (lower(username), year);

-- Serves "top N for a year" and rank lookups.
create index if not exists idx_leaderboard_year_rank
  on public.leaderboard_stats (year, total_contributions desc)
  where not hidden;

commit;
