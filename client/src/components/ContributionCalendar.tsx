import { useEffect, useRef, useState } from "react";
import type { ContributionDay, ContributionWeek } from "../lib/api";
import ContributionDaySquare, { formatDateLabel } from "./ContributionDay";

interface ContributionCalendarProps {
  weeks: ContributionWeek[];
}

const WEEKDAY_LABELS: Array<{ index: number; label: string }> = [
  { index: 1, label: "Mon" },
  { index: 3, label: "Wed" },
  { index: 5, label: "Fri" }
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

interface TooltipState {
  day: ContributionDay;
  top: number;
  left: number;
}

export default function ContributionCalendar({ weeks }: ContributionCalendarProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll the calendar to the most recent week on mount so the current
  // date is visible by default on narrow screens.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [weeks]);

  // Dismiss the tooltip on outside click/tap.
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setTooltip(null);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleSelect(day: ContributionDay, el: HTMLButtonElement) {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    setTooltip((prev) =>
      prev?.day.date === day.date
        ? null
        : {
            day,
            top: elRect.top - containerRect.top,
            left: elRect.left - containerRect.left + elRect.width / 2
          }
    );
  }

  // Build month labels: one label per week-column where the month
  // changes relative to the previous column.
  const monthLabels = weeks.map((week, i) => {
    const firstDay = week.contributionDays[0];
    if (!firstDay) return null;
    const month = Number(firstDay.date.slice(5, 7)) - 1;
    const prevWeek = weeks[i - 1];
    const prevFirstDay = prevWeek?.contributionDays[0];
    const prevMonth = prevFirstDay ? Number(prevFirstDay.date.slice(5, 7)) - 1 : -1;
    return month !== prevMonth ? MONTH_NAMES[month] : null;
  });

  return (
    <div ref={containerRef} className="relative w-full">
      <div ref={scrollRef} className="no-scrollbar overflow-x-auto pb-2">
        <div className="inline-flex">
          <div className="flex w-7 shrink-0 flex-col gap-[3px] pt-[18px]">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const match = WEEKDAY_LABELS.find((w) => w.index === dayIndex);
              return (
                <div
                  key={dayIndex}
                  className="flex h-[11px] items-center text-[10px] leading-none text-gray-400 sm:h-[12px]"
                >
                  {match?.label ?? ""}
                </div>
              );
            })}
          </div>

          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                <div className="h-[14px] whitespace-nowrap text-[10px] leading-none text-gray-400">
                  {monthLabels[weekIndex] ?? ""}
                </div>
                <div className="flex flex-col gap-[3px]">
                  {Array.from({ length: 7 }).map((_, dayIndex) => {
                    const day = week.contributionDays.find((d) => {
                      const date = new Date(`${d.date}T00:00:00Z`);
                      return date.getUTCDay() === dayIndex;
                    });
                    if (!day) {
                      return (
                        <div
                          key={dayIndex}
                          className="h-[11px] w-[11px] shrink-0 sm:h-[12px] sm:w-[12px]"
                        />
                      );
                    }
                    return (
                      <ContributionDaySquare
                        key={day.date}
                        day={day}
                        isSelected={tooltip?.day.date === day.date}
                        onSelect={handleSelect}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-md"
          style={{ top: tooltip.top - 8, left: tooltip.left }}
        >
          <p className="font-medium text-black">{formatDateLabel(tooltip.day.date)}</p>
          <p className="text-gray-500">
            {tooltip.day.count} contribution{tooltip.day.count === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
