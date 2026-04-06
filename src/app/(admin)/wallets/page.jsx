"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";

export default function WalletsPage() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/wallets");
      setWallets(res.wallets ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = wallets.filter((w) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (w.uid && w.uid.toLowerCase().includes(q)) ||
      (w.email && w.email.toLowerCase().includes(q))
    );
  });

  const columns = [
    { key: "email", label: "User", render: (row) => row.email || row.uid },
    {
      key: "ngn_balance",
      label: "NGN Balance",
      render: (row) => (
        <span className="font-mono">
          ₦{typeof row.ngn_balance === "number" ? row.ngn_balance.toLocaleString("en-NG") : "—"}
        </span>
      ),
    },
    {
      key: "vpt_units",
      label: "vPT Units",
      render: (row) => (
        <span className="font-mono">
          {typeof row.vpt_units === "number" ? row.vpt_units.toLocaleString("en-NG") : "—"}
        </span>
      ),
    },
    {
      key: "updated_at",
      label: "Last Updated",
      render: (row) =>
        row.updated_at ? new Date(row.updated_at).toLocaleDateString() : "—",
    },
    {
      key: "bsc_address",
      label: "BSC Address",
      render: (row) => (
        <span className="block max-w-[220px] truncate font-mono text-xs text-white/60">
          {row.bsc_address || "Not created"}
        </span>
      ),
    },
    {
      key: "wallet_status",
      label: "Wallet",
      render: (row) => row.wallet_status || "not_created",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Wallets</h1>
          <p className="mt-2 text-sm text-white/58">Review custodial balances and blockchain wallet creation status across all users.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">{filtered.length} wallets</span>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <input
          type="text"
          placeholder="Search by email or UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
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
        <DataTable columns={columns} rows={filtered} emptyMessage="No wallets found" />
      )}
    </div>
  );
}
