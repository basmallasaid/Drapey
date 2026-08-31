"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #E9DED0",
  fontSize: "12px",
  backgroundColor: "#FFFFFF",
  color: "#2A1D17",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

export default function OrderStatusDonut({ data = [] }) {
  const hasData = data.some((d) => d.count > 0);

  if (!hasData) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-medium-brown)] py-12">
        No orders found for this period.
      </div>
    );
  }

  const total = data.reduce((a, d) => a + d.count, 0);

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
      <div className="shrink-0" style={{ width: "100%", maxWidth: 220, height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.fill || "#E9DED0"} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, _name, entry) => {
                const p = entry?.payload;
                const share = total > 0 ? ((p?.count || 0) / total) * 100 : 0;
                return [
                  `${value} order${value === 1 ? "" : "s"}`,
                  `${p?.label || entry.name || ""} · ${share.toFixed(1)}%`,
                ];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 w-full space-y-2.5 min-w-0">
        {data.map((entry) => (
          <li key={entry.status} className="flex items-center gap-3 min-w-0">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: entry.fill }}></span>
            <span className="flex-1 text-xs text-[var(--color-dark-brown)] capitalize truncate">
              {entry.label}
            </span>
            <span className="text-[11px] text-[var(--color-medium-brown)] whitespace-nowrap">
              {total > 0 ? `${((entry.count / total) * 100).toFixed(1)}%` : "0%"}
            </span>
            <span className="text-[11px] font-bold text-[var(--color-dark-brown)] w-10 text-right">
              {entry.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}