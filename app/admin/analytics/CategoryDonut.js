"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatEgp } from "./utils";

const PALETTE = ["#A9825A", "#765442", "#2A1D17", "#C4B49C", "#9A6259", "#E9DED0", "#D8C9B4"];

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #E9DED0",
  fontSize: "12px",
  backgroundColor: "#FFFFFF",
  color: "#2A1D17",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

export default function CategoryDonut({ data = [], total = 0 }) {
  const hasData = total > 0 && data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-medium-brown)] py-12">
        No product sales data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
      <div className="shrink-0" style={{ width: "100%", maxWidth: 220, height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={92}
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={`${entry.name}-${i}`} fill={PALETTE[i % PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, _name, entry) => {
                const p = entry?.payload;
                const share = total > 0 ? ((p?.value || 0) / total) * 100 : 0;
                return [formatEgp(value), `${p?.name || ""} · ${share.toFixed(1)}%`];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex-1 w-full space-y-2.5 min-w-0">
        {data.map((entry, i) => (
          <li key={entry.name} className="flex items-center gap-3 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
            ></span>
            <span className="flex-1 text-xs text-[var(--color-dark-brown)] truncate">{entry.name}</span>
            <span className="text-[11px] text-[var(--color-medium-brown)] whitespace-nowrap">
              {sharePercent(total, entry.value)}
            </span>
            <span className="text-[11px] font-bold text-[var(--color-dark-brown)] whitespace-nowrap w-[86px] text-right">
              {formatEgp(entry.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function sharePercent(total, value) {
  if (!total) return "0%";
  return `${((value / total) * 100).toFixed(1)}%`;
}