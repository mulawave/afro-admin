"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MarketersTab({ onFeedback }) {
  const [marketers, setMarketers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDistributor, setFilterDistributor] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [mkRes, distRes] = await Promise.all([
        api.get("/distribution/admin/marketers"),
        api.get("/distribution/admin/distributors"),
      ]);
      setMarketers(mkRes.marketers || []);
      setDistributors(distRes.distributors || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load marketers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const distributorMap = {};
  for (const d of distributors) {
    distributorMap[d.id] = d.company_name || d.email;
  }

  const filtered = marketers.filter((m) => {
    if (filterDistributor && m.distributor_id !== filterDistributor) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (m.name || "").toLowerCase().includes(q) ||
      (m.username || "").toLowerCase().includes(q) ||
      (m.phone || "").toLowerCase().includes(q)
    );
  });

  function toggleStatus(marketer) {
    const newStatus = marketer.status === "active" ? "disabled" : "active";
    setConfirm({
      title: newStatus === "disabled" ? "Disable Marketer" : "Enable Marketer",
      message: `${newStatus === "disabled" ? "Disable" : "Enable"} marketer "${marketer.name}"?`,
      confirmLabel: newStatus === "disabled" ? "Disable" : "Enable",
      destructive: newStatus === "disabled",
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.patch(`/distribution/admin/marketers/${marketer.id}`, { status: newStatus });
          onFeedback("success", `Marketer ${newStatus === "disabled" ? "disabled" : "enabled"}`);
          await load();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.name}</div>
          <div className="text-xs text-white/45">@{row.username}</div>
        </div>
      ),
    },
    {
      key: "distributor",
      label: "Distributor",
      render: (row) => (
        <span className="text-sm text-white/70">{distributorMap[row.distributor_id] || "—"}</span>
      ),
    },
    { key: "phone", label: "Phone", render: (row) => <span className="text-sm text-white/60">{row.phone || "—"}</span> },
    {
      key: "codes_requested",
      label: "Codes Requested",
      render: (row) => <span className="font-mono text-sm text-white/70">{row.codes_requested || 0}</span>,
    },
    {
      key: "activation_count",
      label: "Activations",
      render: (row) => <span className="font-mono text-sm text-white/70">{row.activation_count || 0}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => <span className="text-xs text-white/50">{formatDate(row.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => toggleStatus(row)}
          className={`text-sm font-medium ${row.status === "active" ? "text-red-300/60 hover:text-red-200" : "text-emerald-300 hover:text-emerald-200"}`}
        >
          {row.status === "active" ? "Disable" : "Enable"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, username, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          <select
            value={filterDistributor}
            onChange={(e) => setFilterDistributor(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All Distributors</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>{d.company_name}</option>
            ))}
          </select>
        </div>
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

      {!loading && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No marketers found" storageKey="distribution-marketers" />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        busy={confirm?.busy}
        error={confirm?.error}
        destructive={confirm?.destructive}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) { setConfirm(null); return; }
          const ok = await confirm.action();
          if (ok !== false) setConfirm(null);
        }}
      />
    </div>
  );
}
