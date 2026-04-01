"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import LedgerTable from "@/components/users/LedgerTable";

export default function LedgerPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/ledger");
      setData(Array.isArray(res) ? res : res.data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Global Ledger</h1>
        <span className="text-sm text-gray-500">{data.length} entries</span>
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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <LedgerTable data={data} showUser />
        </div>
      )}
    </div>
  );
}
