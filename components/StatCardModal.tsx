"use client";
import { useRef, useState } from "react";
import { toPng } from "html-to-image";
import {
  Download,
  Loader2,
  GitCommit,
  Flame,
  Code2,
  X,
  Share,
  Sparkles,
} from "lucide-react";
import type { UserStats } from "@/lib/github";

interface StatCardModalProps {
  stats: UserStats;
  isOpen: boolean;
  onClose: () => void;
}

function getArchetype(stats: UserStats): {
  title: string;
  description: string;
} {
  const { insights, languages } = stats;
  const topLang = languages[0]?.name || "Code";

  if (insights.weekendWarrior >= 30) {
    return {
      title: "Weekend Warrior",
      description: "Codes when others rest",
    };
  }

  if (insights.mostProductiveDay.dayIndex >= 5) {
    return {
      title: "Weekend Warrior",
      description: "Peak productivity on weekends",
    };
  }

  if (
    insights.mostProductiveDay.dayIndex === 4 ||
    insights.mostProductiveDay.dayIndex === 5
  ) {
    return {
      title: "The Night Owl",
      description: "Thrives in the dark hours",
    };
  }

  if (insights.longestStreak >= 30) {
    return {
      title: "Streak Master",
      description: `${insights.longestStreak} days of pure dedication`,
    };
  }

  if (insights.codeDedication >= 70) {
    return {
      title: "The Relentless",
      description: "Commits almost every day",
    };
  }

  if (languages.length >= 5) {
    return {
      title: "The Polyglot",
      description: `Master of ${languages.length} languages`,
    };
  }

  return {
    title: `${topLang} Mage`,
    description: `Wielder of ${topLang} sorcery`,
  };
}

function getRankBadge(commits: number): string {
  if (commits >= 2000) return "Top 1%";
  if (commits >= 1000) return "Top 5%";
  if (commits >= 500) return "Top 10%";
  if (commits >= 200) return "Top 25%";
  return "Rising Star";
}

export function StatCardModal({
  stats,
  isOpen,
  onClose,
}: Readonly<StatCardModalProps>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const archetype = getArchetype(stats);
  const rankBadge = getRankBadge(stats.contributions.commits);
  const topLanguage = stats.languages[0];

  async function handleDownload() {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 3,
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

  async function handleShare() {
    if (!cardRef.current) return;

    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 2,
      });

      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${stats.user.login}-unwrapped-2025.png`, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${stats.user.login}'s GitHub Unwrapped 2025`,
          text: `Check out my GitHub stats for 2025! ${stats.contributions.commits} commits as a ${archetype.title}`,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: `${stats.user.login}'s GitHub Unwrapped 2025`,
          text: `Check out my GitHub stats for 2025! ${stats.contributions.commits} commits as a ${archetype.title}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm">
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-terminal/60 hover:text-terminal transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        <div
          ref={cardRef}
          className="relative w-full aspect-5/7 rounded-2xl overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, #0f0f0f 0%, #1a1a1a 50%, #0a0a0a 100%)",
          }}
        >
          <div className="absolute inset-0 rounded-2xl border-2 border-terminal/40" />
          <div className="absolute inset-0 rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.2)]" />

          <div className="relative h-full p-5 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src={stats.user.avatarUrl}
                  alt={stats.user.login}
                  className="w-14 h-14 rounded-full border-2 border-terminal/60 shadow-lg"
                />
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {stats.user.name ?? stats.user.login}
                  </h3>
                  <p className="text-terminal/70 font-mono text-xs">
                    @{stats.user.login}
                  </p>
                </div>
              </div>
              <div className="px-2 py-1 bg-terminal/20 border border-terminal/40 rounded text-terminal text-xs font-bold">
                {rankBadge}
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <Sparkles className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-terminal/60 text-xs uppercase tracking-widest mb-1">
                Developer Archetype
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">
                {archetype.title}
              </h2>
              <p className="text-terminal/50 text-sm italic">
                {archetype.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-terminal/5 border border-terminal/20 text-center">
                <GitCommit className="w-4 h-4 text-terminal/60 mx-auto mb-1" />
                <p className="text-lg font-bold text-terminal font-mono">
                  {stats.contributions.commits.toLocaleString()}
                </p>
                <p className="text-[10px] text-terminal/50 uppercase">
                  Commits
                </p>
              </div>

              <div className="p-2 rounded-lg bg-terminal/5 border border-terminal/20 text-center">
                <Code2 className="w-4 h-4 text-terminal/60 mx-auto mb-1" />
                {topLanguage ? (
                  <>
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: topLanguage.color }}
                      />
                      <p className="text-sm font-bold text-white truncate">
                        {topLanguage.name}
                      </p>
                    </div>
                    <p className="text-[10px] text-terminal/50 uppercase">
                      Top Lang
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-white/50">N/A</p>
                )}
              </div>

              <div className="p-2 rounded-lg bg-terminal/5 border border-terminal/20 text-center">
                <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-orange-400 font-mono">
                  {stats.insights.longestStreak}
                </p>
                <p className="text-[10px] text-terminal/50 uppercase">Streak</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-terminal/40 font-mono pt-2 border-t border-terminal/20">
              <span>unwrap-git.hrshvrdhn.com</span>
              <span>2025</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-lg bg-terminal/20 hover:bg-terminal/30 border border-terminal/40 text-terminal font-mono text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 py-3 px-4 rounded-lg bg-terminal/20 hover:bg-terminal/30 border border-terminal/40 text-terminal font-mono text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
}
