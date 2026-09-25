"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";

function formatNgn(amount) {
  return `₦${(Number(amount) || 0).toLocaleString("en-NG")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ENTRY_TYPE_LABELS = {
  license_fee: "License Fee",
  activation_revenue: "Activation Revenue",
  payment: "Payment",
};

const ENTRY_TYPE_COLORS = {
  license_fee: "border border-sky-400/30 bg-sky-500/10 text-sky-200",
  activation_revenue: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  payment: "border border-amber-400/30 bg-amber-500/10 text-amber-200",
};

export default function LedgerTab({ onFeedback }) {
  const [entries, setEntries] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterDistributor, setFilterDistributor] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [ledRes, distRes] = await Promise.all([
        api.get("/distribution/admin/ledger"),
        api.get("/distribution/admin/distributors"),
      ]);
      setEntries(ledRes.entries || []);
      setDistributors(distRes.distributors || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const distributorMap = {};
  for (const d of distributors) {
    distributorMap[d.id] = d.company_name || d.email;
  }

  const filtered = entries.filter((e) => {
    if (filterType && e.type !== filterType) return false;
    if (filterDistributor && e.distributor_id !== filterDistributor) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (e.code || "").toLowerCase().includes(q) ||
      (e.device_id || "").toLowerCase().includes(q) ||
      (distributorMap[e.distributor_id] || "").toLowerCase().includes(q)
    );
  });

  const totalRevenue = filtered
    .filter((e) => e.type === "activation_revenue")
    .reduce((sum, e) => sum + (Number(e.amount_ngn) || 0), 0);
  const totalAfrovision = filtered
    .filter((e) => e.type === "activation_revenue")
    .reduce((sum, e) => sum + (Number(e.afrovision_share_ngn) || 0), 0);
  const totalPayments = filtered
    .filter((e) => e.type === "payment")
    .reduce((sum, e) => sum + (Number(e.amount_ngn) || 0), 0);

  const columns = [
    {
      key: "date",
      label: "Date",
      render: (row) => <span className="text-xs text-white/50">{formatDate(row.created_at)}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ENTRY_TYPE_COLORS[row.type] || "border border-white/10 bg-white/5 text-white/70"}`}>
          {ENTRY_TYPE_LABELS[row.type] || row.type}
        </span>
      ),
    },
    {
      key: "distributor",
      label: "Distributor",
      render: (row) => (
        <span className="text-sm text-white/70">{distributorMap[row.distributor_id] || "—"}</span>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => (
        <span className="font-mono text-sm text-white">{formatNgn(row.amount_ngn)}</span>
      ),
    },
    {
      key: "afrovision_share",
      label: "AfroVision Share",
      render: (row) => row.afrovision_share_ngn != null ? (
        <span className="font-mono text-sm text-emerald-300">{formatNgn(row.afrovision_share_ngn)}</span>
      ) : <span className="text-xs text-white/30">—</span>,
    },
    {
      key: "distributor_share",
      label: "Distributor Share",
      render: (row) => row.distributor_share_ngn != null ? (
        <span className="font-mono text-sm text-sky-300">{formatNgn(row.distributor_share_ngn)}</span>
      ) : <span className="text-xs text-white/30">—</span>,
    },
    {
      key: "code",
      label: "Code",
      render: (row) => <span className="font-mono text-xs text-white/50">{row.code || "—"}</span>,
    },
    {
      key: "device",
      label: "Device",
      render: (row) => (
        <span className="block max-w-[140px] truncate font-mono text-xs text-white/40">{row.device_id || "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Total Revenue" value={formatNgn(totalRevenue)} tone="neutral" />
        <SummaryCard label="AfroVision Share" value={formatNgn(totalAfrovision)} tone="green" />
        <SummaryCard label="Payments Received" value={formatNgn(totalPayments)} tone="amber" />
      </div>

      {/* Filters */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by code, device, or distributor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All Types</option>
            <option value="activation_revenue">Activation Revenue</option>
            <option value="license_fee">License Fee</option>
            <option value="payment">Payment</option>
          </select>
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
        <DataTable columns={columns} rows={filtered} emptyMessage="No ledger entries found" defaultPageSize={25} storageKey="distribution-ledger" />
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone }) {
  const toneClass = tone === "green"
    ? "border-emerald-400/30 text-emerald-200"
    : tone === "amber"
    ? "border-amber-400/30 text-amber-200"
    : "border-white/10 text-white";
  return (
    <div className={`rounded-[1.5rem] border ${toneClass} bg-white/4 p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] backdrop-blur-xl`}>
      <p className="text-xs uppercase tracking-[0.22em] text-white/45">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone === "green" ? "text-emerald-200" : tone === "amber" ? "text-amber-200" : "text-white"}`}>{value}</p>
    </div>
  );
}
