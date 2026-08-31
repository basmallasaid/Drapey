// Pure date/format helpers for the /admin/analytics page (no server imports,
// safe to use from both the server page and the client chart components).

export const RANGE_DEFAULT = "30d";

const DAY_MS = 86400000;

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

// Parses the ?range= / ?from= / ?to= query params into an inclusive date range.
// `to` is always treated as EXCLUSIVE so it maps cleanly onto gte/lt filters.
export function parseRange(query = {}) {
  const now = new Date();
  const key = query.range || RANGE_DEFAULT;

  if (key === "7d") return { key, from: addDays(now, -7), to: now };
  if (key === "3m") return { key, from: addMonths(now, -3), to: now };
  if (key === "6m") return { key, from: addMonths(now, -6), to: now };
  if (key === "year") return { key, from: new Date(now.getFullYear(), 0, 1), to: now };
  if (key === "custom") {
    const from = new Date(`${query.from || ""}T00:00:00`);
    const to = new Date(`${query.to || ""}T00:00:00`);
    if (!Number.isNaN(from.getTime()) && !Number.isNaN(to.getTime()) && to >= from) {
      return { key, from, to: addDays(to, 1) };
    }
  }

  // Default + fallback (also covers 30d explicitly).
  return { key: "30d", from: addDays(now, -30), to: now };
}

export function rangeLabel(range) {
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${fmt(range.from)} – ${fmt(addDays(range.to, -1))}`;
}

// Picks chart granularity from the requested range.
export function granularityForRange(range) {
  const days = Math.max(1, (range.to - range.from) / DAY_MS);
  if (range.key === "7d" || range.key === "30d") return "day";
  if (range.key === "3m") return "week";
  if (range.key === "6m" || range.key === "year") return "month";
  if (days <= 45) return "day";
  if (days <= 130) return "week";
  return "month";
}

// Builds an array of { start, end, label } time buckets covering [from, to).
export function buildBuckets(from, to, gran) {
  const buckets = [];
  if (gran === "month") {
    let s = new Date(from.getFullYear(), from.getMonth(), 1);
    while (s < to) {
      const next = new Date(s.getFullYear(), s.getMonth() + 1, 1);
      const end = Math.min(next.getTime(), to.getTime());
      buckets.push({
        start: s.getTime(),
        end,
        label: s.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      });
      s = next;
    }
  } else {
    const step = gran === "week" ? 7 * DAY_MS : DAY_MS;
    let start = from.getTime();
    while (start < to.getTime()) {
      const end = Math.min(start + step, to.getTime());
      buckets.push({
        start,
        end,
        label: new Date(start).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
      start = end;
    }
  }
  return buckets;
}

// Bucket a timestamp into the matching bucket index, or -1 when out of range.
export function bucketIndex(timestamp, buckets) {
  const t = new Date(timestamp).getTime();
  for (let i = 0; i < buckets.length; i += 1) {
    if (t >= buckets[i].start && t < buckets[i].end) return i;
  }
  return -1;
}

export function formatEgp(value) {
  return `EGP ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

export function formatEgpWhole(value) {
  return `EGP ${Math.round(Number(value)).toLocaleString()}`;
}