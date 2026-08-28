// app/admin/SalesChart.js
"use client";

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const LINE_COLOR = "#B6AB9C"; // muted warm taupe/beige

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #EBE2DA",
  fontSize: "12px",
  backgroundColor: "#FFF",
  color: "#3E3A36",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

function formatAxis(v) {
  const n = Number(v);
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export default function SalesChart({ thisMonth = [], lastMonth = [] }) {
  const [period, setPeriod] = useState("this");
  const data = period === "this" ? thisMonth : lastMonth;
  const hasData = (data || []).some((d) => (d.sales || 0) > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-[#3E3A36]">Sales Overview</h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-[10px] bg-[#FAF8F5] border border-[#EBE2DA] rounded p-1 text-[#8E8A84] outline-none focus:border-[#DCD6CC] transition-colors"
        >
          <option value="this">This Month</option>
          <option value="last">Last Month</option>
        </select>
      </div>

      {!hasData ? (
        <div className="flex flex-1 items-center justify-center text-xs text-[#8E8A84]">
          No sales data for this period
        </div>
      ) : (
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EBE2DA" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#8E8A84" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#8E8A84" }}
                width={54}
                tickFormatter={formatAxis}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                labelStyle={{ color: "#8E8A84" }}
                formatter={(value) => [`EGP ${Number(value).toLocaleString()}`, "Sales"]}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke={LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 3, fill: LINE_COLOR, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
