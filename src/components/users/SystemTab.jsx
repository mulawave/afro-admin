"use client";

import { useState } from "react";

export default function SystemTab({ detail, subcollections }) {
  const u = detail || {};
  const fcmTokens = subcollections?.fcm_tokens?.items || [];
  const membership = subcollections?.membership?.items || [];
  const memoryBank = subcollections?.memory_bank?.items || [];
  const walletSummary = subcollections?.wallet_summary?.items || [];

  const onboarding = u.onboarding && typeof u.onboarding === "object" ? u.onboarding : {};
  const membershipStatus = membership.find((m) => m._id === "status");
  const walletBal = walletSummary.find((w) => w._id === "balance");

  return (
    <div className="space-y-5">
      {/* Admin Flags */}
      <Section title="Admin Flags">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <FlagBadge label="isAdmin" active={u.isAdmin} />
          <FlagBadge label="is_super_admin" active={u.is_super_admin} />
          <FlagBadge label="myngul_admin" active={u.myngul_admin} />
          <FlagBadge label="bpi_admin" active={u.bpi_admin} />
          <FlagBadge label="raven_admin" active={u.raven_admin} />
          <FlagBadge label="afv_enabled" active={u.afv_enabled} />
          <FlagBadge label="is_premium_creator" active={u.is_premium_creator} />
          <FlagBadge label="isVerified" active={u.isVerified} />
        </div>
      </Section>

      {/* App State */}
      <Section title="App State">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetaItem label="Mode" value={u.mode || "—"} />
          <MetaItem label="App State" value={u.appState || "—"} />
          <MetaItem label="Active Screen" value={u.activeScreen || "—"} />
          <MetaItem
            label="Online"
            value={
              <span className={`inline-flex items-center gap-1.5 ${u.online ? "text-emerald-300" : "text-white/55"}`}>
                <span className={`inline-block h-2 w-2 rounded-full ${u.online ? "bg-emerald-400" : "bg-white/30"}`} />
                {u.online ? "Online" : "Offline"}
              </span>
            }
          />
        </div>
      </Section>

      {/* KYC */}
      <Section title="KYC Details">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MetaItem label="Status" value={u.kyc_status || "none"} />
          <MetaItem label="KYC Type" value={u.kyc_type || "—"} />
          <MetaItem label="KYC ID" value={u.kyc_id || "—"} />
          <MetaItem label="KYC 5" value={u.kyc_5 || "—"} />
        </div>
      </Section>

      {/* Onboarding Progress */}
      <Section title="Onboarding Progress">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <StepBadge label="Invite Accepted" done={onboarding.inviteAccepted} />
          <StepBadge label="Pre-Reg Imported" done={onboarding.preRegImported} />
          <StepBadge label="Bank Added" done={onboarding.bankAdded} />
          <StepBadge label="Photo Uploaded" done={onboarding.photoUploaded} />
          <StepBadge label="Address Confirmed" done={onboarding.addressConfirmed} />
          <StepBadge label="PIN Set" done={onboarding.pinSet} />
        </div>
        {onboarding.completedAt && (
          <p className="mt-2 text-xs text-emerald-300/70">Completed: {fmtDate(onboarding.completedAt)}</p>
        )}
      </Section>

      {/* Membership */}
      {membershipStatus && (
        <Section title="Membership">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <MetaItem label="Plan ID" value={membershipStatus.planId || "—"} />
            <MetaItem label="Status" value={membershipStatus.status || "—"} />
            <MetaItem label="Auto Renew" value={membershipStatus.autoRenew ? "Yes" : "No"} />
            <MetaItem label="Expires" value={fmtDate(membershipStatus.expiresAt)} />
          </div>
        </Section>
      )}

      {/* Memory Bank */}
      {memoryBank.length > 0 && (
        <Section title="Memory Bank">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {memoryBank.map((m, i) => (
              <div key={m._id || i}>
                <MetaItem label="Address" value={m.address || "—"} />
                <MetaItem label="Items" value={m.itemCount ?? 0} />
                <MetaItem label="Bytes Used" value={m.bytesUsed ?? 0} />
                <MetaItem label="Auto Deduct" value={m.autoDeduct ? "Yes" : "No"} />
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Wallet Summary */}
      {walletBal && (
        <Section title="Wallet Summary (Subcollection)">
          <div className="grid grid-cols-2 gap-3">
            <MetaItem label="Balance" value={Number(walletBal.balance || 0).toLocaleString("en-NG")} />
            <MetaItem label="Updated" value={fmtDate(walletBal.updatedAt)} />
          </div>
        </Section>
      )}

      {/* FCM Tokens / Devices */}
      <Section title={`Devices (${fcmTokens.length})`}>
        {fcmTokens.length === 0 ? (
          <p className="py-3 text-center text-sm text-white/40">No registered devices</p>
        ) : (
          <div className="space-y-2">
            {fcmTokens.map((tok, i) => (
              <div key={tok._id || i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-sm">
                  {tok.platform === "android" ? "🤖" : tok.platform === "ios" ? "🍎" : "💻"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/80">{tok.deviceModel || tok.platform || "Unknown"}</p>
                  <p className="text-[11px] text-white/40">
                    {tok.osVersion || "—"} · v{tok.appVersion || "?"} · {tok.active ? "Active" : "Inactive"}
                  </p>
                </div>
                <p className="text-[11px] text-white/35">{fmtDate(tok.lastUsed || tok.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/78">{title}</h3>
      {children}
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/42">{label}</p>
      <p className="mt-1 break-all text-sm text-white/80">{typeof value === "string" ? value : value}</p>
    </div>
  );
}

function FlagBadge({ label, active }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium ${
      active
        ? "border-emerald-400/20 bg-emerald-500/8 text-emerald-200"
        : "border-white/8 bg-white/[0.03] text-white/40"
    }`}>
      <span className={`inline-block h-2 w-2 rounded-full ${active ? "bg-emerald-400" : "bg-white/20"}`} />
      {label}
    </div>
  );
}

function StepBadge({ label, done }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border p-2 text-xs font-medium ${
      done
        ? "border-emerald-400/20 bg-emerald-500/8 text-emerald-200"
        : "border-amber-400/20 bg-amber-500/8 text-amber-200"
    }`}>
      <span>{done ? "✓" : "○"}</span>
      {label}
    </div>
  );
}

function fmtDate(val) {
  if (!val) return "—";
  try {
    if (typeof val === "number") {
      const d = new Date(val);
      return isNaN(d.getTime()) ? "—" : d.toLocaleString();
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
}
