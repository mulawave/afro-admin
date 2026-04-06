"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [confirm, setConfirm] = useState(null);

  const loadWithdrawals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/withdrawals/all");
      setWithdrawals(res.withdrawals ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, [loadWithdrawals]);

  const filtered = useMemo(() => {
    return withdrawals.filter((withdrawal) => {
      if (statusFilter !== "all" && withdrawal.status !== statusFilter) {
        return false;
      }
      if (!search) return true;

      const q = search.toLowerCase();
      return [
        withdrawal.id,
        withdrawal.user_display_name,
        withdrawal.user_email,
        withdrawal.user?.email,
        withdrawal.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [search, statusFilter, withdrawals]);

  const pendingCount = withdrawals.filter((withdrawal) => withdrawal.status === "pending").length;
  const pendingAmount = withdrawals
    .filter((withdrawal) => withdrawal.status === "pending")
    .reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);

  function requestAction(withdrawal, action) {
    const endpoint = action === "approve" ? "approve" : "reject";
    const verb = action === "approve" ? "Approve" : "Reject";

    setConfirm({
      title: `${verb} Withdrawal`,
      message: `${verb} ${formatCurrency(withdrawal.amount)} for ${withdrawal.user_display_name || withdrawal.uid}?`,
      destructive: action === "reject",
      busy: false,
      error: null,
      confirmLabel: verb,
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.post(`/withdrawals/${withdrawal.id}/${endpoint}`, {});
          setFeedback({
            tone: "success",
            message: `${verb}d withdrawal for ${withdrawal.user_display_name || withdrawal.uid}.`,
          });
          await loadWithdrawals();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || `Failed to ${endpoint} withdrawal` }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "user",
      label: "User",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.user_display_name || row.uid}</div>
          <div className="text-xs text-white/45">{row.user_email || row.uid}</div>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Amount",
      render: (row) => <span className="font-mono text-white">{formatCurrency(row.amount)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      label: "Requested",
      render: (row) => formatDate(row.created_at),
    },
    {
      key: "processed_at",
      label: "Processed",
      render: (row) => formatDate(row.processed_at),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        row.status === "pending" ? (
          <div className="flex gap-3">
            <button onClick={() => requestAction(row, "approve")} className="text-sm font-medium text-emerald-300 hover:text-emerald-200">
              Approve
            </button>
            <button onClick={() => requestAction(row, "reject")} className="text-sm font-medium text-red-300 hover:text-red-200">
              Reject
            </button>
          </div>
        ) : (
          <span className="text-xs text-white/35">No action</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Withdrawals</h1>
          <p className="mt-2 text-sm text-white/58">Review payout requests and action pending withdrawals from one queue.</p>
        </div>
        <div className="flex items-center gap-3">
          <MetricPill label="Pending" value={pendingCount} />
          <MetricPill label="Pending Value" value={formatCurrency(pendingAmount)} />
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl md:flex-row">
        <input
          type="text"
          placeholder="Search by user or request id..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <NoticeBanner tone="error" message={error} actionLabel="Retry" onAction={loadWithdrawals} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyMessage="No withdrawals found" />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
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

function MetricPill({ label, value }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
      {label}: {value}
    </span>
  );
}

function formatCurrency(value) {
  return `NGN ${Number(value || 0).toLocaleString("en-NG")}`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}