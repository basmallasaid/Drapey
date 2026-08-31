"use client";

import { useState } from "react";

const LINE = "#b6ab9c";

function niceMax(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function formatMoney(v) {
  if (v >= 1000) return `EGP ${(v / 1000).toFixed(1)}K`;
  return `EGP ${Math.round(v)}`;
}

export default function SalesChart({ points = [] }) {
  const [hover, setHover] = useState(null);

  const hasData = points.some((p) => (p.value || 0) > 0);
  if (!hasData) {
    return <div className="flex h-48 items-center justify-center text-sm text-stone">No sales data yet</div>;
  }

  const W = 620;
  const H = 250;
  const padL = 42;
  const padR = 14;
  const padT = 14;
  const padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = niceMax(Math.max(...points.map((p) => p.value || 0)));
  const n = points.length;

  const x = (i) => (n > 1 ? padL + (i / (n - 1)) * innerW : padL + innerW / 2);
  const y = (v) => padT + innerH - (v / max) * innerH;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => ({ v: f * max }));

  const labelEvery = Math.max(1, Math.ceil(points.length / 6));
  const lastIndex = points.length - 1;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-56 w-full" role="img" aria-label="Sales Overview line chart">
        {gridLines.map((g, idx) => (
          <g key={idx}>
            <line
              x1={padL}
              y1={y(g.v)}
              x2={W - padR}
              y2={y(g.v)}
              stroke="#e8e2da"
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y(g.v) + 3}
              textAnchor="end"
              fontSize={11}
              fill="#8e8a84"
            >
              {formatMoney(g.v)}
            </text>
          </g>
        ))}

        <polyline
          points={points.map((p, i) => `${x(i)},${y(p.value || 0)}`).join(" ")}
          fill="none"
          stroke={LINE}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity={0.9}
        />

        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={x(i)}
              cy={y(p.value || 0)}
              r={hover === i ? 4.5 : 3}
              fill={hover === i ? "#8e8a84" : LINE}
              stroke="#ffffff"
              strokeWidth={1.5}
            />
            <circle
              cx={x(i)}
              cy={y(p.value || 0)}
              r={12}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
            {i % labelEvery === 0 || i === lastIndex ? (
              <text x={x(i)} y={H - padB + 16} textAnchor="middle" fontSize={11} fill="#8e8a84">
                {p.label}
              </text>
            ) : null}

            {hover === i && (
              <g>
                <line x1={x(i)} y1={padT} x2={x(i)} y2={H - padB} stroke="#dcd6cc" strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={x(i)} cy={y(p.value || 0)} r={4.5} fill="#8e8a84" stroke="#ffffff" strokeWidth={1.5} />
              </g>
            )}
          </g>
        ))}
      </svg>

      {hover !== null && points[hover] && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-sand bg-white px-3 py-1.5 text-xs text-charcoal shadow-card"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(points[hover].value || 0) / H) * 100}%` }}
        >
          <span className="font-medium">{points[hover].label}</span> · {formatMoney(points[hover].value || 0)}
        </div>
      )}
    </div>
  );
}
