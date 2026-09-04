// Pure date/format helpers for the /admin/analytics page (no server imports,
// safe to use from both the server page and the client chart components).

export const RANGE_DEFAULT = "30d";

export const RANGE_OPTIONS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "Last 7 Days" },
  { key: "30d", label: "Last 30 Days" },
  { key: "3m", label: "Last 3 Months" },
  { key: "6m", label: "Last 6 Months" },
  { key: "year", label: "This Year" },
  { key: "lastyear", label: "Last Year" },
  { key: "all", label: "All Time" },
  { key: "custom", label: "Custom Range" },
];

export const GRANULARITIES = ["hour", "day", "week", "month", "year"];

export const VIEW_LABELS = {
  hour: "Hour",
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

const DAY_MS = 86400000;
const HOUR_MS = 3600000;

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
// Invalid/unknown ranges fall back to the last 30 days without throwing.
export function parseRange(query = {}) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const key = query.range || RANGE_DEFAULT;

  switch (key) {
    case "today":
      return { key, from: todayStart, to: addDays(todayStart, 1) };
    case "yesterday":
      return { key, from: addDays(todayStart, -1), to: todayStart };
    case "7d":
      return { key, from: addDays(now, -7), to: now };
    case "3m":
      return { key, from: addMonths(now, -3), to: now };
    case "6m":
      return { key, from: addMonths(now, -6), to: now };
    case "year":
      return { key, from: new Date(now.getFullYear(), 0, 1), to: now };
    case "lastyear":
      return {
        key,
        from: new Date(now.getFullYear() - 1, 0, 1),
        to: new Date(now.getFullYear(), 0, 1),
      };
    case "all":
      return { key, from: new Date(0), to: now };
    case "custom": {
      const from = new Date(`${query.from || ""}T00:00:00`);
      const to = new Date(`${query.to || ""}T00:00:00`);
      if (
        !Number.isNaN(from.getTime()) &&
        !Number.isNaN(to.getTime()) &&
        to >= from
      ) {
        return { key, from, to: addDays(to, 1) };
      }
      break;
    }
  }

  // Default + fallback (also covers 30d explicitly).
  return { key: "30d", from: addDays(now, -30), to: now };
}

export function rangeLabel(range) {
  if (range.key === "all") return "All Time";
  const fmt = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (range.key === "today") return `Today · ${fmt(range.from)}`;
  if (range.key === "yesterday") return `Yesterday · ${fmt(range.from)}`;
  return `${fmt(range.from)} – ${fmt(addDays(range.to, -1))}`;
}

// Picks the recommended chart granularity for a date range.
export function granularityForRange(range) {
  const days = Math.max(0, (range.to - range.from) / DAY_MS);
  switch (range.key) {
    case "today":
    case "yesterday":
      return "hour";
    case "7d":
    case "30d":
      return "day";
    case "3m":
      return "week";
    case "6m":
    case "year":
    case "lastyear":
      return "month";
    case "all":
      return days > 730 ? "year" : "month";
    default:
      if (days <= 2) return "hour";
      if (days <= 45) return "day";
      if (days <= 130) return "week";
      if (days > 730) return "year";
      return "month";
  }
}

// Resolves the ?view= param to a valid granularity, falling back to the smart
// default whenever the param is missing or unsupported.
export function normalizeView(param, range) {
  if (typeof param === "string" && GRANULARITIES.includes(param)) return param;
  return granularityForRange(range);
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
  } else if (gran === "year") {
    let s = new Date(from.getFullYear(), 0, 1);
    while (s < to) {
      const next = new Date(s.getFullYear() + 1, 0, 1);
      const end = Math.min(next.getTime(), to.getTime());
      buckets.push({ start: s.getTime(), end, label: String(s.getFullYear()) });
      s = next;
    }
  } else if (gran === "hour") {
    let s = new Date(from.getFullYear(), from.getMonth(), from.getDate(), from.getHours(), 0, 0, 0);
    while (s < to) {
      const end = Math.min(s.getTime() + HOUR_MS, to.getTime());
      buckets.push({
        start: s.getTime(),
        end,
        label: s.toLocaleTimeString("en-US", { hour: "numeric" }),
      });
      s = new Date(s.getTime() + HOUR_MS);
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

export function formatRate(value) {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return "0%";
  return `${n.toFixed(1)}%`;
}