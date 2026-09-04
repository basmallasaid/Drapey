"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const REVENUE_COLOR = "#765442";
const ORDERS_COLOR = "#A9825A";

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #E9DED0",
  fontSize: "12px",
  backgroundColor: "#FFFFFF",
  color: "#2A1D17",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

function axisK(v) {
  const n = Number(v);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export default function SalesPerformanceChart({ data = [] }) {
  const hasData = data.some((d) => (d.revenue || 0) > 0 || (d.orders || 0) > 0);

  return (
    <div className="flex flex-col h-full">
      {!hasData ? (
        <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-medium-brown)] py-12">
          No sales data for this period.
        </div>
      ) : (
        <>
          <div className="flex items-center gap-5 mb-4 text-[10px] font-bold uppercase tracking-wider text-[var(--color-medium-brown)]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-[2px] bg-[#765442] inline-block"></span> Revenue (excl. cancelled)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-[2px] bg-[#A9825A] inline-block"></span> Orders (all statuses)
            </span>
          </div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E9DED0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#765442" }}
                  dy={10}
                  minTickGap={24}
                />
                <YAxis
                  yAxisId="rev"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#765442" }}
                  width={56}
                  tickFormatter={axisK}
                />
                <YAxis
                  yAxisId="ord"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#765442" }}
                  width={40}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  labelStyle={{ color: "#765442" }}
                  formatter={(value, name) =>
                    name === "Revenue"
                      ? [
                          `EGP ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                          "Revenue (excl. cancelled)",
                        ]
                      : [`${value} order${value === 1 ? "" : "s"}`, "Orders (all statuses)"]
                  }
                />
                <Line
                  yAxisId="rev"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke={REVENUE_COLOR}
                  strokeWidth={2}
                  dot={{ r: 2.5, fill: REVENUE_COLOR, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  yAxisId="ord"
                  type="monotone"
                  dataKey="orders"
                  name="Orders"
                  stroke={ORDERS_COLOR}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}