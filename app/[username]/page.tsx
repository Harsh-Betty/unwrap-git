"use client";
import { useEffect, useState, useTransition } from "react";
import { useParams } from "next/navigation";
import {
  TerminalLayout,
  InsightsPanel,
  StatsOutput,
} from "@/components/terminal";
import { VisualizationTabs } from "@/components/VisualizationTabs";
import { LottieAnimation } from "@/components/ui/LottieAnimation";
import { useStatsStore } from "@/lib/stats-store";
import { getPublicStats } from "@/app/actions";
import type { UserStats } from "@/lib/github";
import Link from "next/link";
import { Home, AlertCircle } from "lucide-react";

export default function UserPage() {
  const params = useParams();
  const username = params.username as string;

  const { stats: storedStats, username: storedUsername } = useStatsStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (storedStats && storedUsername === username) {
      setStats(storedStats);
      return;
    }

    startTransition(async () => {
      const result = await getPublicStats(username);
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        setError(result.error || "User not found");
      }
    });
  }, [username, storedStats, storedUsername]);

  if (isPending) {
    return (
      <TerminalLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <LottieAnimation
            src="/animations/coding.lottie"
            loop={true}
            autoplay={true}
            className="sm:w-auto sm:h-96"
          />
          <p className="text-terminal/60 font-mono animate-pulse">
            Fetching stats for @{username}...
          </p>
        </div>
      </TerminalLayout>
    );
  }

  if (error) {
    return (
      <TerminalLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-48 h-48 mb-4">
            <LottieAnimation
              src="/animations/404-cat.lottie"
              loop={true}
              autoplay={true}
            />
          </div>
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span className="font-mono text-sm">USER NOT FOUND</span>
          </div>
          <p className="text-terminal/60 mb-6">
            Could not find GitHub user &quot;{username}&quot;
          </p>
          <Link
            href="/"
            className="px-4 py-2 bg-terminal/10 hover:bg-terminal/20 border border-terminal/30 rounded text-terminal transition-colors flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
        </div>
      </TerminalLayout>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <TerminalLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={stats.user.avatarUrl}
            alt={stats.user.login}
            className="w-16 h-16 rounded-full border-2 border-terminal/30"
          />
          <div>
            <h1 className="text-2xl font-bold text-terminal">
              {stats.user.name || stats.user.login}
            </h1>
            <p className="text-terminal/60 font-mono">@{stats.user.login}</p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm text-terminal/60 hover:text-terminal transition-colors"
        >
          ← Back to Home
        </Link>
      </div>

      <InsightsPanel
        insights={stats.insights}
        username={stats.user.login}
        languageCount={stats.languages.length}
      />

      <VisualizationTabs stats={stats} />

      <div className="mt-6">
        <details className="group">
          <summary className="cursor-pointer text-terminal/50 text-xs hover:text-terminal/70 transition-colors">
            <span className="group-open:hidden">▶ Show raw JSON data</span>
            <span className="hidden group-open:inline">
              ▼ Hide raw JSON data
            </span>
          </summary>
          <div className="mt-2">
            <StatsOutput stats={stats} error={null} />
          </div>
        </details>
      </div>
    </TerminalLayout>
  );
}
