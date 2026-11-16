import { TerminalLayout } from "@/components/terminal";
import Link from "next/link";
import {
  BookOpen,
  Search,
  BarChart3,
  Flame,
  Target,
  Calendar,
  Home,
  Palette,
  Trophy,
  Lock,
} from "lucide-react";

export const metadata = {
  title: "How It Works | GitHub Unwrapped",
  description:
    "Learn how GitHub Unwrapped calculates your contribution stats and insights.",
};

export default function HowItWorksPage() {
  return (
    <TerminalLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl text-terminal font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6" />
            How It Works
          </h1>
          <Link
            href="/"
            className="text-sm text-terminal/60 hover:text-terminal transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      <div className="space-y-8 text-terminal/80">
        <section className="p-4 bg-terminal-surface border border-terminal/20 rounded">
          <h2 className="text-lg text-terminal font-bold mb-3 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Data Collection
          </h2>
          <p className="mb-2">
            We use the <span className="text-terminal">GitHub GraphQL API</span>{" "}
            to fetch your contribution data. This includes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-terminal/60 ml-4">
            <li>Commits to repositories</li>
            <li>Pull requests created</li>
            <li>Issues opened</li>
            <li>Pull request reviews</li>
            <li>Repositories contributed to</li>
          </ul>
          <p className="mt-3 text-sm text-terminal/50">
            <strong>Public Mode:</strong> Only public contribution data is
            fetched.
          </p>
          <p className="text-sm text-terminal/50">
            <strong>Signed in:</strong> Your own stats also count your private
            contributions. Private repository names and languages stay
            hidden, because we only ask for the <code>read:user</code> scope.
          </p>
        </section>

        <section className="p-4 bg-terminal-surface border border-terminal/20 rounded">
          <h2 className="text-lg text-terminal font-bold mb-3 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Metrics Calculation
          </h2>

          <div className="space-y-4 text-sm">
            <div>
              <h3 className="text-terminal font-bold flex items-center gap-1">
                <Flame className="w-4 h-4" />
                Streak
              </h3>
              <p className="text-terminal/60">
                Consecutive days with at least 1 contribution. We track both
                your current streak and your longest streak of the selected year.
              </p>
            </div>

            <div>
              <h3 className="text-terminal font-bold flex items-center gap-1">
                <Target className="w-4 h-4" />
                Dedication Score
              </h3>
              <p className="text-terminal/60">
                Percentage of days in the selected year where you made at least one
                contribution.
                <br />
                <code className="text-terminal/80">
                  = (active_days / total_days) × 100
                </code>
              </p>
            </div>

            <div>
              <h3 className="text-terminal font-bold flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Most Productive Day
              </h3>
              <p className="text-terminal/60">
                The day of the week (Monday–Sunday) with the highest total
                contributions.
              </p>
            </div>

            <div>
              <h3 className="text-terminal font-bold flex items-center gap-1">
                <Home className="w-4 h-4" />
                Weekend Warrior
              </h3>
              <p className="text-terminal/60">
                If 30%+ of your contributions are on Saturday or Sunday, you
                earn this badge!
              </p>
            </div>

            <div>
              <h3 className="text-terminal font-bold flex items-center gap-1">
                <Palette className="w-4 h-4" />
                Polyglot
              </h3>
              <p className="text-terminal/60">
                Awarded if you&apos;ve used 5 or more programming languages in
                the selected year.
              </p>
            </div>
          </div>
        </section>

        <section className="p-4 bg-terminal-surface border border-terminal/20 rounded">
          <h2 className="text-lg text-terminal font-bold mb-3 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </h2>
          <p className="text-terminal/60 mb-2">
            The leaderboard is <strong>opt-in only</strong>. Your data is never
            shared publicly unless you click &quot;Join Leaderboard&quot; on
            your stats page.
          </p>
          <p className="text-terminal/60">
            Rankings are based on total contributions (commits + PRs + issues +
            reviews).
          </p>
        </section>

        <section className="p-4 bg-terminal-surface border border-terminal/20 rounded">
          <h2 className="text-lg text-terminal font-bold mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Privacy
          </h2>
          <ul className="space-y-2 text-sm text-terminal/60">
            <li>
              • Your GitHub access token is stored encrypted and only used to
              load your own stats
            </li>
            <li>• Stats are cached to reduce API calls: 2 hours for the current
              year, 14 days for past years</li>
            <li>• Leaderboard data can be deleted at any time</li>
            <li>
              • We only request{" "}
              <code className="text-terminal/80">read:user</code> scope
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-terminal/20 flex justify-between items-center">
        <Link
          href="/leaderboard"
          className="text-terminal/60 hover:text-terminal transition-colors"
        >
          View Leaderboard →
        </Link>
        {/* <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-terminal/60 hover:text-terminal transition-colors"
        >
          View Source on GitHub →
        </a> */}
      </div>
    </TerminalLayout>
  );
}
