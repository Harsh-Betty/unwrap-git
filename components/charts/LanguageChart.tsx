"use client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface LanguageChartProps {
  languages: {
    name: string;
    color: string;
    commitCount: number;
  }[];
}

export function LanguageChart({ languages }: LanguageChartProps) {
  if (!languages || languages.length === 0) return null;

  const topLangs = languages.slice(0, 6);
  const totalCommits = topLangs.reduce((sum, l) => sum + l.commitCount, 0);

  const data = topLangs.map((lang) => ({
    name: lang.name,
    value: lang.commitCount,
    color: lang.color || "#ffb000",
    percentage: Math.round((lang.commitCount / totalCommits) * 100),
  }));

  return (
    <div className="w-full bg-terminal-bg rounded-lg border border-terminal/20 p-4">
      <div className="text-terminal/60 text-xs uppercase tracking-wider mb-4">
        Language Breakdown
      </div>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={60}
                paddingAngle={2}
                dataKey="value"
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#0a0806"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0a0806",
                  border: "1px solid #ffb000",
                  borderRadius: "4px",
                  color: "#ffb000",
                  fontSize: "12px",
                }}
                formatter={(value?: number, name?: string) => [
                  `${value} commits`,
                  name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          {data.map((lang, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: lang.color }}
              />
              <span className="text-terminal/80 truncate">{lang.name}</span>
              <span className="text-terminal/40 text-xs">
                {lang.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
