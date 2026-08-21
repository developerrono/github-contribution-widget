export interface ContributionDay {
  date: string; // YYYY-MM-DD
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

export interface GitHubGraphQLDay {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

export interface GitHubGraphQLWeek {
  contributionDays: GitHubGraphQLDay[];
}

export interface GitHubGraphQLResponse {
  data?: {
    user: {
      login: string;
      name: string | null;
      avatarUrl: string;
      url: string;
      createdAt: string;
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
          weeks: GitHubGraphQLWeek[];
        };
      };
    } | null;
  };
  errors?: Array<{ message: string }>;
}
