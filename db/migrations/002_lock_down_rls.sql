-- Every table had a policy named "Service role can do everything ..." that was
-- granted to the `public` role with `using (true)`. That role includes `anon`,
-- so the policies opened all rows (OAuth tokens and sessions included) to
-- anyone holding the project's anon key through the Supabase REST API.
--
-- The app does not need them: it connects as `postgres` over DATABASE_URL, and
-- the service role bypasses row level security anyway. With RLS enabled and no
-- policies, the anon and authenticated roles get no access at all.
--
-- Run it after `auth migrate` has created the better-auth tables.

begin;

drop policy if exists "Service role can do everything on account" on public.account;
drop policy if exists "Service role can do everything on session" on public.session;
drop policy if exists "Service role can do everything on user" on public."user";
drop policy if exists "Service role can do everything on verification" on public.verification;
drop policy if exists "Service role can do everything on leaderboard" on public.leaderboard_stats;

-- anon and authenticated only exist on Supabase; skip the revoke elsewhere.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon')
     and exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke all on public.account, public.session, public."user",
      public.verification, public.leaderboard_stats from anon, authenticated;
  end if;
end
$$;

commit;
