// app/admin/OrdersChart.js
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STATUS_META } from "@/lib/order-status";

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #EBE2DA",
  fontSize: "12px",
  backgroundColor: "#FFF",
  color: "#3E3A36",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

export default function OrdersChart({ counts = [] }) {
  const hasData = (counts || []).some((c) => (c.count || 0) > 0);

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-bold text-[#3E3A36] mb-6">Orders Overview</h3>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center text-xs text-[#8E8A84]">
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
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#EBE2DA" />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: "#8E8A84" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="status"
                tick={{ fontSize: 10, fill: "#8E8A84" }}
                tickLine={false}
                axisLine={false}
                width={76}
                tickFormatter={(value) => STATUS_META[value]?.label || value}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#8E8A84" }}
                cursor={{ fill: "rgba(62, 58, 54, 0.04)" }}
                formatter={(value, name, entry) => {
                  const status = entry?.payload?.status;
                  return [`${value} order${value === 1 ? "" : "s"}`, STATUS_META[status]?.label || status];
                }}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={16}>
                {counts.map((c, i) => (
                  <Cell key={i} fill={STATUS_META[c.status]?.fill || "#E8E2DA"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
