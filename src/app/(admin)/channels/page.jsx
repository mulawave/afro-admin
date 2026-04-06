"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/channels");
      setChannels(res.channels ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  function toggleChannel(channel) {
    const action = channel.is_active ? "Disable" : "Enable";
    setConfirm({
      title: `${action} Channel`,
      message: `${action} "${channel.name}"? ${
        channel.is_active
          ? "This channel will be hidden from users and streams will stop."
          : "This channel will become visible and accessible to users."
      }`,
      destructive: channel.is_active,
      action: async () => {
        setActionLoading(true);
        try {
          await api.post(`/admin/channels/${channel.id}/${channel.is_active ? "disable" : "enable"}`);
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function togglePremium(channel) {
    const requiresPayment = !channel.requires_payment;
    setConfirm({
      title: requiresPayment ? "Enable Premium Access" : "Disable Premium Access",
      message: requiresPayment
        ? `Turn "${channel.name}" into a paid stream entry channel using its current default fees?`
        : `Remove paid entry requirements from "${channel.name}"?`,
      destructive: false,
      action: async () => {
        setActionLoading(true);
        try {
          await api.patch(`/admin/channels/${channel.id}/premium`, {
            requires_payment: requiresPayment,
            entry_fee_type: channel.entry_fee_type || "ngn",
            entry_fee_ngn: channel.entry_fee_ngn || 500,
            entry_fee_vpt_units: channel.entry_fee_vpt_units || 100,
            access_duration_minutes: channel.access_duration_minutes || 120,
          });
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  const filtered = channels.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.owner_id && c.owner_id.toLowerCase().includes(q)) ||
      (c.owner_display_name && c.owner_display_name.toLowerCase().includes(q)) ||
      (c.owner_email && c.owner_email.toLowerCase().includes(q))
    );
  });

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "owner_display_name",
      label: "Owner",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium text-white">{row.owner_display_name || row.owner_id || "Unknown owner"}</p>
          <p className="text-xs text-white/42">{row.owner_email || row.owner_id || "No owner email"}</p>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            row.type === "private"
              ? "border border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
              : "border border-sky-400/30 bg-sky-500/10 text-sky-200"
          }`}
        >
          {row.type === "private" ? "Private" : "Public"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.is_active ? "active" : "disabled"} />,
    },
    {
      key: "premium",
      label: "Premium",
      render: (row) => <StatusBadge status={row.requires_payment ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => toggleChannel(row)}
            disabled={actionLoading}
            className={`inline-flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 ${
              row.is_active
                ? "text-amber-300 hover:text-amber-200"
                : "text-emerald-300 hover:text-emerald-200"
            }`}
          >
            {actionLoading && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
            {row.is_active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => togglePremium(row)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200 disabled:opacity-50"
          >
            {actionLoading && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
            {row.requires_payment ? "Unpremium" : "Premium"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Channels</h1>
          <p className="mt-2 text-sm text-white/58">Moderate active visibility and premium access behavior for creator channels.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
          {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <input
          type="text"
          placeholder="Search by channel name or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
      </div>

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadChannels} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && !error && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No channels found" />
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
