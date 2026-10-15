"use client";

import StatusBadge from "@/components/ui/StatusBadge";

// OMS pages reuse the ODS building blocks unchanged; only the page header names the app.
export { Button, Card, ErrorNote, Field, ReasonDialog, Spinner, Stat, inputClass, useAsync } from "@/components/ods/OdsUi";

/** Page header for OMS- pages. */
export function OmsHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--av-light-orange)]/85">Obroh Media Suite</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-white/58">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Must match the app (SupportRepo.CATEGORIES) and the server (support.js). */
export const OMS_CATEGORIES = {
  playback: "A video or song won't play",
  download: "A download failed",
  payment: "Payment or plan",
  voucher: "Voucher",
  wallet: "vPT, streak or referrals",
  account: "Account or profile",
  share: "Posting to YouTube/TikTok/Instagram",
  bug: "Something isn't working",
  feedback: "Suggestion",
  other: "Something else",
};

/** "free" / "plus (trial)" / "studio" — what the user can use right now. */
export function PlanBadge({ u }) {
  if (!u.exists) return <StatusBadge status="deleted" />;
  const label = u.trialRunning && u.plan === "free" ? "trial" : u.effectivePlan;
  const tone = u.disabled ? "disabled" : label === "free" ? "none" : label === "trial" ? "pending" : "active";
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusBadge status={tone} />
      <span className="text-xs capitalize text-white/60">{u.disabled ? "disabled" : label}</span>
    </span>
  );
}
