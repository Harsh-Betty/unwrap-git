"use client";
import type { Insights } from "@/lib/analytics";
import { formatPeakDate } from "@/lib/analytics";

interface InsightsPanelProps {
  insights: Insights;
  username: string;
  languageCount: number;
}

function CircularProgress({ value, label }: { value: number; label: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#00ff0020"
            strokeWidth="4"
          />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#00ff00"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-[#00ff00] font-bold">
          {value}%
        </div>
      </div>
      <span className="text-[#00ff00]/50 text-xs">{label}</span>
    </div>
  );
}

export function InsightsPanel({
  insights,
  username,
  languageCount,
}: InsightsPanelProps) {
  return (
    <div className="mt-6 p-4 bg-[#0a140a] border border-[#00ff00]/20 rounded">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#00ff00] text-lg">📊</span>
        <span className="text-[#00ff00]/80 text-sm uppercase tracking-wider font-bold">
          2025 Insights for @{username}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10 text-center">
          <div className="text-[#00ff00] text-3xl font-bold">
            {insights.currentStreak}
          </div>
          <div className="text-[#00ff00]/50 text-xs uppercase mt-1">
            Day Streak
          </div>
          <div className="text-[#00ff00]/30 text-xs">
            Best: {insights.longestStreak}
          </div>
        </div>

        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10 text-center">
          <div className="text-[#00ff00] text-3xl font-bold">
            {insights.totalContributionDays}
          </div>
          <div className="text-[#00ff00]/50 text-xs uppercase mt-1">
            Active Days
          </div>
          <div className="text-[#00ff00]/30 text-xs">
            ~{insights.averagePerDay}/day
          </div>
        </div>

        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10 text-center">
          <div className="text-[#00ff00] text-3xl font-bold">
            {languageCount}
          </div>
          <div className="text-[#00ff00]/50 text-xs uppercase mt-1">
            Languages
          </div>
          <div className="text-[#00ff00]/30 text-xs">Used in 2025</div>
        </div>

        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <CircularProgress
            value={insights.codeDedication}
            label="Dedication"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            📅 Peak Day
          </div>
          <div className="text-[#00ff00] text-xl font-bold">
            {formatPeakDate(insights.peakDay.date)}
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            {insights.peakDay.count} contributions
          </div>
        </div>

        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            🗓️ Most Active On
          </div>
          <div className="text-[#00ff00] text-xl font-bold">
            {insights.mostProductiveDay.day}s
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            {insights.mostProductiveDay.count} total
          </div>
        </div>

        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            📈 Top Month
          </div>
          <div className="text-[#00ff00] text-xl font-bold">
            {insights.busiestMonth.month}
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            {insights.busiestMonth.count} contributions
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-4">
        {insights.weekendWarrior >= 30 && (
          <span className="px-2 py-1 text-xs bg-[#00ff00]/10 text-[#00ff00] rounded-full border border-[#00ff00]/30">
            🏠 Weekend Warrior ({insights.weekendWarrior}%)
          </span>
        )}
        {insights.longestStreak >= 7 && (
          <span className="px-2 py-1 text-xs bg-[#00ff00]/10 text-[#00ff00] rounded-full border border-[#00ff00]/30">
            🔥 Week Streak Master
          </span>
        )}
        {insights.codeDedication >= 50 && (
          <span className="px-2 py-1 text-xs bg-[#00ff00]/10 text-[#00ff00] rounded-full border border-[#00ff00]/30">
            💪 Consistent Coder
          </span>
        )}
        {languageCount >= 5 && (
          <span className="px-2 py-1 text-xs bg-[#00ff00]/10 text-[#00ff00] rounded-full border border-[#00ff00]/30">
            🌈 Polyglot
          </span>
        )}
      </div>
    </div>
  );
}
