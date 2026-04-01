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
      setWallets(Array.isArray(res) ? res : res.data ?? []);
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
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Wallets</h1>
        <span className="text-sm text-gray-500">{filtered.length} wallets</span>
      </div>

      <div>
        <input
          type="text"
          placeholder="Search by email or UID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <DataTable columns={columns} rows={filtered} emptyMessage="No wallets found" />
        </div>
      )}
    </div>
  );
}
