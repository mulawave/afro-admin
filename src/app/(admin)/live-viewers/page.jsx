"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { getLiveOverview } from "@/services/liveViewers";
import StatCard from "@/components/dashboard/StatCard";
import DataTable from "@/components/ui/DataTable";

const REFRESH_INTERVAL_MS = 15000;

function LiveBadge({ isLive }) {
  if (!isLive) {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-medium text-white/45">
        Offline
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      Live
    </span>
  );
}

function ChannelCell({ row }) {
  return (
    <div className="flex items-center gap-3">
      {row.logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.logo_url}
          alt={row.name || "Channel"}
          className="h-8 w-8 rounded-full border border-white/10 object-cover"
        />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/6 text-xs font-semibold text-white/50">
          {(row.name || "?").slice(0, 1).toUpperCase()}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white/88">{row.name || "Untitled channel"}</p>
        <p className="truncate text-xs text-white/42">{row.owner_display_name}</p>
      </div>
    </div>
  );
}

export default function LiveViewersPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await getLiveOverview();
      setData(res);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Failed to load live viewers overview");
    }
  }, []);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const filteredChannels = useMemo(() => {
    if (!data?.channels) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.channels;
    return data.channels.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.owner_display_name || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = [
    { key: "name", label: "Channel", render: (row) => <ChannelCell row={row} /> },
    { key: "is_live", label: "Status", render: (row) => <LiveBadge isLive={row.is_live} /> },
    {
      key: "current_viewers",
      label: "Live Viewers",
      render: (row) => <span className="font-semibold text-white">{row.current_viewers.toLocaleString("en-NG")}</span>,
    },
    { key: "peak_viewers", label: "Peak", render: (row) => row.peak_viewers.toLocaleString("en-NG") },
    { key: "total_views", label: "Total Views", render: (row) => row.total_views.toLocaleString("en-NG") },
    { key: "followers_count", label: "Followers", render: (row) => row.followers_count.toLocaleString("en-NG") },
    {
      key: "total_watch_hours",
      label: "Hours Watched",
      render: (row) => row.total_watch_hours.toLocaleString("en-NG", { maximumFractionDigits: 1 }),
    },
    { key: "category", label: "Category", render: (row) => row.category || "—" },
  ];

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="mb-2 text-lg text-red-200">Failed to load live viewers</p>
          <p className="mb-4 text-sm text-white/48">{error}</p>
          <button
            onClick={fetchOverview}
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
          <p className="text-white/48">Loading live viewers...</p>
        </div>
      </div>
    );
  }

  const { summary, top_performers: topPerformers } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Channel Viewers</h1>
          <p className="mt-1 text-sm text-white/48">
            Real-time overview across all channels.{" "}
            {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={fetchOverview}
          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition-colors hover:bg-white/10"
        >
          Refresh now
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Current Viewers" value={summary.total_current_viewers} accent="green" hint="Right now" />
        <StatCard title="Channels Live" value={summary.total_channels_live} accent="green" hint={`of ${summary.total_channels} total`} />
        <StatCard title="All-Time Views" value={summary.total_all_time_views} accent="blue" hint="Across all channels" />
        <StatCard title="Total Followers" value={summary.total_followers} accent="purple" hint="Across all channels" />
        <StatCard title="Hours Watched" value={summary.total_watch_hours} accent="amber" hint="Lifetime watch time" />
      </div>

      {topPerformers?.length > 0 && (
        <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Top Performers</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {topPerformers.slice(0, 5).map((row, idx) => (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--av-orange)]/20 text-xs font-bold text-[var(--av-light-orange)]">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/88">{row.name || "Untitled"}</p>
                  <p className="text-xs text-white/48">
                    {row.current_viewers.toLocaleString("en-NG")} watching now
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channel, owner, or category..."
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50 focus:outline-none"
        />
      </div>

      <DataTable
        columns={columns}
        rows={filteredChannels}
        emptyMessage="No channels found"
        defaultPageSize={20}
        storageKey="live-viewers-table"
      />
    </div>
  );
}
