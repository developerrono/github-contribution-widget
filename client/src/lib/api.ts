export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContributionWeek {
  contributionDays: ContributionDay[];
}

export interface ContributionResponse {
  username: string;
  displayName: string | null;
  avatarUrl: string;
  profileUrl: string;
  year: number;
  availableYears: number[];
  totalContributions: number;
  currentStreak: number;
  longestStreak: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  weeks: ContributionWeek[];
}

export class ApiError extends Error {}

/**
 * Fetches contribution data for the given year (defaults to the
 * current year on the backend when omitted). Always talks to our own
 * backend — the GitHub token never touches the browser.
 */
export async function fetchContributions(
  year?: number
): Promise<ContributionResponse> {
  const params = new URLSearchParams();
  if (year) params.set("year", String(year));
  const query = params.toString();

  const response = await fetch(`/api/github/contributions${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new ApiError("Unable to load GitHub contributions.");
  }

  return (await response.json()) as ContributionResponse;
}
