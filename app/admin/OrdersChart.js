// app/admin/OrdersChart.js
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STATUS_META } from "@/lib/order-status";

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #E9DED0",
  fontSize: "12px",
  backgroundColor: "#FFFFFF",
  color: "#2A1D17",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

export default function OrdersChart({ counts = [] }) {
  const hasData = (counts || []).some((c) => (c.count || 0) > 0);

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-bold text-[var(--color-dark-brown)] mb-6">Orders Overview</h3>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-medium-brown)]">
          No orders yet
        </div>
      ) : (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={counts}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9DED0" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#765442" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 10, fill: "#765442" }}
                tickLine={false}
                axisLine={false}
                width={76}
                tickFormatter={(value) => STATUS_META[value]?.label || value}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#765442" }}
                cursor={{ fill: "rgba(62, 58, 54, 0.04)" }}
                formatter={(value, name, entry) => {
                  const status = entry?.payload?.status;
                  return [`${value} order${value === 1 ? "" : "s"}`, STATUS_META[status]?.label || status];
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {counts.map((c, i) => (
                  <Cell key={i} fill={STATUS_META[c.status]?.fill || "#E9DED0"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
