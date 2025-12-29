"use client";
import { useEffect, useState, useTransition } from "react";
import { TerminalLayout } from "@/components/terminal";
import { getLeaderboard, type LeaderboardResult } from "./actions";
import type { LeaderboardEntry } from "@/lib/supabase";
import Link from "next/link";
import { Trophy, Medal } from "lucide-react";
import { LottieAnimation } from "@/components/ui/LottieAnimation";

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result: LeaderboardResult = await getLeaderboard(50);
      if (result.success && result.data) {
        setEntries(result.data);
      } else {
        setError(result.error ?? "Failed to load leaderboard");
      }
    });
  }, []);

  const getMedalColor = (index: number) => {
    if (index === 0) return "#ffd700"; // gold
    if (index === 1) return "#c0c0c0"; // silver
    if (index === 2) return "#cd7f32"; // bronze
    return null;
  };

  return (
    <TerminalLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl text-terminal font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            Leaderboard
          </h1>
          <Link
            href="/"
            className="text-sm text-terminal/60 hover:text-terminal transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="text-terminal/60 text-sm">
          Top contributors of 2025. Join by clicking &quot;Join
          Leaderboard&quot; on your stats page.
        </p>
      </div>

      {isPending && (
        <div className="text-terminal/50 animate-pulse flex flex-col items-center justify-center">
          <LottieAnimation
            src="/animations/git-octocat.lottie"
            loop={true}
            autoplay={true}
            className="sm:w-auto sm:h-96"
          />
          Loading leaderboard...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400">
          {error}
        </div>
      )}

      {!isPending && entries.length === 0 && !error && (
        <div className="text-terminal/50 p-8 flex items-center justify-center flex-col text-center border border-terminal/20 rounded">
          <LottieAnimation
            src="/animations/cat.lottie"
            loop={true}
            autoplay={true}
            className="sm:w-auto sm:h-96"
          />
          <p className="text-lg mb-2">No entries yet!</p>
          <p className="text-sm">Be the first to join the leaderboard.</p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          {/* header */}
          <div className="grid grid-cols-12 gap-4 text-terminal/50 text-xs uppercase tracking-wider p-3 border-b border-terminal/20">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Developer</div>
            <div className="col-span-2 text-right">Commits</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2">Top Lang</div>
          </div>

          {/* entries */}
          {entries.map((entry, index) => {
            const medalColor = getMedalColor(index);
            return (
              <Link
                key={entry.id}
                href={`/${entry.username}`}
                className={`grid grid-cols-12 gap-4 items-center p-3 rounded transition-colors overflow-x-auto
                  ${
                    index === 0
                      ? "bg-[#ffd700]/10 border border-[#ffd700]/30 hover:bg-[#ffd700]/20"
                      : ""
                  }
                  ${
                    index === 1
                      ? "bg-[#c0c0c0]/10 border border-[#c0c0c0]/30 hover:bg-[#c0c0c0]/20"
                      : ""
                  }
                  ${
                    index === 2
                      ? "bg-[#cd7f32]/10 border border-[#cd7f32]/30 hover:bg-[#cd7f32]/20"
                      : ""
                  }
                  ${
                    index > 2
                      ? "bg-terminal-surface border border-terminal/10 hover:border-terminal/30 hover:bg-terminal/5"
                      : ""
                  }
                `}
              >
                <div className="col-span-1 text-lg font-bold">
                  {medalColor ? (
                    <Medal className="w-5 h-5" style={{ color: medalColor }} />
                  ) : (
                    <span className="text-terminal/40">{index + 1}</span>
                  )}
                </div>
                <div className="col-span-5 flex items-center gap-3">
                  <img
                    src={entry.avatar_url}
                    alt={entry.username}
                    className="w-8 h-8 rounded-full border border-terminal/30"
                  />
                  <span className="text-terminal font-mono">
                    @{entry.username}
                  </span>
                </div>
                <div className="col-span-2 text-right text-terminal/80">
                  {entry.total_commits.toLocaleString()}
                </div>
                <div className="col-span-2 text-right text-terminal">
                  {entry.total_contributions.toLocaleString()}
                </div>
                <div className="col-span-2">
                  <span className="px-2 py-0.5 text-xs bg-terminal/10 text-terminal/80 rounded">
                    {entry.top_language}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/how-it-works"
          className="text-terminal/50 text-sm hover:text-terminal transition-colors"
        >
          How does the leaderboard work? →
        </Link>
      </div>
    </TerminalLayout>
  );
}
