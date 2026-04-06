"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import UserDrawer from "@/components/users/UserDrawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users");
      setUsers((res.users ?? []).map((user) => ({ ...user, uid: user.id })));
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.uid && u.uid.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  function requestCleanupDuplicates() {
    setConfirm({
      title: "Clean Duplicate Accounts",
      message: "This will find all accounts with the same email address and remove duplicates, keeping only the original (oldest) account. This action cannot be undone.",
      busy: false,
      error: null,
      confirmLabel: "Remove Duplicates",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          const res = await api.post("/admin/users/cleanup/duplicates", {});
          setFeedback({ tone: "success", message: res.message || `Removed ${res.removed} duplicate(s)` });
          await loadUsers();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Cleanup failed" }));
          return false;
        }
      },
    });
  }

  function requestCleanupEmpty() {
    setConfirm({
      title: "Remove Empty Accounts",
      message: "This will permanently delete accounts that have no email, no name, no balance, and no meaningful user data. This action cannot be undone.",
      busy: false,
      error: null,
      confirmLabel: "Remove Empty",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          const res = await api.post("/admin/users/cleanup/empty", {});
          setFeedback({ tone: "success", message: res.message || `Removed ${res.removed} empty account(s)` });
          await loadUsers();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Cleanup failed" }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "identity",
      label: "User",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.name || row.email}</div>
          <div className="text-xs text-white/45">{row.email}</div>
        </div>
      ),
    },
    { key: "role", label: "Role" },
    {
      key: "kyc_status",
      label: "KYC",
      render: (row) => <StatusBadge status={row.kyc_status} />,
    },
    {
      key: "premium",
      label: "Premium",
      render: (row) => <StatusBadge status={row.is_premium_creator ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => setSelected(row)}
          className="text-sm font-medium text-sky-300 hover:text-sky-200"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Users</h1>
          <p className="mt-2 text-sm text-white/58">Review platform members, adjust access, and inspect wallet activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={requestCleanupDuplicates}
            className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20"
          >
            Clean Duplicates
          </button>
          <button
            onClick={requestCleanupEmpty}
            className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20"
          >
            Remove Empty
          </button>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">{filtered.length} users</span>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <input
          type="text"
          placeholder="Search by email, UID, or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
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
          <button onClick={loadUsers} className="ml-3 underline">
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
        <DataTable columns={columns} rows={filtered} emptyMessage="No users found" />
      )}

      <UserDrawer
        user={selected}
        onUpdated={loadUsers}
        onDeleted={(message) => setFeedback({ tone: "success", message })}
        onClose={() => {
          setSelected(null);
        }}
      />

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
