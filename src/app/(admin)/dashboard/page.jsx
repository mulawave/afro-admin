"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import PoolsCard from "@/components/dashboard/PoolsCard";

const REFRESH_INTERVAL = 10_000;

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/stats");
      setData(res);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load stats");
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-3">
          {error && (
            <span className="text-sm text-amber-600">Auto-refresh paused — last update failed</span>
          )}
          {lastUpdated && (
            <span className="text-xs text-gray-400">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-green-600">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={data.users} />
        <StatCard title="Active Users" value={data.active_users} accent="green" />
        <StatCard title="Live Channels" value={data.live_channels} accent="purple" />
        <StatCard title="Total Revenue (₦)" value={data.total_ngn} accent="amber" />
      </div>

      {/* SECOND ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Gift Volume (₦ Today)" value={data.gift_volume_ngn_today} />
        <StatCard title="Gift Volume (vPT)" value={data.gift_volume_vpt_today} accent="purple" />
        <StatCard title="Swap Volume (₦)" value={data.swap_volume_ngn} accent="amber" />
        <StatCard title="Total vPT" value={data.total_vpt_units} accent="green" />
      </div>

      {/* CHART */}
      <RevenueChart />

      {/* POOLS */}
      <PoolsCard pools={data.pools} />
    </div>
  );
}
