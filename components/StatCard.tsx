"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2, Code2, GitCommit } from "lucide-react";
import type { UserStats } from "@/lib/github";

interface StatCardProps {
  stats: UserStats;
}

export function StatCard({ stats }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const topLanguage = stats.languages[0];

  // Generate mini contribution bars from calendar data (last 52 days)
  const recentActivity = stats.calendar.slice(-52).map((day) => day.count);
  const maxCount = Math.max(...recentActivity, 1);

  async function handleDownload() {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      link.download = `${stats.user.login}-unwrapped-2025.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export image:", error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        className="relative p-6 rounded-xl bg-linear-to-br from-neutral-900 via-neutral-950 to-black border border-terminal/30 overflow-hidden"
      >
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-terminal/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={stats.user.avatarUrl}
              alt={stats.user.login}
              className="w-16 h-16 rounded-full border-2 border-terminal/50"
            />
            <div>
              <h3 className="text-xl font-bold text-white">
                {stats.user.name || stats.user.login}
              </h3>
              <p className="text-terminal/70 font-mono text-sm">
                @{stats.user.login}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-terminal/5 border border-terminal/20">
              <div className="flex items-center gap-2 text-terminal/60 text-xs mb-1">
                <GitCommit className="w-3 h-3" />
                <span>Commits 2025</span>
              </div>
              <p className="text-2xl font-bold text-terminal font-mono">
                {stats.contributions.commits.toLocaleString()}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-terminal/5 border border-terminal/20">
              <div className="flex items-center gap-2 text-terminal/60 text-xs mb-1">
                <Code2 className="w-3 h-3" />
                <span>Top Language</span>
              </div>
              {topLanguage ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: topLanguage.color }}
                  />
                  <p className="text-lg font-semibold text-white">
                    {topLanguage.name}
                  </p>
                </div>
              ) : (
                <p className="text-lg text-white/50">N/A</p>
              )}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-terminal/60 text-xs mb-2 font-mono">CODE DNA</p>
            <div className="flex items-end gap-0.5 h-8">
              {recentActivity.map((count, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-terminal/80"
                  style={{
                    height: `${Math.max((count / maxCount) * 100, 8)}%`,
                    opacity: 0.3 + (count / maxCount) * 0.7,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-terminal/40 font-mono pt-4 border-t border-terminal/10">
            <span>unwrap-git.hrshvrdhn.com</span>
            <span>2025</span>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownload}
        disabled={isExporting}
        className="w-full py-3 px-4 rounded-lg bg-terminal/20 hover:bg-terminal/30 border border-terminal/40 text-terminal font-mono text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Download Snapshot</span>
          </>
        )}
      </button>
    </div>
  );
}
