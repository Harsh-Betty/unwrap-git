"use client";
import { useEffect, useState, useTransition } from "react";
import { TerminalLayout } from "@/components/terminal";
import { getLeaderboard, type LeaderboardResult } from "./actions";
import type { LeaderboardEntry } from "@/lib/supabase";
import Link from "next/link";

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
        setError(result.error || "Failed to load leaderboard");
      }
    });
  }, []);

  return (
    <TerminalLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl text-[#00ff00] font-bold">
            🏆 Global Leaderboard
          </h1>
          <Link
            href="/"
            className="text-sm text-[#00ff00]/60 hover:text-[#00ff00] transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
        <p className="text-[#00ff00]/60 text-sm">
          Top contributors of 2025. Join by clicking &quot;Join
          Leaderboard&quot; on your stats page.
        </p>
      </div>

      {isPending && (
        <div className="text-[#00ff00]/50 animate-pulse">
          Loading leaderboard...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded text-red-400">
          {error}
        </div>
      )}

      {!isPending && entries.length === 0 && !error && (
        <div className="text-[#00ff00]/50 p-8 text-center border border-[#00ff00]/20 rounded">
          <p className="text-lg mb-2">No entries yet!</p>
          <p className="text-sm">Be the first to join the leaderboard.</p>
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-2">
          {/* header */}
          <div className="grid grid-cols-12 gap-4 text-[#00ff00]/50 text-xs uppercase tracking-wider p-3 border-b border-[#00ff00]/20">
            <div className="col-span-1">#</div>
            <div className="col-span-5">Developer</div>
            <div className="col-span-2 text-right">Commits</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-2">Top Lang</div>
          </div>

          {/* entries */}
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`grid grid-cols-12 gap-4 items-center p-3 rounded transition-colors
                ${
                  index === 0
                    ? "bg-[#ffd700]/10 border border-[#ffd700]/30"
                    : ""
                }
                ${
                  index === 1
                    ? "bg-[#c0c0c0]/10 border border-[#c0c0c0]/30"
                    : ""
                }
                ${
                  index === 2
                    ? "bg-[#cd7f32]/10 border border-[#cd7f32]/30"
                    : ""
                }
                ${
                  index > 2
                    ? "bg-[#111] border border-[#00ff00]/10 hover:border-[#00ff00]/30"
                    : ""
                }
              `}
            >
              <div className="col-span-1 text-lg font-bold">
                {index === 0 && "🥇"}
                {index === 1 && "🥈"}
                {index === 2 && "🥉"}
                {index > 2 && (
                  <span className="text-[#00ff00]/40">{index + 1}</span>
                )}
              </div>
              <div className="col-span-5 flex items-center gap-3">
                <img
                  src={entry.avatar_url}
                  alt={entry.username}
                  className="w-8 h-8 rounded-full border border-[#00ff00]/30"
                />
                <span className="text-[#00ff00] font-mono">
                  @{entry.username}
                </span>
              </div>
              <div className="col-span-2 text-right text-[#00ff00]/80">
                {entry.total_commits.toLocaleString()}
              </div>
              <div className="col-span-2 text-right text-[#00ff00]">
                {entry.total_contributions.toLocaleString()}
              </div>
              <div className="col-span-2">
                <span className="px-2 py-0.5 text-xs bg-[#00ff00]/10 text-[#00ff00]/80 rounded">
                  {entry.top_language}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/how-it-works"
          className="text-[#00ff00]/50 text-sm hover:text-[#00ff00] transition-colors"
        >
          How does the leaderboard work? →
        </Link>
      </div>
    </TerminalLayout>
  );
}
