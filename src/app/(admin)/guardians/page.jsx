"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const GUARDIAN_STATUSES = ["pending", "verified", "rejected"];
const STATUS_COLORS = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  verified: "bg-green-500/15 text-green-300 border-green-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
};
const RELATIONSHIP_LABELS = {
  parent: "Parent",
  legal_guardian: "Legal Guardian",
  sibling: "Sibling",
  relative: "Relative",
  other: "Other",
};
const ID_LABELS = {
  national_id: "National ID",
  international_passport: "Int'l Passport",
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
  nin_slip: "NIN Slip",
  residence_permit: "Residence Permit",
};

export default function GuardiansPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter ? `/guardian/admin/list?status=${filter}` : "/guardian/admin/list";
      const res = await api.get(url);
      setRecords(res.items ?? res.records ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load guardian records");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function requestReview(record, decision) {
    const isReject = decision === "rejected";
    setConfirm({
      title: isReject ? "Reject Guardian Consent" : "Approve Guardian Consent",
      message: `${isReject ? "Reject" : "Approve"} guardian consent from ${record.guardian_full_name} for minor user ${record.minor_user_id}?`,
      confirmLabel: isReject ? "Reject" : "Approve",
      destructive: isReject,
      rejectReason: isReject,
      action: async (reason) => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          const body = { decision };
          if (reason) body.rejection_reason = reason;
          await api.patch(`/guardian/admin/${record.id}/review`, body);
          setFeedback({ tone: "success", message: `Guardian consent ${decision}` });
          await loadRecords();
          if (selected?.id === record.id) setSelected((p) => ({ ...p, status: decision }));
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  function requestDelete(record) {
    setConfirm({
      title: "Delete Guardian Record",
      message: `Permanently delete guardian record for ${record.guardian_full_name}? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.delete(`/guardian/admin/${record.id}`);
          setFeedback({ tone: "success", message: "Guardian record deleted" });
          await loadRecords();
          if (selected?.id === record.id) setSelected(null);
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  const filtered = records.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.guardian_full_name || "").toLowerCase().includes(q) ||
      (r.guardian_email || "").toLowerCase().includes(q) ||
      (r.minor_user_id || "").toLowerCase().includes(q) ||
      (r.guardian_phone || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "guardian",
      label: "Guardian",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.guardian_full_name || "—"}</div>
          <div className="text-xs text-white/45">{row.guardian_email}</div>
        </div>
      ),
    },
    {
      key: "minor_user_id",
      label: "Minor User ID",
      render: (row) => <span className="text-xs text-white/70">{row.minor_user_id}</span>,
    },
    {
      key: "relationship",
      label: "Relationship",
      render: (row) => <span className="text-sm text-white/70">{RELATIONSHIP_LABELS[row.guardian_relationship] || row.guardian_relationship || "—"}</span>,
    },
    {
      key: "verification_method",
      label: "Method",
      render: (row) => (
        <span className="text-xs text-white/60">
          {row.guardian_account_uid ? "Linked Account" : "ID Documents"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] || STATUS_COLORS.pending}`}>
          {row.status || "pending"}
        </span>
      ),
    },
    {
      key: "submitted_at",
      label: "Submitted",
      render: (row) => (
        <span className="text-xs text-white/60">
          {row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelected(row)} className="text-sm font-medium text-sky-300 hover:text-sky-200">Review</button>
          {row.status === "pending" && (
            <>
              <button onClick={() => requestReview(row, "verified")} className="text-sm font-medium text-green-300 hover:text-green-200">Approve</button>
              <button onClick={() => requestReview(row, "rejected")} className="text-sm font-medium text-red-300 hover:text-red-200">Reject</button>
            </>
          )}
          <button onClick={() => requestDelete(row)} className="text-sm font-medium text-red-300/60 hover:text-red-200">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Guardian Consent</h1>
          <p className="mt-2 text-sm text-white/58">Review guardian consent forms for minor users, approve or reject submissions.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">{filtered.length} records</span>
      </div>

      {/* Search + Filters */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by guardian name, email, phone, or minor user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("")}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                !filter ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]" : "border-white/10 bg-white/4 text-white/50 hover:text-white"
              }`}
            >
              All
            </button>
            {GUARDIAN_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                  filter === s ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]" : "border-white/10 bg-white/4 text-white/50 hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {feedback && !loading && (
        <div className={`rounded-[1.5rem] px-4 py-3 text-sm ${
          feedback.tone === "success"
            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border border-red-400/30 bg-red-500/10 text-red-200"
        }`}>
          {feedback.message}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={() => loadRecords()} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No guardian records found" />
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Guardian Review: {selected.guardian_full_name}</h2>
            <button onClick={() => setSelected(null)} className="text-sm text-white/50 hover:text-white">Close ✕</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Guardian Name" value={selected.guardian_full_name} />
            <Field label="Email" value={selected.guardian_email} />
            <Field label="Phone" value={selected.guardian_phone} />
            <Field label="Relationship" value={RELATIONSHIP_LABELS[selected.guardian_relationship] || selected.guardian_relationship} />
            <Field label="Address" value={selected.guardian_address} />
            <Field label="Status" value={selected.status} />
            <Field label="Minor User ID" value={selected.minor_user_id} />
            <Field label="Verification Method" value={selected.guardian_account_uid ? "Linked Account" : "ID Documents"} />
            {selected.guardian_account_uid && (
              <Field label="Linked Account UID" value={selected.guardian_account_uid} />
            )}
            {!selected.guardian_account_uid && (
              <>
                <Field label="ID Type" value={ID_LABELS[selected.guardian_id_type] || selected.guardian_id_type} />
                <Field label="ID Number" value={selected.guardian_id_number} />
              </>
            )}
            <Field label="Consent Signature" value={selected.consent_signature} />
            <Field label="Consent Date" value={selected.consent_date ? new Date(selected.consent_date).toLocaleString() : "—"} />
            <Field label="Submitted" value={selected.created_at ? new Date(selected.created_at).toLocaleString() : "—"} />
            <Field label="Reviewed By" value={selected.reviewer_id || "—"} />
            <Field label="Reviewed At" value={selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleString() : "—"} />
            {selected.rejection_reason && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Rejection Reason" value={selected.rejection_reason} />
              </div>
            )}
          </div>

          {/* Document Images */}
          {!selected.guardian_account_uid && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selected.guardian_id_front_url && (
                <div>
                  <label className="mb-2 block text-xs text-white/50">Guardian ID Front</label>
                  <a href={selected.guardian_id_front_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 overflow-hidden hover:border-sky-400/30 transition">
                    <img src={selected.guardian_id_front_url} alt="ID Front" className="w-full h-40 object-cover" />
                  </a>
                </div>
              )}
              {selected.guardian_id_back_url && (
                <div>
                  <label className="mb-2 block text-xs text-white/50">Guardian ID Back</label>
                  <a href={selected.guardian_id_back_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 overflow-hidden hover:border-sky-400/30 transition">
                    <img src={selected.guardian_id_back_url} alt="ID Back" className="w-full h-40 object-cover" />
                  </a>
                </div>
              )}
              {selected.guardian_selfie_url && (
                <div>
                  <label className="mb-2 block text-xs text-white/50">Guardian Selfie</label>
                  <a href={selected.guardian_selfie_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-white/10 overflow-hidden hover:border-sky-400/30 transition">
                    <img src={selected.guardian_selfie_url} alt="Selfie" className="w-full h-40 object-cover" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {selected.status === "pending" && (
              <>
                <button onClick={() => requestReview(selected, "verified")} className="rounded-xl border border-green-400/30 bg-green-500/10 px-5 py-2 text-sm font-medium text-green-200 transition hover:bg-green-500/20">
                  ✓ Approve Consent
                </button>
                <button onClick={() => requestReview(selected, "rejected")} className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20">
                  ✕ Reject
                </button>
              </>
            )}
            <button onClick={() => requestDelete(selected)} className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-300/60 transition hover:bg-red-500/20 hover:text-red-200">
              Delete Record
            </button>
          </div>
        </div>
      )}

      {/* Confirm */}
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
          const shouldClose = await confirm.action();
          if (shouldClose !== false) setConfirm(null);
        }}
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/50">{label}</label>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}
