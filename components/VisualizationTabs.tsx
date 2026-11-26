"use client";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import dynamic from "next/dynamic";
import { CalendarDays, CreditCard, LayoutGrid, Mountain, Play, Waves } from "lucide-react";
import { ActivityCalendar } from "./charts/ActivityCalendar";
import { ContributionWave } from "./charts/ContributionWave";
import { CommitClock } from "./insights/CommitClock";
import { FunFacts } from "./insights/FunFacts";
import { HighlightTiles } from "./insights/HighlightTiles";
import { LanguageBars } from "./insights/LanguageBars";
import { RepoList } from "./insights/RepoList";
import { StatCardModal } from "./StatCardModal";
import { WrappedStory } from "./WrappedStory";
import type { Archetype } from "@/lib/archetype";
import type { UserStats } from "@/lib/github";

// three.js is large, so the terrain only loads when its tab is opened.
const ContributionTerrain = dynamic(
  () =>
    import("./3d/ContributionTerrain").then((mod) => ({
      default: mod.ContributionTerrain,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-80 bg-terminal-bg rounded-lg border border-terminal/20 flex items-center justify-center">
        <p className="text-terminal/70 animate-pulse">Loading 3D terrain…</p>
      </div>
    ),
  }
);

interface VisualizationTabsProps {
  stats: UserStats;
  // Position on that year's leaderboard, when the user is listed.
  rank: { rank: number; total: number } | null;
  archetype: Archetype;
}

type TabId = "overview" | "calendar" | "weekly" | "terrain";

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "weekly", label: "Weekly", icon: Waves },
  { id: "terrain", label: "3D Terrain", icon: Mountain },
];

export function VisualizationTabs({
  stats,
  rank,
  archetype,
}: Readonly<VisualizationTabsProps>) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const baseId = useId();

  // Arrow keys move between tabs, as in the WAI-ARIA tabs pattern.
  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    const target =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? TABS.length - 1
          : step !== undefined
            ? (index + step + TABS.length) % TABS.length
            : null;
    if (target === null) return;
    event.preventDefault();
    setActiveTab(TABS[target].id);
    tabRefs.current[target]?.focus();
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          type="button"
          onClick={() => setIsStoryOpen(true)}
          className="focus-ring inline-flex items-center gap-2 min-h-11 px-4 rounded bg-terminal text-terminal-bg font-bold hover:bg-terminal-bright transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4" aria-hidden="true" />
          Play my {stats.year} recap
        </button>
        <button
          type="button"
          onClick={() => setIsCardOpen(true)}
          className="focus-ring inline-flex items-center gap-2 min-h-11 px-4 rounded border border-terminal/40 text-terminal hover:bg-terminal/10 transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4" aria-hidden="true" />
          Share card
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Visualizations"
        className="flex border-b border-terminal/20 mb-4 overflow-x-auto"
      >
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKey(event, index)}
              className={`focus-ring shrink-0 min-h-11 px-4 text-sm transition-colors cursor-pointer flex items-center gap-2 ${
                selected
                  ? "text-terminal border-b-2 border-terminal -mb-px"
                  : "text-terminal/70 hover:text-terminal"
              }`}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`${baseId}-panel`}
        aria-labelledby={`${baseId}-tab-${activeTab}`}
        tabIndex={0}
        className="space-y-4 focus:outline-none"
      >
        {activeTab === "overview" && (
          <>
            <HighlightTiles stats={stats} />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 [&>*]:min-w-0">
              {stats.commitSample && <CommitClock sample={stats.commitSample} />}
              <LanguageBars
                languages={stats.languages}
                restricted={stats.contributions.restricted}
              />
              <RepoList repos={stats.repos} login={stats.user.login} />
              <FunFacts stats={stats} />
            </div>
          </>
        )}

        {activeTab === "calendar" && (
          <ActivityCalendar calendar={stats.calendar} year={stats.year} />
        )}

        {activeTab === "weekly" && (
          <ContributionWave data={stats.insights.weeklyData} year={stats.year} />
        )}

        {activeTab === "terrain" && (
          <ContributionTerrain
            calendar={stats.calendar}
            username={stats.user.login}
          />
        )}
      </div>

      <WrappedStory
        stats={stats}
        archetype={archetype}
        open={isStoryOpen}
        onClose={() => setIsStoryOpen(false)}
        onShare={() => setIsCardOpen(true)}
      />
      <StatCardModal
        stats={stats}
        rank={rank}
        archetype={archetype}
        isOpen={isCardOpen}
        onClose={() => setIsCardOpen(false)}
      />
    </div>
  );
}
