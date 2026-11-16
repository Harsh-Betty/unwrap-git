import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowLeft, Medal, Trophy } from "lucide-react";
import { LeaderboardVisibilityToggle } from "@/components/LeaderboardVisibilityToggle";
import { TerminalLayout } from "@/components/terminal";
import { LottieAnimation } from "@/components/ui/LottieAnimation";
import { auth } from "@/lib/auth";
import {
  getLeaderboard,
  getLeaderboardYears,
  isHiddenFromLeaderboard,
} from "@/lib/leaderboard";
import { absoluteUrl, jsonLd } from "@/lib/site";
import { currentYear, profilePath } from "@/lib/year";

const MEDALS = [
  { label: "1st", color: "#ffd700" },
  { label: "2nd", color: "#c0c0c0" },
  { label: "3rd", color: "#cd7f32" },
];

function leaderboardPath(year: number): string {
  return year === currentYear() ? "/leaderboard" : `/leaderboard/${year}`;
}

async function loadViewer(): Promise<{ login: string; hidden: boolean } | null> {
  // Read headers outside the try: it is how Next learns the page is dynamic.
  const requestHeaders = await headers();
  try {
    const session = await auth.api.getSession({ headers: requestHeaders });
    const login = session?.user.name;
    if (!login) return null;
    return { login, hidden: await isHiddenFromLeaderboard(login) };
  } catch (error) {
    console.error("Could not load the leaderboard viewer:", error);
    return null;
  }
}

export async function LeaderboardView({ year }: { year: number }) {
  const [entries, knownYears, viewer] = await Promise.all([
    getLeaderboard(year).catch((error: unknown) => {
      console.error("Leaderboard read failed:", error);
      return null;
    }),
    getLeaderboardYears().catch(() => []),
    loadViewer(),
  ]);

  const years = [...new Set([currentYear(), year, ...knownYears])].sort(
    (a, b) => b - a
  );
  const isCurrent = year === currentYear();

  const structuredData = entries?.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `GitHub contributions leaderboard ${year}`,
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: entries.length,
        itemListElement: entries.slice(0, 50).map((entry, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: entry.name ?? entry.username,
          url: absoluteUrl(profilePath(entry.username, year)),
        })),
      }
    : null;

  return (
    <TerminalLayout>
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
        />
      )}
      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl text-terminal font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6" aria-hidden="true" />
            {year} leaderboard
          </h1>
          <Link
            href="/"
            className="focus-ring inline-flex items-center gap-2 min-h-11 text-sm text-terminal/70 hover:text-terminal transition-colors"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            Home
          </Link>
        </div>
        <p className="text-terminal/70 text-sm max-w-2xl">
          Everyone who has been unwrapped for {year}, ranked by contributions
          {isCurrent ? " so far" : ""}. Look someone up to add them.
        </p>

        <nav aria-label="Leaderboard year" className="overflow-x-auto">
          <ul className="flex gap-2 pb-1">
            {years.map((option) => (
              <li key={option}>
                <Link
                  href={leaderboardPath(option)}
                  aria-current={option === year ? "page" : undefined}
                  className={`focus-ring flex items-center min-h-11 px-3 text-sm rounded border transition-colors ${
                    option === year
                      ? "bg-terminal text-terminal-bg border-terminal font-bold"
                      : "text-terminal/70 border-terminal/20 hover:text-terminal hover:border-terminal/50"
                  }`}
                >
                  {option}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {viewer && (
          <LeaderboardVisibilityToggle
            login={viewer.login}
            hidden={viewer.hidden}
          />
        )}
      </header>

      {entries === null && (
        <p
          role="alert"
          className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400"
        >
          The leaderboard could not be loaded. Refresh to try again.
        </p>
      )}

      {entries?.length === 0 && (
        <div className="p-8 flex flex-col items-center text-center border border-terminal/20 rounded">
          <LottieAnimation
            src="/animations/cat.lottie"
            className="w-48 h-48"
          />
          <p className="text-lg text-terminal mb-2">
            Nobody has been unwrapped for {year} yet
          </p>
          <Link
            href="/"
            className="focus-ring inline-flex items-center min-h-11 underline underline-offset-4 text-terminal hover:text-terminal-bright"
          >
            Look up a GitHub user
          </Link>
        </div>
      )}

      {entries && entries.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="text-terminal/70 text-xs uppercase tracking-wider text-left">
                <th scope="col" className="px-3 py-2 w-14 font-normal">
                  Rank
                </th>
                <th scope="col" className="px-3 py-2 font-normal">
                  Developer
                </th>
                <th scope="col" className="px-3 py-2 text-right font-normal">
                  Contributions
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right font-normal hidden sm:table-cell"
                >
                  Commits
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 text-right font-normal hidden md:table-cell"
                >
                  Best streak
                </th>
                <th
                  scope="col"
                  className="px-3 py-2 font-normal hidden sm:table-cell"
                >
                  Top language
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const medal = MEDALS[index];
                const isViewer =
                  viewer?.login.toLowerCase() === entry.username.toLowerCase();
                return (
                  <tr
                    key={entry.username}
                    className={
                      isViewer
                        ? "bg-terminal/15 outline outline-1 outline-terminal/60"
                        : "bg-terminal-surface"
                    }
                  >
                    <td className="px-3 py-2 rounded-l">
                      {medal ? (
                        <span className="inline-flex items-center gap-1 font-bold">
                          <Medal
                            className="w-5 h-5"
                            style={{ color: medal.color }}
                            aria-hidden="true"
                          />
                          <span className="sr-only">{medal.label}</span>
                        </span>
                      ) : (
                        <span className="text-terminal/70">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={profilePath(entry.username, year)}
                        // A prefetch would run a GitHub lookup for every row.
                        prefetch={false}
                        className="focus-ring inline-flex items-center gap-3 min-h-11 text-terminal hover:text-terminal-bright"
                      >
                        {entry.avatarUrl && (
                          <Image
                            src={entry.avatarUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full border border-terminal/30"
                          />
                        )}
                        <span>
                          @{entry.username}
                          {isViewer && (
                            <span className="ml-2 text-xs text-terminal/70">
                              (you)
                            </span>
                          )}
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-right text-terminal font-bold tabular-nums">
                      {entry.totalContributions.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-2 text-right text-terminal/80 tabular-nums hidden sm:table-cell">
                      {entry.totalCommits.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-2 text-right text-terminal/80 tabular-nums hidden md:table-cell">
                      {entry.longestStreak > 0
                        ? `${entry.longestStreak} days`
                        : "–"}
                    </td>
                    <td className="px-3 py-2 rounded-r text-terminal/80 hidden sm:table-cell">
                      {entry.topLanguage}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-8 text-center">
        <Link
          href="/how-it-works"
          className="focus-ring inline-flex items-center min-h-11 text-terminal/70 text-sm hover:text-terminal transition-colors underline underline-offset-4"
        >
          How the leaderboard works
        </Link>
      </p>
    </TerminalLayout>
  );
}
