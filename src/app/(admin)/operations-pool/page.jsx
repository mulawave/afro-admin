"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export default function OperationsPoolPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/vpt/admin/pool/operations");
      setStats(res.stats ?? null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load operations pool data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n) => (n ?? 0).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Operations Pool</h1>
          <p className="mt-2 text-sm text-[var(--av-light-orange)]">
            Platform operations revenue — 50% of all subscription payments retained for running costs.
          </p>
        </div>
        <button onClick={load} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-white/10">
          Refresh
        </button>
      </div>

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Pool Balance" value={`₦${fmt(stats.pool?.balance_ngn)}`} sub="Current available balance" accent="orange" />
            <StatCard label="Total Credited" value={`₦${fmt(stats.pool?.total_credited)}`} sub="Lifetime operations inflow" accent="sky" />
            <StatCard label="Last Updated" value={stats.pool?.updated_at ? new Date(stats.pool.updated_at).toLocaleString() : "Never"} sub="Most recent credit" accent="emerald" />
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
            <h3 className="text-sm font-semibold text-[var(--av-light-orange)] mb-3">How the Operations Pool Works</h3>
            <div className="grid gap-3 text-xs text-[var(--av-light-orange)] sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-[var(--av-light-orange)] mb-1">50% of Subscriptions</p>
                <p>Half of every platform and creator subscription payment is allocated to the operations pool.</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-[var(--av-light-orange)] mb-1">Running Costs</p>
                <p>Covers infrastructure, hosting, development, support, and other platform operating expenses.</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-[var(--av-light-orange)] mb-1">Platform Retained</p>
                <p>This pool is retained by the platform — no user-facing distributions are made from it.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, accent }) {
  const colors = {
    orange: "border-[var(--av-light-orange)]/30 text-[var(--av-light-orange)]",
    sky: "border-sky-400/30 text-sky-300",
    emerald: "border-emerald-400/30 text-emerald-300",
  };
  const c = colors[accent] || colors.orange;
  const [borderColor] = c.split(" ");

  return (
    <div className={`rounded-[1.5rem] border ${borderColor} bg-[var(--admin-surface)] p-5`}>
      <p className="text-xs uppercase tracking-wider text-[var(--av-light-orange)] mb-2">{label}</p>
      <p className={`text-2xl font-bold ${c.split(" ")[1]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-[var(--av-light-orange)]">{sub}</p>
    </div>
  );
}
