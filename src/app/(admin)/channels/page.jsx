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
      setChannels(Array.isArray(res) ? res : res.data ?? []);
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
          await api.patch(`/admin/channels/${channel.id}`, {
            is_active: !channel.is_active,
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

  function stopStream(channel) {
    setConfirm({
      title: "Stop Stream",
      message: `Force stop the live stream on "${channel.name}"? This will disconnect the streamer and all viewers immediately.`,
      destructive: true,
      action: async () => {
        setActionLoading(true);
        try {
          await api.post(`/admin/channels/${channel.id}/stop`);
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function deleteChannel(channel) {
    setConfirm({
      title: "Delete Channel",
      message: `Permanently delete "${channel.name}"? This will remove all programs, events, and references tied to this channel. This cannot be undone.`,
      destructive: true,
      action: async () => {
        setActionLoading(true);
        try {
          await api.delete(`/admin/channels/${channel.id}`);
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
      (c.owner_uid && c.owner_uid.toLowerCase().includes(q))
    );
  });

  const columns = [
    { key: "name", label: "Name" },
    { key: "owner_uid", label: "Owner" },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.is_private
              ? "bg-purple-100 text-purple-700"
              : "bg-blue-100 text-blue-700"
          }`}
        >
          {row.is_private ? "Private" : "Public"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <StatusBadge status={row.is_active ? "active" : "disabled"} />
      ),
    },
    {
      key: "live",
      label: "Live",
      render: (row) =>
        row.is_live ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            LIVE
          </span>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => toggleChannel(row)}
            className={`text-sm font-medium ${
              row.is_active
                ? "text-amber-600 hover:text-amber-800"
                : "text-green-600 hover:text-green-800"
            }`}
          >
            {row.is_active ? "Disable" : "Enable"}
          </button>
          {row.is_live && (
            <button
              onClick={() => stopStream(row)}
              className="text-sm font-medium text-red-600 hover:text-red-800"
            >
              Stop
            </button>
          )}
          <button
            onClick={() => deleteChannel(row)}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Channels</h1>
        <span className="text-sm text-gray-500">
          {filtered.length} channel{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search by channel name or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadChannels} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage="No channels found"
          />
        </div>
      )}

      {/* Confirm Dialog */}
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
