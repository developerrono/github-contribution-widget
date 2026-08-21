import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { fetchContributions, type ContributionResponse } from "../lib/api";
import ProfileHeader from "../components/ProfileHeader";
import ContributionCalendar from "../components/ContributionCalendar";
import ContributionStats from "../components/ContributionStats";
import YearSelector from "../components/YearSelector";

type LoadState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: ContributionResponse };

export default function Home() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [pendingYear, setPendingYear] = useState<number | undefined>(undefined);

  const load = useCallback(async (year?: number) => {
    setState((prev) =>
      prev.status === "ready" ? prev : { status: "loading" }
    );
    try {
      const data = await fetchContributions(year);
      setState({ status: "ready", data });
    } catch {
      // Never surface raw error details in the UI — the backend never
      // leaks internals either, so a generic message is all we show.
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    load(pendingYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingYear]);

  const handleRetry = () => {
    setState({ status: "loading" });
    load(pendingYear);
  };

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[900px] flex-col items-center gap-6 px-4 pb-10 pt-8 sm:gap-8 sm:px-6 sm:pt-14">
      {state.status === "loading" && <LoadingSkeleton />}

      {state.status === "error" && <ErrorState onRetry={handleRetry} />}

      {state.status === "ready" && (
        <>
          <ProfileHeader
            username={state.data.username}
            displayName={state.data.displayName}
            avatarUrl={state.data.avatarUrl}
            profileUrl={state.data.profileUrl}
            totalContributions={state.data.totalContributions}
            year={state.data.year}
          />

          <YearSelector
            years={state.data.availableYears}
            selectedYear={state.data.year}
            onSelect={setPendingYear}
          />

          <section
            aria-label="Contribution calendar"
            className="w-full rounded-xl border border-gray-200 p-4 sm:p-5"
          >
            <ContributionCalendar weeks={state.data.weeks} />
          </section>

          <ContributionStats
            currentStreak={state.data.currentStreak}
            longestStreak={state.data.longestStreak}
            today={state.data.today}
            thisWeek={state.data.thisWeek}
            thisMonth={state.data.thisMonth}
          />

          <a
            href={state.data.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-black px-5 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white"
          >
            View GitHub
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </>
      )}
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <div
      className="flex w-full flex-col items-center gap-6 sm:gap-8"
      role="status"
      aria-label="Loading GitHub contributions"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-16 w-16 animate-pulse rounded-full bg-gray-100" />
        <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
        <div className="h-3 w-40 animate-pulse rounded bg-gray-100" />
      </div>

      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-14 animate-pulse rounded-full bg-gray-100" />
        ))}
      </div>

      <div className="h-32 w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50" />

      <div className="grid w-full max-w-sm grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 text-center">
      <p className="text-sm text-gray-600">Unable to load GitHub contributions.</p>
      <button
        type="button"
        onClick={onRetry}
        className="min-h-[44px] rounded-full border border-black px-5 py-2 text-sm font-medium text-black transition hover:bg-black hover:text-white"
      >
        Try again
      </button>
    </div>
  );
}
