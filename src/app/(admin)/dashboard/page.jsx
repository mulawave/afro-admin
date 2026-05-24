"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import PoolsCard from "@/components/dashboard/PoolsCard";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    setRefreshing(true);

    try {
      const [dashboardRes, systemRes, queueRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/withdrawals/admin/system-totals"),
        api.get("/vpt/admin/stats"),
      ]);
      const dashboard = dashboardRes.dashboard ?? {};
      const systemTotals = systemRes ?? {};
      const queueStats = queueRes.stats ?? {};

      setData({
        dashboard,
        systemTotals,
        queueStats,
        pools: {
          operations_ngn: systemTotals.pools?.operations?.balance_ngn ?? 0,
          community_ngn: systemTotals.pools?.community?.balance_ngn ?? 0,
          operations_vpt: systemTotals.pools?.operations?.balance_vpt ?? 0,
          community_vpt: systemTotals.pools?.community?.balance_vpt ?? 0,
        },
      });
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load stats");
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        fetchStats();
      }
    }

    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchStats]);

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="mb-2 text-lg text-red-200">Failed to load dashboard</p>
          <p className="mb-4 text-sm text-white/48">{error}</p>
          <button
            onClick={fetchStats}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 font-semibold text-[var(--av-dark-blue)]"
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
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
          <p className="text-white/48">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboard = data.dashboard || {};
  const financial = dashboard.financial || {};
  const queue = data.queueStats.queue || {};
  const batches = data.queueStats.batches || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <p className="mt-2 text-sm text-white/58">Live platform health across users, monetization, queues, and treasury pools.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchStats}
            disabled={refreshing}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--av-light-orange)] hover:text-[var(--av-light-orange)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {error && (
            <span className="text-sm text-amber-200">Auto-refresh paused — last update failed</span>
          )}
          {lastUpdated && (
            <span className="text-xs text-white/42">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={dashboard.users?.total} href="/users" hint="Open users" />
        <StatCard title="Creators" value={dashboard.users?.creators} accent="green" href="/creator-subscriptions" hint="Memberships" />
        <StatCard title="Active Channels" value={dashboard.channels?.active} accent="purple" href="/channels" hint="Moderate channels" />
        <StatCard title="Premium Creators" value={dashboard.users?.premium} accent="amber" href="/plans" hint="Plan catalog" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Plan Revenue (₦)" value={financial.total_ngn_in} accent="amber" />
        <StatCard title="Pending Withdrawals" value={data.systemTotals.pending_withdrawals?.count} accent="purple" href="/withdrawals" hint="Review queue" />
        <StatCard title="Queue Pending" value={queue.pending} accent="blue" href="/batches" hint="Process batches" />
        <StatCard title="Total Swaps" value={financial.total_swaps} accent="green" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryItem label="Disabled Channels" value={dashboard.channels?.disabled} />
            <SummaryItem label="Gift Wallets" value={financial.gift_wallets} />
            <SummaryItem label="Queue Failed" value={queue.failed} />
            <SummaryItem label="Batches Failed" value={batches.failed} />
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <h3 className="text-lg font-semibold text-white">Finance Snapshot</h3>
          <div className="mt-4 space-y-3">
            <SnapshotRow label="Pending Withdrawal Value" value={`₦${Number(data.systemTotals.pending_withdrawals?.total_amount || 0).toLocaleString("en-NG")}`} />
            <SnapshotRow label="Total Gift NGN" value={`₦${Number(financial.total_gift_ngn || 0).toLocaleString("en-NG")}`} />
            <SnapshotRow label="Total Gift vPT" value={Number(financial.total_gift_vpt || 0).toLocaleString("en-NG")} />
            <SnapshotRow label="Ledger Failures" value={financial.total_failures} />
          </div>
        </div>
      </div>

      <RevenueChart />

      <PoolsCard pools={data.pools} />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value ?? 0}</p>
    </div>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-white/58">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
