"use client";
import { useMemo, useState } from "react";

interface ActivityCalendarProps {
  calendar: { date: string; count: number; weekday: number }[];
}

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getColorForCount(count: number): string {
  if (count === 0) return "#161b22";
  if (count <= 3) return "#0e4429";
  if (count <= 6) return "#006d32";
  if (count <= 9) return "#26a641";
  return "#39d353";
}

export function ActivityCalendar({ calendar }: ActivityCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{
    date: string;
    count: number;
    x: number;
    y: number;
  } | null>(null);

  const { weeks, monthLabels } = useMemo(() => {
    if (!calendar || calendar.length === 0)
      return { weeks: [], monthLabels: [] };

    const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
    const weeks: { date: string; count: number; weekday: number }[][] = [];
    let currentWeek: typeof sorted = [];

    const firstDate = new Date(sorted[0].date);
    const startDayOfWeek = firstDate.getDay();
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push({ date: "", count: -1, weekday: i });
    }

    for (const day of sorted) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    const monthLabels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, weekIndex) => {
      const validDay = week.find((d) => d.date && d.count >= 0);
      if (validDay) {
        const date = new Date(validDay.date);
        const month = date.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({ month: MONTH_LABELS[month], weekIndex });
          lastMonth = month;
        }
      }
    });

    return { weeks, monthLabels };
  }, [calendar]);

  if (weeks.length === 0) return null;

  const cellSize = 11;
  const cellGap = 3;
  const width = weeks.length * (cellSize + cellGap) + 30;
  const height = 7 * (cellSize + cellGap) + 30;

  return (
    <div className="w-full bg-[#0a0a0a] rounded-lg border border-[#00ff00]/20 p-4 overflow-x-auto">
      <div className="text-[#00ff00]/60 text-xs uppercase tracking-wider mb-4">
        Activity Calendar · 2025
      </div>
      <div className="relative" style={{ minWidth: width }}>
        <svg width={width} height={height}>
          {monthLabels.map(({ month, weekIndex }, i) => (
            <text
              key={i}
              x={30 + weekIndex * (cellSize + cellGap)}
              y={12}
              fontSize={10}
              fill="#00ff0060"
            >
              {month}
            </text>
          ))}

          {["Sun", "", "Tue", "", "Thu", "", "Sat"].map((day, i) => (
            <text
              key={i}
              x={0}
              y={30 + i * (cellSize + cellGap) + cellSize - 2}
              fontSize={9}
              fill="#00ff0040"
            >
              {day}
            </text>
          ))}

          {weeks.map((week, weekIndex) =>
            week.map((day, dayIndex) => {
              if (day.count < 0) return null;
              return (
                <rect
                  key={`${weekIndex}-${dayIndex}`}
                  x={30 + weekIndex * (cellSize + cellGap)}
                  y={20 + dayIndex * (cellSize + cellGap)}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={getColorForCount(day.count)}
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoveredDay({
                      date: day.date,
                      count: day.count,
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                    });
                  }}
                  onMouseLeave={() => setHoveredDay(null)}
                />
              );
            })
          )}
        </svg>

        {hoveredDay && (
          <div
            className="fixed z-50 px-2 py-1 bg-[#0a0a0a] border border-[#00ff00] rounded text-xs text-[#00ff00] whitespace-nowrap pointer-events-none"
            style={{
              left: hoveredDay.x,
              top: hoveredDay.y - 30,
              transform: "translateX(-50%)",
            }}
          >
            {hoveredDay.count} contributions on{" "}
            {new Date(hoveredDay.date).toLocaleDateString()}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 text-xs text-[#00ff00]/40">
        <span>Less</span>
        {[0, 3, 6, 9, 12].map((count) => (
          <div
            key={count}
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: getColorForCount(count) }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
