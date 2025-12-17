"use client";
import {
  LoadingLog,
  StatsOutput,
  TerminalInput,
  TerminalLayout,
} from "@/components/terminal";
import type { UserStats } from "@/lib/github";
import { useLogStore } from "@/lib/log-store";
import { useState, useTransition } from "react";
import { getPublicStats, type StatsResult } from "./actions";

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
  const [isPending, startTransition] = useTransition();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const { addLog, updateLog, clearLogs, setLoading } = useLogStore();

  const handleSearch = async (username: string) => {
    setStats(null);
    setError(null);
    clearLogs();
    setHasSearched(true);
    setLoading(true);

    startTransition(async () => {
      const log1 = addLog(`Initializing connection to GitHub API...`);

      await new Promise((r) => setTimeout(r, 400));
      updateLog(log1, "done");

      const log2 = addLog(`Validating username: ${username}`);
      await new Promise((r) => setTimeout(r, 300));
      updateLog(log2, "done");

      const log3 = addLog(`Fetching contribution data for 2025...`);

      const result: StatsResult = await getPublicStats(username);

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

        const log6 = addLog(`Compilation complete. Rendering output...`);
        await new Promise((r) => setTimeout(r, 200));
        updateLog(log6, "done");

        setStats(result.data);
      } else {
        updateLog(log3, "error");
        const errorLog = addLog(result.error || "Unknown error occurred");
        updateLog(errorLog, "error");
        setError(result.error || "Failed to fetch stats");
      }

      setLoading(false);
    });
  };

  return (
    <TerminalLayout>
      <div className="mb-8">
        <pre className="ascii-art text-[#00ff00] glow-text overflow-x-auto">
          {ASCII_HEADER}
        </pre>
        <div className="mt-4 text-[#00ff00]/60 text-sm">
          <span className="text-[#00ff00]/40">[v2025.1.0]</span>
          <span className="mx-2">•</span>
          <span>Your Year in Code</span>
          <span className="mx-2">•</span>
          <span className="text-[#00ff00]/40">Public Mode</span>
        </div>
      </div>

      <div className="mb-6 space-y-2">
        <p className="text-[#00ff00]/80">
          <span className="text-[#666]">$</span> Welcome to GitHub Unwrapped
          2025
        </p>
        <p className="text-[#00ff00]/60 text-sm">
          Enter a GitHub username to see their 2025 contribution stats.
        </p>
      </div>

      <div className="mb-6 py-4 px-4 bg-[#111] rounded border border-[#333]">
        <TerminalInput
          onSubmit={handleSearch}
          disabled={isPending}
          placeholder="Enter GitHub username..."
          prompt={isPending ? "⏳" : ">"}
        />
      </div>

      <LoadingLog />

      {hasSearched && <StatsOutput stats={stats} error={error} />}

      {!hasSearched && (
        <div className="mt-12 text-[#00ff00]/30 text-xs">
          <p>
            💡 Tip: Try searching for popular developers like
            &quot;torvalds&quot;, &quot;gaearon&quot;, or
            &quot;sindresorhus&quot;
          </p>
        </div>
      )}
    </TerminalLayout>
  );
}
