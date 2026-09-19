"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const TABS = ["overview", "gifts", "subscriptions", "events", "asset-flow", "audit-log"];
const PERIODS = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "365d", label: "365 Days" },
];

function fmtNum(val) {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}

function fmtCurrency(val, currency) {
  if (val === null || val === undefined) return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  if (currency === "vpt") return `${Math.floor(num)} vPT`;
  return `₦${num.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDate(ts) {
  if (!ts) return "—";
  const d = new Date(typeof ts === "number" ? ts : ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function fmtDateShort(ts) {
  if (!ts) return "—";
  const d = new Date(typeof ts === "number" ? ts : ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "indigo" }) {
  const colorMap = {
    indigo: "border-indigo-400/20 bg-indigo-500/8 text-indigo-200",
    emerald: "border-emerald-400/20 bg-emerald-500/8 text-emerald-200",
    sky: "border-sky-400/20 bg-sky-500/8 text-sky-200",
    amber: "border-amber-400/20 bg-amber-500/8 text-amber-200",
    orange: "border-orange-400/20 bg-orange-500/8 text-orange-200",
    teal: "border-teal-400/20 bg-teal-500/8 text-teal-200",
    cyan: "border-cyan-400/20 bg-cyan-500/8 text-cyan-200",
    violet: "border-violet-400/20 bg-violet-500/8 text-violet-200",
    rose: "border-rose-400/20 bg-rose-500/8 text-rose-200",
    purple: "border-purple-400/20 bg-purple-500/8 text-purple-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${colorMap[color] || colorMap.indigo}`}>
      <div className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-xs opacity-60">{sub}</div>}
    </div>
  );
}

// ── Mini Timeline Chart ────────────────────────────────────────────────────
function MiniTimelineChart({ timeline, dataKey, color = "#818cf8", label = "Views" }) {
  const values = timeline.map((d) => d[dataKey] || 0);
  const maxVal = Math.max(...values, 1);
  const chartHeight = 120;
  const barWidth = timeline.length > 0 ? Math.max(100 / timeline.length, 1.5) : 1.5;

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/70">{label}</h3>
      <div className="flex items-end gap-px" style={{ height: chartHeight }}>
        {timeline.map((d, i) => {
          const val = d[dataKey] || 0;
          const h = (val / maxVal) * chartHeight;
          return (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all hover:opacity-80"
              style={{
                height: `${Math.max(h, 2)}px`,
                backgroundColor: color,
                minWidth: `${barWidth}%`,
              }}
              title={`${d.date}: ${fmtNum(val)}`}
            />
          );
        })}
      </div>
      {timeline.length > 0 && (
        <div className="mt-2 flex justify-between text-[10px] text-white/40">
          <span>{timeline[0]?.date}</span>
          <span>{timeline[timeline.length - 1]?.date}</span>
        </div>
      )}
    </div>
  );
}

// ── Gift Row ───────────────────────────────────────────────────────────────
function GiftRow({ gift }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-sm text-white/70 whitespace-nowrap">{fmtDate(gift.created_at)}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {gift.sender_avatar_url ? (
              <img src={gift.sender_avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">
                {(gift.sender_name || gift.sender_alias || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <a
                href={`https://afrovision.online/u/${encodeURIComponent(gift.sender_uid)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-sky-300 hover:text-sky-200 hover:underline truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {gift.sender_alias || gift.sender_name || "Unknown"}
              </a>
              {gift.sender_email && <div className="text-xs text-white/40 truncate">{gift.sender_email}</div>}
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{gift.gift_icon}</span>
            <span className="text-sm text-white/80">{gift.gift_name}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <span className={gift.currency === "vpt" ? "text-orange-300" : "text-amber-300"}>
            {fmtCurrency(gift.gross_amount, gift.currency)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-emerald-300">{fmtCurrency(gift.creator_share, gift.currency)}</td>
        <td className="px-4 py-3 text-sm text-sky-300">{fmtCurrency(gift.ops_share, gift.currency)}</td>
        <td className="px-4 py-3 text-sm text-violet-300">{fmtCurrency(gift.community_share, gift.currency)}</td>
        <td className="px-4 py-3 text-xs text-white/40">{expanded ? "▲" : "▼"}</td>
      </tr>
      {expanded && (
        <tr className="bg-white/[0.02]">
          <td colSpan={8} className="px-8 py-3">
            <div className="grid grid-cols-2 gap-4 text-xs md:grid-cols-4">
              <div>
                <div className="text-white/40 uppercase tracking-wider mb-1">Sender Balance</div>
                <div className="text-white/70">
                  {gift.sender_balance_before ?? "—"} → {gift.sender_balance_after ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-white/40 uppercase tracking-wider mb-1">Creator Balance</div>
                <div className="text-white/70">
                  {gift.creator_balance_before ?? "—"} → {gift.creator_balance_after ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-white/40 uppercase tracking-wider mb-1">Sender UID</div>
                <div className="text-white/70 font-mono text-[10px]">{gift.sender_uid || "—"}</div>
              </div>
              <div>
                <div className="text-white/40 uppercase tracking-wider mb-1">Ledger Ref</div>
                <div className="text-white/70 font-mono text-[10px]">{gift.ledger_ref || "—"}</div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function ChannelAuditPage() {
  const params = useParams();
  const channelId = params.id;

  const [channel, setChannel] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshTimer = useRef(null);

  // Tab data states
  const [analytics, setAnalytics] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [giftsHasMore, setGiftsHasMore] = useState(false);
  const [giftsCursor, setGiftsCursor] = useState(null);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [giftsCurrency, setGiftsCurrency] = useState("");

  const [subscriptions, setSubscriptions] = useState([]);
  const [subsHasMore, setSubsHasMore] = useState(false);
  const [subsCursor, setSubsCursor] = useState(null);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsStatus, setSubsStatus] = useState("");

  const [events, setEvents] = useState([]);
  const [eventsHasMore, setEventsHasMore] = useState(false);
  const [eventsCursor, setEventsCursor] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsType, setEventsType] = useState("");

  const [assetFlow, setAssetFlow] = useState(null);
  const [assetFlowLoading, setAssetFlowLoading] = useState(false);

  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Ban/unban dialog
  const [banDialog, setBanDialog] = useState({ open: false });
  const [unbanDialog, setUnbanDialog] = useState({ open: false });
  const [actionLoading, setActionLoading] = useState(false);

  // Load channel info
  useEffect(() => {
    let cancelled = false;
    async function loadChannel() {
      try {
        setLoading(true);
        const res = await api.get(`/channels/${channelId}`);
        if (cancelled) return;
        setChannel(res.channel || res);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadChannel();
    return () => { cancelled = true; };
  }, [channelId]);

  // Load analytics (overview tab)
  const loadAnalytics = useCallback(async () => {
    try {
      const res = await api.get(`/admin/channels/${channelId}/analytics?period=${period}`);
      setAnalytics(res);
    } catch (err) {
      console.error("Analytics error:", err);
    }
  }, [channelId, period]);

  // Load gifts
  const loadGifts = useCallback(async (cursor = null) => {
    try {
      setGiftsLoading(true);
      let path = `/admin/channels/${channelId}/audit/gifts?period=${period}&limit=50`;
      if (cursor) path += `&cursor=${cursor}`;
      if (giftsCurrency) path += `&currency=${giftsCurrency}`;
      const res = await api.get(path);
      if (cursor) {
        setGifts((prev) => [...prev, ...res.gifts]);
      } else {
        setGifts(res.gifts);
      }
      setGiftsHasMore(res.has_more);
      setGiftsCursor(res.next_cursor);
    } catch (err) {
      console.error("Gifts error:", err);
    } finally {
      setGiftsLoading(false);
    }
  }, [channelId, period, giftsCurrency]);

  // Load subscriptions
  const loadSubs = useCallback(async (cursor = null) => {
    try {
      setSubsLoading(true);
      let path = `/admin/channels/${channelId}/audit/subscriptions?limit=50`;
      if (cursor) path += `&cursor=${cursor}`;
      if (subsStatus) path += `&status=${subsStatus}`;
      const res = await api.get(path);
      if (cursor) {
        setSubscriptions((prev) => [...prev, ...res.subscriptions]);
      } else {
        setSubscriptions(res.subscriptions);
      }
      setSubsHasMore(res.has_more);
      setSubsCursor(res.next_cursor);
    } catch (err) {
      console.error("Subs error:", err);
    } finally {
      setSubsLoading(false);
    }
  }, [channelId, subsStatus]);

  // Load events
  const loadEvents = useCallback(async (cursor = null) => {
    try {
      setEventsLoading(true);
      let path = `/admin/channels/${channelId}/audit/events?period=${period}&limit=50`;
      if (cursor) path += `&cursor=${cursor}`;
      if (eventsType) path += `&type=${eventsType}`;
      const res = await api.get(path);
      if (cursor) {
        setEvents((prev) => [...prev, ...res.events]);
      } else {
        setEvents(res.events);
      }
      setEventsHasMore(res.has_more);
      setEventsCursor(res.next_cursor);
    } catch (err) {
      console.error("Events error:", err);
    } finally {
      setEventsLoading(false);
    }
  }, [channelId, period, eventsType]);

  // Load asset flow
  const loadAssetFlow = useCallback(async () => {
    try {
      setAssetFlowLoading(true);
      const res = await api.get(`/admin/channels/${channelId}/audit/asset-flow?period=${period}`);
      setAssetFlow(res);
    } catch (err) {
      console.error("Asset flow error:", err);
    } finally {
      setAssetFlowLoading(false);
    }
  }, [channelId, period]);

  // Load audit logs
  const loadAuditLogs = useCallback(async () => {
    try {
      setLogsLoading(true);
      const res = await api.get(`/admin/channels/${channelId}/audit/logs?limit=100`);
      setAuditLogs(res.logs);
    } catch (err) {
      console.error("Audit logs error:", err);
    } finally {
      setLogsLoading(false);
    }
  }, [channelId]);

  // Tab switch data loading
  useEffect(() => {
    if (activeTab === "overview") loadAnalytics();
    if (activeTab === "gifts") loadGifts();
    if (activeTab === "subscriptions") loadSubs();
    if (activeTab === "events") loadEvents();
    if (activeTab === "asset-flow") loadAssetFlow();
    if (activeTab === "audit-log") loadAuditLogs();
  }, [activeTab, period]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30s
  useEffect(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(() => {
      if (activeTab === "overview") loadAnalytics();
      if (activeTab === "gifts" && !giftsCursor) loadGifts();
      if (activeTab === "events" && !eventsCursor) loadEvents();
      if (activeTab === "asset-flow") loadAssetFlow();
    }, 30000);
    return () => { if (refreshTimer.current) clearInterval(refreshTimer.current); };
  }, [activeTab, period]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ban/unban actions
  const handleBan = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/channels/${channelId}/ban`, { reason: banDialog.reason || "Banned from admin panel" });
      setBanDialog({ open: false });
      const res = await api.get(`/admin/channels/${channelId}`);
      setChannel(res.channel || res);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/channels/${channelId}/unban`);
      setUnbanDialog({ open: false });
      const res = await api.get(`/admin/channels/${channelId}`);
      setChannel(res.channel || res);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-white/50">Loading channel…</div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-red-300">{error || "Channel not found"}</div>
        <Link href="/channels" className="text-indigo-300 hover:text-indigo-200">← Back to channels</Link>
      </div>
    );
  }

  const isBanned = channel.is_banned || channel.status === "banned";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {channel.logo_url ? (
            <img src={channel.logo_url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl font-bold text-white/60">
              {(channel.name || "C")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white">{channel.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/50">
              <span>Owner: {channel.owner_name || channel.owner_id || "—"}</span>
              <span className="text-white/20">•</span>
              <span>{channel.category || "Uncategorized"}</span>
              {channel.stream_status && (
                <>
                  <span className="text-white/20">•</span>
                  <StatusBadge status={channel.stream_status} />
                </>
              )}
              {isBanned && <StatusBadge status="banned" />}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/channels" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            ← Back
          </Link>
          <Link href={`/channels/${channelId}/subscribers`} className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-200 hover:bg-indigo-500/20">
            Subscribers
          </Link>
          {isBanned ? (
            <button
              onClick={() => setUnbanDialog({ open: true })}
              className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20"
            >
              Unban Channel
            </button>
          ) : (
            <button
              onClick={() => setBanDialog({ open: true })}
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20"
            >
              Ban Channel
            </button>
          )}
        </div>
      </div>

      {/* Period filter */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/50">Period:</span>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                period === p.value
                  ? "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-white/10">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-all border-b-2 ${
              activeTab === tab
                ? "border-indigo-400 text-indigo-200"
                : "border-transparent text-white/50 hover:text-white/70"
            }`}
          >
            {tab.replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            {!analytics ? (
              <div className="text-white/40">Loading analytics…</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard label="Subscribers" value={fmtNum(analytics.overview?.subscriber_count)} color="emerald" />
                  <StatCard label="Active Subs" value={fmtNum(analytics.overview?.active_subscriptions)} color="sky" />
                  <StatCard label="Total Views" value={fmtNum(analytics.overview?.total_views)} color="indigo" />
                  <StatCard label="Weekly Views" value={fmtNum(analytics.overview?.weekly_views)} color="violet" />
                  <StatCard label="Gifts (₦)" value={fmtNum(analytics.overview?.total_gifts_ngn)} color="amber" />
                  <StatCard label="Gifts (VPT)" value={fmtNum(analytics.overview?.total_gifts_vpt)} color="orange" />
                  <StatCard label="Earnings (₦)" value={fmtNum(analytics.overview?.total_earnings_ngn)} color="teal" />
                  <StatCard label="Earnings (VPT)" value={fmtNum(analytics.overview?.total_earnings_vpt)} color="cyan" />
                  <StatCard label="Reactions" value={fmtNum(analytics.overview?.total_reactions)} color="rose" />
                  <StatCard label="Gift Count" value={fmtNum(analytics.overview?.total_gifts_count)} color="pink" />
                  <StatCard label="New Subs" value={fmtNum(analytics.overview?.new_subscribers)} color="lime" />
                  <StatCard label="Total Events" value={fmtNum(analytics.overview?.total_events)} color="purple" />
                </div>
                {analytics.timeline && analytics.timeline.length > 0 && (
                  <MiniTimelineChart timeline={analytics.timeline} dataKey="views" label="Daily Views" />
                )}
              </>
            )}
          </div>
        )}

        {/* ── Gifts ── */}
        {activeTab === "gifts" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Currency:</span>
              <select
                value={giftsCurrency}
                onChange={(e) => { setGiftsCurrency(e.target.value); setGiftsCursor(null); }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70"
              >
                <option value="">All</option>
                <option value="vpt">VPT</option>
                <option value="ngn">NGN</option>
              </select>
            </div>
            {giftsLoading && gifts.length === 0 ? (
              <div className="text-white/40">Loading gifts…</div>
            ) : gifts.length === 0 ? (
              <div className="text-white/40">No gifts found in this period.</div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Sender</th>
                        <th className="px-4 py-3">Gift</th>
                        <th className="px-4 py-3">Gross</th>
                        <th className="px-4 py-3 text-emerald-300/70">Creator (50%)</th>
                        <th className="px-4 py-3 text-sky-300/70">Ops (30%)</th>
                        <th className="px-4 py-3 text-violet-300/70">Community (20%)</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {gifts.map((g, i) => <GiftRow key={g.id || i} gift={g} />)}
                    </tbody>
                  </table>
                </div>
                {giftsHasMore && (
                  <button
                    onClick={() => loadGifts(giftsCursor)}
                    disabled={giftsLoading}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
                  >
                    {giftsLoading ? "Loading…" : "Load More"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Subscriptions ── */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Status:</span>
              <select
                value={subsStatus}
                onChange={(e) => { setSubsStatus(e.target.value); setSubsCursor(null); }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="cancelled">Cancelled</option>
                <option value="banned_by_owner">Banned by Owner</option>
              </select>
            </div>
            {subsLoading && subscriptions.length === 0 ? (
              <div className="text-white/40">Loading subscriptions…</div>
            ) : subscriptions.length === 0 ? (
              <div className="text-white/40">No subscriptions found.</div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                        <th className="px-4 py-3">Subscriber</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Premium</th>
                        <th className="px-4 py-3">Interval</th>
                        <th className="px-4 py-3">Subscribed</th>
                        <th className="px-4 py-3">Next Billing</th>
                        <th className="px-4 py-3">Renewals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((s) => (
                        <tr key={s.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {s.subscriber_avatar_url ? (
                                <img src={s.subscriber_avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-white/50">
                                  {(s.subscriber_name || "?")[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <a
                                  href={`https://afrovision.online/u/${encodeURIComponent(s.subscriber_uid)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-sky-300 hover:text-sky-200 hover:underline truncate block"
                                >
                                  {s.subscriber_name || "Unknown"}
                                </a>
                                {s.subscriber_email && <div className="text-xs text-white/40 truncate">{s.subscriber_email}</div>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                          <td className="px-4 py-3 text-sm text-white/70">
                            {s.amount > 0 ? `${s.currency === "ngn" ? "₦" : ""}${fmtNum(s.amount)}` : "Free"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {s.is_premium ? <span className="text-amber-300">Premium</span> : <span className="text-white/40">No</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60">
                            {s.interval_count > 0 ? `${s.interval_count} ${s.interval_unit}` : "—"}
                          </td>
                          <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">{fmtDateShort(s.subscribed_at)}</td>
                          <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">{fmtDateShort(s.next_billing)}</td>
                          <td className="px-4 py-3 text-sm text-white/60">{s.renewal_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {subsHasMore && (
                  <button
                    onClick={() => loadSubs(subsCursor)}
                    disabled={subsLoading}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
                  >
                    {subsLoading ? "Loading…" : "Load More"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Events ── */}
        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/50">Type:</span>
              <select
                value={eventsType}
                onChange={(e) => { setEventsType(e.target.value); setEventsCursor(null); }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70"
              >
                <option value="">All</option>
                <option value="gift">Gifts</option>
                <option value="reaction">Reactions</option>
                <option value="view">Views</option>
                <option value="comment">Comments</option>
              </select>
            </div>
            {eventsLoading && events.length === 0 ? (
              <div className="text-white/40">Loading events…</div>
            ) : events.length === 0 ? (
              <div className="text-white/40">No events found in this period.</div>
            ) : (
              <>
                <div className="space-y-2">
                  {events.map((e) => (
                    <div key={e.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-lg">
                        {e.type === "gift" ? (e.gift_icon || "🎁") : e.type === "reaction" ? (e.emoji || "👍") : e.type === "view" ? "👁" : e.type === "comment" ? "💬" : "•"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white/80">
                          <a
                            href={`https://afrovision.online/u/${encodeURIComponent(e.sender_uid)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-sky-300 hover:text-sky-200 hover:underline"
                          >{e.sender_name || "Unknown"}</a>
                          {e.type === "gift" && ` sent a ${e.gift_name || "gift"}`}
                          {e.type === "reaction" && ` reacted ${e.emoji || ""}`}
                          {e.type === "view" && " viewed the channel"}
                          {e.type === "comment" && " commented"}
                        </div>
                        <div className="text-xs text-white/40">{fmtDate(e.created_at)}</div>
                      </div>
                      <span className="text-xs text-white/30 capitalize">{e.type}</span>
                    </div>
                  ))}
                </div>
                {eventsHasMore && (
                  <button
                    onClick={() => loadEvents(eventsCursor)}
                    disabled={eventsLoading}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50"
                  >
                    {eventsLoading ? "Loading…" : "Load More"}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Asset Flow ── */}
        {activeTab === "asset-flow" && (
          <div className="space-y-5">
            {assetFlowLoading && !assetFlow ? (
              <div className="text-white/40">Loading asset flow…</div>
            ) : !assetFlow ? (
              <div className="text-white/40">No data available.</div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <StatCard label="Total Gifts Gross (VPT)" value={fmtNum(assetFlow.summary?.total_gifts_gross_vpt)} color="orange" />
                  <StatCard label="Total Gifts Gross (₦)" value={fmtNum(assetFlow.summary?.total_gifts_gross_ngn)} color="amber" />
                  <StatCard label="Creator Share (VPT)" value={fmtNum(assetFlow.summary?.creator_share_vpt)} color="emerald" />
                  <StatCard label="Creator Share (₦)" value={fmtNum(assetFlow.summary?.creator_share_ngn)} color="teal" />
                  <StatCard label="Ops Pool (VPT)" value={fmtNum(assetFlow.summary?.ops_pool_vpt)} color="sky" />
                  <StatCard label="Ops Pool (₦)" value={fmtNum(assetFlow.summary?.ops_pool_ngn)} color="cyan" />
                  <StatCard label="Community Pool (VPT)" value={fmtNum(assetFlow.summary?.community_pool_vpt)} color="violet" />
                  <StatCard label="Community Pool (₦)" value={fmtNum(assetFlow.summary?.community_pool_ngn)} color="purple" />
                  <StatCard label="Subscription Revenue (₦)" value={fmtNum(assetFlow.summary?.subscription_revenue_ngn)} color="indigo" />
                  <StatCard label="Stream Entry Revenue (VPT)" value={fmtNum(assetFlow.summary?.stream_entry_revenue_vpt)} color="rose" />
                  <StatCard label="Withdrawals (₦)" value={fmtNum(assetFlow.summary?.total_withdrawals_ngn)} color="rose" />
                  <StatCard label="Net Creator Earnings (₦)" value={fmtNum(assetFlow.summary?.net_creator_earnings_ngn)} color="emerald" />
                </div>

                {/* By Type Table */}
                {assetFlow.by_type && Object.keys(assetFlow.by_type).length > 0 && (
                  <div className="rounded-2xl border border-white/10 overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                          <th className="px-4 py-3">Ledger Type</th>
                          <th className="px-4 py-3">Count</th>
                          <th className="px-4 py-3">VPT</th>
                          <th className="px-4 py-3">NGN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(assetFlow.by_type).map(([type, data]) => (
                          <tr key={type} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3 text-sm font-mono text-white/80">{type}</td>
                            <td className="px-4 py-3 text-sm text-white/60">{data.count}</td>
                            <td className="px-4 py-3 text-sm text-orange-300/80">{fmtNum(data.vpt)}</td>
                            <td className="px-4 py-3 text-sm text-amber-300/80">{fmtNum(data.ngn)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Timeline */}
                {assetFlow.timeline && assetFlow.timeline.length > 0 && (
                  <MiniTimelineChart timeline={assetFlow.timeline} dataKey="ngn_in" color="#fbbf24" label="Daily NGN Inflow" />
                )}
                {assetFlow.timeline && assetFlow.timeline.length > 0 && (
                  <MiniTimelineChart timeline={assetFlow.timeline} dataKey="vpt_in" color="#fb923c" label="Daily VPT Inflow" />
                )}

                <div className="text-xs text-white/40">
                  Based on {assetFlow.entry_count || 0} ledger entries for this period.
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Audit Log ── */}
        {activeTab === "audit-log" && (
          <div className="space-y-4">
            {logsLoading ? (
              <div className="text-white/40">Loading audit logs…</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-white/40">No audit log entries found for this channel.</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-left text-xs uppercase tracking-wider text-white/40">
                      <th className="px-4 py-3">Timestamp</th>
                      <th className="px-4 py-3">Admin</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">{fmtDate(log.timestamp)}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-white/80">{log.performedBy_name || "Unknown"}</div>
                          {log.performedBy_email && <div className="text-xs text-white/40">{log.performedBy_email}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-lg bg-white/5 px-2 py-1 text-xs font-mono text-white/70">{log.action}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/50">
                          {log.meta && Object.keys(log.meta).length > 0
                            ? JSON.stringify(log.meta).slice(0, 120)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Ban Dialog */}
      <ConfirmDialog
        open={banDialog.open}
        title="Ban Channel"
        message="Are you sure you want to ban this channel? It will be hidden from all public listings."
        confirmLabel="Ban Channel"
        busy={actionLoading}
        onConfirm={handleBan}
        onCancel={() => setBanDialog({ open: false })}
      />

      {/* Unban Dialog */}
      <ConfirmDialog
        open={unbanDialog.open}
        title="Unban Channel"
        message="Are you sure you want to unban this channel? It will be visible again."
        confirmLabel="Unban Channel"
        busy={actionLoading}
        onConfirm={handleUnban}
        onCancel={() => setUnbanDialog({ open: false })}
      />
    </div>
  );
}
