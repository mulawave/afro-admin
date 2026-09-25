"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const KYC_STATUSES = ["pending", "under_review", "verified", "rejected", "expired", "minor_pending"];
const STATUS_COLORS = {
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  under_review: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  verified: "bg-green-500/15 text-green-300 border-green-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  expired: "bg-white/8 text-white/50 border-white/10",
  minor_pending: "bg-purple-500/15 text-purple-300 border-purple-500/30",
};
const ID_LABELS = {
  national_id: "National ID",
  international_passport: "Int'l Passport",
  drivers_license: "Driver's License",
  voters_card: "Voter's Card",
  nin_slip: "NIN Slip",
  residence_permit: "Residence Permit",
};

export default function KycPage() {
  /* ── State ────────────────────────────────────────────── */
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [tab, setTab] = useState("all"); // all | expiring | expired
  const [expiringDays, setExpiringDays] = useState(30);
  const [specialRecords, setSpecialRecords] = useState([]);
  const [modalImage, setModalImage] = useState(null);

  /* ── Data loading ─────────────────────────────────────── */
  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter ? `/kyc/admin/list?status=${filter}` : "/kyc/admin/list";
      const res = await api.get(url);
      setRecords(res.items ?? res.records ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load KYC records");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadExpiring = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/kyc/admin/expiring?days=${expiringDays}`);
      setSpecialRecords(res.records ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load expiring records");
    } finally {
      setLoading(false);
    }
  }, [expiringDays]);

  const loadExpired = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/kyc/admin/expired");
      setSpecialRecords(res.records ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load expired records");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "all") loadRecords();
    else if (tab === "expiring") loadExpiring();
    else if (tab === "expired") loadExpired();
  }, [tab, loadRecords, loadExpiring, loadExpired]);

  /* ── Actions ──────────────────────────────────────────── */
  function requestReview(record, decision) {
    const isReject = decision === "rejected";
    setConfirm({
      title: isReject ? "Reject KYC" : "Verify KYC",
      message: `${isReject ? "Reject" : "Approve"} KYC submission for ${record.full_name || record.user_id}? ${isReject ? "The user will need to re-submit." : "This verifies their identity."}`,
      confirmLabel: isReject ? "Reject" : "Verify",
      destructive: isReject,
      rejectReason: isReject,
      action: async (reason) => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          const body = { decision };
          if (reason) body.rejection_reason = reason;
          await api.patch(`/kyc/admin/${record.id}/review`, body);
          setFeedback({ tone: "success", message: `KYC ${decision}` });
          if (tab === "all") await loadRecords();
          else if (tab === "expiring") await loadExpiring();
          else if (tab === "expired") await loadExpired();
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
      title: "Delete KYC Record",
      message: `Permanently delete KYC for ${record.full_name || record.user_id}? This cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.delete(`/kyc/admin/${record.id}`);
          setFeedback({ tone: "success", message: "KYC record deleted" });
          if (tab === "all") await loadRecords();
          else if (tab === "expiring") await loadExpiring();
          else if (tab === "expired") await loadExpired();
          if (selected?.id === record.id) setSelected(null);
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  /* ── Columns ──────────────────────────────────────────── */
  const activeRecords = tab === "all" ? records : specialRecords;

  const filtered = activeRecords.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (r.full_name || "").toLowerCase().includes(q) ||
      (r.user_id || "").toLowerCase().includes(q) ||
      (r.id_type || "").toLowerCase().includes(q) ||
      (r.id_number || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "identity",
      label: "Applicant",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.full_name || "—"}</div>
          <div className="text-xs text-white/45">{row.user_id}</div>
        </div>
      ),
    },
    {
      key: "id_type",
      label: "ID Type",
      render: (row) => <span className="text-sm text-white/70">{ID_LABELS[row.id_type] || row.id_type || "—"}</span>,
    },
    { key: "id_number", label: "ID Number" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[row.status] || STATUS_COLORS.pending}`}>
          {(row.status || "pending").replace("_", " ")}
        </span>
      ),
    },
    {
      key: "dob",
      label: "Date of Birth",
      render: (row) => row.date_of_birth ? (
        <span className={`text-xs font-medium ${row.is_minor ? "text-purple-300" : "text-white/70"}`}>
          {new Date(row.date_of_birth).toLocaleDateString()}{row.is_minor ? " (minor)" : ""}
        </span>
      ) : <span className="text-xs text-white/30">—</span>,
    },
    {
      key: "expiry",
      label: "ID Expiry",
      render: (row) => {
        if (!row.id_expiry_date) return <span className="text-xs text-white/30">—</span>;
        const exp = new Date(row.id_expiry_date);
        const isExpired = exp < new Date();
        return (
          <span className={`text-xs font-medium ${isExpired ? "text-red-300" : "text-white/70"}`}>
            {exp.toLocaleDateString()}{isExpired ? " (expired)" : ""}
          </span>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelected(row)} className="text-sm font-medium text-sky-300 hover:text-sky-200">Review</button>
          {["pending", "under_review"].includes(row.status) && (
            <button onClick={() => requestReview(row, "verified")} className="text-sm font-medium text-green-300 hover:text-green-200">Verify</button>
          )}
          {["pending", "under_review"].includes(row.status) && (
            <button onClick={() => requestReview(row, "rejected")} className="text-sm font-medium text-red-300 hover:text-red-200">Reject</button>
          )}
          <button onClick={() => requestDelete(row)} className="text-sm font-medium text-red-300/60 hover:text-red-200">Delete</button>
        </div>
      ),
    },
  ];

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">KYC Verification</h1>
          <p className="mt-2 text-sm text-white/58">Review identity documents, approve or reject submissions, track ID expiry.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">{filtered.length} records</span>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "all", label: "All Submissions" },
          { id: "expiring", label: "Expiring Soon" },
          { id: "expired", label: "Expired" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); setFilter(""); }}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by name, ID number, or user ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          {tab === "all" && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter("")}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  !filter ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]" : "border-white/10 bg-white/4 text-white/50 hover:text-white"
                }`}
              >
                All
              </button>
              {KYC_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                    filter === s ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]" : "border-white/10 bg-white/4 text-white/50 hover:text-white"
                  }`}
                >
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
          {tab === "expiring" && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-white/50">Within</label>
              <input
                type="number"
                min="1"
                value={expiringDays}
                onChange={(e) => setExpiringDays(Number(e.target.value) || 30)}
                className="w-20 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
              />
              <span className="text-xs text-white/50">days</span>
            </div>
          )}
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
          <button onClick={() => { if (tab === "all") loadRecords(); else if (tab === "expiring") loadExpiring(); else loadExpired(); }} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No KYC records found" />
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">KYC Review: {selected.full_name || selected.user_id}</h2>
            <button onClick={() => setSelected(null)} className="text-sm text-white/50 hover:text-white">Close ✕</button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Full Name" value={selected.full_name} />
            <Field label="Date of Birth" value={selected.date_of_birth ? `${new Date(selected.date_of_birth).toLocaleDateString()}${selected.is_minor ? " (Minor)" : ""}` : "—"} />
            <Field label="Nationality" value={selected.nationality} />
            <Field label="Phone" value={selected.phone} />
            <Field label="Address" value={selected.address} />
            <Field label="Status" value={(selected.status || "").replace("_", " ")} />
            <Field label="ID Type" value={ID_LABELS[selected.id_type] || selected.id_type} />
            <Field label="ID Number" value={selected.id_number} />
            <Field label="ID Expiry" value={selected.id_expiry_date ? new Date(selected.id_expiry_date).toLocaleDateString() : "—"} />
            <Field label="Submitted" value={selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : "—"} />
            <Field label="Reviewed By" value={selected.reviewed_by || "—"} />
            <Field label="Reviewed At" value={selected.reviewed_at ? new Date(selected.reviewed_at).toLocaleString() : "—"} />
            {selected.rejection_reason && (
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="Rejection Reason" value={selected.rejection_reason} />
              </div>
            )}
          </div>

          {/* Document Images — Full display, click to open modal */}
          <div className="mt-6">
            <h3 className="mb-3 text-sm font-semibold text-white/80">Uploaded Documents</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {selected.id_front_url && (
                <DocCard
                  label="ID Front"
                  url={selected.id_front_url}
                  onClick={() => setModalImage({ url: selected.id_front_url, label: "ID Front" })}
                />
              )}
              {selected.id_back_url && (
                <DocCard
                  label="ID Back"
                  url={selected.id_back_url}
                  onClick={() => setModalImage({ url: selected.id_back_url, label: "ID Back" })}
                />
              )}
              {selected.selfie_url && (
                <DocCard
                  label="Selfie / Biometric"
                  url={selected.selfie_url}
                  onClick={() => setModalImage({ url: selected.selfie_url, label: "Selfie / Biometric" })}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex flex-wrap gap-2">
            {["pending", "under_review"].includes(selected.status) && (
              <>
                <button onClick={() => requestReview(selected, "verified")} className="rounded-xl border border-green-400/30 bg-green-500/10 px-5 py-2 text-sm font-medium text-green-200 transition hover:bg-green-500/20">
                  ✓ Verify Identity
                </button>
                <button onClick={() => requestReview(selected, "rejected")} className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20">
                  ✕ Reject
                </button>
              </>
            )}
            {selected.status === "expired" && (
              <span className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-5 py-2 text-sm font-medium text-amber-200">
                ID Expired — Awaiting Re-submission
              </span>
            )}
            <button onClick={() => requestDelete(selected)} className="rounded-xl border border-red-400/30 bg-red-500/10 px-5 py-2 text-sm font-medium text-red-300/60 transition hover:bg-red-500/20 hover:text-red-200">
              Delete Record
            </button>
          </div>
        </div>
      )}

      {/* Image Modal Viewer */}
      {modalImage && (
        <ImageModal
          url={modalImage.url}
          label={modalImage.label}
          onClose={() => setModalImage(null)}
        />
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

function DocCard({ label, url, onClick }) {
  return (
    <div>
      <label className="mb-2 block text-xs text-white/50">{label}</label>
      <button
        onClick={onClick}
        className="group block w-full overflow-hidden rounded-xl border border-white/10 hover:border-sky-400/40 transition-all"
      >
        <div className="relative aspect-[3/2] w-full bg-white/5">
          <img
            src={url}
            alt={label}
            className="h-full w-full object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Click to view full
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

function ImageModal({ url, label, onClose }) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] max-w-[95vw] flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex w-full items-center justify-between gap-4">
          <span className="text-sm font-semibold text-white/90">{label}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomed((v) => !v)}
              className="rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/15"
            >
              {zoomed ? "Fit" : "Zoom"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/15"
            >
              Close ✕
            </button>
          </div>
        </div>

        <div className="flex max-h-[calc(95vh-60px)] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-black/50">
          <img
            src={url}
            alt={label}
            className={zoomed
              ? "max-w-none cursor-zoom-out"
              : "max-h-[calc(95vh-60px)] max-w-[95vw] cursor-zoom-in object-contain"
            }
            onClick={() => setZoomed((v) => !v)}
          />
        </div>
      </div>
    </div>
  );
}
