"use client";
import {
  AuthButtons,
  InsightsPanel,
  LoadingLog,
  StatsOutput,
  TerminalInput,
  TerminalLayout,
} from "@/components/terminal";
import { VisualizationTabs } from "@/components/VisualizationTabs";
import type { UserStats } from "@/lib/github";
import { useLogStore } from "@/lib/log-store";
import { useSession } from "@/lib/auth-client";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import {
  getAuthenticatedStats,
  getPublicStats,
  type StatsResult,
} from "./actions";
import { joinLeaderboard } from "./leaderboard/actions";
import Link from "next/link";

// ASCII header
const ASCII_HEADER = `
 ██████╗ ██╗████████╗██╗  ██╗██╗   ██╗██████╗     
██╔════╝ ██║╚══██╔══╝██║  ██║██║   ██║██╔══██╗    
██║  ███╗██║   ██║   ███████║██║   ██║██████╔╝    
██║   ██║██║   ██║   ██╔══██║██║   ██║██╔══██╗    
╚██████╔╝██║   ██║   ██║  ██║╚██████╔╝██████╔╝    
 ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═════╝     
                                                   
██╗   ██╗███╗   ██╗██╗    ██╗██████╗  █████╗ ██████╗ ██████╗ ███████╗██████╗ 
██║   ██║████╗  ██║██║    ██║██╔══██╗██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗
██║   ██║██╔██╗ ██║██║ █╗ ██║██████╔╝███████║██████╔╝██████╔╝█████╗  ██║  ██║
██║   ██║██║╚██╗██║██║███╗██║██╔══██╗██╔══██║██╔═══╝ ██╔═══╝ ██╔══╝  ██║  ██║
╚██████╔╝██║ ╚████║╚███╔███╔╝██║  ██║██║  ██║██║     ██║     ███████╗██████╔╝
 ╚═════╝ ╚═╝  ╚═══╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝     ╚══════╝╚═════╝ 
`.trim();

export default function Home() {
  const { data: session, isPending: isSessionLoading } = useSession();
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(true);
  const [joinedLeaderboard, setJoinedLeaderboard] = useState(false);
  const [joiningLeaderboard, setJoiningLeaderboard] = useState(false);
  const hasAutoSearched = useRef(false);

  const { addLog, updateLog, clearLogs, setLoading } = useLogStore();

  const handleSearch = useCallback(
    async (username: string) => {
      setStats(null);
      setError(null);
      clearLogs();
      setHasSearched(true);
      setLoading(true);
      setIsAuthenticated(false);

      startTransition(async () => {
        const log1 = addLog(`Initializing connection to GitHub API...`);

        await new Promise((r) => setTimeout(r, 400));
        updateLog(log1, "done");

        const log2 = addLog(`Validating username: ${username}`);
        await new Promise((r) => setTimeout(r, 300));
        updateLog(log2, "done");

        const isAuthSearch = !!session?.user;
        const modeLog = addLog(
          isAuthSearch
            ? `Authenticated mode: including private repos...`
            : `Public mode: fetching public contributions...`
        );
        await new Promise((r) => setTimeout(r, 200));
        updateLog(modeLog, "done");

        const log3 = addLog(`Fetching contribution data for 2025...`);

        const result: StatsResult = isAuthSearch
          ? await getAuthenticatedStats(username)
          : await getPublicStats(username);

        if (result.success && result.data) {
          updateLog(log3, "done");

          const log4 = addLog(
            `Processing ${result.data.contributions.total} contributions...`
          );
          await new Promise((r) => setTimeout(r, 300));
          updateLog(log4, "done");

          const log5 = addLog(
            `Analyzing ${result.data.languages.length} languages...`
          );
          await new Promise((r) => setTimeout(r, 200));
          updateLog(log5, "done");

          const log6 = addLog(
            `Computing insights and generating visualizations...`
          );
          await new Promise((r) => setTimeout(r, 300));
          updateLog(log6, "done");

          const log7 = addLog(`Compilation complete. Rendering output...`);
          await new Promise((r) => setTimeout(r, 200));
          updateLog(log7, "done");

          setStats(result.data);
          setIsAuthenticated(result.isAuthenticated || false);
        } else {
          updateLog(log3, "error");
          const errorLog = addLog(result.error || "Unknown error occurred");
          updateLog(errorLog, "error");
          setError(result.error || "Failed to fetch stats");
        }

        setLoading(false);
      });
    },
    [session, addLog, updateLog, clearLogs, setLoading]
  );

  // auto-search when user logs in
  useEffect(() => {
    if (session?.user && !hasAutoSearched.current && !isSessionLoading) {
      hasAutoSearched.current = true;
      setShowSearchInput(false);
      const username = session.user.name;
      if (username) {
        handleSearch(username);
      }
    }
  }, [session, isSessionLoading, handleSearch]);

  // reset auto-search flag when user logs out
  useEffect(() => {
    if (!session?.user) {
      hasAutoSearched.current = false;
      setShowSearchInput(true);
    }
  }, [session]);

  const handleSearchAnother = () => {
    setShowSearchInput(true);
    setStats(null);
    setError(null);
    setHasSearched(false);
    clearLogs();
  };

  return (
    <TerminalLayout>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div>
          <pre className="ascii-art text-[#00ff00] glow-text overflow-x-auto">
            {ASCII_HEADER}
          </pre>
          <div className="mt-4 text-[#00ff00]/60 text-sm flex flex-wrap items-center gap-2">
            <span className="text-[#00ff00]/40">[v2025.5.0]</span>
            <span>•</span>
            <span>Your Year in Code</span>
            <span>•</span>
            {session?.user ? (
              <span className="text-[#00ff00]">Private Mode</span>
            ) : (
              <span className="text-[#00ff00]/40">Public Mode</span>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <AuthButtons />
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-[#00ff00]/80">
          <span className="text-[#666]">$</span> Welcome to GitHub Unwrapped
          2025
        </p>
        <p className="text-[#00ff00]/60 text-sm">
          {session?.user ? (
            <>
              Viewing stats for your account. Includes private repository
              contributions.
            </>
          ) : (
            <>Enter a GitHub username to see their 2025 contribution stats.</>
          )}
        </p>
      </div>

      {showSearchInput && (
        <div className="mb-6 py-4 px-4 bg-[#111] rounded border border-[#333]">
          <TerminalInput
            onSubmit={handleSearch}
            disabled={isPending}
            placeholder="Enter GitHub username..."
            prompt={isPending ? "⏳" : ">"}
          />
        </div>
      )}

      <LoadingLog />

      {hasSearched && (
        <div>
          {isAuthenticated && (
            <div className="mb-2 text-xs text-[#00ff00]/50 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00ff00] animate-pulse" />
              <span>Results include private repository contributions</span>
            </div>
          )}

          {stats && (
            <InsightsPanel
              insights={stats.insights}
              username={stats.user.login}
              languageCount={stats.languages.length}
            />
          )}

          {stats && <VisualizationTabs stats={stats} />}

          <div className="mt-6">
            <details className="group">
              <summary className="cursor-pointer text-[#00ff00]/50 text-xs hover:text-[#00ff00]/70 transition-colors">
                <span className="group-open:hidden">▶ Show raw JSON data</span>
                <span className="hidden group-open:inline">
                  ▼ Hide raw JSON data
                </span>
              </summary>
              <div className="mt-2">
                <StatsOutput stats={stats} error={error} />
              </div>
            </details>
          </div>

          {stats && !showSearchInput && (
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                onClick={handleSearchAnother}
                className="px-4 py-2 text-sm text-[#00ff00] border border-[#00ff00]/30 rounded 
                           hover:bg-[#00ff00]/10 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>🔍</span>
                <span>Search for another user</span>
              </button>

              {session?.user && !joinedLeaderboard && (
                <button
                  onClick={async () => {
                    if (!stats) return;
                    setJoiningLeaderboard(true);
                    const result = await joinLeaderboard(stats);
                    if (result.success) {
                      setJoinedLeaderboard(true);
                    }
                    setJoiningLeaderboard(false);
                  }}
                  disabled={joiningLeaderboard}
                  className="px-4 py-2 text-sm text-[#ffd700] border border-[#ffd700]/30 rounded 
                             hover:bg-[#ffd700]/10 transition-colors cursor-pointer flex items-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>🏆</span>
                  <span>
                    {joiningLeaderboard ? "Joining..." : "Join Leaderboard"}
                  </span>
                </button>
              )}

              {joinedLeaderboard && (
                <Link
                  href="/leaderboard"
                  className="px-4 py-2 text-sm text-[#00ff00] bg-[#00ff00]/10 border border-[#00ff00]/30 rounded 
                             hover:bg-[#00ff00]/20 transition-colors flex items-center gap-2"
                >
                  <span>✅</span>
                  <span>View Leaderboard</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {!hasSearched && !session?.user && (
        <div className="mt-12 text-[#00ff00]/30 text-xs">
          <p>
            💡 Tip: Try searching for popular developers like
            &quot;torvalds&quot;, &quot;gaearon&quot;, or
            &quot;sindresorhus&quot;
          </p>
          <p className="mt-2">
            🔐 Sign in with GitHub to auto-load your stats with private repos
          </p>
        </div>
      )}
      <div className="mt-12 pt-6 border-t border-[#00ff00]/20 flex flex-wrap justify-center gap-6 text-sm">
        <Link
          href="/leaderboard"
          className="text-[#00ff00]/50 hover:text-[#00ff00] transition-colors"
        >
          🏆 Leaderboard
        </Link>
        <Link
          href="/how-it-works"
          className="text-[#00ff00]/50 hover:text-[#00ff00] transition-colors"
        >
          📖 How It Works
        </Link>
      </div>
    </TerminalLayout>
  );
}
