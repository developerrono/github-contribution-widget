interface YearSelectorProps {
  years: number[];
  selectedYear: number;
  onSelect: (year: number) => void;
  disabled?: boolean;
}

export default function YearSelector({
  years,
  selectedYear,
  onSelect,
  disabled
}: YearSelectorProps) {
  if (years.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Select contribution year"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      {years.map((year) => {
        const isActive = year === selectedYear;
        return (
          <button
            key={year}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onSelect(year)}
            className={`min-h-[36px] rounded-full border px-3.5 py-1.5 font-mono text-sm transition disabled:opacity-50 ${
              isActive
                ? "border-black bg-black text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-black"
            }`}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}
