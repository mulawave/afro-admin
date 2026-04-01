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
      const res = await api.get("/admin/stats/trend");
      setChartData(res);
      setError(null);
    } catch {
      setError("Could not load trend data");
    }
  }, []);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  return (
    <div className="bg-white p-5 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>

      {error && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      )}

      {!error && !chartData && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400 text-sm">Loading chart...</p>
        </div>
      )}

      {!error && chartData && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value) => [`₦${Number(value).toLocaleString("en-NG")}`, "Revenue"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 4, fill: "#2563eb" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {!error && chartData && chartData.length === 0 && (
        <div className="flex items-center justify-center h-[300px]">
          <p className="text-gray-400 text-sm">No trend data available yet</p>
        </div>
      )}
    </div>
  );
}
