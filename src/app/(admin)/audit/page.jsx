"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/audit");
      setLogs(Array.isArray(res) ? res : res.data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const actions = [...new Set(logs.map((l) => l.action).filter(Boolean))];

  const filtered = logs.filter((l) => {
    if (filterAction && l.action !== filterAction) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (l.action && l.action.toLowerCase().includes(q)) ||
      (l.performed_by && l.performed_by.toLowerCase().includes(q)) ||
      (l.target_id && l.target_id.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-mono font-medium bg-gray-100 text-gray-800">
          {row.action}
        </span>
      ),
    },
    { key: "performed_by", label: "Admin" },
    { key: "target_id", label: "Target" },
    {
      key: "meta",
      label: "Details",
      render: (row) =>
        row.meta && Object.keys(row.meta).length > 0 ? (
          <span className="text-xs text-gray-500 font-mono truncate max-w-xs block">
            {JSON.stringify(row.meta)}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "created_at",
      label: "Date",
      render: (row) => (
        <span className="text-xs text-gray-500 whitespace-nowrap">
          {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <span className="text-sm text-gray-500">
          {filtered.length} entr{filtered.length !== 1 ? "ies" : "y"}
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search by action, admin, or target..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Actions</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadLogs} className="ml-3 underline">Retry</button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage="No audit logs found"
          />
        </div>
      )}

      {/* Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
        Audit logs are immutable. Every admin action is recorded automatically.
      </div>
    </div>
  );
}
