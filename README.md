# Unwrap Git

**GitHub Wrapped for any year.** Type a GitHub username, pick a year and get a
year in review: contributions, languages, streaks, the hours you commit at, the
repositories you worked in and a coding personality. Play it as a short recap
story or download it as a card.

**[unwrap-git.hrshvrdhn.com](https://unwrap-git.hrshvrdhn.com)**

## Features

- **Any year since 2008.** Past years cover January 1 to December 31 (UTC); the
  current year covers January 1 to today. `/<username>` shows this year,
  `/<username>/<year>` any other.
- **Overview:** contributions with the change from last year, merged pull
  requests, repositories, lines changed, longest streak and break, busiest
  week, day and month.
- **Commit hours:** an hour-of-day chart and a weekday by hour grid, in each
  commit's own timezone.
- **Languages weighted by code size,** not just each repository's main language.
- **Coding personality:** Night Owl, Early Bird, Weekend Warrior, The Reviewer,
  Open Sourcerer, Marathoner, Sprinter, Polyglot and more, each with the number
  behind it.
- **Recap story and share card:** a tap-through recap that ends on a
  downloadable PNG card.
- **Yearly leaderboard:** everyone who gets looked up is ranked by
  contributions. Signed-in users can hide themselves.
- **Calendar, weekly chart and a 3D contribution terrain.**
- **Private contributions:** sign in with GitHub to add your private
  contribution counts to your own page. Only the `read:user` scope is
  requested, so private code, repository names and languages are never read.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router, server components) and React 19
- [Tailwind CSS 4](https://tailwindcss.com)
- [GitHub GraphQL API](https://docs.github.com/en/graphql) through
  [Octokit](https://github.com/octokit/octokit.js)
- [better-auth](https://www.better-auth.com) for GitHub sign-in, on Postgres
  ([Supabase](https://supabase.com))
- [Upstash Redis](https://upstash.com) for caching and rate limiting
- [Recharts](https://recharts.org), [React Three Fiber](https://r3f.docs.pmnd.rs)
  and [dotLottie](https://lottiefiles.com) for charts, 3D and animation
- [Bun](https://bun.sh) as the package manager, deployed on
  [Vercel](https://vercel.com)

## Running it locally

You need [Bun](https://bun.sh), a Postgres database and a GitHub account.

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Set environment variables.** Copy the example file and fill it in:

   ```bash
   cp .env.example .env
   ```

   | Variable | What it's for |
   |---|---|
   | `GITHUB_ACCESS_TOKEN` | A [personal access token](https://github.com/settings/tokens) with no scopes, used for public lookups. |
   | `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | A [GitHub OAuth app](https://github.com/settings/developers) with the callback URL `http://localhost:3000/api/auth/callback/github`. |
   | `BETTER_AUTH_SECRET` | Any random string, for example from `openssl rand -base64 32`. |
   | `BETTER_AUTH_URL` | The site origin, `http://localhost:3000` locally. |
   | `DATABASE_URL` | A Postgres connection string. |
   | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Optional. Without them, caching and rate limiting use memory. |
   | `NEXT_PUBLIC_SITE_URL` | Optional. The canonical origin used in metadata and the sitemap. |
   | `LEADERBOARD_WRITES` | Optional. Leaderboard rows are only written on Vercel production; set to `on` to write them anywhere else. |

3. **Create the database tables.** Create the sign-in tables with the
   better-auth CLI, then run the SQL files in `db/migrations` in order, for
   example with `psql "$DATABASE_URL" -f <file>` or in the Supabase SQL editor.

   ```bash
   bunx auth@latest migrate
   ```

4. **Start the dev server** and open [localhost:3000](http://localhost:3000).

   ```bash
   bun dev
   ```

Before opening a pull request, run:

```bash
bun run lint && bun run typecheck && bun run build
```

## How the numbers work

The [How it works](https://unwrap-git.hrshvrdhn.com/how-it-works) page
explains each metric. In short:

- Totals and the calendar come from GitHub's contribution collection for the
  date range.
- Each repository's commits are split across its languages by code size.
- Commit hours come from up to 100 of the user's commits in each of their 6
  busiest public repositories.
- Results are cached for 2 hours for the current year and 14 days for past
  years, to stay well inside GitHub's API limits.

## Contributing

Issues and pull requests are welcome. For anything bigger than a small fix,
please open an issue first so we can agree on the approach.

## License

[MIT](LICENSE) © Harshvardhan Singh
