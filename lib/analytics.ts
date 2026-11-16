export interface CalendarDay {
  date: string; // YYYY-MM-DD
  count: number;
  weekday: number; // 0 = Sunday
}

export interface Insights {
  mostProductiveDay: {
    day: string;
    dayIndex: number;
    count: number;
  };
  longestStreak: number;
  // Streak ending on the last day of the range. Only meaningful while the
  // year is still in progress.
  currentStreak: number;
  // Longest run of days without a single contribution.
  longestBreak: number;
  totalContributionDays: number;
  totalDays: number;
  averagePerDay: number;
  busiestMonth: {
    month: string;
    monthIndex: number;
    count: number;
  };
  busiestWeek: {
    start: string;
    count: number;
  };
  weekendWarrior: number;
  codeDedication: number;
  peakDay: {
    date: string;
    count: number;
  };
  monthlyData: {
    month: string;
    monthIndex: number;
    count: number;
  }[];
  weeklyData: {
    week: number;
    start: string;
    count: number;
  }[];
  // Contributions per quarter, Q1 to Q4.
  quarters: number[];
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EMPTY_INSIGHTS: Insights = {
  mostProductiveDay: { day: "N/A", dayIndex: 0, count: 0 },
  longestStreak: 0,
  currentStreak: 0,
  longestBreak: 0,
  totalContributionDays: 0,
  totalDays: 0,
  averagePerDay: 0,
  busiestMonth: { month: "N/A", monthIndex: 0, count: 0 },
  busiestWeek: { start: "", count: 0 },
  weekendWarrior: 0,
  codeDedication: 0,
  peakDay: { date: "", count: 0 },
  monthlyData: [],
  weeklyData: [],
  quarters: [0, 0, 0, 0],
};

function maxBy<T>(items: T[], score: (item: T) => number): T | undefined {
  return items.reduce<T | undefined>(
    (best, item) =>
      best === undefined || score(item) > score(best) ? item : best,
    undefined
  );
}

// Longest run of consecutive days matching the predicate.
function longestRun(
  days: CalendarDay[],
  matches: (day: CalendarDay) => boolean
): number {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = matches(day) ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  return longest;
}

export function computeInsights(calendar: CalendarDay[]): Insights {
  if (calendar.length === 0) return EMPTY_INSIGHTS;

  const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.reduce((sum, day) => sum + day.count, 0);
  const activeDays = sorted.filter((day) => day.count > 0).length;

  const dayTotals = DAY_NAMES.map((_, index) =>
    sorted
      .filter((day) => day.weekday === index)
      .reduce((sum, day) => sum + day.count, 0)
  );
  const topDayIndex = dayTotals.indexOf(Math.max(...dayTotals));

  const monthTotals = MONTH_NAMES.map(() => 0);
  const monthsSeen = new Set<number>();
  for (const day of sorted) {
    const monthIndex = Number(day.date.slice(5, 7)) - 1;
    monthTotals[monthIndex] += day.count;
    monthsSeen.add(monthIndex);
  }
  const monthlyData = [...monthsSeen]
    .sort((a, b) => a - b)
    .map((monthIndex) => ({
      month: MONTH_NAMES[monthIndex],
      monthIndex,
      count: monthTotals[monthIndex],
    }));
  const busiestMonth =
    maxBy(
      monthlyData.filter((month) => month.count > 0),
      (month) => month.count
    ) ?? EMPTY_INSIGHTS.busiestMonth;

  // Weeks run Sunday to Saturday like the GitHub calendar, so the first and
  // last week of a year can be partial.
  const weeklyData: Insights["weeklyData"] = [];
  for (const day of sorted) {
    const last = weeklyData[weeklyData.length - 1];
    if (!last || day.weekday === 0) {
      weeklyData.push({
        week: weeklyData.length + 1,
        start: day.date,
        count: day.count,
      });
    } else {
      last.count += day.count;
    }
  }
  const topWeek = maxBy(weeklyData, (week) => week.count);

  const peak = maxBy(sorted, (day) => day.count);

  const lastGapIndex = sorted.findLastIndex((day) => day.count === 0);
  const currentStreak = sorted.length - 1 - lastGapIndex;

  const weekendTotal = dayTotals[0] + dayTotals[6];

  return {
    mostProductiveDay: {
      day: total > 0 ? DAY_NAMES[topDayIndex] : "N/A",
      dayIndex: topDayIndex,
      count: dayTotals[topDayIndex],
    },
    longestStreak: longestRun(sorted, (day) => day.count > 0),
    currentStreak,
    longestBreak: longestRun(sorted, (day) => day.count === 0),
    totalContributionDays: activeDays,
    totalDays: sorted.length,
    averagePerDay: Math.round((total / sorted.length) * 10) / 10,
    busiestMonth,
    busiestWeek:
      topWeek && topWeek.count > 0
        ? { start: topWeek.start, count: topWeek.count }
        : EMPTY_INSIGHTS.busiestWeek,
    weekendWarrior: total > 0 ? Math.round((weekendTotal / total) * 100) : 0,
    codeDedication: Math.round((activeDays / sorted.length) * 100),
    peakDay:
      peak && peak.count > 0
        ? { date: peak.date, count: peak.count }
        : EMPTY_INSIGHTS.peakDay,
    monthlyData,
    weeklyData,
    quarters: [0, 1, 2, 3].map((quarter) =>
      monthTotals
        .slice(quarter * 3, quarter * 3 + 3)
        .reduce((sum, count) => sum + count, 0)
    ),
  };
}

// Dates are calendar days (YYYY-MM-DD), so format them in UTC to avoid the
// viewer's timezone shifting them by a day.
export function formatPeakDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
