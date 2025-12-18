"use client";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface ContributionWaveProps {
  data: { week: number; count: number }[];
}

export function ContributionWave({ data }: ContributionWaveProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-48 bg-[#0a0a0a] rounded-lg border border-[#00ff00]/20 p-4">
      <div className="text-[#00ff00]/60 text-xs uppercase tracking-wider mb-2">
        Contribution Wave · 2025
      </div>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff00" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00ff00" stopOpacity={0} />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <XAxis
            dataKey="week"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#00ff0050", fontSize: 10 }}
            tickFormatter={(week) => (week % 4 === 0 ? `W${week}` : "")}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0a0a0a",
              border: "1px solid #00ff00",
              borderRadius: "4px",
              color: "#00ff00",
              fontSize: "12px",
            }}
            labelFormatter={(week) => `Week ${week}`}
            formatter={(value?: number) => [`${value} contributions`, ""]}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#00ff00"
            strokeWidth={2}
            fill="url(#waveGradient)"
            filter="url(#glow)"
            animationDuration={1500}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
