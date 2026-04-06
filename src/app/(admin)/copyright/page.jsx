"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const STATUSES = ["pending", "reviewing", "resolved", "dismissed"];
const STATUS_COLORS = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  reviewing: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  resolved: "bg-green-500/15 text-green-300 border-green-500/30",
  dismissed: "bg-white/8 text-white/50 border-white/10",
};

export default function CopyrightReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter ? `/copyright/reports?status=${filter}` : "/copyright/reports";
      const res = await api.get(url);
      setReports(res.reports ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load copyright reports");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  function requestStatusChange(trackingId, newStatus) {
    setConfirm({
      title: "Update Report Status",
      message: `Change report ${trackingId} status to "${newStatus}"?`,
      destructive: newStatus === "dismissed",
      action: async () => {
        setSaving(trackingId);
        try {
          await api.patch(`/copyright/reports/${trackingId}`, { status: newStatus });
          await load();
          if (selected?.trackingId === trackingId) {
            setSelected((prev) => ({ ...prev, status: newStatus }));
          }
        } catch {
          // handled by api
        } finally {
          setSaving(null);
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Copyright Reports</h1>
          <p className="mt-2 text-sm text-white/58">
            Manage copyright infringement reports submitted by rights holders.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
          {reports.length} report{reports.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            !filter
              ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
              : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
          }`}
        >
          All
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
              filter === s
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {reports.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          No copyright reports{filter ? ` with status "${filter}"` : ""}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="divide-y divide-white/6">
            {reports.map((report) => (
              <div
                key={report.trackingId}
                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-white/3 lg:flex-row lg:items-center lg:justify-between cursor-pointer"
                onClick={() => setSelected(selected?.trackingId === report.trackingId ? null : report)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-[var(--av-light-orange)]">
                      {report.trackingId}
                    </span>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_COLORS[report.status] || STATUS_COLORS.pending}`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-white/75">{report.fullName} — {report.email}</div>
                  <div className="mt-1 text-xs text-white/40 line-clamp-1">{report.copyrightWorkDescription}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/40 lg:ml-4">
                  {new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="border-b border-white/8 px-5 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Report: {selected.trackingId}</h2>
            <button onClick={() => setSelected(null)} className="text-xs text-white/40 hover:text-white">Close ×</button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <DetailRow label="Reporter" value={`${selected.fullName} (${selected.email})`} />
            {selected.phone && <DetailRow label="Phone" value={selected.phone} />}
            {selected.address && <DetailRow label="Address" value={selected.address} />}
            <DetailRow label="Copyrighted Work" value={selected.copyrightWorkDescription} />
            {selected.copyrightWorkUrl && (
              <DetailRow label="Original Work URL" value={selected.copyrightWorkUrl} link />
            )}
            <DetailRow label="Infringing Content URLs" value={selected.infringingContentUrls} />
            {selected.infringingContentDescription && (
              <DetailRow label="Additional Description" value={selected.infringingContentDescription} />
            )}
            <DetailRow label="Signature" value={selected.signature} />
            <DetailRow label="Submitted" value={new Date(selected.createdAt).toLocaleString()} />
            <DetailRow label="Last Updated" value={new Date(selected.updatedAt).toLocaleString()} />
            {selected.adminNotes && <DetailRow label="Admin Notes" value={selected.adminNotes} />}

            <div className="flex items-center gap-2 pt-2 border-t border-white/8">
              <span className="text-xs font-medium text-white/50 mr-2">Update Status:</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  disabled={selected.status === s || saving === selected.trackingId}
                  onClick={() => requestStatusChange(selected.trackingId, s)}
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition disabled:opacity-30 ${
                    STATUS_COLORS[s]
                  } hover:brightness-125`}
                >
                  {saving === selected.trackingId ? "..." : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />
    </div>
  );
}

function DetailRow({ label, value, link }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-4">
      <span className="text-xs font-semibold text-white/45 min-w-[140px]">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--av-light-orange)] hover:underline break-all">
          {value}
        </a>
      ) : (
        <span className="text-sm text-white/78 whitespace-pre-wrap break-all">{value}</span>
      )}
    </div>
  );
}
