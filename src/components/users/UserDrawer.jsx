"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";
import WalletCard from "@/components/users/WalletCard";
import LedgerTable from "@/components/users/LedgerTable";

export default function UserDrawer({ user, onClose }) {
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [w, l] = await Promise.all([
        api.get(`/admin/wallet/${user.uid}`),
        api.get(`/admin/ledger/${user.uid}`),
      ]);
      setWallet(w.data ?? w);
      setLedger(Array.isArray(l) ? l : l.data ?? []);
    } catch {
      // partial data is acceptable
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setWallet(null);
      setLedger([]);
      load();
    }
  }, [user, load]);

  async function suspendUser() {
    setConfirm({
      title: "Suspend User",
      message: `Suspend ${user.email}? They will lose access immediately.`,
      destructive: true,
      action: async () => {
        setActionLoading(true);
        try {
          await api.patch(`/admin/users/${user.uid}/status`, { status: "suspended" });
          onClose();
        } catch {
          // error handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  async function reactivateUser() {
    setActionLoading(true);
    try {
      await api.patch(`/admin/users/${user.uid}/status`, { status: "active" });
      onClose();
    } catch {
      // error handled by api
    } finally {
      setActionLoading(false);
    }
  }

  function deleteUser() {
    setConfirm({
      title: "Delete User",
      message: `Permanently delete ${user.email}? This will delete their wallet, sessions, and archive ledger data. This cannot be undone.`,
      destructive: true,
      action: async () => {
        setActionLoading(true);
        try {
          await api.delete(`/admin/users/${user.uid}`);
          onClose();
        } catch {
          // error handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  return (
    <>
      <Drawer open={Boolean(user)} onClose={onClose} title="User Details" width="max-w-xl">
        {user && (
          <div className="space-y-6">
            {/* Profile Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                  {user.email?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">UID: {user.uid}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">Role:</span>
                <span className="font-medium text-gray-900">{user.role}</span>
                <span className="text-gray-500">Status:</span>
                <StatusBadge status={user.status} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 border-t border-gray-200 pt-4">
              {user.status === "active" && (
                <button
                  onClick={suspendUser}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
              {user.status === "suspended" && (
                <button
                  onClick={reactivateUser}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                >
                  Reactivate
                </button>
              )}
              <button
                onClick={deleteUser}
                disabled={actionLoading}
                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Delete
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
              </div>
            )}

            {/* Wallet */}
            {!loading && wallet && (
              <WalletCard wallet={wallet} user={user} onUpdate={load} />
            )}

            {/* Ledger */}
            {!loading && (
              <LedgerTable data={ledger} />
            )}
          </div>
        )}
      </Drawer>

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
        destructive={confirm?.destructive}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />
    </>
  );
}
