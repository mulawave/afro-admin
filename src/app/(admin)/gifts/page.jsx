"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import GiftForm from "@/components/gifts/GiftForm";

export default function GiftsPage() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadGifts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/gifts");
      setGifts(Array.isArray(res) ? res : res.data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load gifts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGifts();
  }, [loadGifts]);

  async function toggleGift(gift) {
    const action = gift.is_active ? "Disable" : "Enable";
    setConfirm({
      title: `${action} Gift`,
      message: `${action} "${gift.name}"? ${
        gift.is_active
          ? "Users will no longer be able to send this gift."
          : "This gift will become available to users."
      }`,
      destructive: gift.is_active,
      action: async () => {
        setActionLoading(true);
        try {
          await api.patch(`/admin/gifts/${gift.id}`, {
            is_active: !gift.is_active,
          });
          await loadGifts();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  const filtered = gifts.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (g.name && g.name.toLowerCase().includes(q)) ||
      (g.icon && g.icon.toLowerCase().includes(q))
    );
  });

  const columns = [
    {
      key: "icon",
      label: "Icon",
      render: (row) => <span className="text-xl">{row.icon || "🎁"}</span>,
    },
    { key: "name", label: "Name" },
    {
      key: "value",
      label: "Value",
      render: (row) =>
        row.currency === "vpt"
          ? `${row.vpt_units ?? 0} vPT`
          : `₦${(row.naira_value ?? 0).toLocaleString()}`,
    },
    {
      key: "currency",
      label: "Currency",
      render: (row) => (
        <span className="uppercase text-xs font-medium text-gray-500">
          {row.currency || "—"}
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
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(row)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => toggleGift(row)}
            className={`text-sm font-medium ${
              row.is_active
                ? "text-amber-600 hover:text-amber-800"
                : "text-green-600 hover:text-green-800"
            }`}
          >
            {row.is_active ? "Disable" : "Enable"}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gifts</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {filtered.length} gift{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setEditing({})}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Gift
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search gifts by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadGifts} className="ml-3 underline">
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
            emptyMessage="No gifts found"
          />
        </div>
      )}

      {/* Gift Form Drawer */}
      {editing !== null && (
        <GiftForm
          gift={editing}
          onClose={() => {
            setEditing(null);
            loadGifts();
          }}
        />
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
