"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

export default function RbdPoolPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/vpt/admin/pool/rbd");
      setStats(res.stats ?? null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load RBD pool data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fmt = (n) => (n ?? 0).toLocaleString();
  const fmtVpt = (n) => (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">RBD Pool</h1>
          <p className="mt-2 text-sm text-[var(--av-light-orange)]">
            Referral Base Dump — unclaimed referral earnings when a referral tree level has no referrer.
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="NGN Balance" value={`₦${fmt(stats.pool?.balance_ngn)}`} sub="Cash balance available" accent="orange" />
            <StatCard label="vPT Balance" value={`${fmtVpt(stats.pool?.balance_vpt)} vPT`} sub="vPT balance available" accent="purple" />
            <StatCard label="Total Credited (NGN)" value={`₦${fmt(stats.pool?.total_credited_ngn)}`} sub="Lifetime NGN inflow" accent="sky" />
            <StatCard label="Total Credited (vPT)" value={`${fmtVpt(stats.pool?.total_credited_vpt)} vPT`} sub="Lifetime vPT inflow" accent="emerald" />
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
            <h3 className="text-sm font-semibold text-[var(--av-light-orange)] mb-3">How the RBD Pool Works</h3>
            <div className="grid gap-3 text-xs text-[var(--av-light-orange)] sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-[var(--av-light-orange)] mb-1">5-Level Referral Tree</p>
                <p>Each subscription distributes 15% across 5 referral levels (50% cash / 50% vPT per level).</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-[var(--av-light-orange)] mb-1">Empty Tree Levels</p>
                <p>When a referral level has no referrer, the earnings for that level cannot be distributed to anyone.</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-[var(--av-light-orange)] mb-1">Dumped to RBD</p>
                <p>Unclaimed referral earnings are credited to this pool instead of being lost, for future platform use.</p>
              </div>
            </div>
          </div>

          {stats.pool?.updated_at && (
            <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--av-light-orange)]">Last Updated</span>
                <span className="font-mono text-white">{new Date(stats.pool.updated_at).toLocaleString()}</span>
              </div>
            </div>
          )}
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
    purple: "border-purple-400/30 text-purple-300",
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
