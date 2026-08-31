"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const FILL = "#A9825A";

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #E9DED0",
  fontSize: "12px",
  backgroundColor: "#FFFFFF",
  color: "#2A1D17",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

export default function NewCustomersChart({ data = [], total = 0 }) {
  if (total === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-medium-brown)] py-12">
        No new customers in this period.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="newCustomersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={FILL} stopOpacity={0.35} />
              <stop offset="100%" stopColor={FILL} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#765442" }}
            width={40}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "#765442" }}
            formatter={(value) => [`${value} customer${value === 1 ? "" : "s"}`, "New customers"]}
          />
          <Area
            type="monotone"
            dataKey="customers"
            name="New customers"
            stroke={FILL}
            strokeWidth={2}
            fill="url(#newCustomersGradient)"
            dot={{ r: 2.5, fill: FILL, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}