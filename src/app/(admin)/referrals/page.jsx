"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState("");
  const [uplineFilter, setUplineFilter] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [assignDialog, setAssignDialog] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/referrals");
      setReferrals(res.referrals ?? []);
      setStats(res.stats ?? null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load referrals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return referrals.filter((r) => {
      if (uplineFilter === "with" && !r.has_upline) return false;
      if (uplineFilter === "without" && r.has_upline) return false;

      if (!search) return true;
      const q = search.toLowerCase();
      return [r.email, r.name, r.referral_code, r.referred_by_email, r.referred_by_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [search, uplineFilter, referrals]);

  function openAssignDialog(referral) {
    setAssignDialog({
      uid: referral.uid,
      email: referral.email || referral.uid,
      name: referral.name,
      referrerCode: "",
      busy: false,
      error: null,
    });
  }

  async function submitAssignUpline() {
    if (!assignDialog) return;
    const code = assignDialog.referrerCode.trim().toUpperCase();
    if (!code) {
      setAssignDialog((d) => ({ ...d, error: "Enter a referral code" }));
      return;
    }

    // Find referrer UID by code
    const referrer = referrals.find(
      (r) => r.referral_code?.toUpperCase() === code
    );
    if (!referrer) {
      setAssignDialog((d) => ({
        ...d,
        error: `No user found with referral code "${code}"`,
      }));
      return;
    }
    if (referrer.uid === assignDialog.uid) {
      setAssignDialog((d) => ({
        ...d,
        error: "Cannot assign user as their own upline",
      }));
      return;
    }

    setAssignDialog((d) => ({ ...d, busy: true, error: null }));
    try {
      const res = await api.post("/admin/referrals/assign-upline", {
        uid: assignDialog.uid,
        referrer_uid: referrer.uid,
      });
      setFeedback({
        tone: "success",
        message: res.message || `Upline assigned successfully. ${res.earnings_created || 0} earnings created retroactively.`,
      });
      setAssignDialog(null);
      await load();
    } catch (err) {
      setAssignDialog((d) => ({
        ...d,
        busy: false,
        error: err.message || "Failed to assign upline",
      }));
    }
  }

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => (
        <div>
          <div className="font-medium text-white">
            {row.name || "Anonymous"}
          </div>
          <div className="text-xs text-[var(--av-light-orange)]">{row.email || row.uid}</div>
        </div>
      ),
    },
    {
      key: "referral_code",
      label: "Code",
      render: (row) => (
        <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-[var(--av-light-orange)]">
          {row.referral_code}
        </span>
      ),
    },
    {
      key: "upline",
      label: "Upline",
      render: (row) =>
        row.has_upline ? (
          <div>
            <div className="text-sm text-white">
              {row.referred_by_name || "Anonymous"}
            </div>
            <div className="text-xs text-[var(--av-light-orange)]">
              {row.referred_by_email || row.referred_by}
            </div>
          </div>
        ) : (
          <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
            No upline
          </span>
        ),
    },
    {
      key: "invites",
      label: "Invites",
      render: (row) => row.invited_count || 0,
    },
    {
      key: "earnings",
      label: "Earnings",
      render: (row) => (
        <div>
          {row.total_earnings_ngn > 0 && (
            <div className="text-sm font-medium text-[var(--av-light-orange)]">
              ₦{Number(row.total_earnings_ngn).toLocaleString("en-NG")}
            </div>
          )}
          {row.total_earnings_vpt_units > 0 && (
            <div className="text-xs text-[var(--av-orange)]">
              {Number(row.total_earnings_vpt_units).toLocaleString("en-NG")} vPT
            </div>
          )}
          {row.total_earnings_ngn === 0 && row.total_earnings_vpt_units === 0 && (
            <span className="text-xs text-[var(--av-light-orange)]">None</span>
          )}
        </div>
      ),
    },
    {
      key: "ledger",
      label: "Ledger Status",
      render: (row) => {
        const ls = row.ledger_summary;
        if (!ls) return <span className="text-xs text-[var(--av-light-orange)]">—</span>;
        return (
          <div className="space-y-0.5">
            {(ls.pending_ngn > 0 || ls.pending_vpt_units > 0) && (
              <div className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-300">
                  Pending: ₦{ls.pending_ngn}
                  {ls.pending_vpt_units > 0 && ` + ${ls.pending_vpt_units} vPT`}
                </span>
              </div>
            )}
            {(ls.credited_ngn > 0 || ls.credited_vpt_units > 0) && (
              <div className="flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-emerald-300">
                  Credited: ₦{ls.credited_ngn}
                  {ls.credited_vpt_units > 0 && ` + ${ls.credited_vpt_units} vPT`}
                </span>
              </div>
            )}
            {ls.pending_ngn === 0 && ls.pending_vpt_units === 0 && ls.credited_ngn === 0 && ls.credited_vpt_units === 0 && (
              <span className="text-xs text-[var(--av-light-orange)]">—</span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      label: "",
      render: (row) =>
        !row.has_upline ? (
          <button
            onClick={() => openAssignDialog(row)}
            className="rounded-lg bg-[var(--av-orange)]/15 px-3 py-1.5 text-xs font-medium text-[var(--av-orange)] transition hover:bg-[var(--av-orange)]/25"
          >
            Assign Upline
          </button>
        ) : (
          <span className="text-xs text-[var(--av-light-orange)]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            Referral Management
          </h1>
          <p className="mt-2 text-sm text-[var(--av-light-orange)]">
            View referral trees, earnings, ledger status, and assign uplines to
            users who registered without a referral code.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--av-light-orange)]">
          <MetricPill label="Total" value={stats?.total || 0} />
          <MetricPill label="With Upline" value={stats?.with_upline || 0} />
          <MetricPill
            label="Without Upline"
            value={stats?.without_upline || 0}
            alert
          />
          <MetricPill
            label="Pending ₦"
            value={stats?.total_pending_ngn || 0}
          />
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl md:flex-row">
        <input
          type="text"
          placeholder="Search by name, email, or referral code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--av-light-orange)]"
        />
        <select
          value={uplineFilter}
          onChange={(e) => setUplineFilter(e.target.value)}
          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All users</option>
          <option value="with">With upline</option>
          <option value="without">Without upline</option>
        </select>
      </div>

      <NoticeBanner
        tone="error"
        message={error}
        actionLabel="Retry"
        onAction={load}
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          emptyMessage="No referral records found"
        />
      )}

      {/* Assign Upline Dialog */}
      {assignDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[var(--admin-surface-strong)] p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">Assign Upline</h3>
            <p className="mt-1 text-sm text-[var(--av-light-orange)]">
              Assign an upline to{" "}
              <strong className="text-white">
                {assignDialog.name || assignDialog.email}
              </strong>
              . This will retroactively create referral earnings for any
              existing subscriptions.
            </p>

            <div className="mt-4">
              <label className="mb-1 block text-xs text-[var(--av-light-orange)]">
                Referrer&apos;s Referral Code
              </label>
              <input
                type="text"
                value={assignDialog.referrerCode}
                onChange={(e) =>
                  setAssignDialog((d) => ({
                    ...d,
                    referrerCode: e.target.value.toUpperCase(),
                    error: null,
                  }))
                }
                placeholder="Enter referral code (e.g. A1B2C3D4)"
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 font-mono text-sm text-white uppercase tracking-wider outline-none placeholder:text-[var(--av-light-orange)] focus:border-[var(--av-orange)]/40"
                disabled={assignDialog.busy}
                maxLength={16}
              />
            </div>

            {assignDialog.error && (
              <p className="mt-2 text-sm text-red-400">{assignDialog.error}</p>
            )}

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setAssignDialog(null)}
                disabled={assignDialog.busy}
                className="rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-[var(--av-light-orange)] transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={submitAssignUpline}
                disabled={assignDialog.busy}
                className="rounded-xl bg-[var(--av-orange)] px-5 py-2 text-sm font-medium text-white transition hover:bg-[var(--av-orange)]/85 disabled:opacity-50"
              >
                {assignDialog.busy ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Assigning...
                  </span>
                ) : (
                  "Assign Upline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value, alert }) {
  return (
    <span
      className={`rounded-full border px-3 py-1 ${
        alert && value > 0
          ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
          : "border-white/10 bg-white/6"
      }`}
    >
      {label}: {Number(value || 0).toLocaleString("en-NG")}
    </span>
  );
}
