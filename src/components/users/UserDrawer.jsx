"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";
import UserDetailTabs from "@/components/users/UserDetailTabs";
import OverviewTab from "@/components/users/OverviewTab";
import EconomyTab from "@/components/users/EconomyTab";
import ActivityTab from "@/components/users/ActivityTab";
import EngagementTab from "@/components/users/EngagementTab";
import SystemTab from "@/components/users/SystemTab";

export default function UserDrawer({ user, onClose, onUpdated, onDeleted }) {
  const router = useRouter();
  const [detail, setDetail] = useState(null);
  const [subcollections, setSubcollections] = useState({});
  const [wallet, setWallet] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [role, setRole] = useState("viewer");
  const [kycStatus, setKycStatus] = useState("none");
  const [isPremium, setIsPremium] = useState(false);
  const [navLoading, setNavLoading] = useState(false);

  const userId = user?.id ?? user?.uid;

  const loadDetail = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await api.get(`/admin/users/${userId}/detail`);
      setDetail(res.user || null);
      setSubcollections(res.subcollections || {});
    } catch {
      setDetail(user);
      setSubcollections({});
    } finally {
      setLoading(false);
    }
  }, [userId, user]);

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    setWalletLoading(true);
    try {
      const [w, l] = await Promise.all([
        api.get(`/admin/users/${userId}/wallet`),
        api.get(`/withdrawals/admin/user/${userId}/transactions`),
      ]);
      setWallet(w.wallet ?? w);
      setLedger(l.entries ?? []);
    } catch {
      setWallet(null);
      setLedger([]);
    } finally {
      setWalletLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (user) {
      setDetail(null);
      setSubcollections({});
      setWallet(null);
      setLedger([]);
      setActiveTab("overview");
      setRole(user.role || "viewer");
      setKycStatus(user.kyc_status || "none");
      setIsPremium(Boolean(user.is_premium_creator));
      setFeedback(null);
      loadDetail();
      loadWallet();
    }
  }, [user, loadDetail, loadWallet]);

  function updateUserAccess() {
    setConfirm({
      title: "Update User Access",
      message: `Apply role, KYC, and premium changes for ${user?.email}?`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: "Apply Changes",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          await Promise.all([
            api.post("/admin/set-role", { userId, role }),
            api.post("/admin/set-kyc", { userId, kycStatus }),
            api.post("/admin/set-premium", { userId, isPremium }),
          ]);
          setFeedback({ tone: "success", message: `Saved access changes for ${user?.email}.` });
          if (onUpdated) await onUpdated();
          await loadDetail();
          await loadWallet();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to update user access" }));
          return false;
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function deleteUser() {
    setConfirm({
      title: "Delete User",
      message: `Delete ${user?.email}? This removes the user from active admin operations and blocks future login while preserving historical records.`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Delete User",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          const res = await api.delete(`/admin/users/${userId}`);
          if (onUpdated) await onUpdated();
          if (onDeleted) onDeleted(res.message || `Deleted ${user?.email}.`);
          if (onClose) onClose();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to delete user" }));
          return false;
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  const displayName = detail
    ? [detail.firstName, detail.middleName, detail.lastName].filter(Boolean).join(" ") || detail.name || detail.email
    : user?.name || user?.email || "—";

  const profilePic = detail?.profilePicture;

  return (
    <>
      <Drawer open={Boolean(user)} onClose={onClose} title="User Details" width="max-w-5xl">
        {user && (
          <div className="space-y-5">
            {/* Enhanced Header */}
            <div className="flex items-center gap-4">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={displayName}
                  className="h-14 w-14 rounded-full border-2 border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] text-sm font-bold text-[var(--av-dark-blue)]">
                  {(user.email?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                  {detail?.online && (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                  )}
                </div>
                <p className="text-xs text-white/45">{user.email}</p>
                <p className="font-mono text-[11px] text-white/30">UID: {userId}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-medium capitalize text-white/60">
                  {detail?.role || user.role || "viewer"}
                </span>
                {detail?.isVerified && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">Verified</span>
                )}
              </div>
            </div>

            <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

            {/* Tabs */}
            <UserDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--av-light-orange)] border-t-transparent" />
              </div>
            )}

            {/* Tab Content */}
            {!loading && (
              <>
                {activeTab === "overview" && (
                  <OverviewTab
                    detail={detail || user}
                    role={role}
                    setRole={setRole}
                    kycStatus={kycStatus}
                    setKycStatus={setKycStatus}
                    isPremium={isPremium}
                    setIsPremium={setIsPremium}
                  />
                )}

                {activeTab === "economy" && (
                  <EconomyTab
                    detail={detail || user}
                    wallet={wallet}
                    walletLoading={walletLoading}
                    ledger={ledger}
                    user={user}
                    onWalletUpdate={loadWallet}
                  />
                )}

                {activeTab === "activity" && (
                  <ActivityTab subcollections={subcollections} />
                )}

                {activeTab === "engagement" && (
                  <EngagementTab detail={detail || user} subcollections={subcollections} />
                )}

                {activeTab === "system" && (
                  <SystemTab detail={detail || user} subcollections={subcollections} />
                )}
              </>
            )}

            {/* Action buttons — always visible */}
            <div className="sticky bottom-0 border-t border-white/8 bg-[var(--admin-surface-strong)] pt-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setNavLoading(true);
                    router.push(`/communication?recipient=${encodeURIComponent(userId)}`);
                  }}
                  disabled={navLoading || actionLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10 disabled:opacity-50"
                >
                  {navLoading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />}
                  Send Notice
                </button>
                <button
                  onClick={updateUserAccess}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
                >
                  {actionLoading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--av-dark-blue)]/30 border-t-[var(--av-dark-blue)]/80" />}
                  {actionLoading ? "Saving..." : "Apply Changes"}
                </button>
                <button
                  onClick={deleteUser}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/16 disabled:opacity-50"
                >
                  {actionLoading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200/30 border-t-red-200/80" />}
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title ?? ""}
        message={confirm?.message ?? ""}
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
    </>
  );
}
