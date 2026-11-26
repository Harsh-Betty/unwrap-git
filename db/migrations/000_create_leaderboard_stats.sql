-- The leaderboard table as it was first created (before 001). Only needed on
-- a new database: on an existing one every statement is a no-op.

create table if not exists public.leaderboard_stats (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  total_commits integer not null default 0,
  total_contributions integer not null default 0,
  top_language text not null default 'Unknown',
  avatar_url text,
  opt_in_date timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint leaderboard_stats_username_key unique (username)
);

alter table public.leaderboard_stats enable row level security;
