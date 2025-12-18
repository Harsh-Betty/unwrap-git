"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ContributionWave } from "./charts/ContributionWave";
import { LanguageChart } from "./charts/LanguageChart";
import { ActivityCalendar } from "./charts/ActivityCalendar";
import type { UserStats } from "@/lib/github";

// lazy load 3D component
const GitSkyline = dynamic(
  () => import("./3d/GitSkyline").then((mod) => ({ default: mod.GitSkyline })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-[#050505] rounded-lg border border-[#00ff00]/20 flex items-center justify-center">
        <div className="text-[#00ff00]/50 animate-pulse">
          Loading 3D Skyline...
        </div>
      </div>
    ),
  }
);

interface VisualizationTabsProps {
  stats: UserStats;
}

type TabId = "charts" | "calendar" | "skyline";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "charts", label: "Charts", icon: "📊" },
  { id: "calendar", label: "Calendar", icon: "📅" },
  { id: "skyline", label: "3D Skyline", icon: "🏙️" },
];

export function VisualizationTabs({ stats }: VisualizationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("charts");

  return (
    <div className="mt-6">
      <div className="flex border-b border-[#00ff00]/20 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm transition-colors cursor-pointer flex items-center gap-2
              ${
                activeTab === tab.id
                  ? "text-[#00ff00] border-b-2 border-[#00ff00] -mb-px"
                  : "text-[#00ff00]/40 hover:text-[#00ff00]/70"
              }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {activeTab === "charts" && (
          <>
            <ContributionWave data={stats.insights.weeklyData} />
            <LanguageChart languages={stats.languages} />
          </>
        )}

        {activeTab === "calendar" && (
          <ActivityCalendar calendar={stats.calendar} />
        )}

        {activeTab === "skyline" && (
          <GitSkyline calendar={stats.calendar} username={stats.user.login} />
        )}
      </div>
    </div>
  );
}
