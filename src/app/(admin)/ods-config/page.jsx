"use client";

import { useEffect, useMemo, useState } from "react";
import { ods } from "@/services/ods";
import { Button, Card, ErrorNote, Field, OdsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/ods/OdsUi";

const PLANS = ["weekly", "monthly", "yearly", "lifetime"];
const SWITCHES = [
  ["downloads", "Downloads", "Premium-link downloads and download features"],
  ["payments", "Payments", "Paystack checkout, pay with vPT, redeem month"],
  ["rewards", "Rewards", "Download, streak and ad rewards"],
  ["vouchers", "Vouchers", "Voucher redemption"],
  ["referrals", "Referrals", "Entering codes and referral payouts"],
  ["ads", "Ads", "Rewarded ad credits (Pangle)"],
];

const get = (o, path) => path.split(".").reduce((x, k) => (x == null ? undefined : x[k]), o);
function set(o, path, value) {
  const keys = path.split(".");
  const out = structuredClone(o);
  let cur = out;
  for (const k of keys.slice(0, -1)) cur = cur[k] ??= {};
  cur[keys[keys.length - 1]] = value;
  return out;
}

/** Minimal nested diff: only changed leaves (arrays compared whole). */
function diff(a, b) {
  if (JSON.stringify(a) === JSON.stringify(b)) return undefined;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null || Array.isArray(a) || Array.isArray(b)) return b;
  const out = {};
  for (const k of Object.keys(b)) {
    const d = diff(a[k], b[k]);
    if (d !== undefined) out[k] = d;
  }
  return Object.keys(out).length ? out : undefined;
}

export default function OdsConfigPage() {
  const cfg = useAsync(() => ods.getConfig(), []);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (cfg.data?.effective) setDraft(stripDerived(cfg.data.effective));
  }, [cfg.data]);

  const base = cfg.data ? stripDerived(cfg.data.effective) : null;
  const patch = useMemo(() => (base && draft ? diff(base, draft) || {} : {}), [base, draft]);
  const dirty = Object.keys(patch).length > 0;

  const num = (path, props = {}) => (
    <input
      inputMode="decimal"
      value={get(draft, path) ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft((d) => set(d, path, raw === "" ? "" : Number.isNaN(Number(raw)) ? raw : Number(raw)));
      }}
      className={inputClass}
      {...props}
    />
  );

  if (cfg.loading && !draft) return <Spinner />;
  return (
    <div className="space-y-6 pb-24">
      <OdsHeader title="ODS-Config" subtitle="Everything the app reads from /v1/config. Changes apply to the API within a minute and to apps on their next config fetch." />
      <ErrorNote error={cfg.error} onRetry={cfg.reload} />
      {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p> : null}

      {draft ? (
        <>
          <Card title="Kill switches" subtitle="Off = the feature is disabled for everyone. The API enforces this, not just the app.">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SWITCHES.map(([key, label, hint]) => {
                const on = draft.killSwitches[key] !== false;
                return (
                  <button
                    key={key}
                    onClick={() => setDraft((d) => set(d, `killSwitches.${key}`, !on))}
                    className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${on ? "border-emerald-400/25 bg-emerald-500/[0.07]" : "border-red-400/30 bg-red-500/10"}`}
                  >
                    <span>
                      <span className="block text-sm font-medium text-white">{label}</span>
                      <span className="block text-xs text-white/45">{hint}</span>
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${on ? "bg-emerald-500/20 text-emerald-100" : "bg-red-500/20 text-red-100"}`}>{on ? "ON" : "OFF"}</span>
                  </button>
                );
              })}
            </div>
          </Card>

          <Card title="Pricing" subtitle="NGN is the source of truth; vPT = NGN ÷ peg. USD is display only.">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Peg (₦ per 1 vPT)">{num("pegNgnPerVpt")}</Field>
              <Field label="Trial length (days)">{num("trialDays")}</Field>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.2em] text-white/40">
                    <th className="py-2 pr-3">Plan</th>
                    <th className="py-2 pr-3">NGN</th>
                    <th className="py-2 pr-3">USD (display)</th>
                    <th className="py-2 pr-3">Days</th>
                    <th className="py-2">vPT price</th>
                  </tr>
                </thead>
                <tbody>
                  {PLANS.map((p) => (
                    <tr key={p}>
                      <td className="py-1.5 pr-3 capitalize text-white/80">{p}</td>
                      <td className="py-1.5 pr-3">{num(`plans.${p}.ngn`)}</td>
                      <td className="py-1.5 pr-3">{num(`plans.${p}.usd`)}</td>
                      <td className="py-1.5 pr-3">{p === "lifetime" ? <span className="text-white/40">Never ends</span> : num(`plans.${p}.days`)}</td>
                      <td className="py-1.5 font-mono text-xs text-white/60">{draft.pegNgnPerVpt > 0 ? (draft.plans[p].ngn / draft.pegNgnPerVpt).toFixed(8) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Rewards" subtitle="All amounts in NGN; converted to vPT at the peg.">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/80">Download reward (per link)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pro rate">{num("rewards.download.proNgn")}</Field>
                  <Field label="Free rate">{num("rewards.download.freeNgn")}</Field>
                </div>
                {["pro", "free"].map((t) => (
                  <div key={t} className="grid grid-cols-3 gap-3">
                    {["day", "week", "month"].map((w) => (
                      <Field key={w} label={`${t === "pro" ? "Pro" : "Free"} ${w} cap`}>{num(`rewards.download.${t}Caps.${w}`)}</Field>
                    ))}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-white/80">Streak (Pro)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Base per day">{num("rewards.streak.baseNgn")}</Field>
                  <Field label="Bonus every Nth day">{num("rewards.streak.everyNthDay")}</Field>
                  <Field label="Nth-day multiplier">{num("rewards.streak.nthDayMultiplier")}</Field>
                  <Field label="Month-end multiplier" hint="Wins over the Nth-day bonus">{num("rewards.streak.monthEndMultiplier")}</Field>
                </div>
                <p className="pt-2 text-sm font-medium text-white/80">Other</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Rewarded ad">{num("rewards.ad.ngn")}</Field>
                  <Field label="Ads per day">{num("rewards.ad.dailyCap")}</Field>
                  <Field label="Premium link cost">{num("rewards.premiumLinkNgn")}</Field>
                  <Field label="Referral %" hint="Of each paid plan price">{num("rewards.referralPercent")}</Field>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Free vs Pro limits">
            <div className="grid gap-4 lg:grid-cols-2">
              {["free", "pro"].map((t) => (
                <div key={t} className="space-y-3">
                  <p className="text-sm font-medium capitalize text-white/80">{t}</p>
                  <Field label="Allowed sites" hint={'Comma-separated, or "all"'}>
                    <input
                      value={Array.isArray(draft.limits[t].sites) ? draft.limits[t].sites.join(", ") : draft.limits[t].sites}
                      onChange={(e) => {
                        const v = e.target.value.trim();
                        setDraft((d) => set(d, `limits.${t}.sites`, v.toLowerCase() === "all" ? "all" : v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
                      }}
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Max resolution (p)">{num(`limits.${t}.maxResolution`)}</Field>
                    <Field label="Concurrent downloads">{num(`limits.${t}.concurrentDownloads`)}</Field>
                    <Field label="Auto retries">{num(`limits.${t}.autoRetries`)}</Field>
                    <Field label="Manual retries" hint="Empty = unlimited">
                      <input
                        value={draft.limits[t].manualRetries ?? ""}
                        onChange={(e) => setDraft((d) => set(d, `limits.${t}.manualRetries`, e.target.value === "" ? null : Number(e.target.value)))}
                        className={inputClass}
                      />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-white/75">
                    <input type="checkbox" checked={!!draft.limits[t].backgroundDownloads} onChange={(e) => setDraft((d) => set(d, `limits.${t}.backgroundDownloads`, e.target.checked))} className="accent-[var(--av-orange)]" />
                    Background downloads
                  </label>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Ads (Pangle)">
              <label className="mb-3 flex items-center gap-2 text-sm text-white/75">
                <input type="checkbox" checked={!!draft.ads.enabled} onChange={(e) => setDraft((d) => set(d, "ads.enabled", e.target.checked))} className="accent-[var(--av-orange)]" />
                Ads enabled
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[["pangleAppId", "App ID"], ["bannerSlotId", "Banner slot"], ["bigBannerSlotId", "Big banner slot"], ["rewardedSlotId", "Rewarded slot"], ["interstitialSlotId", "Interstitial slot"]].map(([k, l]) => (
                  <Field key={k} label={l}>
                    <input value={draft.ads[k] ?? ""} onChange={(e) => setDraft((d) => set(d, `ads.${k}`, e.target.value.trim()))} className={`${inputClass} font-mono`} />
                  </Field>
                ))}
                <Field label="Rewarded daily cap">{num("ads.rewardedDailyCap")}</Field>
              </div>
            </Card>
            <Card title="App versions & integrity">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min supported build" hint="Android versionCode. Older builds must update. 0 = off.">{num("minSupportedBuild")}</Field>
                <Field label="Latest build">{num("latestBuild")}</Field>
                <Field label="Renewal reminder (hours before end)">{num("renewalReminderHours")}</Field>
              </div>
              <label className="mt-4 flex items-center gap-2 text-sm text-white/75">
                <input type="checkbox" checked={!!draft.appCheck?.enforce} onChange={(e) => setDraft((d) => set(d, "appCheck.enforce", e.target.checked))} className="accent-[var(--av-orange)]" />
                Enforce App Check (only after the app ships the App Check SDK)
              </label>
            </Card>
          </div>

          <div className="fixed bottom-4 left-4 right-4 z-30 md:left-80">
            <div className={`flex items-center justify-between gap-3 rounded-[1.5rem] border px-5 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl ${dirty ? "border-[var(--av-light-orange)]/40 bg-[var(--admin-surface-strong)]" : "border-white/8 bg-[var(--admin-surface)]/80"}`}>
              <span className="text-sm text-white/70">{dirty ? `Unsaved changes: ${Object.keys(patch).join(", ")}` : "No changes"}</span>
              <div className="flex gap-2">
                <Button variant="ghost" disabled={!dirty} onClick={() => setDraft(base)}>Discard</Button>
                <Button disabled={!dirty} onClick={() => setSaving(true)}>Review & save</Button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <ReasonDialog
        open={saving}
        onClose={() => setSaving(false)}
        title="Save ODS config"
        message="These changes go live for the API within a minute."
        fields={<pre className="max-h-60 overflow-auto rounded-2xl bg-black/30 p-3 text-xs text-white/75">{JSON.stringify(patch, null, 2)}</pre>}
        confirmLabel="Save"
        onConfirm={async (reason) => {
          await ods.updateConfig(patch, reason);
          setNotice("Config saved.");
          cfg.reload();
        }}
      />
    </div>
  );
}

/** Fields the admin can't edit here (managed elsewhere). */
function stripDerived(c) {
  const { paystackPublicKey: _pk, updatedAt: _u, updatedBy: _b, ...rest } = c;
  return rest;
}
