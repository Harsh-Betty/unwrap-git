import { formatHour } from "@/lib/archetype";
import type { CommitSample } from "@/lib/github";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Sequential amber ramp on the dark surface: more commits, brighter cell.
const RAMP = ["#1a1408", "#3d2800", "#6b4600", "#a86e00", "#ffb000"];

function rampColor(value: number, max: number): string {
  if (value === 0 || max === 0) return RAMP[0];
  const step = Math.ceil((value / max) * (RAMP.length - 1));
  return RAMP[Math.min(step, RAMP.length - 1)];
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}

export function CommitClock({ sample }: { sample: CommitSample }) {
  const maxHour = Math.max(...sample.hours, 1);
  const peakHour = sample.hours.indexOf(Math.max(...sample.hours));
  const cells = sample.weekdayHours.flat();
  const maxCell = Math.max(...cells, 1);
  const peakCell = cells.indexOf(Math.max(...cells));

  const chartHeight = 96;
  const barWidth = 10;
  const gap = 4;
  const width = 24 * (barWidth + gap) - gap;

  return (
    <section
      aria-labelledby="commit-clock-title"
      className="p-4 bg-terminal-bg rounded border border-terminal/15"
    >
      <h2 id="commit-clock-title" className="text-terminal font-bold">
        When you commit
      </h2>
      <p className="text-terminal/70 text-sm mt-1">
        Busiest hour: <strong className="text-terminal">{formatHour(peakHour)}</strong>
        . Busiest slot:{" "}
        <strong className="text-terminal">
          {DAY_NAMES[Math.floor(peakCell / 24)]}s around{" "}
          {formatHour(peakCell % 24)}
        </strong>
        .
      </p>

      <div className="mt-4 overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${chartHeight + 18}`}
          className="w-full min-w-[336px] h-auto"
          role="img"
          aria-label={`Commits by hour of day. Busiest at ${formatHour(peakHour)}.`}
        >
          {sample.hours.map((count, hour) => {
            const height = count === 0 ? 0 : Math.max(2, (count / maxHour) * chartHeight);
            const x = hour * (barWidth + gap);
            return (
              <g key={hour}>
                <title>{`${formatHour(hour)}: ${plural(count, "commit")}`}</title>
                {/* Hit area covers the whole column, not only the bar. */}
                <rect x={x} y={0} width={barWidth + gap} height={chartHeight} fill="transparent" />
                <rect
                  x={x}
                  y={chartHeight - height}
                  width={barWidth}
                  height={height}
                  rx={2}
                  fill={hour === peakHour ? "#ffb000" : "#a86e00"}
                />
              </g>
            );
          })}
          <line x1={0} x2={width} y1={chartHeight + 0.5} y2={chartHeight + 0.5} stroke="#ffb000" strokeOpacity={0.25} />
          {[0, 6, 12, 18].map((hour) => (
            <text
              key={hour}
              x={hour * (barWidth + gap)}
              y={chartHeight + 14}
              fontSize={10}
              fill="#ffb000"
              fillOpacity={0.75}
            >
              {formatHour(hour)}
            </text>
          ))}
        </svg>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="border-separate border-spacing-[2px] text-[10px] text-terminal/70">
          <caption className="sr-only">
            Commits by weekday and hour of day
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="sr-only">Day</span>
              </th>
              {Array.from({ length: 24 }, (_, hour) => (
                <th key={hour} scope="col" className="font-normal w-3">
                  <span className={hour % 6 === 0 ? "" : "sr-only"}>
                    {formatHour(hour).replace(" ", "")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.weekdayHours.map((row, day) => (
              <tr key={day}>
                <th scope="row" className="font-normal pr-2 text-left">
                  {DAYS[day]}
                </th>
                {row.map((count, hour) => (
                  <td
                    key={hour}
                    title={`${DAY_NAMES[day]} ${formatHour(hour)}: ${plural(count, "commit")}`}
                    className="w-3 h-3 min-w-3 rounded-[2px] p-0"
                    style={{ backgroundColor: rampColor(count, maxCell) }}
                  >
                    <span className="sr-only">{count}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-terminal/70">
        From {plural(sample.commits, "commit")} in your{" "}
        {plural(
          sample.repos,
          "busiest public repository",
          "busiest public repositories"
        )}
        , in the timezone each commit was written in.
      </p>
    </section>
  );
}
