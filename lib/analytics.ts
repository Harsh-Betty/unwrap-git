import type { UserStats } from "./github";

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
    count: number;
  };
  weekendWarrior: number; // percentage of contributions on weekends
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
      busiestMonth: { month: "N/A", count: 0 },
      weekendWarrior: 0,
    };
  }

  // sort calendar by date
  const sorted = [...calendar].sort((a, b) => a.date.localeCompare(b.date));

  // most productive day of week
  const dayTotals = new Array(7).fill(0);
  let totalContributions = 0;
  let totalContributionDays = 0;
  let weekendContributions = 0;

  for (const day of sorted) {
    dayTotals[day.weekday] += day.count;
    totalContributions += day.count;
    if (day.count > 0) totalContributionDays++;
    if (day.weekday === 0 || day.weekday === 6) {
      weekendContributions += day.count;
    }
  }

  const maxDayIndex = dayTotals.indexOf(Math.max(...dayTotals));
  const mostProductiveDay = {
    day: DAY_NAMES[maxDayIndex],
    dayIndex: maxDayIndex,
    count: dayTotals[maxDayIndex],
  };

  // busiest month
  const monthTotals = new Map<string, number>();
  for (const day of sorted) {
    const month = day.date.slice(0, 7); // YYYY-MM
    monthTotals.set(month, (monthTotals.get(month) || 0) + day.count);
  }

  let busiestMonth = { month: "N/A", count: 0 };
  for (const [month, count] of monthTotals) {
    if (count > busiestMonth.count) {
      const monthIndex = parseInt(month.slice(5, 7)) - 1;
      busiestMonth = {
        month: MONTH_NAMES[monthIndex],
        count,
      };
    }
  }

  // streaks - longest and current
  let longestStreak = 0;
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].count > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // current streak (from most recent day backwards)
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  const averagePerDay =
    totalContributionDays > 0
      ? Math.round((totalContributions / sorted.length) * 10) / 10
      : 0;

  const weekendWarrior =
    totalContributions > 0
      ? Math.round((weekendContributions / totalContributions) * 100)
      : 0;

  return {
    mostProductiveDay,
    longestStreak,
    currentStreak,
    totalContributionDays,
    averagePerDay,
    busiestMonth,
    weekendWarrior,
  };
}

export function formatInsightMessage(
  insights: Insights,
  stats: UserStats
): string[] {
  const messages: string[] = [];

  messages.push(
    `🔥 ${insights.currentStreak} day streak (longest: ${insights.longestStreak} days)`
  );
  messages.push(
    `📅 Most productive on ${insights.mostProductiveDay.day}s (${insights.mostProductiveDay.count} contributions)`
  );
  messages.push(
    `📈 ${insights.busiestMonth.month} was your busiest month (${insights.busiestMonth.count} contributions)`
  );

  if (insights.weekendWarrior >= 30) {
    messages.push(
      `🏠 Weekend Warrior: ${insights.weekendWarrior}% of contributions on weekends!`
    );
  }

  if (stats.languages[0]) {
    messages.push(
      `💻 Top language: ${stats.languages[0].name} (${stats.languages[0].commitCount} commits)`
    );
  }

  return messages;
}
