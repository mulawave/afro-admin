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
  const [debitAmount, setDebitAmount] = useState("");
  const [debitCurrency, setDebitCurrency] = useState("ngn");

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
      setLedger(Array.isArray(l.entries) ? l.entries : []);
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

  /** Restrictive action: confirm dialog with a required reason (audited server-side). */
  function reasonedAction({ title, message, confirmLabel, destructive = true, call, success }) {
    setConfirm({
      title,
      message,
      destructive,
      busy: false,
      error: null,
      confirmLabel,
      requireReason: true,
      action: async (reason) => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          await call(reason);
          setFeedback({ tone: "success", message: success });
          await loadDetail();
          if (onUpdated) await onUpdated();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Action failed" }));
          return false;
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function debitUserAssets() {
    const amt = parseFloat(debitAmount);
    if (!amt || amt <= 0) { setFeedback({ tone: "error", message: "Enter a valid amount" }); return; }
    setConfirm({
      title: "Debit User Assets",
      message: `Debit ${debitCurrency.toUpperCase()} ${amt.toLocaleString()} from ${user?.email}'s balance? This moves money and cannot be undone from here.`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Debit",
      requireReason: true,
      action: async (reason) => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          await api.post(`/admin/users/${userId}/debit`, { amount: amt, currency: debitCurrency, reason });
          setFeedback({ tone: "success", message: `Debited ${debitCurrency.toUpperCase()} ${amt.toLocaleString()} successfully.` });
          setDebitAmount("");
          await loadDetail(); await loadWallet();
          if (onUpdated) await onUpdated();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Debit failed" }));
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
      requireReason: true,
      action: async (reason) => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        setActionLoading(true);
        try {
          const res = await api.delete(`/admin/users/${userId}`, { reason });
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
    : user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "—";

  const profilePic = detail?.profilePicture || detail?.avatar_url || user?.avatar_url || user?.profilePicture;

  return (
    <>
      <Drawer open={Boolean(user)} onClose={onClose} title="User Details" width="max-w-5xl">
        {user && (
          <div className="space-y-5">
            {/* Enhanced Header */}
            <div className="flex items-center gap-4">
              {profilePic ? (
                <a href={profilePic} target="_blank" rel="noopener noreferrer" className="block shrink-0" title="Click to view full image">
                  <img
                    src={profilePic}
                    alt={displayName}
                    className="h-14 w-14 rounded-full border-2 border-white/10 object-cover transition hover:border-[var(--av-light-orange)] hover:ring-2 hover:ring-[var(--av-light-orange)]/30"
                  />
                </a>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] text-sm font-bold text-[var(--av-dark-blue)]">
                  {(displayName?.[0] || user?.email?.[0] || "?").toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-lg font-semibold text-white">{displayName}</p>
                  {detail?.online && (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-emerald-400/20" />
                  )}
                </div>
                <p className="text-xs text-white/45">{detail?.email || user?.email}</p>
                <p className="font-mono text-[11px] text-white/30">UID: {userId}</p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-medium capitalize text-white/60">
                  {detail?.role || user.role || "viewer"}
                </span>
                {detail?.isVerified && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-200">Verified</span>
                )}
                {(detail || user)?.is_banned && (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-[11px] font-medium text-red-200">Banned</span>
                )}
                {(detail || user)?.wallet_frozen && (
                  <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-medium text-sky-200">Wallet Frozen</span>
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

            {/* Admin Controls */}
            {!loading && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-white/78">Admin Controls</h3>

                {/* Ban / Unban */}
                <div className="flex flex-wrap items-center gap-3">
                  {((detail || user)?.is_banned) ? (
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await api.post(`/admin/users/${userId}/unban`, {});
                          setFeedback({ tone: "success", message: "User unbanned." });
                          await loadDetail();
                          if (onUpdated) await onUpdated();
                        } catch (err) {
                          setFeedback({ tone: "error", message: err.message || "Failed to unban" });
                        } finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                    >Unban User</button>
                  ) : (
                    <button
                      onClick={() => reasonedAction({
                        title: "Ban User",
                        message: `Ban ${user?.email}? They'll be blocked from the platform until unbanned.`,
                        confirmLabel: "Ban User",
                        call: (reason) => api.post(`/admin/users/${userId}/ban`, { reason }),
                        success: "User banned.",
                      })}
                      disabled={actionLoading}
                      className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                    >Ban User</button>
                  )}
                </div>

                {/* Wallet & Withdrawal Controls */}
                <div className="flex flex-wrap gap-2">
                  {((detail || user)?.wallet_frozen) ? (
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await api.post(`/admin/users/${userId}/unfreeze-wallet`, {});
                          setFeedback({ tone: "success", message: "Wallet unfrozen." });
                          await loadDetail();
                          if (onUpdated) await onUpdated();
                        } catch (err) { setFeedback({ tone: "error", message: err.message }); }
                        finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                    >Unfreeze Wallet</button>
                  ) : (
                    <button
                      onClick={() => reasonedAction({
                        title: "Freeze Wallet",
                        message: `Freeze ${user?.email}'s wallet? No money can move in or out until it's unfrozen.`,
                        confirmLabel: "Freeze Wallet",
                        call: (reason) => api.post(`/admin/users/${userId}/freeze-wallet`, { reason }),
                        success: "Wallet frozen.",
                      })}
                      disabled={actionLoading}
                      className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/20 disabled:opacity-50"
                    >Freeze Wallet</button>
                  )}
                  {((detail || user)?.withdrawal_banned) ? (
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await api.post(`/admin/users/${userId}/unban-withdrawal`, {});
                          setFeedback({ tone: "success", message: "Withdrawals re-enabled." });
                          await loadDetail();
                          if (onUpdated) await onUpdated();
                        } catch (err) { setFeedback({ tone: "error", message: err.message }); }
                        finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                    >Unban Withdrawals</button>
                  ) : (
                    <button
                      onClick={() => reasonedAction({
                        title: "Ban Withdrawals",
                        message: `Stop ${user?.email} from withdrawing funds until re-enabled?`,
                        confirmLabel: "Ban Withdrawals",
                        call: (reason) => api.post(`/admin/users/${userId}/ban-withdrawal`, { reason }),
                        success: "Withdrawals banned.",
                      })}
                      disabled={actionLoading}
                      className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                    >Ban Withdrawals</button>
                  )}
                  {((detail || user)?.channel_creation_banned) ? (
                    <button
                      onClick={async () => {
                        setActionLoading(true);
                        try {
                          await api.post(`/admin/users/${userId}/unban-channel-creation`, {});
                          setFeedback({ tone: "success", message: "Channel creation re-enabled." });
                          await loadDetail();
                          if (onUpdated) await onUpdated();
                        } catch (err) { setFeedback({ tone: "error", message: err.message }); }
                        finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                    >Unban Channel Creation</button>
                  ) : (
                    <button
                      onClick={() => reasonedAction({
                        title: "Ban Channel Creation",
                        message: `Stop ${user?.email} from creating channels until re-enabled?`,
                        confirmLabel: "Ban Channel Creation",
                        call: (reason) => api.post(`/admin/users/${userId}/ban-channel-creation`, { reason }),
                        success: "Channel creation banned.",
                      })}
                      disabled={actionLoading}
                      className="rounded-xl border border-purple-400/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/20 disabled:opacity-50"
                    >Ban Channel Creation</button>
                  )}
                </div>

                {/* Debit Assets */}
                <div className="border-t border-white/8 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/42">Debit User Assets</p>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-[11px] text-white/42 mb-1">Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={debitAmount}
                        onChange={(e) => setDebitAmount(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32"
                      />
                    </div>
                    <div className="min-w-[100px]">
                      <label className="block text-[11px] text-white/42 mb-1">Currency</label>
                      <select
                        value={debitCurrency}
                        onChange={(e) => setDebitCurrency(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
                      >
                        <option value="ngn" className="bg-[var(--admin-surface)]">NGN (Cash)</option>
                        <option value="vpt" className="bg-[var(--admin-surface)]">VPT</option>
                        <option value="coins" className="bg-[var(--admin-surface)]">Coins</option>
                      </select>
                    </div>
                    <button
                      onClick={debitUserAssets}
                      disabled={actionLoading}
                      className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                    >Debit</button>
                  </div>
                </div>
              </div>
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
        requireReason={Boolean(confirm?.requireReason)}
        onCancel={() => setConfirm(null)}
        onConfirm={async (reason) => {
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action(reason);
          if (shouldClose !== false) {
            setConfirm(null);
          }
        }}
      />
    </>
  );
}
