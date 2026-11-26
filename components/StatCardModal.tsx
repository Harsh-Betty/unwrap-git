"use client";
import { useEffect, useRef, useState } from "react";
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
import type { Archetype } from "@/lib/archetype";
import type { UserStats } from "@/lib/github";

interface StatCardModalProps {
  stats: UserStats;
  rank: { rank: number; total: number } | null;
  archetype: Archetype;
  isOpen: boolean;
  onClose: () => void;
}

export function StatCardModal({
  stats,
  rank,
  archetype,
  isOpen,
  onClose,
}: Readonly<StatCardModalProps>) {
  const cardRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Native modal dialog: focus trap, Escape and focus return come built in.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const topLanguage = stats.languages[0];
  const fileName = `${stats.user.login}-unwrapped-${stats.year}.png`;
  const shareTitle = `${stats.user.login}'s GitHub Unwrapped ${stats.year}`;
  const shareText = `My ${stats.year} on GitHub: ${stats.contributions.commits.toLocaleString()} commits as a ${archetype.title}`;

  async function handleDownload() {
    if (!cardRef.current) return;
    setNotice(null);

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        backgroundColor: "#0a0a0a",
        pixelRatio: 3,
      });

      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export image:", error);
      setNotice("The image could not be created. Try again.");
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
      const file = new File([blob], fileName, {
        type: "image/png",
      });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setNotice("Link copied to your clipboard.");
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        setNotice("Sharing did not work. Download the image instead.");
      }
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        setNotice(null);
        onClose();
      }}
      // A click on the backdrop lands on the dialog element itself.
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      aria-label="Share card"
      className="m-auto w-[min(24rem,calc(100vw-2rem))] max-h-[calc(100dvh-2rem)] overflow-visible p-0 pt-14 bg-transparent backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="relative w-full">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="focus-ring absolute -top-14 right-0 p-2.5 text-terminal/70 hover:text-terminal transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" aria-hidden="true" />
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
                {/* A plain img: html-to-image must inline it as is, and
                    next/image would rewrite it through the optimizer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={stats.user.avatarUrl}
                  alt=""
                  crossOrigin="anonymous"
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
              {rank && (
                <div className="px-2 py-1 bg-terminal/20 border border-terminal/40 rounded text-terminal text-xs font-bold">
                  #{rank.rank} of {rank.total.toLocaleString("en-US")}
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <Sparkles className="w-8 h-8 text-amber-400 mb-2" />
              <p className="text-terminal/60 text-xs uppercase tracking-widest mb-1">
                Developer Archetype
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">
                {archetype.title}
              </h2>
              <p className="text-terminal/70 text-sm italic">
                {archetype.reason}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2 rounded-lg bg-terminal/5 border border-terminal/20 text-center">
                <GitCommit className="w-4 h-4 text-terminal/60 mx-auto mb-1" />
                <p className="text-lg font-bold text-terminal font-mono">
                  {stats.contributions.commits.toLocaleString()}
                </p>
                <p className="text-[10px] text-terminal/70 uppercase">
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
                    <p className="text-[10px] text-terminal/70 uppercase">
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
                <p className="text-[10px] text-terminal/70 uppercase">Streak</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-terminal/70 font-mono pt-2 border-t border-terminal/20">
              <span>unwrap-git.hrshvrdhn.com</span>
              <span>{stats.year}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="focus-ring flex-1 py-3 px-4 rounded-lg bg-terminal/20 hover:bg-terminal/30 border border-terminal/40 text-terminal font-mono text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Download</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="focus-ring flex-1 py-3 px-4 rounded-lg bg-terminal/20 hover:bg-terminal/30 border border-terminal/40 text-terminal font-mono text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share className="w-4 h-4" aria-hidden="true" />
            <span>Share</span>
          </button>
        </div>
        <p role="status" className="mt-3 min-h-5 text-center text-sm text-terminal/80">
          {notice}
        </p>
      </div>
    </dialog>
  );
}
