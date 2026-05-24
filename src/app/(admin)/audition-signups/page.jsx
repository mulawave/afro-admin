"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const PAYMENT_OPTIONS = ["pending", "paid", "failed"];
const SIGNUP_OPTIONS = ["pending_payment", "enrolled", "cancelled"];

function fmtDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function statusClass(status) {
  if (["paid", "enrolled"].includes(status)) {
    return "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  }
  if (["failed", "cancelled"].includes(status)) {
    return "border border-red-400/30 bg-red-500/10 text-red-200";
  }
  if (["pending", "pending_payment"].includes(status)) {
    return "border border-amber-400/30 bg-amber-500/10 text-amber-200";
  }
  return "border border-white/10 bg-white/5 text-white/70";
}

function StatusPill({ value }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClass(value)}`}>
      {value || "-"}
    </span>
  );
}

function downloadCsv(rows, challengeLabelById) {
  const headers = [
    "signup_id",
    "challenge_id",
    "challenge_title",
    "user_id",
    "name",
    "email",
    "payment_reference",
    "payment_status",
    "signup_status",
    "payment_amount_ngn",
    "vpt_price_at_signup",
    "vpt_allocated",
    "community_pool_allocated",
    "ops_pool_allocated",
    "vpt_credited",
    "campaign_tags",
    "email_sent",
    "email_sent_at",
    "email_error",
    "enrolled_at",
    "cancelled_at",
    "cancel_reason",
    "created_at",
    "updated_at",
  ];

  const escape = (value) => {
    const raw = value == null ? "" : String(value);
    if (raw.includes(",") || raw.includes('"') || raw.includes("\n")) {
      return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
  };

  const lines = [headers.join(",")];
  rows.forEach((row) => {
    const values = [
      row.id,
      row.challenge_id,
      challengeLabelById[row.challenge_id] || "",
      row.user_id,
      row.name,
      row.email,
      row.payment_reference,
      row.payment_status,
      row.signup_status,
      row.payment_amount_ngn,
      row.vpt_price_at_signup,
      row.vpt_allocated,
      row.community_pool_allocated,
      row.ops_pool_allocated,
      row.vpt_credited,
      Array.isArray(row.campaign_tags) ? row.campaign_tags.join("|") : "",
      row.email_sent,
      row.email_sent_at,
      row.email_error,
      row.enrolled_at,
      row.cancelled_at,
      row.cancel_reason,
      row.created_at,
      row.updated_at,
    ];
    lines.push(values.map(escape).join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.href = url;
  link.download = `audition-signups-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function AuditionSignupsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selected, setSelected] = useState(null);

  const [challengeOptions, setChallengeOptions] = useState([]);
  const [search, setSearch] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [signupStatus, setSignupStatus] = useState("");
  const [emailSent, setEmailSent] = useState("");

  const challengeLabelById = useMemo(() => {
    const map = {};
    challengeOptions.forEach((c) => {
      map[c.id] = c.title || `Season ${c.season || "-"}`;
    });
    return map;
  }, [challengeOptions]);

  const loadChallenges = useCallback(async () => {
    try {
      const res = await api.get("/challenge/admin/list");
      setChallengeOptions(res.challenges || []);
    } catch {
      setChallengeOptions([]);
    }
  }, []);

  const loadSignups = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "500");
      params.set("offset", "0");
      if (challengeId) params.set("challenge_id", challengeId);
      if (paymentStatus) params.set("payment_status", paymentStatus);
      if (signupStatus) params.set("signup_status", signupStatus);
      if (emailSent) params.set("email_sent", emailSent);
      if (search.trim()) params.set("search", search.trim());

      const res = await api.get(`/challenge/admin/audition-signups?${params.toString()}`);
      const rows = res.items || [];
      setItems(rows);
      setTotal(res.total || rows.length);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load paid audition signups");
    } finally {
      setLoading(false);
    }
  }, [challengeId, paymentStatus, signupStatus, emailSent, search]);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  useEffect(() => {
    loadSignups();
  }, [loadSignups]);

  function requestDelete(row) {
    setConfirm({
      title: "Delete signup",
      message: `Delete signup ${row.id}? This will permanently remove the record.`,
      confirmLabel: "Delete",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.delete(`/challenge/admin/audition-signups/${row.id}`);
          setFeedback({ tone: "success", message: "Signup deleted" });
          if (selected?.id === row.id) setSelected(null);
          await loadSignups();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Delete failed" }));
          return false;
        }
      },
    });
  }

  function requestCancel(row) {
    const reason = window.prompt("Cancel reason (optional):", row.cancel_reason || "") || null;

    setConfirm({
      title: "Cancel signup",
      message: `Cancel signup ${row.id}? This keeps history but marks signup as cancelled.`,
      confirmLabel: "Cancel Signup",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.patch(`/challenge/admin/audition-signups/${row.id}`, {
            signup_status: "cancelled",
            cancelled_at: new Date().toISOString(),
            cancel_reason: reason,
          });
          setFeedback({ tone: "success", message: "Signup cancelled" });
          await loadSignups();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Cancellation failed" }));
          return false;
        }
      },
    });
  }

  function requestResendEmail(row) {
    setConfirm({
      title: "Resend confirmation email",
      message: `Resend confirmation email for signup ${row.id}?`,
      confirmLabel: "Resend Email",
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.post(`/challenge/admin/audition-signups/${row.id}/resend-email`);
          setFeedback({ tone: "success", message: "Confirmation email resent" });
          await loadSignups();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Resend failed" }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "participant",
      label: "Participant",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.name || row.email || "-"}</div>
          <div className="text-xs text-white/45">{row.email || "-"}</div>
          <div className="text-[11px] text-white/35">UID: {row.user_id || "-"}</div>
        </div>
      ),
    },
    {
      key: "challenge",
      label: "Challenge",
      render: (row) => (
        <div>
          <div className="text-white/85">{challengeLabelById[row.challenge_id] || row.challenge_id}</div>
          <div className="text-[11px] text-white/35">{row.challenge_id}</div>
        </div>
      ),
    },
    {
      key: "payment_reference",
      label: "Payment Ref",
      render: (row) => (
        <span className="text-xs text-white/70">{row.payment_reference || "-"}</span>
      ),
    },
    {
      key: "payment_status",
      label: "Payment",
      render: (row) => <StatusPill value={row.payment_status} />,
    },
    {
      key: "signup_status",
      label: "Signup",
      render: (row) => <StatusPill value={row.signup_status} />,
    },
    {
      key: "created_at",
      label: "Created",
      render: (row) => <span className="text-xs text-white/70">{fmtDate(row.created_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelected(row)}
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            Details
          </button>
          {row.signup_status === "pending_payment" && (
            <button
              onClick={() => requestCancel(row)}
              className="text-sm font-medium text-amber-300 hover:text-amber-200"
            >
              Cancel
            </button>
          )}
          {!row.email_sent && (
            <button
              onClick={() => requestResendEmail(row)}
              className="text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Resend Email
            </button>
          )}
          <button
            onClick={() => requestDelete(row)}
            className="text-sm font-medium text-red-300 hover:text-red-200"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Paid Audition Signups</h1>
          <p className="mt-2 text-sm text-white/58">
            Dedicated operations dataset for paid audition entries. This is separate from challenge registration progression records.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => downloadCsv(items, challengeLabelById)}
            className="rounded-2xl border border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/15 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25"
          >
            Export CSV
          </button>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {loading ? "Loading..." : `${total} records`}
          </span>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input
            type="text"
            placeholder="Search by name, email, or payment ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32 xl:col-span-2"
          />

          <select
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All challenges</option>
            {challengeOptions.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.title || `Season ${ch.season || "-"}`}
              </option>
            ))}
          </select>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All payment statuses</option>
            {PAYMENT_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={signupStatus}
            onChange={(e) => setSignupStatus(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All signup statuses</option>
            {SIGNUP_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => setEmailSent("")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              emailSent === ""
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/50 hover:text-white"
            }`}
          >
            Email: all
          </button>
          <button
            onClick={() => setEmailSent("true")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              emailSent === "true"
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/50 hover:text-white"
            }`}
          >
            Email: sent
          </button>
          <button
            onClick={() => setEmailSent("false")}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
              emailSent === "false"
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/50 hover:text-white"
            }`}
          >
            Email: pending
          </button>
          <button
            onClick={() => {
              setSearch("");
              setChallengeId("");
              setPaymentStatus("");
              setSignupStatus("");
              setEmailSent("");
            }}
            className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs font-medium text-white/50 transition hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

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
          <button onClick={loadSignups} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && (
        <DataTable
          columns={columns}
          rows={items}
          emptyMessage="No paid audition signups found for the current filter set"
        />
      )}

      {selected && (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Signup Details</h2>
            <button
              onClick={() => setSelected(null)}
              className="rounded-xl border border-white/12 bg-white/6 px-3 py-1.5 text-xs text-white/70 hover:text-white"
            >
              Close
            </button>
          </div>
          <pre className="overflow-auto rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-white/75">
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
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
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const close = await confirm.action();
          if (close !== false) setConfirm(null);
        }}
      />
    </div>
  );
}
