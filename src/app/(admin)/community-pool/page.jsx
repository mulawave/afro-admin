"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function CommunityPoolPage() {
  const [stats, setStats] = useState(null);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, distRes] = await Promise.all([
        api.get("/vpt/admin/pool/stats"),
        api.get("/vpt/admin/pool/distributions?limit=20"),
      ]);
      setStats(statsRes.stats ?? null);
      setDistributions(distRes.distributions ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load pool data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function triggerDistribution() {
    setConfirm({
      title: "Distribute Viewer Rewards",
      message: `This will distribute ${stats?.reward_percent ?? 10}% of the community pool (≈₦${(stats?.next_distribution_ngn ?? 0).toLocaleString()}) to ${stats?.eligible_viewers ?? 0} eligible viewers based on their plan multipliers. Proceed?`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: "Distribute Now",
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          const res = await api.post("/vpt/admin/pool/distribute");
          const result = res.result;
          if (result.distributed) {
            setFeedback({
              tone: "success",
              message: `Distributed ₦${result.distributed_ngn.toLocaleString()} to ${result.success_count}/${result.eligible_viewers} viewers. Pool balance: ₦${result.pool_balance_after.toLocaleString()}.`,
            });
          } else {
            setFeedback({ tone: "warn", message: result.reason || "No distribution made." });
          }
          await load();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Distribution failed" }));
          return false;
        }
      },
    });
  }

  const fmt = (n) => (n ?? 0).toLocaleString();
  const fmtVpt = (n) => (n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Community Pool</h1>
          <p className="mt-2 text-sm text-white/58">
            Viewer reward distribution engine — multiplier-weighted vPT payouts from the community pool.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10">
            Refresh
          </button>
          <button
            onClick={triggerDistribution}
            disabled={!stats || (stats.eligible_viewers ?? 0) === 0 || (stats.pool?.balance_ngn ?? 0) <= 0}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-40 disabled:pointer-events-none"
          >
            Distribute Rewards
          </button>
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

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
          {/* Pool Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Pool Balance" value={`₦${fmt(stats.pool?.balance_ngn)}`} sub="Available for distribution" accent="orange" />
            <StatCard label="Total Credited" value={`₦${fmt(stats.pool?.total_credited)}`} sub="Lifetime pool inflow" accent="sky" />
            <StatCard label="Total Distributed" value={`₦${fmt(stats.pool?.total_distributed)}`} sub="Lifetime viewer rewards" accent="emerald" />
            <StatCard label="Eligible Viewers" value={stats.eligible_viewers} sub={`${fmtVpt(stats.total_multipliers)} total multiplier weight`} accent="purple" />
          </div>

          {/* Reward Config & Next Distribution */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-4">Reward Configuration</h3>
              <div className="space-y-3 text-sm">
                <ConfigRow label="Reward Percent" value={`${stats.reward_percent}% per cycle`} />
                <ConfigRow label="vPT Price" value={`₦${fmt(stats.vpt_price_ngn)} / vPT`} />
                <ConfigRow label="Next Payout (NGN)" value={`₦${fmt(stats.next_distribution_ngn)}`} />
                <ConfigRow label="Next Payout (vPT)" value={`${fmtVpt(stats.next_distribution_vpt)} vPT`} />
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
              <h3 className="text-sm font-semibold text-white/80 mb-4">Viewer Tier Breakdown</h3>
              {Object.keys(stats.tier_counts ?? {}).length > 0 ? (
                <div className="space-y-3 text-sm">
                  {Object.entries(stats.tier_counts).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between">
                      <span className="text-white/60 capitalize">{tier.replace(/_/g, " ")}</span>
                      <span className="font-mono text-white">{count} viewer{count !== 1 ? "s" : ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/40">No eligible viewers yet.</p>
              )}
            </div>
          </div>

          {/* Multiplier Rules Explanation */}
          <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
            <h3 className="text-sm font-semibold text-white/80 mb-3">How Multiplier Distribution Works</h3>
            <div className="grid gap-3 text-xs text-white/50 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-white/70 mb-1">1. Pool Accumulates</p>
                <p>Subscription payments and ad revenue contribute to the community pool.</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-white/70 mb-1">2. Cycle Triggers</p>
                <p>Every {stats.reward_percent}% of the pool is allocated for distribution (auto or manual).</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-white/70 mb-1">3. Weighted Shares</p>
                <p>Each viewer&apos;s share = (their multiplier ÷ total multipliers) × allocation.</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-white/3 p-3">
                <p className="font-semibold text-white/70 mb-1">4. vPT Credit</p>
                <p>NGN shares convert to vPT at ₦{fmt(stats.vpt_price_ngn)}/vPT and credit user balances.</p>
              </div>
            </div>
          </div>

          {/* Distribution History */}
          <div className="rounded-[1.5rem] border border-white/8 bg-[var(--admin-surface)] p-5">
            <h3 className="text-sm font-semibold text-white/80 mb-4">Distribution History</h3>
            {distributions.length === 0 ? (
              <p className="text-sm text-white/40 py-4 text-center">No distributions yet. Trigger the first one when the pool has funds and viewers are subscribed.</p>
            ) : (
              <div className="space-y-3">
                {distributions.map((dist) => (
                  <div key={dist.id} className="rounded-2xl border border-white/6 bg-white/3 overflow-hidden">
                    <button
                      onClick={() => setExpanded(expanded === dist.id ? null : dist.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/3 transition"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`h-2 w-2 rounded-full ${dist.success_count > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white">₦{fmt(dist.distributed_ngn)}</span>
                            <span className="text-xs text-white/40">→ {dist.success_count}/{dist.eligible_viewers} viewers</span>
                          </div>
                          <span className="text-[11px] text-white/35">{new Date(dist.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-white/40">{expanded === dist.id ? "▲" : "▼"}</span>
                    </button>

                    {expanded === dist.id && (
                      <div className="border-t border-white/6 px-4 py-3 space-y-2">
                        <div className="grid gap-2 text-xs text-white/50 sm:grid-cols-3">
                          <div>Pool Before: ₦{fmt(dist.pool_balance_before)}</div>
                          <div>Pool After: ₦{fmt(dist.pool_balance_after)}</div>
                          <div>Reward %: {((dist.reward_percent ?? 0) * 100).toFixed(1)}%</div>
                          <div>Multiplier Sum: {fmtVpt(dist.total_multipliers)}</div>
                          <div>vPT Price: ₦{fmt(dist.vpt_price_ngn)}</div>
                          <div>Failed: {dist.failed_count ?? 0}</div>
                        </div>
                        {dist.results && dist.results.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="text-white/40 border-b border-white/6">
                                  <th className="text-left py-1 pr-3">User</th>
                                  <th className="text-right py-1 pr-3">Multiplier</th>
                                  <th className="text-right py-1 pr-3">NGN</th>
                                  <th className="text-right py-1 pr-3">vPT</th>
                                  <th className="text-right py-1">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dist.results.map((r, i) => (
                                  <tr key={i} className="border-b border-white/4">
                                    <td className="py-1 pr-3 text-white/60 font-mono">{r.userId?.slice(0, 8)}…</td>
                                    <td className="py-1 pr-3 text-right text-white/60">{r.multiplier}x</td>
                                    <td className="py-1 pr-3 text-right text-white/60">₦{fmt(r.shareNGN)}</td>
                                    <td className="py-1 pr-3 text-right text-white/60">{fmtVpt(r.vptAmount)}</td>
                                    <td className={`py-1 text-right ${r.status === "success" ? "text-emerald-400" : "text-red-400"}`}>{r.status}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog state={confirm} onClose={() => setConfirm(null)} />
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
      <p className="text-xs uppercase tracking-wider text-white/45 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${c.split(" ")[1]}`}>{value}</p>
      <p className="mt-1 text-[11px] text-white/35">{sub}</p>
    </div>
  );
}

function ConfigRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}
