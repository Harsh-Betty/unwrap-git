"use client";
import type { UserStats } from "@/lib/github";
import { useEffect, useState } from "react";

interface StatsOutputProps {
  stats: UserStats | null;
  error?: string | null;
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
            <span className="text-red-500 text-lg">⛔</span>
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

  const jsonOutput = JSON.stringify(stats, null, 2);
  const lines = jsonOutput.split("\n");

  return (
    <div
      className={`stats-output mt-6 transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="bg-[#0d1a0d] border border-[#00ff00]/20 rounded overflow-hidden shadow-[0_0_40px_rgba(0,255,0,0.1)]">
        <div className="flex items-center justify-between px-4 py-2 bg-[#0a140a] border-b border-[#00ff00]/20">
          <div className="flex items-center gap-2">
            <span className="text-[#00ff00] text-lg">✓</span>
            <span className="text-[#00ff00]/80 text-sm uppercase tracking-wider font-bold">
              Stats for @{stats.user.login}
            </span>
          </div>
          <span className="text-[#00ff00]/40 text-xs">
            {stats.contributions.total} contributions in 2025
          </span>
        </div>

        {/* JSON output */}
        <div className="overflow-x-auto">
          <pre className="p-4 text-sm">
            <code>
              {lines.map((line, i) => (
                <div key={i} className="flex hover:bg-[#00ff00]/5 group">
                  <span className="select-none w-10 shrink-0 text-right pr-4 text-[#00ff00]/30 border-r border-[#00ff00]/10 mr-4">
                    {i + 1}
                  </span>
                  <span className="text-[#00ff00]/90 whitespace-pre">
                    {highlightJson(line)}
                  </span>
                </div>
              ))}
            </code>
          </pre>
        </div>

        <div className="px-4 py-3 bg-[#0a140a] border-t border-[#00ff00]/20">
          <div className="flex flex-wrap gap-4 text-xs text-[#00ff00]/60">
            <span>📊 {stats.contributions.commits} commits</span>
            <span>🔀 {stats.contributions.pullRequests} PRs</span>
            <span>📝 {stats.contributions.issues} issues</span>
            <span>🗣️ {stats.contributions.pullRequestReviews} reviews</span>
            {stats.languages[0] && (
              <span>💻 Top: {stats.languages[0].name}</span>
            )}
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
  return <span className="text-[#00ff00]/90">{value}</span>;
}
