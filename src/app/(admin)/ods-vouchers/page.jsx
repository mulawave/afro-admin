"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { ods, formatDate, formatVpt } from "@/services/ods";
import { Button, Card, ErrorNote, Field, OdsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/ods/OdsUi";

const PLANS = ["weekly", "monthly", "yearly", "lifetime"];
const vStatus = (s) => ({ unused: "active", redeemed: "success", void: "cancelled" })[s] || s;

export default function OdsVouchersPage() {
  const batches = useAsync(() => ods.voucherBatches(), []);
  const [creating, setCreating] = useState(false);
  const [openBatch, setOpenBatch] = useState(null);
  const [lookup, setLookup] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  async function find(e) {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);
    try {
      const r = await ods.vouchers({ code: lookup.trim() });
      setLookupResult(r.items[0] || "none");
    } catch (err) {
      setLookupError(err.message);
    }
  }

  const batchCols = [
    { key: "vendor", label: "Batch", render: (b) => (
      <div>
        <p className="font-medium text-white">{b.vendor}</p>
        <p className="font-mono text-xs text-white/40">{b.id}</p>
      </div>
    ) },
    { key: "value", label: "Value", render: (b) => (b.type === "vpt" ? formatVpt(b.vpt) : <span className="capitalize">{b.plan} Pro</span>) },
    { key: "count", label: "Codes", render: (b) => b.count },
    { key: "createdAt", label: "Created", render: (b) => <span className="text-xs text-white/60">{formatDate(b.createdAt)}</span> },
    { key: "open", label: "", render: (b) => (
      <div className="flex gap-2">
        <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setOpenBatch(b)}>Codes</Button>
        <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => ods.exportVouchersCsv(b.id).catch((e) => alert(e.message))}>CSV</Button>
      </div>
    ) },
  ];

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Vouchers" subtitle="Generate OBROH- voucher codes for vendors, export them, void unsold stock and see redemptions.">
        <Button onClick={() => setCreating(true)}>New batch</Button>
      </OdsHeader>

      <Card title="Look up a code">
        <form onSubmit={find} className="flex flex-wrap gap-2">
          <input value={lookup} onChange={(e) => setLookup(e.target.value)} className={`${inputClass} max-w-sm`} placeholder="OBROH-XXXX-XXXX" />
          <Button type="submit" disabled={!lookup.trim()}>Find</Button>
        </form>
        {lookupError ? <p className="mt-3 text-sm text-red-200">{lookupError}</p> : null}
        {lookupResult === "none" ? <p className="mt-3 text-sm text-white/50">No voucher with that code.</p> : null}
        {lookupResult && lookupResult !== "none" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="font-mono">{lookupResult.code}</span>
            <StatusBadge status={vStatus(lookupResult.status)} />
            <span>{lookupResult.type === "vpt" ? formatVpt(lookupResult.vpt) : `${lookupResult.plan} Pro`}</span>
            <span className="text-white/50">{lookupResult.vendor}</span>
            {lookupResult.redeemedByUid ? <span className="font-mono text-xs text-white/50">by {lookupResult.redeemedByUid} · {formatDate(lookupResult.redeemedAt)}</span> : null}
          </div>
        ) : null}
      </Card>

      <ErrorNote error={batches.error} onRetry={batches.reload} />
      {batches.loading && !batches.data ? <Spinner /> : <DataTable columns={batchCols} rows={batches.data?.items || []} emptyMessage="No voucher batches yet." />}

      <CreateBatch open={creating} onClose={() => setCreating(false)} onCreated={() => batches.reload()} />
      {openBatch ? <BatchCodes batch={openBatch} onClose={() => setOpenBatch(null)} /> : null}
    </div>
  );
}

function CreateBatch({ open, onClose, onCreated }) {
  const [type, setType] = useState("vpt");
  const [vpt, setVpt] = useState("");
  const [plan, setPlan] = useState("monthly");
  const [count, setCount] = useState("50");
  const [vendor, setVendor] = useState("");
  const [result, setResult] = useState(null);

  const n = Number(count);
  const valid = vendor.trim() && Number.isInteger(n) && n >= 1 && n <= 5000 && (type === "plan" || (Number(vpt) > 0 && Number(vpt) <= 1_000_000));

  if (result) {
    return (
      <ReasonDialog
        open
        requireReason={false}
        title={`${result.codes.length} codes created`}
        message="Download the CSV from the batch list any time."
        fields={<textarea readOnly value={result.codes.join("\n")} rows={8} className={`${inputClass} font-mono text-xs`} />}
        confirmLabel="Done"
        onConfirm={async () => setResult(null)}
        onClose={() => { setResult(null); onClose(); }}
      />
    );
  }
  return (
    <ReasonDialog
      open={open}
      onClose={onClose}
      title="New voucher batch"
      canConfirm={!!valid}
      fields={
        <>
          <Field label="Voucher type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="vpt" className="bg-[var(--av-dark-blue)]">vPT credit</option>
              <option value="plan" className="bg-[var(--av-dark-blue)]">Pro plan</option>
            </select>
          </Field>
          {type === "vpt" ? (
            <Field label="vPT per code" hint="In vPT (not NGN), up to 8 decimals.">
              <input value={vpt} onChange={(e) => setVpt(e.target.value)} inputMode="decimal" className={inputClass} placeholder="e.g. 2.5" />
            </Field>
          ) : (
            <Field label="Plan">
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
                {PLANS.map((p) => <option key={p} value={p} className="bg-[var(--av-dark-blue)] capitalize">{p}</option>)}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Number of codes" hint="1–5,000">
              <input value={count} onChange={(e) => setCount(e.target.value)} inputMode="numeric" className={inputClass} />
            </Field>
            <Field label="Vendor">
              <input value={vendor} onChange={(e) => setVendor(e.target.value)} className={inputClass} placeholder="Shop / partner name" />
            </Field>
          </div>
        </>
      }
      confirmLabel="Generate"
      onConfirm={async (reason) => {
        const r = await ods.createVoucherBatch({ type, ...(type === "vpt" ? { vpt: Number(vpt) } : { plan }), count: n, vendor: vendor.trim(), note: reason });
        onCreated();
        setResult(r); // the result view renders on its own once the create dialog closes
      }}
    />
  );
}

function BatchCodes({ batch, onClose }) {
  const codes = useAsync(() => ods.vouchers({ batchId: batch.id }), [batch.id]);
  const [voiding, setVoiding] = useState(false);
  const [notice, setNotice] = useState(null);
  const items = codes.data?.items || [];
  const unused = items.filter((v) => v.status === "unused").length;
  const cols = [
    { key: "code", label: "Code", render: (v) => <span className="font-mono text-xs">{v.code}</span> },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={vStatus(v.status)} /> },
    { key: "redeemedByUid", label: "Redeemed by", render: (v) => (v.redeemedByUid ? <span className="font-mono text-xs text-white/60">{v.redeemedByUid}</span> : "—") },
    { key: "redeemedAt", label: "When", render: (v) => <span className="text-xs text-white/60">{formatDate(v.redeemedAt)}</span> },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl space-y-4 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface-strong)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{batch.vendor} · {batch.type === "vpt" ? formatVpt(batch.vpt) : `${batch.plan} Pro`}</h3>
            <p className="text-xs text-white/45">{items.length} codes · {unused} unused</p>
          </div>
          <div className="flex gap-2">
            <Button variant="danger" disabled={!unused} onClick={() => setVoiding(true)}>Void {unused} unused</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
        {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
        <ErrorNote error={codes.error} onRetry={codes.reload} />
        {codes.loading && !codes.data ? <Spinner /> : <DataTable columns={cols} rows={items} getRowId={(v) => v.code} defaultPageSize={25} />}
      </div>
      <ReasonDialog
        open={voiding}
        onClose={() => setVoiding(false)}
        destructive
        title={`Void ${unused} unused codes?`}
        message="Redeemed codes aren't affected. Voided codes can never be redeemed."
        confirmLabel="Void codes"
        onConfirm={async (reason) => {
          const r = await ods.voidVouchers({ batchId: batch.id, reason });
          setNotice(`${r.voided} codes voided.`);
          codes.reload();
        }}
      />
    </div>
  );
}
