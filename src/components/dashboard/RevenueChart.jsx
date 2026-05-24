"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";

const CHART_H = 260;
const CHART_PAD = { top: 16, right: 12, bottom: 40, left: 56 };

function fmt(v) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(1)}m`;
  if (v >= 1_000) return `₦${(v / 1_000).toFixed(0)}k`;
  return `₦${v}`;
}

function SvgLineChart({ data }) {
  const svgRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    const el = svgRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width || 600);
    });
    ro.observe(el);
    setWidth(el.clientWidth || 600);
    return () => ro.disconnect();
  }, []);

  const innerW = width - CHART_PAD.left - CHART_PAD.right;
  const innerH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

  const revenues = data.map((d) => d.revenue);
  const minVal = Math.min(...revenues);
  const maxVal = Math.max(...revenues);
  const range = maxVal - minVal || 1;

  const px = (i) => (i / (data.length - 1)) * innerW;
  const py = (v) => innerH - ((v - minVal) / range) * innerH;

  const points = data.map((d, i) => [px(i), py(d.revenue)]);
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const areaPath = `${linePath} L${innerW},${innerH} L0,${innerH} Z`;

  const yTicks = 4;
  const yTickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    minVal + (range * i) / yTicks
  );

  function handleMouseMove(e) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = e.clientX - rect.left - CHART_PAD.left;
    const idx = Math.round((relX / innerW) * (data.length - 1));
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    setTooltip({ idx: clamped, x: points[clamped][0], y: points[clamped][1] });
  }

  return (
    <div className="relative w-full" style={{ height: CHART_H }}>
      <svg
        ref={svgRef}
        width={width}
        height={CHART_H}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f5c16c" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f5c16c" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(${CHART_PAD.left},${CHART_PAD.top})`}>
          {/* Y grid lines + labels */}
          {yTickVals.map((v, i) => (
            <g key={i}>
              <line
                x1={0} y1={py(v)} x2={innerW} y2={py(v)}
                stroke="rgba(255,255,255,0.07)" strokeDasharray="4 4"
              />
              <text
                x={-8} y={py(v) + 4}
                fontSize={11} fill="rgba(255,255,255,0.5)"
                textAnchor="end"
              >
                {fmt(v)}
              </text>
            </g>
          ))}

          {/* X labels */}
          {data.map((d, i) => (
            <text
              key={i}
              x={px(i)} y={innerH + 20}
              fontSize={11} fill="rgba(255,255,255,0.5)"
              textAnchor="middle"
            >
              {d.day}
            </text>
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#revGrad)" />

          {/* Line */}
          <path d={linePath} fill="none" stroke="#f5c16c" strokeWidth={2.5} strokeLinejoin="round" />

          {/* Dots */}
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={4} fill="#f49617" stroke="#f5c16c" strokeWidth={1.5} />
          ))}

          {/* Tooltip */}
          {tooltip && (
            <>
              <line
                x1={tooltip.x} y1={0} x2={tooltip.x} y2={innerH}
                stroke="rgba(245,193,108,0.35)" strokeWidth={1} strokeDasharray="3 3"
              />
              <circle cx={tooltip.x} cy={tooltip.y} r={6} fill="#f49617" stroke="#f5c16c" strokeWidth={2} />
              <foreignObject
                x={tooltip.x + (tooltip.x > innerW * 0.7 ? -148 : 10)}
                y={tooltip.y - 36}
                width={138}
                height={52}
              >
                <div
                  xmlns="http://www.w3.org/1999/xhtml"
                  style={{
                    background: "rgba(5,10,48,0.96)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: "6px 12px",
                    color: "#fff",
                    fontSize: 12,
                    boxShadow: "0 12px 30px rgba(0,0,0,0.3)",
                    whiteSpace: "nowrap",
                  }}
                >
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>
                    {data[tooltip.idx].day}
                  </div>
                  <div style={{ color: "#f5c16c", fontWeight: 600 }}>
                    ₦{Number(data[tooltip.idx].revenue).toLocaleString("en-NG")}
                  </div>
                </div>
              </foreignObject>
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

export default function RevenueChart() {
  const [chartData, setChartData] = useState(null);
  const [error, setError] = useState(null);

  const fetchTrend = useCallback(async () => {
    try {
      const res = await api.get("/admin/dashboard/trend");
      setChartData(res.trend ?? []);
      setError(null);
    } catch {
      setError("Could not load trend data");
    }
  }, []);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <h3 className="mb-4 text-lg font-semibold text-white">Revenue Trend</h3>

      {error && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-white/45">{error}</p>
        </div>
      )}

      {!error && !chartData && (
        <div className="flex items-center justify-center h-[300px]">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--av-light-orange)] border-t-transparent" />
        </div>
      )}

      {!error && chartData && chartData.length > 0 && (
        <SvgLineChart data={chartData} />
      )}

      {!error && chartData && chartData.length === 0 && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-white/45">No trend data available yet</p>
        </div>
      )}
    </div>
  );
}
