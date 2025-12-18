"use client";
import type { Insights } from "@/lib/analytics";

interface InsightsPanelProps {
  insights: Insights;
  username: string;
}

export function InsightsPanel({ insights, username }: InsightsPanelProps) {
  return (
    <div className="mt-6 p-4 bg-[#0a140a] border border-[#00ff00]/20 rounded">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-[#00ff00] text-lg">📊</span>
        <span className="text-[#00ff00]/80 text-sm uppercase tracking-wider font-bold">
          2025 Insights for @{username}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Streak */}
        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            🔥 Contribution Streak
          </div>
          <div className="text-[#00ff00] text-2xl font-bold">
            {insights.currentStreak} days
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            Longest: {insights.longestStreak} days
          </div>
        </div>

        {/* Most Productive Day */}
        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            📅 Most Productive Day
          </div>
          <div className="text-[#00ff00] text-2xl font-bold">
            {insights.mostProductiveDay.day}
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            {insights.mostProductiveDay.count} contributions
          </div>
        </div>

        {/* Busiest Month */}
        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            📈 Busiest Month
          </div>
          <div className="text-[#00ff00] text-2xl font-bold">
            {insights.busiestMonth.month}
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            {insights.busiestMonth.count} contributions
          </div>
        </div>

        {/* Contribution Stats */}
        <div className="p-3 bg-[#111] rounded border border-[#00ff00]/10">
          <div className="text-[#00ff00]/50 text-xs uppercase mb-1">
            📊 Active Days
          </div>
          <div className="text-[#00ff00] text-2xl font-bold">
            {insights.totalContributionDays}
          </div>
          <div className="text-[#00ff00]/40 text-xs">
            ~{insights.averagePerDay} per day avg
          </div>
        </div>
      </div>

      {insights.weekendWarrior >= 30 && (
        <div className="mt-4 p-3 bg-linear-to-r from-[#00ff00]/10 to-transparent rounded border border-[#00ff00]/20">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏠</span>
            <div>
              <div className="text-[#00ff00] font-bold">Weekend Warrior!</div>
              <div className="text-[#00ff00]/60 text-sm">
                {insights.weekendWarrior}% of your contributions were on
                weekends
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
