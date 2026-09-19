"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DevicesTab({ onFeedback }) {
  const [devices, setDevices] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDistributor, setFilterDistributor] = useState("");
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [devRes, distRes] = await Promise.all([
        api.get("/distribution/admin/devices"),
        api.get("/distribution/admin/distributors"),
      ]);
      setDevices(devRes.devices || []);
      setDistributors(distRes.distributors || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const distributorMap = {};
  for (const d of distributors) {
    distributorMap[d.id] = d.company_name || d.email;
  }

  const filtered = devices.filter((d) => {
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterDistributor && d.distributor_id !== filterDistributor) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.device_id || "").toLowerCase().includes(q) ||
      (d.owner_name || "").toLowerCase().includes(q) ||
      (d.owner_email || "").toLowerCase().includes(q) ||
      (d.owner_phone || "").toLowerCase().includes(q) ||
      (d.activation_code || "").toLowerCase().includes(q)
    );
  });

  function toggleKillSwitch(device) {
    const isDisabling = device.status !== "disabled";
    setConfirm({
      title: isDisabling ? "Disable TV (Kill Switch)" : "Re-enable TV",
      message: isDisabling
        ? `Disable TV "${device.device_name || device.device_id}"? The TV will be bricked on its next heartbeat. Owner: ${device.owner_name || "—"}`
        : `Re-enable TV "${device.device_name || device.device_id}"? The TV will function normally on its next heartbeat.`,
      confirmLabel: isDisabling ? "Disable" : "Enable",
      destructive: isDisabling,
      needsReason: isDisabling,
      action: async (reason) => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          const body = { status: isDisabling ? "disabled" : "active" };
          if (isDisabling && reason) body.disabled_reason = reason;
          await api.patch(`/distribution/admin/devices/${device.device_id}`, body);
          onFeedback("success", `TV ${isDisabling ? "disabled (kill switch activated)" : "re-enabled"}`);
          await load();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "device",
      label: "Device",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.device_name || "AfroVision TV"}</div>
          <div className="block max-w-[180px] truncate font-mono text-xs text-white/40">{row.device_id}</div>
        </div>
      ),
    },
    {
      key: "owner",
      label: "Owner",
      render: (row) => (
        <div>
          <div className="text-sm text-white">{row.owner_name || "—"}</div>
          <div className="text-xs text-white/45">{row.owner_email || "—"}</div>
          <div className="text-xs text-white/45">{row.owner_phone || "—"}</div>
        </div>
      ),
    },
    {
      key: "distributor",
      label: "Distributor",
      render: (row) => (
        <span className="text-sm text-white/70">{distributorMap[row.distributor_id] || "—"}</span>
      ),
    },
    {
      key: "activation_code",
      label: "Activation Code",
      render: (row) => (
        <span className="font-mono text-xs text-white/60">{row.activation_code || "—"}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "app_version",
      label: "App Version",
      render: (row) => <span className="text-xs text-white/50">{row.app_version || "—"}</span>,
    },
    {
      key: "last_seen",
      label: "Last Seen",
      render: (row) => <span className="text-xs text-white/50">{timeAgo(row.last_seen_at)}</span>,
    },
    {
      key: "activated_at",
      label: "Activated",
      render: (row) => <span className="text-xs text-white/50">{formatDate(row.activated_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => toggleKillSwitch(row)}
          className={`text-sm font-medium ${row.status === "disabled" ? "text-emerald-300 hover:text-emerald-200" : "text-red-300 hover:text-red-200"}`}
        >
          {row.status === "disabled" ? "Enable" : "Kill Switch"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search by device ID, owner, email, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <select
            value={filterDistributor}
            onChange={(e) => setFilterDistributor(e.target.value)}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
          >
            <option value="">All Distributors</option>
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>{d.company_name}</option>
            ))}
          </select>
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
        <DataTable columns={columns} rows={filtered} emptyMessage="No TV devices found" defaultPageSize={25} storageKey="distribution-devices" />
      )}

      <ConfirmDialog
        open={Boolean(confirm) && !confirm?.needsReason}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        busy={confirm?.busy}
        error={confirm?.error}
        destructive={confirm?.destructive}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) { setConfirm(null); return; }
          const ok = await confirm.action(confirm?.reasonValue);
          if (ok !== false) setConfirm(null);
        }}
      />

      {confirm?.needsReason && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-sm" onClick={() => setConfirm(null)} />
          <div className="relative mx-4 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface-strong)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            <h3 className="mb-2 text-lg font-semibold text-white">{confirm.title}</h3>
            <p className="mb-4 text-sm leading-6 text-white/66">{confirm.message}</p>
            <textarea
              placeholder="Reason for disabling (optional)..."
              value={confirm.reasonValue || ""}
              onChange={(e) => setConfirm((c) => ({ ...c, reasonValue: e.target.value }))}
              className="mb-4 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              rows={3}
            />
            {confirm.error && (
              <p className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{confirm.error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirm(null)}
                disabled={confirm.busy}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!confirm.action) { setConfirm(null); return; }
                  setConfirm((c) => ({ ...c, busy: true, error: null }));
                  confirm.action(confirm.reasonValue).then((ok) => {
                    if (ok !== false) setConfirm(null);
                  }).catch(() => {
                    setConfirm((c) => ({ ...c, busy: false }));
                  });
                }}
                disabled={confirm.busy}
                className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50"
              >
                {confirm.busy && (
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                )}
                {confirm.busy ? "Working..." : confirm.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
