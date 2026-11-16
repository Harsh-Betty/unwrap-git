// GitHub launched in 2008, so there is nothing to unwrap before that.
export const FIRST_YEAR = 2008;

export function currentYear(now: Date = new Date()): number {
  return now.getUTCFullYear();
}

export function isValidYear(year: number, now: Date = new Date()): boolean {
  return Number.isInteger(year) && year >= FIRST_YEAR && year <= currentYear(now);
}

// Accepts only a plain four-digit year, so "2025abc" or "02025" are rejected.
export function parseYear(value: string, now: Date = new Date()): number | null {
  if (!/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return isValidYear(year, now) ? year : null;
}

export interface YearRange {
  from: Date;
  to: Date;
  // true while the year is still in progress, so stats are year-to-date
  isYtd: boolean;
}

// Jan 1st 00:00:00 UTC to Dec 31st 23:59:59 UTC, capped at "now" for the
// current year.
export function yearRange(year: number, now: Date = new Date()): YearRange {
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59));
  const isYtd = now < end;
  return { from, to: isYtd ? now : end, isYtd };
}

export function selectableYears(now: Date = new Date()): number[] {
  const latest = currentYear(now);
  return Array.from({ length: latest - FIRST_YEAR + 1 }, (_, i) => latest - i);
}

export function profilePath(login: string, year: number): string {
  return year === currentYear() ? `/${login}` : `/${login}/${year}`;
}
