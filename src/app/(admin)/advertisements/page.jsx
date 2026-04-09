"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STATUSES = ["pending", "approved", "rejected", "active", "paused", "expired", "depleted"];
const STATUS_COLORS = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  approved: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  active: "bg-green-500/15 text-green-300 border-green-500/30",
  paused: "bg-purple-500/15 text-purple-300 border-purple-500/30",
  expired: "bg-white/8 text-white/50 border-white/10",
  depleted: "bg-orange-500/15 text-orange-300 border-orange-500/30",
};

const CATEGORY_LABELS = {
  banner_home: "Banner — Home",
  banner_page: "Banner — Page",
  in_stream_pre: "Pre-Roll",
  in_stream_mid: "Mid-Roll",
  in_stream_brief: "Brief (≤15s)",
};

export default function AdvertisementsPage() {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(null);
  const [tab, setTab] = useState("all"); // all | pending | impressions
  const [impressions, setImpressions] = useState([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (tab === "pending") {
        const res = await api.get("/ads/pending");
        setAds(res ?? []);
      } else if (tab === "impressions") {
        const res = await api.get("/ads/impressions");
        setImpressions(res ?? []);
      } else {
        const res = await api.get("/ads/all");
        setAds(res ?? []);
      }
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load ads");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  function requestAction(adId, action, label, destructive = false) {
    setConfirm({
      title: `${label} Ad`,
      message: `Are you sure you want to ${label.toLowerCase()} this ad?`,
      destructive,
      action: async () => {
        setSaving(adId);
        try {
          if (action === "delete") {
            await api.delete(`/ads/${adId}`);
          } else {
            await api.patch(`/ads/${adId}/${action}`);
          }
          await load();
          if (selected?.id === adId) {
            if (action === "delete") {
              setSelected(null);
            } else {
              const updated = ads.find((a) => a.id === adId);
              if (updated) setSelected(updated);
            }
          }
        } catch {
          // handled by api
        } finally {
          setSaving(null);
        }
      },
    });
  }

  const filtered = ads.filter((ad) => {
    if (filter && ad.status !== filter) return false;
    if (categoryFilter && ad.category !== categoryFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Advertisements</h1>
          <p className="mt-2 text-sm text-white/58">
            Review, approve, and manage all advertisements across the platform.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
          {tab === "impressions" ? `${impressions.length} impression${impressions.length !== 1 ? "s" : ""}` : `${filtered.length} ad${filtered.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: "all", label: "All Ads" },
          { key: "pending", label: "Pending Review" },
          { key: "impressions", label: "Impressions" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSelected(null); }}
            className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              tab === t.key
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Impressions Tab */}
      {tab === "impressions" ? (
        <ImpressionsTable impressions={impressions} />
      ) : (
        <>
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-white/45 self-center mr-1">Status:</span>
              <button
                onClick={() => setFilter("")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  !filter
                    ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                    : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
                }`}
              >
                All
              </button>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                    filter === s
                      ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                      : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-medium text-white/45 self-center mr-1">Category:</span>
              <button
                onClick={() => setCategoryFilter("")}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  !categoryFilter
                    ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                    : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
                }`}
              >
                All
              </button>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategoryFilter(key)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    categoryFilter === key
                      ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                      : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Ad List */}
          {filtered.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              No ads{filter ? ` with status "${filter}"` : ""}{categoryFilter ? ` in "${CATEGORY_LABELS[categoryFilter]}"` : ""}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div className="divide-y divide-white/6">
                {filtered.map((ad) => (
                  <div
                    key={ad.id}
                    className="flex flex-col gap-3 px-5 py-4 transition hover:bg-white/3 lg:flex-row lg:items-center lg:justify-between cursor-pointer"
                    onClick={() => setSelected(selected?.id === ad.id ? null : ad)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white">{ad.title}</span>
                        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLORS[ad.status] || STATUS_COLORS.pending}`}>
                          {ad.status}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[10px] font-medium text-white/50">
                          {CATEGORY_LABELS[ad.category] || ad.category}
                        </span>
                        {ad.is_super_ad && (
                          <span className="rounded-full border border-[var(--av-orange)]/50 bg-[var(--av-orange)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--av-orange)]">
                            SUPER
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-xs text-white/40">
                        <span>Budget: ₦{(ad.budget || 0).toLocaleString()}</span>
                        <span>Spent: ₦{(ad.spent || 0).toLocaleString()}</span>
                        <span>Impressions: {(ad.impression_count || 0).toLocaleString()}</span>
                        <span>₦{(ad.price_per_impression || 0)}/imp</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/40 lg:ml-4">
                      {new Date(ad.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detail Panel */}
          {selected && (
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
              <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{selected.title}</h2>
                <button onClick={() => setSelected(null)} className="text-xs text-white/40 hover:text-white">Close ×</button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <DetailRow label="ID" value={selected.id} />
                <DetailRow label="Category" value={CATEGORY_LABELS[selected.category] || selected.category} />
                <DetailRow label="Status" value={selected.status} />
                <DetailRow label="Advertiser ID" value={selected.advertiser_id} />
                {selected.description && <DetailRow label="Description" value={selected.description} />}
                {selected.media_url && <DetailRow label="Media URL" value={selected.media_url} link />}
                {selected.thumbnail_url && <DetailRow label="Thumbnail" value={selected.thumbnail_url} link />}
                {selected.click_url && <DetailRow label="Click URL" value={selected.click_url} link />}
                {selected.duration > 0 && <DetailRow label="Duration" value={`${selected.duration}s`} />}
                <DetailRow label="Budget" value={`₦${(selected.budget || 0).toLocaleString()}`} />
                <DetailRow label="Spent" value={`₦${(selected.spent || 0).toLocaleString()}`} />
                <DetailRow label="Price/Impression" value={`₦${selected.price_per_impression || 0}`} />
                <DetailRow label="Impressions" value={`${(selected.impression_count || 0).toLocaleString()}`} />
                {selected.target_channels?.length > 0 && (
                  <DetailRow label="Target Channels" value={selected.target_channels.join(", ")} />
                )}
                {selected.start_date && <DetailRow label="Start Date" value={new Date(selected.start_date).toLocaleString()} />}
                {selected.end_date && <DetailRow label="End Date" value={new Date(selected.end_date).toLocaleString()} />}
                <DetailRow label="Super Ad" value={selected.is_super_ad ? "Yes" : "No"} />
                <DetailRow label="Created" value={new Date(selected.created_at).toLocaleString()} />
                <DetailRow label="Updated" value={new Date(selected.updated_at).toLocaleString()} />

                {/* Budget bar */}
                {selected.budget > 0 && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs text-white/45 mb-1">
                      <span>Budget Usage</span>
                      <span>{Math.min(100, Math.round((selected.spent / selected.budget) * 100))}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--av-orange)] to-[var(--av-light-orange)] transition-all"
                        style={{ width: `${Math.min(100, (selected.spent / selected.budget) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/8">
                  <span className="text-xs font-medium text-white/50 mr-2">Actions:</span>
                  {selected.status === "pending" && (
                    <>
                      <ActionButton
                        label="Approve"
                        color="green"
                        disabled={saving === selected.id}
                        onClick={() => requestAction(selected.id, "approve", "Approve")}
                      />
                      <ActionButton
                        label="Reject"
                        color="red"
                        disabled={saving === selected.id}
                        onClick={() => requestAction(selected.id, "reject", "Reject", true)}
                      />
                    </>
                  )}
                  {(selected.status === "approved" || selected.status === "paused") && (
                    <ActionButton
                      label="Activate"
                      color="green"
                      disabled={saving === selected.id}
                      onClick={() => requestAction(selected.id, "activate", "Activate")}
                    />
                  )}
                  {selected.status === "active" && (
                    <ActionButton
                      label="Pause"
                      color="purple"
                      disabled={saving === selected.id}
                      onClick={() => requestAction(selected.id, "pause", "Pause")}
                    />
                  )}
                  <ActionButton
                    label="Delete"
                    color="red"
                    disabled={saving === selected.id}
                    onClick={() => requestAction(selected.id, "delete", "Delete", true)}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────────── */

function DetailRow({ label, value, link }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="text-xs font-semibold text-white/45 min-w-[140px]">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--av-light-orange)] hover:underline break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm text-white/78 whitespace-pre-wrap break-all">{value}</span>
      )}
    </div>
  );
}

function ActionButton({ label, color, disabled, onClick }) {
  const colors = {
    green: "border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500/25",
    red: "border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25",
    purple: "border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25",
    blue: "border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25",
  };
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition disabled:opacity-30 ${colors[color] || colors.blue}`}
    >
      {label}
    </button>
  );
}

function ImpressionsTable({ impressions }) {
  if (impressions.length === 0) {
    return (
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        No impressions recorded yet
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/8 text-xs uppercase tracking-wider text-white/45">
              <th className="px-5 py-3 font-medium">Ad ID</th>
              <th className="px-5 py-3 font-medium">Channel</th>
              <th className="px-5 py-3 font-medium">Category</th>
              <th className="px-5 py-3 font-medium">Viewers</th>
              <th className="px-5 py-3 font-medium">Cost</th>
              <th className="px-5 py-3 font-medium">Played At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {impressions.slice(0, 200).map((imp) => (
              <tr key={imp.id} className="transition hover:bg-white/3">
                <td className="px-5 py-3 font-mono text-xs text-[var(--av-light-orange)]">{imp.ad_id?.slice(0, 8)}...</td>
                <td className="px-5 py-3 text-white/70">{imp.channel_id?.slice(0, 8) || "—"}...</td>
                <td className="px-5 py-3 text-white/50">{CATEGORY_LABELS[imp.category] || imp.category}</td>
                <td className="px-5 py-3 text-white/70">{imp.viewer_count || 1}</td>
                <td className="px-5 py-3 text-white/70">₦{(imp.cost || 0).toFixed(2)}</td>
                <td className="px-5 py-3 text-white/40 text-xs">
                  {imp.played_at ? new Date(imp.played_at).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
