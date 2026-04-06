"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import GiftForm from "@/components/gifts/GiftForm";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function GiftsPage() {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const loadGifts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/interactions/gifts/all");
      setGifts(res.gifts ?? []);
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
      busy: false,
      error: null,
      confirmLabel: action,
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          await api.patch(`/interactions/gifts/${gift.id}`, {
            is_active: !gift.is_active,
          });
          setFeedback({ tone: "success", message: `${action}d ${gift.name}.` });
          await loadGifts();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || `Failed to ${action.toLowerCase()} gift` }));
          return false;
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function deleteGift(gift) {
    setConfirm({
      title: "Delete Gift",
      message: `Permanently delete "${gift.name}" from the gift catalog? This cannot be undone.`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Delete Gift",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          await api.delete(`/interactions/gifts/${gift.id}`);
          setFeedback({ tone: "success", message: `Deleted ${gift.name}.` });
          await loadGifts();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to delete gift" }));
          return false;
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
        <span className="text-xs font-medium uppercase text-white/52">
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
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            Edit
          </button>
          <button
            onClick={() => toggleGift(row)}
            className={`text-sm font-medium ${
              row.is_active
                ? "text-amber-300 hover:text-amber-200"
                : "text-emerald-300 hover:text-emerald-200"
            }`}
          >
            {row.is_active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => deleteGift(row)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Gifts</h1>
          <p className="mt-2 text-sm text-white/58">Manage the interactive gift catalog used across live channels and streams.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {filtered.length} gift{filtered.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => setEditing({})}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            + Add Gift
          </button>
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <input
          type="text"
          placeholder="Search gifts by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
      </div>

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadGifts} className="ml-3 underline">
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
        <DataTable columns={columns} rows={filtered} emptyMessage="No gifts found" />
      )}

      {editing !== null && (
        <GiftForm
          gift={editing}
          onClose={() => {
            setEditing(null);
            loadGifts();
          }}
        />
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
