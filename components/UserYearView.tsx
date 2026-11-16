import Image from "next/image";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Clock, Lock, Trophy } from "lucide-react";
import { InsightsPanel, StatsOutput, TerminalLayout } from "@/components/terminal";
import { LottieAnimation } from "@/components/ui/LottieAnimation";
import { VisualizationTabs } from "@/components/VisualizationTabs";
import { YearSwitcher } from "@/components/YearSwitcher";
import { getLeaderboardRank } from "@/lib/leaderboard";
import { getStats, type StatsResult } from "@/lib/stats";
import { currentYear, profilePath } from "@/lib/year";

interface UserYearViewProps {
  username: string;
  year: number;
}

function HomeLink() {
  return (
    <Link
      href="/"
      className="focus-ring inline-flex items-center gap-2 min-h-11 text-sm text-terminal/70 hover:text-terminal transition-colors"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      Search another user
    </Link>
  );
}

function ErrorState({
  username,
  year,
  result,
}: {
  username: string;
  year: number;
  result: Extract<StatsResult, { ok: false }>;
}) {
  const name = decodeURIComponent(username);
  const isMissing = result.reason === "not_found" || result.reason === "invalid";

  const message = {
    invalid: `"${name}" is not a valid GitHub username.`,
    not_found: `There is no GitHub user called "${name}". Organizations are not supported.`,
    rate_limited: `Too many lookups from your network. Try again in ${
      result.resetIn ?? 60
    } seconds.`,
    github_busy:
      "GitHub is limiting our requests right now. Try again in a few minutes.",
    error: "GitHub did not answer in time. Try again in a moment.",
  }[result.reason];

  return (
    <TerminalLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        {isMissing && (
          <div className="w-48 h-48 mb-4">
            <LottieAnimation src="/animations/404-cat.lottie" />
          </div>
        )}
        <h1 className="flex items-center gap-2 text-red-400 text-sm uppercase tracking-wider mb-2">
          {isMissing ? (
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Clock className="w-5 h-5" aria-hidden="true" />
          )}
          {isMissing ? "User not found" : "Could not load stats"}
        </h1>
        <p className="text-terminal/80 mb-6 max-w-md">{message}</p>
        <div className="flex flex-wrap justify-center gap-4">
          {!isMissing && (
            <Link
              href={profilePath(name, year)}
              className="focus-ring inline-flex items-center min-h-11 px-4 rounded bg-terminal text-terminal-bg font-bold hover:bg-terminal-bright transition-colors"
            >
              Try again
            </Link>
          )}
          <HomeLink />
        </div>
      </div>
    </TerminalLayout>
  );
}

export async function UserYearView({ username, year }: UserYearViewProps) {
  const result = await getStats(username, year);
  if (!result.ok) {
    return <ErrorState username={username} year={year} result={result} />;
  }

  const stats = result.data;
  const { user } = stats;
  const rank = await getLeaderboardRank(user.login, stats.year).catch(
    () => null
  );
  const leaderboardHref =
    stats.year === currentYear() ? "/leaderboard" : `/leaderboard/${stats.year}`;

  return (
    <TerminalLayout>
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Image
              src={user.avatarUrl}
              alt=""
              width={64}
              height={64}
              priority
              className="w-16 h-16 rounded-full border-2 border-terminal/30"
            />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-terminal truncate">
                {user.name || user.login}
              </h1>
              <p className="text-terminal/70">
                @{user.login} · {stats.year}
                {stats.isYtd ? " so far" : ""}
              </p>
            </div>
          </div>
          <HomeLink />
        </div>

        <YearSwitcher
          login={user.login}
          years={stats.years}
          activeYear={stats.year}
        />

        {rank && (
          <p className="text-sm">
            <Link
              href={leaderboardHref}
              className="focus-ring inline-flex items-center gap-2 min-h-11 text-terminal hover:text-terminal-bright"
            >
              <Trophy className="w-4 h-4" aria-hidden="true" />
              <span>
                <span className="font-bold">#{rank.rank}</span> of{" "}
                {rank.total.toLocaleString("en-US")} on the {stats.year}{" "}
                leaderboard
              </span>
            </Link>
          </p>
        )}

        {stats.includesPrivate && (
          <p className="flex items-center gap-2 text-xs text-terminal/70">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Only you see this version: it counts your private contributions.
          </p>
        )}
      </header>

      <InsightsPanel
        insights={stats.insights}
        username={user.login}
        languageCount={stats.languages.length}
        year={stats.year}
        isYtd={stats.isYtd}
      />

      <VisualizationTabs stats={stats} rank={rank} />

      <details className="group mt-6">
        <summary className="focus-ring cursor-pointer text-terminal/70 text-xs hover:text-terminal transition-colors">
          Raw JSON data
        </summary>
        <div className="mt-2">
          <StatsOutput stats={stats} error={null} />
        </div>
      </details>
    </TerminalLayout>
  );
}
