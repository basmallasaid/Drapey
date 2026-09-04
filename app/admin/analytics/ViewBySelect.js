"use client";

import { useRouter, usePathname } from "next/navigation";
import { GRANULARITIES, VIEW_LABELS } from "./utils";

const CONTROL_CLASS =
  "text-[11px] bg-[var(--color-cream)] border border-[var(--color-light-beige)] rounded-lg px-3 py-2 text-[var(--color-medium-brown)] outline-none focus:border-[var(--color-tan)] transition-colors";

export default function ViewBySelect({ value = "day", range = "30d", from = "", to = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  function onChange(e) {
    const params = new URLSearchParams();
    params.set("range", range);
    if (range === "custom") {
      if (from) params.set("from", from);
      if (to) params.set("to", to);
    }
    params.set("view", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select value={value} onChange={onChange} className={CONTROL_CLASS} aria-label="Analytics chart granularity">
      {GRANULARITIES.map((g) => (
        <option key={g} value={g}>
          {VIEW_LABELS[g]}
        </option>
      ))}
    </select>
  );
}