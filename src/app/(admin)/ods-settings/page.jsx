"use client";

import { useState } from "react";
import { ods, formatDate } from "@/services/ods";
import { Button, Card, ErrorNote, Field, OdsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/ods/OdsUi";

/**
 * ODS-Settings → Payments (spec §6.7). Secret keys are write-only: the page
 * never receives them back, only the last 4 characters and a fingerprint.
 * Keys are stored in GCP Secret Manager; Firestore holds mode + fingerprints.
 */
export default function OdsSettingsPage() {
  const { data, loading, error, reload, setData } = useAsync(() => ods.paymentSettings(), []);
  const [modeDialog, setModeDialog] = useState(null);

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Settings" subtitle="Payment and ad keys for ODS. Keys are write-only, stored in Secret Manager, and take effect within a minute without an app release." />
      <ErrorNote error={error} onRetry={reload} />
      {loading && !data ? <Spinner /> : null}

      {data ? (
        <>
          <Card
            title="Payment mode"
            subtitle={data.rotatedAt ? `Last changed ${formatDate(data.rotatedAt)}` : "Not configured yet"}
            actions={
              <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
                {["test", "live"].map((m) => (
                  <button
                    key={m}
                    onClick={() => m !== data.mode && setModeDialog(m)}
                    className={`rounded-xl px-4 py-1.5 text-sm uppercase tracking-wide ${data.mode === m ? (m === "live" ? "bg-emerald-500/20 text-emerald-100" : "bg-amber-500/20 text-amber-100") : "text-white/55 hover:text-white/80"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            }
          >
            <p className="text-sm text-white/70">
              ODS is charging in <strong className={data.mode === "live" ? "text-emerald-200" : "text-amber-200"}>{data.mode.toUpperCase()}</strong> mode.
              {data.previousAcceptedUntil ? ` Webhooks signed with the previous key are still accepted until ${formatDate(data.previousAcceptedUntil)}.` : ""}
            </p>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {["test", "live"].map((mode) => (
              <KeyCard key={mode} mode={mode} keys={data[mode]} active={data.mode === mode} onSaved={setData} />
            ))}
          </div>

          <PangleCard />

          <Card title="Webhook">
            <p className="text-sm text-white/70">
              In the Paystack dashboard, set the webhook URL to <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">{"<ods-api URL>"}/v1/webhooks/paystack</code>. Paystack signs it with the active secret key, so nothing else needs configuring.
            </p>
          </Card>
        </>
      ) : null}

      <ReasonDialog
        open={!!modeDialog}
        onClose={() => setModeDialog(null)}
        requireReason={false}
        destructive={modeDialog === "live"}
        title={`Switch ODS payments to ${modeDialog?.toUpperCase()} mode?`}
        message={modeDialog === "live" ? "Real money will be charged from now on." : "Checkouts will use Paystack test mode; no real money will be charged."}
        confirmLabel={`Switch to ${modeDialog}`}
        onConfirm={async () => setData(await ods.setPaystackMode(modeDialog))}
      />
    </div>
  );
}

function PangleCard() {
  const { data, error, reload, setData } = useAsync(() => ods.pangleSettings(), []);
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      setData(await ods.savePangleKey(key.trim()));
      setKey("");
      setMsg({ ok: true, text: "Saved. Rewarded-ad credits are verified with this key from now on." });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title="Pangle rewarded ads" subtitle="Security key from the Pangle console (server-side reward verification). Used to verify every ad reward before vPT is credited.">
      <ErrorNote error={error} onRetry={reload} />
      {data ? (
        <p className="mb-4 text-sm text-white/70">
          {data.configured ? (
            <>
              Key saved: <span className="font-mono">…{data.last4}</span> · fingerprint <span className="font-mono text-xs">{data.fingerprint}</span>
              {data.updatedAt ? ` · updated ${formatDate(data.updatedAt)}` : ""}
            </>
          ) : (
            <span className="text-amber-200">No key saved yet. Ad rewards are not credited until one is added.</span>
          )}
        </p>
      ) : null}
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[260px] flex-1">
          <Field label={data?.configured ? "Replace security key" : "Security key"} hint="Write-only. It is never shown again after saving.">
            <input type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} className={inputClass} placeholder="Paste the Pangle security key" />
          </Field>
        </div>
        <Button type="submit" disabled={saving || key.trim().length < 8}>{saving ? "Saving..." : "Save key"}</Button>
      </form>
      {msg ? <p className={`mt-3 text-sm ${msg.ok ? "text-emerald-200" : "text-red-200"}`}>{msg.text}</p> : null}
    </Card>
  );
}

function KeyCard({ mode, keys, active, onSaved }) {
  const [secretKey, setSecretKey] = useState("");
  const [publicKey, setPublicKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState(null);

  const secretOk = !secretKey || new RegExp(`^sk_${mode}_[A-Za-z0-9]{20,}$`).test(secretKey.trim());
  const publicOk = !publicKey || new RegExp(`^pk_${mode}_[A-Za-z0-9]{20,}$`).test(publicKey.trim());

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const r = await ods.savePaystackKeys({ mode, ...(secretKey ? { secretKey: secretKey.trim() } : {}), ...(publicKey ? { publicKey: publicKey.trim() } : {}) });
      setSecretKey("");
      setPublicKey("");
      onSaved(r);
      setMsg({ ok: true, text: "Saved. The secret isn't shown again." });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    setMsg(null);
    try {
      const r = await ods.testPaystack(mode);
      setMsg({ ok: r.ok, text: r.message });
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card
      title={`${mode === "live" ? "Live" : "Test"} keys`}
      subtitle={active ? "Active" : "Inactive"}
      actions={
        <Button variant="ghost" onClick={test} disabled={!keys.configured || testing}>
          {testing ? "Testing..." : "Test connection"}
        </Button>
      }
    >
      <dl className="mb-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-white/40">Secret key</dt>
          <dd className="font-mono text-white/85">{keys.configured ? `sk_${mode}_…${keys.secretLast4}` : "Not set"}</dd>
        </div>
        <div>
          <dt className="text-xs text-white/40">Fingerprint</dt>
          <dd className="font-mono text-xs text-white/60">{keys.secretFingerprint || "—"}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-white/40">Public key</dt>
          <dd className="break-all font-mono text-xs text-white/70">{keys.publicKey || "Not set"}</dd>
        </div>
      </dl>
      <form onSubmit={save} className="space-y-3">
        <Field label={keys.configured ? "Replace secret key" : "Secret key"} hint={secretOk ? "Write-only. Stored in Secret Manager." : `Must start with sk_${mode}_`}>
          <input type="password" autoComplete="off" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} className={inputClass} placeholder={`sk_${mode}_…`} />
        </Field>
        <Field label="Public key" hint={publicOk ? "Shared with the app via config." : `Must start with pk_${mode}_`}>
          <input autoComplete="off" value={publicKey} onChange={(e) => setPublicKey(e.target.value)} className={inputClass} placeholder={`pk_${mode}_…`} />
        </Field>
        {msg ? <p className={`text-sm ${msg.ok ? "text-emerald-200" : "text-red-200"}`}>{msg.text}</p> : null}
        <Button type="submit" disabled={saving || (!secretKey && !publicKey) || !secretOk || !publicOk}>
          {saving ? "Saving..." : "Save keys"}
        </Button>
      </form>
    </Card>
  );
}
