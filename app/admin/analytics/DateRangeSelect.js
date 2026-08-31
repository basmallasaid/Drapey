"use client";

import { useRouter, usePathname } from "next/navigation";

const PRESET_OPTIONS = [
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "3m", label: "Last 3 Months" },
  { key: "6m", label: "Last 6 Months" },
  { key: "year", label: "This Year" },
  { key: "custom", label: "Custom Range" },
];

const CONTROL_CLASS =
  "text-[11px] bg-[var(--color-cream)] border border-[var(--color-light-beige)] rounded-lg px-3 py-2 text-[var(--color-medium-brown)] outline-none focus:border-[var(--color-tan)] transition-colors";

export default function DateRangeSelect({ value = "30d", from = "", to = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  const apply = (range, start, end) => {
    const params = new URLSearchParams();
    if (range) params.set("range", range);
    if (range === "custom") {
      if (start) params.set("from", start);
      if (end) params.set("to", end);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      <select
        value={value}
        onChange={(e) => apply(e.target.value, from, to)}
        className={CONTROL_CLASS}
        aria-label="Analytics date range"
      >
        {PRESET_OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>

      {value === "custom" && (
        <>
          <label className="flex items-center gap-2 text-[10px] text-[var(--color-medium-brown)] font-bold uppercase tracking-wide">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => apply("custom", e.target.value, to)}
              className={CONTROL_CLASS}
            />
          </label>
          <label className="flex items-center gap-2 text-[10px] text-[var(--color-medium-brown)] font-bold uppercase tracking-wide">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => apply("custom", from, e.target.value)}
              className={CONTROL_CLASS}
            />
          </label>
        </>
      )}
    </div>
  );
}