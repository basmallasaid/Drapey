"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatEgp } from "./utils";

const PALETTE = ["#765442", "#A9825A", "#9A6259", "#C4B49C", "#2A1D17", "#D8C9B4"];

const TOOLTIP_STYLE = {
  borderRadius: "12px",
  border: "1px solid #E9DED0",
  fontSize: "12px",
  backgroundColor: "#FFFFFF",
  color: "#2A1D17",
  boxShadow: "0 1px 2px 0 rgb(62 58 54 / 0.04), 0 2px 6px -1px rgb(62 58 54 / 0.05)",
};

export default function TopProductsChart({ data = [] }) {
  const display = data.slice(0, 8);

  if (display.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-[var(--color-medium-brown)] py-12">
        No product sales data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={display}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 8, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E9DED0" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#765442" }}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={118}
              tick={{ fontSize: 10, fill: "#765442" }}
            />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              cursor={{ fill: "rgba(169,130,90,0.08)" }}
              formatter={(value, _name, entry) => {
                const p = entry?.payload;
                return [
                  `${value} unit${value === 1 ? "" : "s"}${
                    p?.revenue ? ` · ${formatEgp(p.revenue)}` : ""
                  }`,
                  p?.name || "",
                ];
              }}
            />
            {display.map((_, i) => (
              <Bar key={i} dataKey="units" fill={PALETTE[i % PALETTE.length]} barSize={16} radius={[0, 6, 6, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-medium-brown)] border-b border-[var(--color-light-beige)]">
              <th className="py-2 pr-3 font-bold">#</th>
              <th className="py-2 pr-3 font-bold">Product</th>
              <th className="py-2 pr-3 font-bold text-right">Units</th>
              <th className="py-2 font-bold text-right">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr key={`${item.name}-${i}`} className="border-b border-[var(--color-light-beige)] last:border-0">
                <td className="py-2 pr-3 text-[var(--color-medium-brown)]">{i + 1}</td>
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="w-8 h-10 object-cover rounded-md bg-[var(--color-light-beige)] shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-10 bg-[var(--color-light-beige)] rounded-md shrink-0"></div>
                    )}
                    <span className="text-[var(--color-dark-brown)] truncate">{item.name}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-right text-[var(--color-medium-brown)]">{item.units}</td>
                <td className="py-2 text-right font-bold text-[var(--color-dark-brown)] whitespace-nowrap">
                  {formatEgp(item.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}