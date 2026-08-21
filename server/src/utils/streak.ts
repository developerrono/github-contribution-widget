import type { ContributionDay } from "../types.js";

/**
 * Returns today's date as YYYY-MM-DD in the given IANA timezone.
 * Defaults to UTC when no timezone is provided.
 */
export function todayInTimezone(timeZone = "UTC"): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  // en-CA formats as YYYY-MM-DD
  return formatter.format(new Date());
}

/**
 * Flattens weeks into a single chronologically sorted list of days,
 * filtering out any dates strictly after "today" so future placeholder
 * days (which GitHub returns to pad the current week) are never treated
 * as zero-contribution days that would break a streak.
 */
export function flattenAndClampDays(
  days: ContributionDay[],
  today: string
): ContributionDay[] {
  return days
    .filter((day) => day.date <= today)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Current streak: consecutive days with at least 1 contribution,
 * counting backwards from "today". If today has 0 contributions yet
 * (e.g. it's early in the day), the streak still counts backwards from
 * yesterday, since the streak isn't broken until a full day passes with
 * zero contributions.
 */
export function calculateCurrentStreak(
  sortedDays: ContributionDay[],
  today: string
): number {
  if (sortedDays.length === 0) return 0;

  const byDate = new Map(sortedDays.map((d) => [d.date, d.count]));

  let cursor = new Date(`${today}T00:00:00Z`);
  let streak = 0;

  // If today has zero contributions, don't break the streak yet —
  // just start counting from yesterday. If today has contributions,
  // include it.
  const todayCount = byDate.get(today) ?? 0;
  if (todayCount === 0) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  // Walk backwards day by day while contributions exist.
  // Guard against days missing from the map (treat as 0, stop).
  const earliestDate = sortedDays[0]?.date;
  while (true) {
    const dateStr = cursor.toISOString().slice(0, 10);
    if (earliestDate && dateStr < earliestDate) break;

    const count = byDate.get(dateStr);
    if (count === undefined || count === 0) break;

    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

/**
 * Longest streak: longest consecutive run of days with at least
 * 1 contribution within the provided (already clamped/sorted) days.
 */
export function calculateLongestStreak(sortedDays: ContributionDay[]): number {
  let longest = 0;
  let current = 0;
  let prevDate: string | null = null;

  for (const day of sortedDays) {
    if (day.count > 0) {
      if (prevDate && isNextDay(prevDate, day.date)) {
        current += 1;
      } else {
        current = 1;
      }
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
    prevDate = day.date;
  }

  return longest;
}

function isNextDay(prevDateStr: string, dateStr: string): boolean {
  const prev = new Date(`${prevDateStr}T00:00:00Z`);
  const next = new Date(`${dateStr}T00:00:00Z`);
  const diffMs = next.getTime() - prev.getTime();
  return diffMs === 24 * 60 * 60 * 1000;
}

export function sumRange(
  sortedDays: ContributionDay[],
  fromDate: string,
  toDate: string
): number {
  return sortedDays
    .filter((d) => d.date >= fromDate && d.date <= toDate)
    .reduce((sum, d) => sum + d.count, 0);
}

/** Returns YYYY-MM-DD for N days before the given date string (UTC). */
export function daysBefore(dateStr: string, n: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Returns YYYY-MM-01 for the given date string. */
export function startOfMonth(dateStr: string): string {
  return `${dateStr.slice(0, 7)}-01`;
}
