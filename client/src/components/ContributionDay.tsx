import { forwardRef } from "react";
import type { ContributionDay as ContributionDayData } from "../lib/api";

const LEVEL_CLASSES: Record<0 | 1 | 2 | 3 | 4, string> = {
  0: "bg-level-0",
  1: "bg-level-1",
  2: "bg-level-2",
  3: "bg-level-3",
  4: "bg-level-4"
};

function formatDateLabel(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  return date.toLocaleDateString(undefined, {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

interface ContributionDayProps {
  day: ContributionDayData;
  isSelected: boolean;
  onSelect: (day: ContributionDayData, el: HTMLButtonElement) => void;
}

const ContributionDaySquare = forwardRef<HTMLButtonElement, ContributionDayProps>(
  ({ day, isSelected, onSelect }, ref) => {
    const label = `${formatDateLabel(day.date)}: ${day.count} contribution${
      day.count === 1 ? "" : "s"
    }`;

    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-pressed={isSelected}
        onClick={(e) => onSelect(day, e.currentTarget)}
        className={`h-[11px] w-[11px] shrink-0 rounded-[2px] transition sm:h-[12px] sm:w-[12px] ${LEVEL_CLASSES[day.level]} ${
          isSelected ? "ring-2 ring-black ring-offset-1" : "hover:ring-1 hover:ring-gray-400 hover:ring-offset-1"
        }`}
      />
    );
  }
);

ContributionDaySquare.displayName = "ContributionDaySquare";

export default ContributionDaySquare;
export { formatDateLabel };
