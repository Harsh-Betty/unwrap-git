"use client";
import type { UserStats } from "@/lib/github";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface StatsOutputProps {
  stats: UserStats | null;
  error?: string | null;
}

interface CollapsibleSectionProps {
  title: string;
  data: unknown;
  defaultCollapsed?: boolean;
  lineStart: number;
}

function CollapsibleSection({
  title,
  data,
  defaultCollapsed = false,
  lineStart,
}: CollapsibleSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split("\n");

  return (
    <div className="border-b border-terminal/10 last:border-b-0">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 py-2 px-4 hover:bg-terminal/5 
                   transition-colors text-left cursor-pointer group"
      >
        <span className="select-none w-10 shrink-0 text-right pr-4 text-terminal/30 border-r border-terminal/10 mr-4">
          {lineStart}
        </span>
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-terminal/50" />
        ) : (
          <ChevronDown className="w-4 h-4 text-terminal/50" />
        )}
        <span className="text-cyan-400">&quot;{title}&quot;</span>
        <span className="text-white">:</span>
        {collapsed && (
          <span className="text-terminal/40 text-xs ml-2">
            [{lines.length} lines...]
          </span>
        )}
      </button>
      {!collapsed && (
        <pre className="pl-4 text-sm">
          <code>
            {lines.map((line, i) => (
              <div key={i} className="flex hover:bg-terminal/5 group">
                <span className="select-none w-10 shrink-0 text-right pr-4 text-terminal/30 border-r border-terminal/10 mr-4">
                  {lineStart + i + 1}
                </span>
                <span className="text-terminal/90 whitespace-pre pl-4">
                  {highlightJson(line)}
                </span>
              </div>
            ))}
          </code>
        </pre>
      )}
    </div>
  );
}

export function StatsOutput({ stats, error }: StatsOutputProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (stats || error) {
      const timer = setTimeout(() => setVisible(true), 200);
      return () => clearTimeout(timer);
    }
  }, [stats, error]);

  if (!stats && !error) return null;

  if (error) {
    return (
      <div
        className={`stats-output mt-6 transition-opacity duration-500 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-[#1a0a0a] border border-red-900/50 rounded p-6 shadow-[0_0_30px_rgba(255,0,0,0.1)]">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-400 font-bold uppercase tracking-wider text-sm">
              Error
            </span>
          </div>
          <pre className="text-red-400 text-sm whitespace-pre-wrap font-mono">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const userLines = JSON.stringify(stats.user, null, 2).split("\n").length;
  const contribLines = JSON.stringify(stats.contributions, null, 2).split(
    "\n"
  ).length;
  const calendarLines = JSON.stringify(stats.calendar, null, 2).split(
    "\n"
  ).length;
  const langLines = JSON.stringify(stats.languages, null, 2).split("\n").length;

  let lineCounter = 2;

  return (
    <div
      className={`stats-output mt-6 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-terminal-surface border border-terminal/20 rounded overflow-hidden shadow-[0_0_40px_rgba(255,176,0,0.1)]">
        <div className="flex items-center justify-between px-4 py-2 bg-terminal-bg border-b border-terminal/20">
          <div className="flex items-center gap-2">
            <span className="text-terminal text-lg">✓</span>
            <span className="text-terminal/80 text-sm uppercase tracking-wider font-bold">
              Stats for @{stats.user.login}
            </span>
          </div>
          <span className="text-terminal/40 text-xs">
            {stats.contributions.total} contributions in 2025
          </span>
        </div>

        <div className="flex hover:bg-terminal/5 px-4 py-1">
          <span className="select-none w-10 shrink-0 text-right pr-4 text-terminal/30 border-r border-terminal/10 mr-4">
            1
          </span>
          <span className="text-terminal/90">{"{"}</span>
        </div>

        <CollapsibleSection
          title="user"
          data={stats.user}
          lineStart={lineCounter}
        />
        {(lineCounter += userLines + 1)}

        <CollapsibleSection
          title="contributions"
          data={stats.contributions}
          lineStart={lineCounter}
        />
        {(lineCounter += contribLines + 1)}

        <CollapsibleSection
          title="calendar"
          data={stats.calendar}
          defaultCollapsed={true}
          lineStart={lineCounter}
        />
        {(lineCounter += calendarLines + 1)}

        <CollapsibleSection
          title="languages"
          data={stats.languages}
          lineStart={lineCounter}
        />
        {(lineCounter += langLines + 1)}

        <CollapsibleSection
          title="topRepos"
          data={stats.topRepos}
          lineStart={lineCounter}
        />

        <div className="flex hover:bg-terminal/5 px-4 py-1">
          <span className="select-none w-10 shrink-0 text-right pr-4 text-terminal/30 border-r border-terminal/10 mr-4">
            ~
          </span>
          <span className="text-terminal/90">{"}"}</span>
        </div>

        <div className="px-4 py-3 bg-terminal-bg border-t border-terminal/20">
          <div className="flex flex-wrap gap-4 text-xs text-terminal/60">
            <span>{stats.contributions.commits} commits</span>
            <span>{stats.contributions.pullRequests} PRs</span>
            <span>{stats.contributions.issues} issues</span>
            <span>{stats.contributions.pullRequestReviews} reviews</span>
            {stats.languages[0] && <span>Top: {stats.languages[0].name}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// JSON syntax highlighting
function highlightJson(line: string): React.ReactNode {
  const keyMatch = line.match(/^(\s*)"([^"]+)"(:)/);
  if (keyMatch) {
    const [, indent, key, colon] = keyMatch;
    const rest = line.slice(keyMatch[0].length);
    return (
      <>
        {indent}
        <span className="text-cyan-400">&quot;{key}&quot;</span>
        <span className="text-white">{colon}</span>
        {highlightValue(rest)}
      </>
    );
  }

  return highlightValue(line);
}

function highlightValue(value: string): React.ReactNode {
  if (value.includes('"')) {
    return <span className="text-amber-400">{value}</span>;
  }
  if (/^\s*\d+/.test(value)) {
    return <span className="text-purple-400">{value}</span>;
  }
  if (/true|false|null/.test(value)) {
    return <span className="text-pink-400">{value}</span>;
  }
  return <span className="text-terminal/90">{value}</span>;
}
