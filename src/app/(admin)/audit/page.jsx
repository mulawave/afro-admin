"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [nextBefore, setNextBefore] = useState(null);
  // Every action name seen so far, so the filter list doesn't shrink when filtering.
  const [knownActions, setKnownActions] = useState([]);

  // Server-side paging: newest first, 50 per page, action filter applied by the backend.
  const fetchPage = useCallback(async (before) => {
    const qs = new URLSearchParams({ limit: "50" });
    if (filterAction) qs.set("action", filterAction);
    if (before) qs.set("before", String(before));
    return api.get(`/admin/audit?${qs.toString()}`);
  }, [filterAction]);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPage(null);
      setLogs(res.logs ?? []);
      setNextBefore(res.nextBefore ?? null);
      setKnownActions((prev) => [...new Set([...prev, ...(res.logs ?? []).map((l) => l.action).filter(Boolean)])].sort());
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadOlder = useCallback(async () => {
    if (!nextBefore) return;
    try {
      setLoadingMore(true);
      const res = await fetchPage(nextBefore);
      setLogs((prev) => [...prev, ...(res.logs ?? [])]);
      setNextBefore(res.nextBefore ?? null);
      setKnownActions((prev) => [...new Set([...prev, ...(res.logs ?? []).map((l) => l.action).filter(Boolean)])].sort());
    } catch (err) {
      setError(err.message || "Failed to load older audit logs");
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, nextBefore]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actions = knownActions.includes(filterAction) || !filterAction ? knownActions : [...knownActions, filterAction];

  // Text search narrows the entries already loaded (use "Load older" to search further back).
  const filtered = logs.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return buildSearchText(l).includes(q);
  });

  const columns = [
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-mono font-medium text-white/82">
          {row.action}
        </span>
      ),
    },
    {
      key: "admin",
      label: "Admin",
      render: (row) => <EntityCell entity={row.admin} fallback={row.admin_uid} />,
    },
    {
      key: "target",
      label: "Target",
      render: (row) => <EntityCell entity={row.target} fallback={row.target_id} />,
    },
    {
      key: "meta",
      label: "Details",
      render: (row) => <AuditMetaCell meta={row.meta} />,
    },
    {
      key: "created_at",
      label: "Date",
      render: (row) => (
        <span className="whitespace-nowrap text-xs text-white/55">
          {row.timestamp ? new Date(row.timestamp).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Audit Logs</h1>
          <p className="mt-2 text-sm text-white/58">Immutable records for sensitive operator actions across the platform.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
          {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"} loaded{nextBefore ? " · more available" : ""}
        </span>
      </div>

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl md:flex-row">
        <input
          type="text"
          placeholder="Search loaded entries by action, admin, or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white outline-none"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadLogs} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && !error && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No audit logs found" defaultPageSize={25} />
      )}

      {!loading && !error && nextBefore ? (
        <div className="flex justify-center">
          <button
            onClick={loadOlder}
            disabled={loadingMore}
            className="rounded-2xl border border-white/10 bg-white/6 px-5 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 disabled:opacity-40"
          >
            {loadingMore ? "Loading..." : "Load older entries"}
          </button>
        </div>
      ) : null}

      <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
        Audit logs are immutable. Every admin action is recorded automatically.
      </div>
    </div>
  );
}

function buildSearchText(log) {
  return [
    log.action,
    log.admin?.display_name,
    log.admin?.email,
    log.admin_uid,
    log.target?.display_name,
    log.target?.owner_display_name,
    log.target?.id,
    log.target_id,
    JSON.stringify(log.meta || {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function EntityCell({ entity, fallback }) {
  const displayName = entity?.display_name || fallback || "—";
  const secondary = entity?.email || entity?.owner_display_name || entity?.id || null;

  return (
    <div className="space-y-0.5">
      <p className="font-medium text-white">{displayName}</p>
      <p className="text-xs text-white/42">{secondary && secondary !== displayName ? secondary : "—"}</p>
    </div>
  );
}

function AuditMetaCell({ meta }) {
  const entries = Object.entries(meta || {}).filter(([, value]) => value !== undefined && value !== null && value !== "");

  if (!entries.length) {
    return <span className="text-white/38">—</span>;
  }

  return (
    <div className="max-w-sm space-y-1">
      {entries.slice(0, 4).map(([key, value]) => (
        <div key={key} className="flex items-start justify-between gap-3 text-xs">
          <span className="text-white/42">{formatMetaKey(key)}</span>
          <span className="max-w-[12rem] text-right text-white/72">{formatMetaValue(value)}</span>
        </div>
      ))}
      {entries.length > 4 ? <p className="text-[11px] text-white/36">+{entries.length - 4} more fields</p> : null}
    </div>
  );
}

function formatMetaKey(key) {
  return key.replace(/_details$/, "").replace(/_/g, " ");
}

function formatMetaValue(value) {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString("en-NG");
  if (typeof value === "string") return value;

  if (value && typeof value === "object") {
    return value.display_name || value.email || value.label || value.id || JSON.stringify(value);
  }

  return "—";
}
