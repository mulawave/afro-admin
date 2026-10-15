"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/DataTable";
import { oms, formatDate, formatNgn, formatVpt } from "@/services/oms";
import { Button, Card, ErrorNote, Field, OmsHeader, ReasonDialog, Spinner, Stat, inputClass, useAsync } from "@/components/oms/OmsUi";

export default function OmsPaymentsPage() {
  const [tab, setTab] = useState("recent");
  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Payments" subtitle="Paystack top-ups credited to OMS wallets, payments nobody could match, and the 15-minute reconciliation." />
      <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        {[["recent", "Credited"], ["unmatched", "Unmatched"], ["reconcile", "Reconcile status"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-3 py-1.5 text-sm ${tab === k ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "recent" ? <Recent /> : null}
      {tab === "unmatched" ? <Unmatched /> : null}
      {tab === "reconcile" ? <Reconcile /> : null}
    </div>
  );
}

function Recent() {
  const [q, setQ] = useState({});
  const [input, setInput] = useState("");
  const list = useAsync(() => oms.payments(q), [JSON.stringify(q)]);
  const cols = [
    { key: "reference", label: "Reference", render: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { key: "uid", label: "Account", render: (p) => <Link href={`/oms-users?q=${encodeURIComponent(p.uid)}`} className="font-mono text-xs underline">{p.uid}</Link> },
    { key: "amountNgn", label: "Paid", render: (p) => formatNgn(p.amountNgn) },
    { key: "vpt", label: "Credited", render: (p) => <span className="font-mono text-xs">{formatVpt(p.vpt)}</span> },
    { key: "at", label: "When", render: (p) => <span className="text-xs text-white/60">{formatDate(p.at)}</span> },
  ];
  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const v = input.trim();
          setQ(!v ? {} : v.startsWith("omsu-") ? { ref: v } : { uid: v });
        }}
        className="flex flex-wrap gap-2"
      >
        <input value={input} onChange={(e) => setInput(e.target.value)} className={`${inputClass} max-w-md`} placeholder="Paystack reference (omsu-…) or Account ID" />
        <Button type="submit">Search</Button>
        {input ? <Button type="button" variant="ghost" onClick={() => { setInput(""); setQ({}); }}>Clear</Button> : null}
      </form>
      <ErrorNote error={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? <Spinner /> : <DataTable columns={cols} rows={list.data?.items || []} getRowId={(p) => p.reference} emptyMessage="No payments." defaultPageSize={25} />}
    </>
  );
}

function Unmatched() {
  const list = useAsync(() => oms.unmatchedPayments(), []);
  const [assigning, setAssigning] = useState(null);
  const [uid, setUid] = useState("");
  const [notice, setNotice] = useState(null);
  const cols = [
    { key: "reference", label: "Reference", render: (p) => <span className="font-mono text-xs">{p.reference}</span> },
    { key: "amountNaira", label: "Paid", render: (p) => formatNgn(p.amountNaira) },
    { key: "email", label: "Paystack email", render: (p) => <span className="text-xs">{p.email || "—"}</span> },
    { key: "why", label: "Why unmatched", render: (p) => <span className="text-xs text-white/60">{p.why}</span> },
    { key: "at", label: "When", render: (p) => <span className="text-xs text-white/60">{formatDate(p.at)}</span> },
    { key: "assign", label: "", render: (p) => <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => { setUid(p.uid || ""); setAssigning(p); }}>Credit to…</Button> },
  ];
  return (
    <>
      <p className="text-sm text-white/55">
        Real Paystack charges that couldn&apos;t be tied to an account (usually an old app build that didn&apos;t send the Account ID). Find the person — the Paystack email
        helps — and credit it to them. Paystack is asked again first, and a payment can only ever be credited once.
      </p>
      {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}
      <ErrorNote error={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? <Spinner /> : <DataTable columns={cols} rows={list.data?.items || []} getRowId={(p) => p.reference} emptyMessage="Nothing unmatched." />}
      <ReasonDialog
        open={!!assigning}
        onClose={() => setAssigning(null)}
        title={assigning ? `Credit ${formatNgn(assigning.amountNaira)} payment` : ""}
        message={assigning ? `Reference ${assigning.reference}. The amount Paystack reports is credited as vPT at the current rate.` : ""}
        canConfirm={uid.trim().length > 0}
        fields={
          <Field label="Account ID to credit">
            <input value={uid} onChange={(e) => setUid(e.target.value)} className={`${inputClass} font-mono`} />
          </Field>
        }
        confirmLabel="Credit"
        onConfirm={async (reason) => {
          const r = await oms.assignPayment(assigning.reference, uid.trim(), reason);
          setNotice(`Credited ${r.payment ? formatVpt(r.payment.vpt) : ""} to ${uid.trim()}.`);
          list.reload();
        }}
      />
    </>
  );
}

function Reconcile() {
  const s = useAsync(() => oms.reconcileStatus(), []);
  const d = s.data;
  return (
    <>
      <ErrorNote error={s.error} onRetry={s.reload} />
      {s.loading && !d ? <Spinner /> : null}
      {d ? (
        <Card title="Last run" subtitle="omsReconcile runs every 15 minutes and credits Paystack payments confirmed after their checkout closed.">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Last run" value={formatDate(d.lastRunAt)} />
            <Stat label="Credited" value={d.credited ?? 0} tone="good" />
            <Stat label="Parked (unmatched)" value={d.parked ?? 0} tone={d.parked ? "warn" : "default"} />
            <Stat label="To retry" value={d.retry ?? 0} tone={d.retry ? "warn" : "default"} />
          </div>
          <p className="mt-3 text-xs text-white/45">
            Covering payments since {formatDate(d.paidSince)}.{d.incomplete ? " The last run didn't finish; the next one picks up where it stopped." : ""}
          </p>
        </Card>
      ) : null}
    </>
  );
}
