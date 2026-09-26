"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import RevenueChart from "@/components/dashboard/RevenueChart";
import PoolsCard from "@/components/dashboard/PoolsCard";

// Auto-refresh tiers (cost-aware). The fast tier is served from a 60s server
// cache and a few pool docs; the slow tier runs full collection scans, so it
// refreshes rarely. Nothing polls while the tab is hidden.
const FAST_MS = 60 * 1000;
const SLOW_MS = 10 * 60 * 1000;
const MAX_BACKOFF_MS = 5 * 60 * 1000;
const LIVE_KEY = "dashboard_live";

function readLivePref() {
  try {
    return window.localStorage.getItem(LIVE_KEY) !== "off";
  } catch {
    return true;
  }
}

function ago(date, now) {
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m} min ago` : date.toLocaleTimeString();
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [regStats, setRegStats] = useState(null);
  const [withdrawalsDisabled, setWithdrawalsDisabled] = useState(false);
  const [togglingWithdrawals, setTogglingWithdrawals] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [live, setLive] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const lastFast = useRef(0);
  const lastSlow = useRef(0);
  const failures = useRef(0);
  const inFlight = useRef(false);

  const loadSettings = useCallback(async () => {
    try {
      const settingsRes = await api.get("/admin/settings");
      const wdSetting = (settingsRes.settings || []).find((s) => s.key === "withdrawals_disabled");
      setWithdrawalsDisabled(wdSetting?.value === true || wdSetting?.value === "true");
    } catch {}
  }, []);

  /**
   * force = manual Refresh: everything, bypassing the server cache.
   * Otherwise: fast tier always; slow tier only when it's due.
   */
  const fetchStats = useCallback(async ({ force = false } = {}) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    const started = Date.now();
    const includeSlow = force || !lastSlow.current || started - lastSlow.current >= SLOW_MS;
    const fresh = force ? "?fresh=1" : "";

    try {
      const [dashboardRes, systemRes, queueRes, regRes] = await Promise.all([
        api.get(`/admin/dashboard${fresh}`),
        api.get("/withdrawals/admin/system-totals"),
        includeSlow ? api.get("/vpt/admin/stats") : Promise.resolve(null),
        includeSlow ? api.get(`/admin/dashboard/registrations?period=daily&days=30${force ? "&fresh=1" : ""}`) : Promise.resolve(null),
      ]);
      const dashboard = dashboardRes.dashboard ?? {};
      const systemTotals = systemRes ?? {};
      if (regRes) setRegStats(regRes);
      if (!lastFast.current || force) await loadSettings();

      setData((prev) => ({
        dashboard,
        systemTotals,
        queueStats: queueRes ? queueRes.stats ?? {} : prev?.queueStats ?? {},
        pools: {
          operations_ngn: systemTotals.pools?.operations?.balance_ngn ?? 0,
          community_ngn: systemTotals.pools?.community?.balance_ngn ?? 0,
          operations_vpt: systemTotals.pools?.operations?.balance_vpt ?? 0,
          community_vpt: systemTotals.pools?.community?.balance_vpt ?? 0,
        },
      }));
      lastFast.current = Date.now();
      if (includeSlow) lastSlow.current = Date.now();
      failures.current = 0;
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      failures.current += 1;
      lastFast.current = Date.now(); // back off from now
      setError(err.message || "Failed to load stats");
    } finally {
      inFlight.current = false;
      setRefreshing(false);
    }
  }, [loadSettings]);

  // Initial load + Live preference (per browser).
  useEffect(() => {
    setLive(readLivePref());
    fetchStats();
  }, [fetchStats]);

  // One lightweight timer: refresh when due, only while Live and the tab is visible.
  // After failures the interval backs off (1, 2, 4… minutes, max 5).
  useEffect(() => {
    function dueIn() {
      const interval = Math.min(FAST_MS * 2 ** failures.current, MAX_BACKOFF_MS);
      return lastFast.current + interval - Date.now();
    }
    function tick() {
      setNow(Date.now());
      if (!live || document.visibilityState !== "visible") return;
      if (dueIn() <= 0) fetchStats();
    }
    const timer = setInterval(tick, 15 * 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [live, fetchStats]);

  function toggleLive() {
    const next = !live;
    setLive(next);
    try {
      window.localStorage.setItem(LIVE_KEY, next ? "on" : "off");
    } catch {}
    if (next && Date.now() - lastFast.current >= FAST_MS) fetchStats();
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="mb-2 text-lg text-red-200">Failed to load dashboard</p>
          <p className="mb-4 text-sm text-white/48">{error}</p>
          <button
            onClick={() => fetchStats({ force: true })}
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
            onClick={() => fetchStats({ force: true })}
            disabled={refreshing}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--av-light-orange)] hover:text-[var(--av-light-orange)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          {error && (
            <span className="text-sm text-amber-200">Last update failed. Retrying less often.</span>
          )}
          {lastUpdated && (
            <span className="text-xs text-white/42" title={lastUpdated.toLocaleString()}>
              Updated {ago(lastUpdated, now)}
            </span>
          )}
          <button
            type="button"
            onClick={toggleLive}
            title={live ? "Auto-refreshes every minute while this tab is open. Click to pause." : "Auto-refresh paused. Click to resume."}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${live ? "border-emerald-400/30 text-emerald-200" : "border-white/10 text-white/50"}`}
          >
            <span className={`h-2 w-2 rounded-full ${live ? "animate-pulse bg-emerald-400" : "bg-white/30"}`} />
            {live ? "Live" : "Paused"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={dashboard.users?.total} href="/users" hint="Open users" />
        <StatCard title="Creators" value={dashboard.users?.creators} accent="green" href="/creator-subscriptions" hint="Memberships" />
        <StatCard title="Active Channels" value={dashboard.channels?.active} accent="purple" href="/channels" hint={`${dashboard.channels?.total ?? 0} total`} />
        <StatCard title="Premium Creators" value={dashboard.users?.premium} accent="amber" href="/plans" hint="Plan catalog" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Plan Revenue 30d (₦)" value={financial.plan_revenue_30d} accent="amber" hint="Last 30 days" />
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

      {regStats && (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">New Registrations</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/58">Today: <span className="font-semibold text-white">{regStats.totals?.today ?? 0}</span></span>
              <span className="text-white/58">This Week: <span className="font-semibold text-white">{regStats.totals?.this_week ?? 0}</span></span>
              <span className="text-white/58">This Month: <span className="font-semibold text-white">{regStats.totals?.this_month ?? 0}</span></span>
              <span className="text-white/58">Total: <span className="font-semibold text-white">{regStats.totals?.total ?? 0}</span></span>
            </div>
          </div>
          <RegistrationTrendChart trend={regStats.trend ?? []} />
        </div>
      )}

      <PoolsCard pools={data.pools} />

      {/* Withdrawals Toggle */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Site-Wide Withdrawals</h3>
            <p className="mt-1 text-sm text-white/50">
              {withdrawalsDisabled
                ? "Withdrawals are currently blocked for all users."
                : "Withdrawals are active and available to users."}
            </p>
          </div>
          <button
            onClick={async () => {
              setTogglingWithdrawals(true);
              setWithdrawalsError(null);
              try {
                await api.post("/admin/settings/withdrawals-toggle", { enabled: !withdrawalsDisabled });
                await loadSettings();
              } catch (err) {
                setWithdrawalsError(err.message || "Failed to change withdrawal status. Current state unchanged.");
              }
              finally { setTogglingWithdrawals(false); }
            }}
            disabled={togglingWithdrawals}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
              withdrawalsDisabled
                ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25"
                : "bg-red-500/15 text-red-200 border border-red-400/30 hover:bg-red-500/25"
            }`}
          >
            {togglingWithdrawals && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
            {withdrawalsDisabled ? "Enable Withdrawals" : "Disable Withdrawals"}
          </button>
        </div>
        {withdrawalsError && (
          <p role="alert" className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{withdrawalsError}</p>
        )}
      </div>
    </div>
  );
}

function RegistrationTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return <p className="text-sm text-white/42 py-8 text-center">No registration data for this period</p>;
  }
  const max = Math.max(...trend.map((d) => d.count), 1);
  const chartHeight = 160;
  return (
    <div className="flex items-end gap-1 overflow-x-auto pb-2" style={{ height: chartHeight + 40 }}>
      {trend.map((d) => {
        const h = Math.max((d.count / max) * chartHeight, 2);
        return (
          <div key={d.date} className="flex flex-col items-center gap-1 shrink-0" style={{ minWidth: 28 }}>
            <span className="text-[9px] text-white/42">{d.count}</span>
            <div
              className="w-5 rounded-t-md bg-[linear-gradient(180deg,var(--av-light-orange),var(--av-orange))] transition-all"
              style={{ height: h }}
              title={`${d.date}: ${d.count} registrations`}
            />
            <span className="text-[8px] text-white/32 rotate-45 origin-left whitespace-nowrap">{d.date.slice(5)}</span>
          </div>
        );
      })}
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
