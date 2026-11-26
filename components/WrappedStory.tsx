"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { formatPeakDate } from "@/lib/analytics";
import { compact, formatHour, type Archetype } from "@/lib/archetype";
import type { UserStats } from "@/lib/github";

interface Slide {
  kicker: string;
  headline: string;
  detail: string;
}

function buildSlides(stats: UserStats, archetype: Archetype): Slide[] {
  const { contributions, insights, languages, commitSample, repos } = stats;
  const period = stats.isYtd ? `${stats.year} so far` : `${stats.year}`;
  const slides: Slide[] = [
    {
      kicker: period,
      headline: `${compact(contributions.total)} contributions`,
      detail: `${compact(contributions.commits)} commits, ${compact(contributions.pullRequests)} pull requests, ${compact(contributions.pullRequestReviews)} reviews and ${compact(contributions.issues)} issues.`,
    },
  ];

  const top = languages[0];
  if (top) {
    slides.push({
      kicker: "Your language",
      headline: top.name,
      detail:
        languages.length > 1
          ? `${Math.round(top.share * 100)}% of your commits, ahead of ${languages[1].name}.`
          : `${Math.round(top.share * 100)}% of your commits.`,
    });
  }

  if (insights.peakDay.count > 0) {
    slides.push({
      kicker: "Your biggest day",
      headline: formatPeakDate(insights.peakDay.date),
      detail: `${insights.peakDay.count} contributions in one day. Your average was ${insights.averagePerDay}.`,
    });
  }

  if (commitSample && commitSample.commits >= 10) {
    const peak = commitSample.hours.indexOf(Math.max(...commitSample.hours));
    slides.push({
      kicker: "Your hour",
      headline: formatHour(peak),
      detail: `More commits landed around ${formatHour(peak)} than any other hour.`,
    });
  }

  slides.push({
    kicker: "Your longest streak",
    headline: `${insights.longestStreak} ${insights.longestStreak === 1 ? "day" : "days"}`,
    detail: `You contributed on ${insights.totalContributionDays} of ${insights.totalDays} days.`,
  });

  const topRepo = repos[0];
  if (topRepo) {
    slides.push({
      kicker: "Where you spent your time",
      headline: topRepo.name,
      detail: `${compact(topRepo.total)} contributions${topRepo.isOwn ? "" : `, in ${topRepo.owner}'s repository`}.`,
    });
  }

  slides.push({
    kicker: "Which makes you",
    headline: archetype.title,
    detail: `${archetype.reason}.`,
  });

  return slides;
}

interface WrappedStoryProps {
  stats: UserStats;
  archetype: Archetype;
  open: boolean;
  onClose: () => void;
  onShare: () => void;
}

// A short tap-through recap. Native <dialog> opened with showModal() gives
// focus trapping, Escape to close and focus return for free.
export function WrappedStory({
  stats,
  archetype,
  open,
  onClose,
  onShare,
}: WrappedStoryProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const slides = buildSlides(stats, archetype);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const go = useCallback(
    (step: number) =>
      setIndex((current) =>
        Math.min(slides.length - 1, Math.max(0, current + step))
      ),
    [slides.length]
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLDialogElement>) {
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={() => {
        setIndex(0);
        onClose();
      }}
      onKeyDown={handleKeyDown}
      aria-labelledby="story-headline"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] p-0 bg-transparent text-terminal backdrop:bg-black/85"
    >
      <div className="relative flex flex-col min-h-[30rem] p-6 rounded-2xl border border-terminal/40 bg-terminal-surface">
        <div className="flex gap-1" aria-hidden="true">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full ${i <= index ? "bg-terminal" : "bg-terminal/20"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="focus-ring absolute top-4 right-4 p-2.5 text-terminal/70 hover:text-terminal cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div
          key={index}
          aria-live="polite"
          className="boot-reveal flex-1 flex flex-col justify-center py-10"
        >
          <p className="text-terminal/70 text-sm uppercase tracking-widest">
            {slide.kicker}
          </p>
          <h2
            id="story-headline"
            className="mt-3 text-4xl font-bold text-terminal glow-text break-words"
          >
            {slide.headline}
          </h2>
          <p className="mt-4 text-terminal/80">{slide.detail}</p>
        </div>

        <p className="sr-only">
          Slide {index + 1} of {slides.length}
        </p>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            className="focus-ring inline-flex items-center gap-1 min-h-11 px-3 rounded text-terminal/80 hover:text-terminal disabled:invisible cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            Back
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={() => {
                dialogRef.current?.close();
                onShare();
              }}
              className="focus-ring min-h-11 px-4 rounded bg-terminal text-terminal-bg font-bold hover:bg-terminal-bright cursor-pointer"
            >
              Make a share card
            </button>
          ) : (
            <button
              type="button"
              autoFocus
              onClick={() => go(1)}
              className="focus-ring inline-flex items-center gap-1 min-h-11 px-4 rounded bg-terminal text-terminal-bg font-bold hover:bg-terminal-bright cursor-pointer"
            >
              Next
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
