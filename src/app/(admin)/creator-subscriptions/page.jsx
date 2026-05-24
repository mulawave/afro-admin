"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function CreatorSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : "";
      const res = await api.get(`/admin/creator-subscriptions${query}`);
      const subscriptionList = Array.isArray(res?.subscriptions)
        ? res.subscriptions
        : Array.isArray(res)
          ? res
          : [];
      setSubscriptions(subscriptionList);
      setStats(res.stats ?? null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load creator subscriptions");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const safeSubscriptions = Array.isArray(subscriptions) ? subscriptions : [];
    return safeSubscriptions.filter((subscription) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return [
        subscription.subscriber_display_name,
        subscription.subscriber?.email,
        subscription.creator_display_name,
        subscription.creator?.email,
        subscription.plan,
        subscription.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [search, subscriptions]);

  function requestCancel(subscription) {
    setConfirm({
      title: "Cancel Creator Subscription",
      message: `Cancel ${subscription.subscriber_display_name}'s subscription to ${subscription.creator_display_name}?`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Cancel Subscription",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.delete(`/admin/creator-subscriptions/${subscription.id}/cancel`);
          setFeedback({
            tone: "success",
            message: `Cancelled subscription between ${subscription.subscriber_display_name} and ${subscription.creator_display_name}.`,
          });
          await load();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to cancel subscription" }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "subscriber",
      label: "Subscriber",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.subscriber_display_name}</div>
          <div className="text-xs text-white/45">{row.subscriber?.email || row.subscriber_uid}</div>
        </div>
      ),
    },
    {
      key: "creator",
      label: "Creator",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.creator_display_name}</div>
          <div className="text-xs text-white/45">{row.creator?.email || row.creator_uid}</div>
        </div>
      ),
    },
    { key: "plan", label: "Plan" },
    { key: "amount", label: "Amount", render: (row) => `${row.currency === "vpt" ? "vPT" : "NGN"} ${Number(row.amount || 0).toLocaleString("en-NG")}` },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "next_billing", label: "Next Billing", render: (row) => formatDate(row.next_billing) },
    {
      key: "actions",
      label: "",
      render: (row) => (
        row.status === "active" ? (
          <button onClick={() => requestCancel(row)} className="text-sm font-medium text-red-300 hover:text-red-200">
            Cancel
          </button>
        ) : <span className="text-xs text-white/35">No action</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Creator Subscriptions</h1>
          <p className="mt-2 text-sm text-white/58">Inspect active and cancelled creator memberships and intervene when support needs require it.</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-white/62">
          <MetricPill label="Active" value={stats?.active || 0} />
          <MetricPill label="Cancelled" value={stats?.cancelled || 0} />
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      <div className="flex flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl md:flex-row">
        <input
          type="text"
          placeholder="Search by subscriber, creator, or plan..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <NoticeBanner tone="error" message={error} actionLabel="Retry" onAction={load} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyMessage="No creator subscriptions found" />
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
    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">
      {label}: {Number(value || 0).toLocaleString("en-NG")}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}