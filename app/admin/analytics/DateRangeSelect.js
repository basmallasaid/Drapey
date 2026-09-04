"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RANGE_OPTIONS } from "./utils";

const CONTROL_CLASS =
  "text-[11px] bg-[var(--color-cream)] border border-[var(--color-light-beige)] rounded-lg px-3 py-2 text-[var(--color-medium-brown)] outline-none focus:border-[var(--color-tan)] transition-colors";

export default function DateRangeSelect({ range = "30d", from = "", to = "", view = "" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [fromValue, setFromValue] = useState(from);
  const [toValue, setToValue] = useState(to);
  const [error, setError] = useState("");

  useEffect(() => {
    setFromValue(from);
    setToValue(to);
  }, [from, to]);

  function buildParams(nextRange, f, t, v) {
    const params = new URLSearchParams();
    params.set("range", nextRange);
    if (v) params.set("view", v);
    if (nextRange === "custom") {
      if (f) params.set("from", f);
      if (t) params.set("to", t);
    }
    return params;
  }

  function navigate(nextRange, f, t) {
    router.push(`${pathname}?${buildParams(nextRange, f, t, view).toString()}`);
  }

  function onPreset(e) {
    setError("");
    navigate(e.target.value, "", "");
  }

  function applyCustom() {
    if (!fromValue || !toValue) {
      setError("Please choose both a start and end date.");
      return;
    }
    if (fromValue > toValue) {
      setError("The start date cannot be after the end date.");
      return;
    }
    setError("");
    navigate("custom", fromValue, toValue);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2">
      <select
        value={range}
        onChange={onPreset}
        className={CONTROL_CLASS}
        aria-label="Analytics date range"
      >
        {RANGE_OPTIONS.map((opt) => (
          <option key={opt.key} value={opt.key}>
            {opt.label}
          </option>
        ))}
      </select>

      {range === "custom" && (
        <>
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[var(--color-medium-brown)]">
            From
            <input
              type="date"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className={CONTROL_CLASS}
              aria-label="Custom range start date"
            />
          </label>
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-[var(--color-medium-brown)]">
            To
            <input
              type="date"
              value={toValue}
              onChange={(e) => setToValue(e.target.value)}
              className={CONTROL_CLASS}
              aria-label="Custom range end date"
            />
          </label>
          <button
            type="button"
            onClick={applyCustom}
            className="text-[11px] font-bold bg-[var(--color-dark-brown)] text-white rounded-lg px-4 py-2 hover:bg-[var(--color-tan)] transition-colors"
          >
            Apply
          </button>
          {error && (
            <span className="text-[11px] font-medium text-red-600" role="alert">
              {error}
            </span>
          )}
        </>
      )}
    </div>
  );
}