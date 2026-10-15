"use client";

import { useRef, useState } from "react";
import { oms, formatNgn, formatVpt, formatDate } from "@/services/oms";
import { Button, Card, ErrorNote, OmsHeader, Spinner, Stat, useAsync } from "@/components/oms/OmsUi";

const TYPE_LABELS = {
  topup: "Paystack top-ups",
  streak: "Streak rewards",
  referral_signup: "Referral bonuses",
  referral_sub: "Referral subscription share",
  voucher_vpt: "vPT vouchers",
  admin_adjustment: "Admin adjustments",
  subscription: "Plans paid with vPT",
  streak_forfeit: "Streak forfeits",
};

function TypeBars({ data, tone }) {
  const rows = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...rows.map(([, v]) => v), 0);
  if (!rows.length) return <p className="text-sm text-white/40">Nothing in this period.</p>;
  return (
    <ul className="space-y-3">
      {rows.map(([type, v]) => (
        <li key={type}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-white/75">{TYPE_LABELS[type] || type}</span>
            <span className="font-mono tabular-nums text-white">{formatVpt(v)}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/6">
            <div className={`h-1.5 rounded-full ${tone}`} style={{ width: `${max ? Math.max(2, (v / max) * 100) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function OmsDashboardPage() {
  const [days, setDays] = useState(30);
  // "Refresh" bypasses the 5-minute server cache for that one load only.
  const freshRef = useRef(false);
  const { data: d, loading, error, reload } = useAsync(() => {
    const fresh = freshRef.current;
    freshRef.current = false;
    return Promise.all([oms.dashboard(days, fresh), oms.config().catch(() => null)]).then(([dash, config]) => ({ ...dash, config }));
  }, [days]);

  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Dashboard" subtitle="Users, plans, revenue, vPT flows and support for the Obroh Media Suite app.">
        <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
          {[7, 30, 90].map((n) => (
            <button key={n} onClick={() => setDays(n)} className={`rounded-xl px-3 py-1.5 text-sm ${days === n ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}>
              {n}d
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => { freshRef.current = true; reload(); }} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </OmsHeader>

      <ErrorNote error={error} onRetry={reload} />
      {loading && !d ? <Spinner /> : null}

      {d ? (
        <>
          <p className="text-xs text-white/40">Generated {formatDate(d.generatedAt)} · figures may be up to 5 minutes old.</p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <a href="/oms-support" className="block"><Stat label="Open support tickets" value={d.support.open} tone={d.support.open ? "warn" : "default"} hint="Open OMS-Support" /></a>
            <a href="/oms-support" className="block"><Stat label="Unread tickets" value={d.support.unread} tone={d.support.unread ? "warn" : "default"} hint="Waiting for a reply" /></a>
            <Stat label={`Revenue (${d.rangeDays}d)`} value={formatNgn(d.revenueNgn)} hint={`${d.paidCharges} Paystack top-ups`} tone="good" />
            <Stat label="Public pool" value={formatVpt(d.publicPoolVpt)} hint="From broken streaks" />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Daily active" value={d.users.dau.toLocaleString()} hint={`${d.users.wau.toLocaleString()} weekly`} />
            <Stat label="Monthly active" value={d.users.mau.toLocaleString()} hint={`${d.users.total.toLocaleString()} accounts total`} />
            <Stat label="Paid plans now" value={d.plans.paid} hint={`${d.plans.plus} Plus · ${d.plans.studio} Studio`} tone="good" />
            <Stat label="On trial now" value={d.plans.onTrial} tone="warn" />
          </div>

          {d.vpt?.unavailable ? (
            <Card title="vPT flows"><p className="text-sm text-white/50">{d.vpt.unavailable}</p></Card>
          ) : d.vpt ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="vPT credited" subtitle={`To users, last ${d.rangeDays} days`}><TypeBars data={d.vpt.credited} tone="bg-emerald-400/70" /></Card>
              <Card title="vPT spent" subtitle={`From users, last ${d.rangeDays} days`}><TypeBars data={d.vpt.spent} tone="bg-[var(--av-orange)]/80" /></Card>
            </div>
          ) : null}

          {d.config ? (
            <Card title="Pricing and rules" subtitle={d.config.note}>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat label="vPT rate" value={`₦${d.config.vptNairaRate} = 1 vPT`} />
                {d.config.plans.filter((p) => p.id !== "free").map((p) => (
                  <Stat key={p.id} label={`${p.id} (${p.days} days)`} value={formatNgn(p.naira)} hint={p.id === "studio" && !d.config.studioEnabled ? "Not on sale yet" : null} />
                ))}
                <Stat label="Trial" value={`${d.config.trialDays} days`} hint={`Referral: ${d.config.referral.signupVpt} vPT + ${Math.round(d.config.referral.subscriptionShare * 100)}%`} />
              </div>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
