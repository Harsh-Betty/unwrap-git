"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { ContributionWave } from "./charts/ContributionWave";
import { LanguageChart } from "./charts/LanguageChart";
import { ActivityCalendar } from "./charts/ActivityCalendar";
import { BarChart3, Calendar, Dna, Mountain, CreditCard } from "lucide-react";
import { StatCardModal } from "./StatCardModal";
import type { UserStats } from "@/lib/github";

// lazy load 3D components
const ContributionHelix = dynamic(
  () =>
    import("./3d/ContributionHelix").then((mod) => ({
      default: mod.ContributionHelix,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-terminal-bg rounded-lg border border-terminal/20 flex items-center justify-center">
        <div className="text-terminal/50 animate-pulse">
          Loading 3D Helix...
        </div>
      </div>
    ),
  }
);

const ContributionTerrain = dynamic(
  () =>
    import("./3d/ContributionTerrain").then((mod) => ({
      default: mod.ContributionTerrain,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-terminal-bg rounded-lg border border-terminal/20 flex items-center justify-center">
        <div className="text-terminal/50 animate-pulse">
          Loading 3D Terrain...
        </div>
      </div>
    ),
  }
);

interface VisualizationTabsProps {
  stats: UserStats;
}

type TabId = "charts" | "calendar" | "helix" | "terrain";

const TABS: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "charts", label: "Charts", icon: BarChart3 },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "helix", label: "3D Helix", icon: Dna },
  { id: "terrain", label: "3D Terrain", icon: Mountain },
];

export function VisualizationTabs({ stats }: Readonly<VisualizationTabsProps>) {
  const [activeTab, setActiveTab] = useState<TabId>("charts");
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between border-b border-terminal/20 mb-4 overflow-x-auto">
        <div className="flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm transition-colors cursor-pointer flex items-center gap-2
                  ${
                    activeTab === tab.id
                      ? "text-terminal border-b-2 border-terminal -mb-px"
                      : "text-terminal/40 hover:text-terminal/70"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsCardModalOpen(true)}
          className="px-3 py-1.5 text-sm bg-terminal/10 hover:bg-terminal/20 border border-terminal/30 rounded text-terminal transition-colors cursor-pointer flex items-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          <span>Generate Card</span>
        </button>
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

        {activeTab === "helix" && (
          <ContributionHelix
            calendar={stats.calendar}
            username={stats.user.login}
          />
        )}

        {activeTab === "terrain" && (
          <ContributionTerrain
            calendar={stats.calendar}
            username={stats.user.login}
          />
        )}
      </div>

      <StatCardModal
        stats={stats}
        isOpen={isCardModalOpen}
        onClose={() => setIsCardModalOpen(false)}
      />
    </div>
  );
}
