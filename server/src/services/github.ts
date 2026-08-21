import fetch from "node-fetch";
import type {
  ContributionDay,
  ContributionResponse,
  ContributionWeek,
  GitHubGraphQLResponse
} from "../types.js";
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  daysBefore,
  flattenAndClampDays,
  startOfMonth,
  sumRange,
  todayInTimezone
} from "../utils/streak.js";

const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";

const LEVEL_MAP: Record<string, 0 | 1 | 2 | 3 | 4> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4
};

const QUERY = `
  query ContributionCalendar($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      login
      name
      avatarUrl
      url
      createdAt
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

interface CacheEntry {
  expiresAt: number;
  data: ContributionResponse;
}

// Simple in-memory cache keyed by "username:year".
// Good enough for a single-user widget; avoids hammering the GitHub API.
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cache of which years actually have data for the user, refreshed daily.
let availableYearsCache: { expiresAt: number; years: number[] } | null = null;

export class GitHubServiceError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "GitHubServiceError";
    this.status = status;
  }
}

function getEnv(): { token: string; username: string } {
  const token = process.env.GITHUB_TOKEN;
  const username = process.env.GITHUB_USERNAME;
  if (!token || !username) {
    throw new GitHubServiceError(
      "Server is not configured correctly.",
      500
    );
  }
  return { token, username };
}

async function fetchContributionYear(
  login: string,
  token: string,
  year: number
): Promise<{
  displayName: string | null;
  avatarUrl: string;
  profileUrl: string;
  totalContributions: number;
  days: ContributionDay[];
  createdAt: string;
}> {
  const from = `${year}-01-01T00:00:00Z`;
  const to = `${year}-12-31T23:59:59Z`;

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-contribution-widget"
    },
    body: JSON.stringify({
      query: QUERY,
      variables: { login, from, to }
    })
  });

  if (!response.ok) {
    throw new GitHubServiceError(
      `GitHub API responded with status ${response.status}`,
      502
    );
  }

  const json = (await response.json()) as GitHubGraphQLResponse;

  if (json.errors && json.errors.length > 0) {
    throw new GitHubServiceError(
      "GitHub API returned an error.",
      502
    );
  }

  const user = json.data?.user;
  if (!user) {
    throw new GitHubServiceError("GitHub user not found.", 404);
  }

  const calendar = user.contributionsCollection.contributionCalendar;

  const days: ContributionDay[] = calendar.weeks.flatMap((week) =>
    week.contributionDays.map((d) => ({
      date: d.date,
      count: d.contributionCount,
      level: LEVEL_MAP[d.contributionLevel] ?? 0
    }))
  );

  return {
    displayName: user.name,
    avatarUrl: user.avatarUrl,
    profileUrl: user.url,
    totalContributions: calendar.totalContributions,
    days,
    createdAt: user.createdAt
  };
}

function daysToWeeks(days: ContributionDay[]): ContributionWeek[] {
  // GitHub's calendar weeks run Sunday -> Saturday. Group by ISO week
  // start (Sunday) derived from each date so the calendar renders in
  // proper columns even if the source ever changes grouping.
  const weeksMap = new Map<string, ContributionDay[]>();

  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const dayOfWeek = date.getUTCDay(); // 0 = Sunday
    const sunday = new Date(date);
    sunday.setUTCDate(date.getUTCDate() - dayOfWeek);
    const key = sunday.toISOString().slice(0, 10);

    if (!weeksMap.has(key)) weeksMap.set(key, []);
    weeksMap.get(key)!.push(day);
  }

  const sortedKeys = Array.from(weeksMap.keys()).sort();
  return sortedKeys.map((key) => ({
    contributionDays: weeksMap.get(key)!.sort((a, b) => (a.date < b.date ? -1 : 1))
  }));
}

async function resolveAvailableYears(
  login: string,
  token: string
): Promise<number[]> {
  const now = Date.now();
  if (availableYearsCache && availableYearsCache.expiresAt > now) {
    return availableYearsCache.years;
  }

  // Fetch account creation year to know how far back data can exist.
  const currentYear = new Date().getUTCFullYear();
  const { createdAt } = await fetchContributionYear(login, token, currentYear).catch(
    async () => {
      // Fallback: if current year query somehow fails, still try to
      // return at least the current year.
      return {
        createdAt: `${currentYear}-01-01T00:00:00Z`,
        displayName: null,
        avatarUrl: "",
        profileUrl: "",
        totalContributions: 0,
        days: [] as ContributionDay[]
      };
    }
  );

  const createdYear = new Date(createdAt).getUTCFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= createdYear; y--) {
    years.push(y);
  }

  availableYearsCache = {
    expiresAt: now + 24 * 60 * 60 * 1000,
    years
  };

  return years;
}

export async function getContributions(
  requestedYear?: number
): Promise<ContributionResponse> {
  const { token, username } = getEnv();
  const currentYear = new Date().getUTCFullYear();
  const year = requestedYear ?? currentYear;

  const cacheKey = `${username}:${year}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.data;
  }

  const [yearData, availableYears] = await Promise.all([
    fetchContributionYear(username, token, year),
    resolveAvailableYears(username, token)
  ]);

  const today = todayInTimezone("UTC");
  const clampedDays = flattenAndClampDays(yearData.days, today);

  // Current streak needs to reflect real-world recency. If today is in
  // January, a streak that started in December of the previous year
  // must not be cut off at the year boundary, so we pull in the tail
  // end of the previous year's data whenever the visible year is the
  // current year and we're early enough for it to matter.
  let currentStreak = 0;
  if (year === currentYear) {
    let streakSourceDays = clampedDays;
    const isEarlyInYear = today.slice(5, 7) === "01"; // January
    if (isEarlyInYear && year > new Date(0).getUTCFullYear()) {
      try {
        const prevYearData = await fetchContributionYear(
          username,
          token,
          year - 1
        );
        const prevDays = flattenAndClampDays(prevYearData.days, today);
        const merged = [...prevDays, ...clampedDays];
        streakSourceDays = flattenAndClampDays(merged, today);
      } catch {
        // If the previous year fetch fails, fall back to only the
        // current year's data rather than failing the whole request.
        streakSourceDays = clampedDays;
      }
    }
    currentStreak = calculateCurrentStreak(streakSourceDays, today);
  }

  const longestStreak = calculateLongestStreak(clampedDays);

  const isCurrentYear = year === currentYear;
  const todayCount = isCurrentYear
    ? clampedDays.find((d) => d.date === today)?.count ?? 0
    : 0;
  const thisWeek = isCurrentYear
    ? sumRange(clampedDays, daysBefore(today, 6), today)
    : 0;
  const thisMonth = isCurrentYear
    ? sumRange(clampedDays, startOfMonth(today), today)
    : 0;

  const result: ContributionResponse = {
    username,
    displayName: yearData.displayName,
    avatarUrl: yearData.avatarUrl,
    profileUrl: yearData.profileUrl,
    year,
    availableYears,
    totalContributions: yearData.totalContributions,
    currentStreak,
    longestStreak,
    today: todayCount,
    thisWeek,
    thisMonth,
    weeks: daysToWeeks(clampedDays)
  };

  cache.set(cacheKey, { expiresAt: now + CACHE_TTL_MS, data: result });

  return result;
}
