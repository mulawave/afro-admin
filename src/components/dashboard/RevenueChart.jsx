"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";

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
          <p className="text-sm text-white/45">Loading chart...</p>
        </div>
      )}

      {!error && chartData && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: "rgba(255,255,255,0.55)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "rgba(255,255,255,0.55)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [`₦${Number(value).toLocaleString("en-NG")}`, "Revenue"]}
              contentStyle={{
                borderRadius: "18px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(5,10,48,0.96)",
                boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
                color: "#fff",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#f5c16c"
              strokeWidth={3}
              dot={{ r: 4, fill: "#f49617" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {!error && chartData && chartData.length === 0 && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-sm text-white/45">No trend data available yet</p>
        </div>
      )}
    </div>
  );
}
