import type { ReactNode } from "react";
import { Flame, Trophy } from "lucide-react";

interface ContributionStatsProps {
  currentStreak: number;
  longestStreak: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export default function ContributionStats({
  currentStreak,
  longestStreak,
  today,
  thisWeek,
  thisMonth
}: ContributionStatsProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <StreakPill icon={<Flame className="h-4 w-4" aria-hidden="true" />} label={`${currentStreak} day streak`} />
        <StreakPill
          icon={<Trophy className="h-4 w-4" aria-hidden="true" />}
          label={`${longestStreak} day best`}
        />
      </div>

      <dl className="grid w-full max-w-sm grid-cols-3 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        <StatCell label="Today" value={today} />
        <StatCell label="This Week" value={thisWeek} />
        <StatCell label="This Month" value={thisMonth} />
      </dl>
    </div>
  );
}

function StreakPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700">
      {icon}
      {label}
    </span>
  );
}

function StatCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 bg-white px-2 py-3">
      <dd className="text-xl font-semibold tabular-nums text-black">
        {value.toLocaleString()}
      </dd>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
    </div>
  );
}
