"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const CATEGORY_LABELS = {
  banner_home: "Banner — Home",
  banner_page: "Banner — Page",
  in_stream_pre: "Pre-Roll",
  in_stream_mid: "Mid-Roll",
  in_stream_brief: "Brief (≤15s)",
};

const STATUS_COLORS = {
  pending: "bg-amber-500/15 text-amber-300",
  approved: "bg-blue-500/15 text-blue-300",
  rejected: "bg-red-500/15 text-red-300",
  active: "bg-green-500/15 text-green-300",
  paused: "bg-purple-500/15 text-purple-300",
  expired: "bg-white/8 text-white/50",
  depleted: "bg-orange-500/15 text-orange-300",
};

function fmt(n) {
  return (n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtInt(n) {
  return (n || 0).toLocaleString();
}

export default function AdAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartMetric, setChartMetric] = useState("revenue"); // revenue | impressions | viewers

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/ads/analytics");
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
        <p className="text-sm">{error}</p>
        <button onClick={load} className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-xs text-white hover:bg-white/15">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { overview, daily, categories, top_ads, top_channels, status_breakdown } = data;

  // Chart bar max
  const chartMax = Math.max(...daily.map((d) => d[chartMetric] || 0), 1);

  return (
    <div className="space-y-6">
      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Total Revenue", value: `₦${fmt(overview.total_revenue)}`, sub: `${fmtInt(overview.total_impressions)} impressions` },
          { label: "Active Ads", value: fmtInt(overview.active_ads), sub: `${fmtInt(overview.total_ads)} total` },
          { label: "Total Viewers", value: fmtInt(overview.total_viewers), sub: "across all ads" },
          { label: "Total Budget", value: `₦${fmt(overview.total_budget)}`, sub: `₦${fmt(overview.total_revenue)} spent` },
          { label: "Avg Rev / Imp", value: `₦${fmt(overview.total_impressions > 0 ? overview.total_revenue / overview.total_impressions : 0)}`, sub: "per impression" },
        ].map((c, i) => (
          <div key={i} className="rounded-2xl border border-white/8 bg-white/4 p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">{c.label}</p>
            <p className="mt-1 text-lg font-semibold text-white">{c.value}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Revenue Split ── */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
        <h3 className="text-sm font-semibold text-white/80">Revenue Split</h3>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {[
            { label: "Operations", value: overview.operations_revenue, color: "bg-blue-500" },
            { label: "Channel Owners", value: overview.channel_revenue, color: "bg-green-500" },
            { label: "Community Pool", value: overview.pool_revenue, color: "bg-amber-500" },
          ].map((s, i) => {
            const pct = overview.total_revenue > 0 ? ((s.value / overview.total_revenue) * 100).toFixed(1) : 0;
            return (
              <div key={i}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${s.color}`} />
                  <span className="text-xs text-white/60">{s.label}</span>
                </div>
                <p className="mt-1 text-base font-semibold text-white">₦{fmt(s.value)}</p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full ${s.color}/60`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-0.5 text-[10px] text-white/35">{pct}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Daily Trend Chart ── */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/80">30-Day Trend</h3>
          <div className="flex gap-1">
            {["revenue", "impressions", "viewers"].map((m) => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`rounded-lg px-3 py-1 text-[10px] uppercase tracking-wider transition ${
                  chartMetric === m
                    ? "bg-[var(--av-light-orange)]/20 text-[var(--av-light-orange)]"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex items-end gap-[2px]" style={{ height: 140 }}>
          {daily.map((d, i) => {
            const val = d[chartMetric] || 0;
            const h = chartMax > 0 ? (val / chartMax) * 100 : 0;
            return (
              <div key={i} className="group relative flex-1" title={`${d.date}: ${chartMetric === "revenue" ? `₦${fmt(val)}` : fmtInt(val)}`}>
                <div
                  className="w-full rounded-t bg-[var(--av-light-orange)]/50 transition group-hover:bg-[var(--av-light-orange)]/80"
                  style={{ height: `${Math.max(h, 1)}%` }}
                />
                {/* Tooltip on hover */}
                <div className="pointer-events-none absolute -top-14 left-1/2 z-10 hidden -translate-x-1/2 rounded-lg border border-white/10 bg-[var(--admin-surface-strong)] px-2 py-1 text-[9px] text-white/70 shadow-lg group-hover:block whitespace-nowrap">
                  <p className="font-semibold">{d.date}</p>
                  <p>{chartMetric === "revenue" ? `₦${fmt(val)}` : fmtInt(val)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-white/25">
          <span>{daily[0]?.date}</span>
          <span>{daily[daily.length - 1]?.date}</span>
        </div>
      </div>

      {/* ── Category & Status Breakdown ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Category breakdown */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-sm font-semibold text-white/80">By Category</h3>
          <div className="mt-3 space-y-3">
            {categories.length === 0 && <p className="text-xs text-white/30">No impression data yet.</p>}
            {categories.sort((a, b) => b.revenue - a.revenue).map((c, i) => {
              const catMax = Math.max(...categories.map((x) => x.revenue), 1);
              const pct = (c.revenue / catMax) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70">{CATEGORY_LABELS[c.category] || c.category}</span>
                    <span className="text-xs font-medium text-white/60">₦{fmt(c.revenue)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-[var(--av-light-orange)]/50" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-white/30">{fmtInt(c.impressions)} impressions · {fmtInt(c.viewers)} viewers</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
          <h3 className="text-sm font-semibold text-white/80">Ad Status Distribution</h3>
          <div className="mt-3 space-y-2">
            {Object.entries(status_breakdown).length === 0 && <p className="text-xs text-white/30">No ads yet.</p>}
            {Object.entries(status_breakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg border px-2 py-0.5 text-[10px] ${STATUS_COLORS[status] || "bg-white/8 text-white/50"}`}>
                      {status}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white/70">{count}</span>
                </div>
              ))}
            <div className="mt-2 border-t border-white/8 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/40">Total</span>
                <span className="text-sm font-semibold text-white/80">{overview.total_ads}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Ads ── */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
        <h3 className="text-sm font-semibold text-white/80">Top 10 Ads by Revenue</h3>
        <div className="mt-3 overflow-x-auto">
          {top_ads.length === 0 ? (
            <p className="text-xs text-white/30">No impression data yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-white/35">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                  <th className="py-2 pr-4 text-right">Impressions</th>
                  <th className="py-2 text-right">Viewers</th>
                </tr>
              </thead>
              <tbody>
                {top_ads.map((ad, i) => (
                  <tr key={ad.ad_id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2 pr-4 text-white/30">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium text-white/80">{ad.title}</td>
                    <td className="py-2 pr-4 text-white/50">{CATEGORY_LABELS[ad.category] || ad.category}</td>
                    <td className="py-2 pr-4">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] ${STATUS_COLORS[ad.status] || "bg-white/8 text-white/50"}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-medium text-[var(--av-light-orange)]">₦{fmt(ad.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-white/60">{fmtInt(ad.impressions)}</td>
                    <td className="py-2 text-right text-white/60">{fmtInt(ad.viewers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Top Channels ── */}
      <div className="rounded-2xl border border-white/8 bg-white/4 p-5">
        <h3 className="text-sm font-semibold text-white/80">Top 10 Channels by Ad Revenue</h3>
        <div className="mt-3 overflow-x-auto">
          {top_channels.length === 0 ? (
            <p className="text-xs text-white/30">No data yet.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/8 text-[10px] uppercase tracking-wider text-white/35">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Channel ID</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                  <th className="py-2 pr-4 text-right">Impressions</th>
                  <th className="py-2 text-right">Viewers</th>
                </tr>
              </thead>
              <tbody>
                {top_channels.map((ch, i) => (
                  <tr key={ch.channel_id} className="border-b border-white/5 hover:bg-white/3">
                    <td className="py-2 pr-4 text-white/30">{i + 1}</td>
                    <td className="py-2 pr-4 text-white/60 font-mono text-[10px]">{ch.channel_id === "direct" ? "Banner (Direct)" : ch.channel_id}</td>
                    <td className="py-2 pr-4 text-right font-medium text-[var(--av-light-orange)]">₦{fmt(ch.revenue)}</td>
                    <td className="py-2 pr-4 text-right text-white/60">{fmtInt(ch.impressions)}</td>
                    <td className="py-2 text-right text-white/60">{fmtInt(ch.viewers)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Refresh ── */}
      <div className="text-center">
        <button
          onClick={load}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-xs text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
}
