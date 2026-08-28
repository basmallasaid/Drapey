"use client";

const STATUS_META = {
  pending: { label: "Pending", bar: "bg-amber-200", dot: "bg-amber-300" },
  confirmed: { label: "Confirmed", bar: "bg-blue-200", dot: "bg-blue-300" },
  preparing: { label: "Preparing", bar: "bg-orange-200", dot: "bg-orange-300" },
  shipped: { label: "Shipped", bar: "bg-indigo-200", dot: "bg-indigo-300" },
  delivered: { label: "Delivered", bar: "bg-green-200", dot: "bg-green-300" },
  cancelled: { label: "Cancelled", bar: "bg-rose-200", dot: "bg-rose-300" },
};

export default function OrdersChart({ counts = [] }) {
  const max = Math.max(1, ...counts.map((c) => c.count || 0));
  const total = counts.reduce((sum, c) => sum + (c.count || 0), 0);

  return (
    <div className="space-y-4">
      {counts.map(({ status, count }) => {
        const meta = STATUS_META[status] || { label: status, bar: "bg-sand", dot: "bg-sand" };
        const pct = Math.round(((count || 0) / max) * 100);
        return (
          <div key={status} className="group relative flex items-center gap-4">
            <div className="w-24 shrink-0 flex items-center gap-2 sm:w-28">
              <span className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
              <span className="text-sm capitalize text-charcoal">{meta.label}</span>
            </div>

            {/* Light tooltip on hover */}
            <div className="pointer-events-none absolute left-28 top-1/2 z-10 hidden -translate-y-1/2 whitespace-nowrap rounded-lg border border-sand bg-white px-3 py-1.5 text-xs text-charcoal shadow-card group-hover:block sm:left-32">
              <span className="font-medium capitalize">{meta.label}</span> · {count} order{count === 1 ? "" : "s"}
            </div>

            <div className="h-3 flex-1 overflow-hidden rounded-full bg-cream">
              <div
                className={`h-full rounded-full ${meta.bar} transition-all duration-300`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="w-8 shrink-0 text-right text-sm font-medium text-warmgray sm:w-12">
              {count}
            </div>
          </div>
        );
      })}
      {total === 0 && <div className="py-6 text-center text-stone">No orders yet</div>}
    </div>
  );
}
