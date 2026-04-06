"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function BatchesPage() {
  const [stats, setStats] = useState(null);
  const [batches, setBatches] = useState([]);
  const [failedBatches, setFailedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, batchesRes, failedRes] = await Promise.all([
        api.get("/vpt/admin/stats"),
        api.get("/vpt/admin/batches"),
        api.get("/vpt/admin/batches/failed"),
      ]);

      setStats(statsRes.stats ?? null);
      setBatches(batchesRes.batches ?? []);
      setFailedBatches(failedRes.batches ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load batch operations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function requestProcessBatch() {
    setConfirm({
      title: "Process Distribution Batch",
      message: "Run the distribution engine now against the current queue?",
      busy: false,
      error: null,
      confirmLabel: "Process Batch",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          const res = await api.post("/vpt/admin/process-batch", {});
          setFeedback({
            tone: "success",
            message: res.result?.message || `Processed batch ${res.result?.batch_id || "successfully"}.`,
          });
          await load();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to process batch" }));
          return false;
        }
      },
    });
  }

  function requestRetry(batch) {
    setConfirm({
      title: "Retry Failed Batch",
      message: `Retry batch ${batch.id}? Retry count: ${batch.retry_count || 0}.`,
      busy: false,
      error: null,
      confirmLabel: "Retry Batch",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          const res = await api.post(`/vpt/admin/batches/${batch.id}/retry`, {});
          setFeedback({
            tone: "success",
            message: `Retry started for batch ${res.result?.batch_id || batch.id}.`,
          });
          await load();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to retry batch" }));
          return false;
        }
      },
    });
  }

  const columns = [
    { key: "id", label: "Batch", render: (row) => <span className="font-mono text-xs text-white/75">{row.id}</span> },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "item_count", label: "Items" },
    { key: "total_ngn", label: "NGN", render: (row) => `NGN ${Number(row.total_ngn || 0).toLocaleString("en-NG")}` },
    { key: "retry_count", label: "Retries" },
    { key: "created_at", label: "Created", render: (row) => formatDate(row.created_at) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        row.status === "failed" ? (
          <button onClick={() => requestRetry(row)} className="text-sm font-medium text-amber-300 hover:text-amber-200">
            Retry
          </button>
        ) : <span className="text-xs text-white/35">No action</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Batch Operations</h1>
          <p className="mt-2 text-sm text-white/58">Monitor the conversion queue, inspect batch history, and trigger or retry distribution runs.</p>
        </div>
        <button
          onClick={requestProcessBatch}
          className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
        >
          Process Queue Now
        </button>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />
      <NoticeBanner tone="error" message={error} actionLabel="Retry" onAction={load} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Queue Pending" value={stats?.queue?.pending} />
            <MetricCard label="Queue Failed" value={stats?.queue?.failed} tone="warn" />
            <MetricCard label="Batch Failed" value={stats?.batches?.failed} tone="warn" />
            <MetricCard label="Distributed" value={stats?.batches?.distributed} tone="success" />
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Failed Batches</h2>
              <span className="text-sm text-white/45">{failedBatches.length} batch{failedBatches.length !== 1 ? "es" : ""}</span>
            </div>
            <DataTable columns={columns} rows={failedBatches} emptyMessage="No failed batches" />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Recent Batch History</h2>
              <span className="text-sm text-white/45">{batches.length} recent batch{batches.length !== 1 ? "es" : ""}</span>
            </div>
            <DataTable columns={columns} rows={batches} emptyMessage="No batches processed yet" />
          </section>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        busy={confirm?.busy}
        error={confirm?.error}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) {
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}

function MetricCard({ label, value, tone = "default" }) {
  const tones = {
    default: "border-white/10 bg-white/[0.04]",
    warn: "border-amber-400/20 bg-amber-500/10",
    success: "border-emerald-400/20 bg-emerald-500/10",
  };

  return (
    <div className={`rounded-[1.5rem] border p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] ${tones[tone] || tones.default}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{Number(value || 0).toLocaleString("en-NG")}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}