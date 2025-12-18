export interface Insights {
  mostProductiveDay: {
    day: string;
    dayIndex: number;
    count: number;
  };
  longestStreak: number;
  currentStreak: number;
  totalContributionDays: number;
  averagePerDay: number;
  busiestMonth: {
    month: string;
    monthIndex: number;
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
    count: number;
  }[];
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

export function computeInsights(
  calendar: { date: string; count: number; weekday: number }[]
): Insights {
  if (calendar.length === 0) {
    return {
      mostProductiveDay: { day: "N/A", dayIndex: 0, count: 0 },
      longestStreak: 0,
      currentStreak: 0,
      totalContributionDays: 0,
      averagePerDay: 0,
      busiestMonth: { month: "N/A", monthIndex: 0, count: 0 },
      weekendWarrior: 0,
      codeDedication: 0,
      peakDay: { date: "", count: 0 },
      monthlyData: [],
      weeklyData: [],
    };
  }

  const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));

  const dayTotals = new Array(7).fill(0);
  let totalContributions = 0;
  let totalContributionDays = 0;
  let weekendContributions = 0;
  let peakDay = { date: "", count: 0 };

  for (const day of sorted) {
    dayTotals[day.weekday] += day.count;
    totalContributions += day.count;
    if (day.count > 0) totalContributionDays++;
    if (day.weekday === 0 || day.weekday === 6) {
      weekendContributions += day.count;
    }
    if (day.count > peakDay.count) {
      peakDay = { date: day.date, count: day.count };
    }
  }

  const maxDayIndex = dayTotals.indexOf(Math.max(...dayTotals));
  const mostProductiveDay = {
    day: DAY_NAMES[maxDayIndex],
    dayIndex: maxDayIndex,
    count: dayTotals[maxDayIndex],
  };

  const monthTotals = new Map<string, number>();
  for (const day of sorted) {
    const month = day.date.slice(0, 7);
    monthTotals.set(month, (monthTotals.get(month) || 0) + day.count);
  }

  let busiestMonth = { month: "N/A", monthIndex: 0, count: 0 };
  const monthlyData: { month: string; monthIndex: number; count: number }[] =
    [];

  for (const [month, count] of monthTotals) {
    const monthIndex = parseInt(month.slice(5, 7)) - 1;
    const monthName = MONTH_NAMES[monthIndex];
    monthlyData.push({ month: monthName, monthIndex, count });
    if (count > busiestMonth.count) {
      busiestMonth = { month: monthName, monthIndex, count };
    }
  }
  monthlyData.sort((a, b) => a.monthIndex - b.monthIndex);

  const weeklyData: { week: number; count: number }[] = [];
  let weekCount = 0;
  let currentWeek = 0;

  for (let i = 0; i < sorted.length; i++) {
    const weekNum = Math.floor(i / 7);
    if (weekNum !== currentWeek) {
      weeklyData.push({ week: currentWeek + 1, count: weekCount });
      weekCount = 0;
      currentWeek = weekNum;
    }
    weekCount += sorted[i].count;
  }
  if (weekCount > 0) {
    weeklyData.push({ week: currentWeek + 1, count: weekCount });
  }

  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (const day of sorted) {
    if (day.count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const averagePerDay =
    sorted.length > 0
      ? Math.round((totalContributions / sorted.length) * 10) / 10
      : 0;

  const weekendWarrior =
    totalContributions > 0
      ? Math.round((weekendContributions / totalContributions) * 100)
      : 0;

  const codeDedication =
    sorted.length > 0
      ? Math.round((totalContributionDays / sorted.length) * 100)
      : 0;

  return {
    mostProductiveDay,
    longestStreak,
    currentStreak,
    totalContributionDays,
    averagePerDay,
    busiestMonth,
    weekendWarrior,
    codeDedication,
    peakDay,
    monthlyData,
    weeklyData,
  };
}

export function formatPeakDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
