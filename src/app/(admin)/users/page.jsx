"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import UserDrawer from "@/components/users/UserDrawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function UsersPage() {
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((ids, selectAll) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selectAll) {
        ids.forEach((id) => next.add(id));
      } else {
        ids.forEach((id) => next.delete(id));
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/users?sort=created_at_desc");
      setUsers((res.users ?? []).map((user) => ({ ...user, uid: user.id })));
      setTotalUsers(res.total ?? res.users?.length ?? 0);
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

  useEffect(() => {
    const uid = searchParams.get("uid");
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await api.get(`/admin/users/${encodeURIComponent(uid)}/detail`);
        if (!cancelled && detail?.user) {
          setSelected({ ...detail.user, id: uid, uid });
        }
      } catch {
        if (!cancelled) {
          setSearch(uid);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [searchParams]);

  useEffect(() => {
    if (!search || search.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(`/admin/users/search?q=${encodeURIComponent(search.trim())}`);
        setSearchResults((res.users ?? []).map((u) => ({ ...u, uid: u.id })));
      } catch {
        setSearchResults(null);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = searchResults
    ? searchResults
    : users.filter((u) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.uid && u.uid.toLowerCase().includes(q)) ||
          (u.role && u.role.toLowerCase().includes(q)) ||
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.firstName && u.firstName.toLowerCase().includes(q)) ||
          (u.lastName && u.lastName.toLowerCase().includes(q)) ||
          (u.vpinId && u.vpinId.toLowerCase().includes(q)) ||
          (u.mobile && u.mobile.toLowerCase().includes(q))
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
        <div className="flex items-center gap-3">
          {(row.avatar_url || row.profilePicture) ? (
            <img src={row.avatar_url || row.profilePicture} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(row.name || row.email || "?")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-medium text-white">{row.name || [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email || "Unknown"}</div>
            <div className="text-xs text-white/45">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: "referralSource",
      label: "Source",
      render: (row) => (
        <span className="text-sm text-white/58">
          {row.referralSource === "Other, please specify" && row.referralSourceDetail
            ? row.referralSourceDetail
            : row.referralSource || "—"}
        </span>
      ),
    },
    { key: "role", label: "Role" },
    {
      key: "phoneNumber",
      label: "Phone",
      render: (row) => (
        <span className="text-sm text-white/58">{row.phoneNumber || row.mobile || "—"}</span>
      ),
    },
    {
      key: "created_at",
      label: "Joined",
      render: (row) => {
        if (!row.created_at) return <span className="text-sm text-white/42">—</span>;
        const d = new Date(row.created_at);
        return (
          <span className="text-sm text-white/58">
            {d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
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
      key: "banned",
      label: "Status",
      render: (row) => {
        if (row.is_banned) return <StatusBadge status="banned" />;
        if (row.wallet_frozen) return <StatusBadge status="frozen" />;
        return <StatusBadge status={row.deleted_at ? "deleted" : "active"} />;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelected(row)}
            className="text-xs font-medium text-sky-300 hover:text-sky-200"
          >
            View
          </button>
          {row.is_banned ? (
            <button
              onClick={async () => {
                try {
                  await api.post(`/admin/users/${row.uid}/unban`, {});
                  setFeedback({ tone: "success", message: `Unbanned ${row.email || row.name}` });
                  await loadUsers();
                } catch (err) {
                  setFeedback({ tone: "error", message: err.message || "Failed to unban" });
                }
              }}
              className="text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              Unban
            </button>
          ) : (
            <button
              onClick={async () => {
                try {
                  await api.post(`/admin/users/${row.uid}/ban`, {});
                  setFeedback({ tone: "success", message: `Banned ${row.email || row.name}` });
                  await loadUsers();
                } catch (err) {
                  setFeedback({ tone: "error", message: err.message || "Failed to ban" });
                }
              }}
              className="text-xs font-medium text-amber-300 hover:text-amber-200"
            >
              Ban
            </button>
          )}
          <button
            onClick={() => {
              setConfirm({
                title: "Delete User",
                message: `Delete ${row.email || row.name}? This removes the user from active admin operations and blocks future login while preserving historical records.`,
                destructive: true,
                busy: false,
                error: null,
                confirmLabel: "Delete User",
                action: async () => {
                  setConfirm((c) => ({ ...c, busy: true, error: null }));
                  try {
                    await api.delete(`/admin/users/${row.uid}`);
                    setFeedback({ tone: "success", message: `Deleted ${row.email || row.name}` });
                    await loadUsers();
                    return true;
                  } catch (err) {
                    setConfirm((c) => ({ ...c, busy: false, error: err.message || "Failed to delete user" }));
                    return false;
                  }
                },
              });
            }}
            className="text-xs font-medium text-red-300 hover:text-red-200"
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
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {search ? `${filtered.length} of ${totalUsers}` : `${totalUsers}`} users
          </span>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, UID, VPin ID, mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[var(--av-light-orange)]" />
            </div>
          )}
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
        <>
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-[var(--av-orange)]/30 bg-[var(--av-orange)]/[0.08] px-4 py-3">
              <span className="text-sm font-medium text-white">
                {selectedIds.size} user{selectedIds.size !== 1 ? "s" : ""} selected
              </span>
              <button
                onClick={() => {
                  setConfirm({
                    title: "Ban Selected Users",
                    message: `Ban ${selectedIds.size} user${selectedIds.size !== 1 ? "s" : ""}? They will be blocked from logging in.`,
                    destructive: true,
                    busy: false,
                    error: null,
                    confirmLabel: "Ban Selected",
                    action: async () => {
                      setConfirm((c) => ({ ...c, busy: true, error: null }));
                      setBulkLoading(true);
                      try {
                        let ok = 0, fail = 0;
                        for (const uid of selectedIds) {
                          try {
                            await api.post(`/admin/users/${uid}/ban`, {});
                            ok++;
                          } catch { fail++; }
                        }
                        setFeedback({ tone: "success", message: `Banned ${ok} user(s)${fail > 0 ? `, ${fail} failed` : ""}` });
                        clearSelection();
                        await loadUsers();
                        return true;
                      } catch (err) {
                        setConfirm((c) => ({ ...c, busy: false, error: err.message || "Bulk ban failed" }));
                        return false;
                      } finally { setBulkLoading(false); }
                    },
                  });
                }}
                disabled={bulkLoading}
                className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20 disabled:opacity-50"
              >
                Ban Selected
              </button>
              <button
                onClick={() => {
                  setConfirm({
                    title: "Delete Selected Users",
                    message: `Delete ${selectedIds.size} user${selectedIds.size !== 1 ? "s" : ""}? This removes them from active admin operations and blocks future login while preserving historical records. This action cannot be undone.`,
                    destructive: true,
                    busy: false,
                    error: null,
                    confirmLabel: "Delete Selected",
                    action: async () => {
                      setConfirm((c) => ({ ...c, busy: true, error: null }));
                      setBulkLoading(true);
                      try {
                        let ok = 0, fail = 0;
                        for (const uid of selectedIds) {
                          try {
                            await api.delete(`/admin/users/${uid}`);
                            ok++;
                          } catch { fail++; }
                        }
                        setFeedback({ tone: "success", message: `Deleted ${ok} user(s)${fail > 0 ? `, ${fail} failed` : ""}` });
                        clearSelection();
                        await loadUsers();
                        return true;
                      } catch (err) {
                        setConfirm((c) => ({ ...c, busy: false, error: err.message || "Bulk delete failed" }));
                        return false;
                      } finally { setBulkLoading(false); }
                    },
                  });
                }}
                disabled={bulkLoading}
                className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                Delete Selected
              </button>
              <button
                onClick={clearSelection}
                disabled={bulkLoading}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/60 transition hover:text-white disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          )}
          <DataTable
            columns={columns}
            rows={filtered}
            emptyMessage="No users found"
            storageKey="admin-users"
            selectable
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            getRowId={(row) => row.uid}
          />
        </>
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
