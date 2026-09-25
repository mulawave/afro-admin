"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import LedgerTable from "@/components/users/LedgerTable";

export default function LedgerPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [type, setType] = useState("");
  const [typeInput, setTypeInput] = useState("");
  const [nextBefore, setNextBefore] = useState(null);
  // Types seen in loaded entries, offered as suggestions; any type can be typed.
  const [seenTypes, setSeenTypes] = useState([]);

  // Server-side paging: newest first, 50 per page; type filter applied by the backend.
  const fetchPage = useCallback(async (before) => {
    const qs = new URLSearchParams({ limit: "50" });
    if (type) qs.set("type", type);
    if (before) qs.set("before", String(before));
    return api.get(`/vpt/admin/ledger?${qs.toString()}`);
  }, [type]);

  const remember = (rows) => setSeenTypes((prev) => [...new Set([...prev, ...rows.map((r) => r.type).filter(Boolean)])].sort());

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPage(null);
      setData(res.ledger ?? []);
      setNextBefore(res.nextBefore ?? null);
      remember(res.ledger ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load ledger");
    } finally {
      setLoading(false);
    }
  }, [fetchPage]);

  const loadOlder = useCallback(async () => {
    if (!nextBefore) return;
    try {
      setLoadingMore(true);
      const res = await fetchPage(nextBefore);
      setData((prev) => [...prev, ...(res.ledger ?? [])]);
      setNextBefore(res.nextBefore ?? null);
      remember(res.ledger ?? []);
    } catch (err) {
      setError(err.message || "Failed to load older entries");
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, nextBefore]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-white">Global Ledger</h1>
          <p className="mt-2 text-sm text-white/58">Inspect system-wide financial events, distributions, and administrative funding actions.</p>
        </div>
        <div className="flex items-center gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setType(typeInput.trim().toUpperCase());
            }}
            className="flex items-center gap-2"
          >
            <input
              list="ledger-types"
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              placeholder="Filter by type (all)"
              className="w-56 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35"
            />
            <datalist id="ledger-types">
              {seenTypes.map((t) => <option key={t} value={t} />)}
            </datalist>
            <button type="submit" className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/80 hover:bg-white/10">Apply</button>
            {type ? (
              <button type="button" onClick={() => { setType(""); setTypeInput(""); }} className="text-xs text-white/55 underline">Clear</button>
            ) : null}
          </form>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {data.length} loaded{nextBefore ? " · more available" : ""}
          </span>
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
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <LedgerTable data={data} showUser hideTypeFilter />
        </div>
      )}

      {!loading && nextBefore ? (
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
    </div>
  );
}
