"use client";

import { useRef, useState } from "react";
import { ods, formatNgn, formatVpt, formatDate } from "@/services/ods";
import { Button, Card, ErrorNote, OdsHeader, Spinner, Stat, useAsync } from "@/components/ods/OdsUi";

const TYPE_LABELS = {
  reward_download: "Download rewards",
  reward_streak: "Streak rewards",
  reward_ad: "Ad rewards",
  reward_referral: "Referral rewards",
  voucher_vpt: "vPT vouchers",
  admin_adjustment: "Admin adjustments",
  subscription_vpt: "Plans paid with vPT",
  premium_link: "Premium links",
  streak_penalty: "Streak penalties",
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

export default function OdsDashboardPage() {
  const [days, setDays] = useState(30);
  // "Refresh" bypasses the 5-minute server cache for that one load only.
  const freshRef = useRef(false);
  const { data, loading, error, reload } = useAsync(() => {
    const fresh = freshRef.current;
    freshRef.current = false;
    return ods.dashboard(days, fresh);
  }, [days]);

  const d = data;
  const conv = d && d.trials.started ? Math.round((d.trials.converted / d.trials.started) * 100) : null;

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Dashboard" subtitle="Users, Pro subscriptions, revenue and vPT flows for the Obroh Download Suite app.">
        <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
          {[7, 30, 90].map((n) => (
            <button
              key={n}
              onClick={() => setDays(n)}
              className={`rounded-xl px-3 py-1.5 text-sm ${days === n ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}
            >
              {n}d
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            freshRef.current = true;
            reload();
          }}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </OdsHeader>

      <ErrorNote error={error} onRetry={reload} />
      {loading && !d ? <Spinner /> : null}

      {d ? (
        <>
          <p className="text-xs text-white/40">
            Generated {formatDate(d.generatedAt)} · figures may be up to 5 minutes old.
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Daily active" value={d.users.dau.toLocaleString()} hint={`${d.users.wau.toLocaleString()} weekly`} />
            <Stat label="Monthly active" value={d.users.mau.toLocaleString()} hint={`${d.users.total.toLocaleString()} accounts total`} />
            <Stat label={`Revenue (${d.rangeDays}d)`} value={formatNgn(d.revenueNgn)} hint={`${d.paidCharges} Paystack charges`} tone="good" />
            <Stat label="Public pool" value={formatVpt(d.publicPool.totalVpt)} hint={`${d.publicPool.contributionCount} contributions`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Active Pro" subtitle="Right now, by plan">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Weekly" value={d.activePro.weekly} />
                <Stat label="Monthly" value={d.activePro.monthly} />
                <Stat label="Yearly" value={d.activePro.yearly} />
                <Stat label="Lifetime" value={d.activePro.lifetime} />
                <Stat label="On trial" value={d.activePro.trial} tone="warn" />
                <Stat label="Paid total" value={d.activePro.total} tone="good" />
              </div>
            </Card>
            <Card title="Trials" subtitle={`Last ${d.rangeDays} days`}>
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Started" value={d.trials.started} />
                <Stat label="Converted" value={d.trials.converted} tone="good" />
                <Stat label="Conversion" value={conv === null ? "—" : `${conv}%`} />
              </div>
              <p className="mt-3 text-xs text-white/40">A conversion is a user's first paid plan (Paystack or vPT) after using their trial.</p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="vPT issued" subtitle={`Credited to users, last ${d.rangeDays} days`}>
              <TypeBars data={d.vpt.issuedByType} tone="bg-emerald-400/70" />
            </Card>
            <Card title="vPT spent" subtitle={`Debited from users, last ${d.rangeDays} days`}>
              <TypeBars data={d.vpt.spentByType} tone="bg-[var(--av-orange)]/80" />
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
