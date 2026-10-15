"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { oms, formatDate, formatVpt, saveText } from "@/services/oms";
import { Button, Card, ErrorNote, Field, OmsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/oms/OmsUi";

const vStatus = (s) => ({ unused: "active", redeemed: "success", void: "cancelled" })[s] || s;
const valueLabel = (v) => (v.type === "vpt" ? formatVpt(v.vpt) : `${v.plan} · ${v.days} days`);

export default function OmsVouchersPage() {
  const batches = useAsync(() => oms.voucherBatches(), []);
  const [creating, setCreating] = useState(false);
  const [openBatch, setOpenBatch] = useState(null);
  const [lookup, setLookup] = useState("");
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [voidCode, setVoidCode] = useState(null);

  async function find(e) {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);
    try {
      const r = await oms.lookupVoucher(lookup.trim());
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
    { key: "value", label: "Value", render: (b) => <span className="capitalize">{valueLabel(b)}</span> },
    { key: "count", label: "Codes", render: (b) => b.count },
    { key: "createdAt", label: "Created", render: (b) => <span className="text-xs text-white/60">{formatDate(b.createdAt)}</span> },
    { key: "open", label: "", render: (b) => <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setOpenBatch(b)}>Status</Button> },
  ];

  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Vouchers" subtitle="Make OMS-XXXX-XXXX voucher codes for vendors, check any code, and void unsold stock.">
        <Button onClick={() => setCreating(true)}>New batch</Button>
      </OmsHeader>

      <Card title="Look up a code" subtitle="Codes are stored only as a fingerprint, so a code can be checked but never listed.">
        <form onSubmit={find} className="flex flex-wrap gap-2">
          <input value={lookup} onChange={(e) => setLookup(e.target.value)} className={`${inputClass} max-w-sm`} placeholder="OMS-XXXX-XXXX" />
          <Button type="submit" disabled={!lookup.trim()}>Find</Button>
        </form>
        {lookupError ? <p className="mt-3 text-sm text-red-200">{lookupError}</p> : null}
        {lookupResult === "none" ? <p className="mt-3 text-sm text-white/50">No voucher with that code.</p> : null}
        {lookupResult && lookupResult !== "none" ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span className="font-mono">{lookupResult.code}</span>
            <StatusBadge status={vStatus(lookupResult.status)} />
            <span className="capitalize">{valueLabel(lookupResult)}</span>
            {lookupResult.redeemedBy ? <span className="font-mono text-xs text-white/50">by {lookupResult.redeemedBy} · {formatDate(lookupResult.redeemedAt)}</span> : null}
            {lookupResult.voidReason ? <span className="text-xs text-white/50">voided: {lookupResult.voidReason}</span> : null}
            {lookupResult.status === "unused" ? <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => setVoidCode(lookupResult.code)}>Void this code</Button> : null}
          </div>
        ) : null}
      </Card>

      <ErrorNote error={batches.error} onRetry={batches.reload} />
      {batches.loading && !batches.data ? <Spinner /> : <DataTable columns={batchCols} rows={batches.data?.items || []} emptyMessage="No voucher batches yet." />}

      <CreateBatch open={creating} onClose={() => setCreating(false)} onCreated={() => batches.reload()} />
      {openBatch ? <BatchStatus batch={openBatch} onClose={() => setOpenBatch(null)} /> : null}
      <ReasonDialog
        open={!!voidCode}
        onClose={() => setVoidCode(null)}
        destructive
        title={`Void ${voidCode}?`}
        message="It can never be redeemed after this."
        confirmLabel="Void code"
        onConfirm={async (reason) => {
          await oms.voidVouchers({ codes: [voidCode], reason });
          const r = await oms.lookupVoucher(voidCode);
          setLookupResult(r.items[0] || "none");
        }}
      />
    </div>
  );
}

function CreateBatch({ open, onClose, onCreated }) {
  const [type, setType] = useState("vpt");
  const [vpt, setVpt] = useState("");
  const [plan, setPlan] = useState("plus");
  const [days, setDays] = useState("30");
  const [count, setCount] = useState("50");
  const [vendor, setVendor] = useState("");
  const [result, setResult] = useState(null);

  const n = Number(count);
  const d = Number(days);
  const valid =
    vendor.trim() && Number.isInteger(n) && n >= 1 && n <= 5000 &&
    (type === "plan" ? Number.isInteger(d) && d >= 1 && d <= 3650 : Number(vpt) > 0 && Number(vpt) <= 1_000_000);

  function downloadCsv(r) {
    const value = r.batch.type === "vpt" ? `${r.batch.vpt} vPT` : `${r.batch.plan} ${r.batch.days} days`;
    const rows = ["code,value,vendor,batch", ...r.codes.map((c) => `${c},"${value}","${r.batch.vendor.replace(/"/g, '""')}",${r.batch.id}`)];
    saveText(`oms-vouchers-${r.batch.vendor.replace(/[^a-z0-9]+/gi, "-")}-${r.batch.id}.csv`, rows.join("\n"));
  }

  if (result) {
    return (
      <ReasonDialog
        open
        requireReason={false}
        title={`${result.codes.length} codes created`}
        message={
          <>
            <strong className="text-amber-200">These codes are shown only once.</strong> OMS stores a fingerprint of each code, never the code
            itself, so they can't be shown or exported again. Download the CSV now.
          </>
        }
        fields={
          <>
            <textarea readOnly value={result.codes.join("\n")} rows={8} className={`${inputClass} font-mono text-xs`} />
            <Button type="button" variant="ghost" onClick={() => downloadCsv(result)}>Download CSV</Button>
          </>
        }
        confirmLabel="I've saved them"
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
              <option value="plan" className="bg-[var(--av-dark-blue)]">Plan (Plus or Studio)</option>
            </select>
          </Field>
          {type === "vpt" ? (
            <Field label="vPT per code" hint="In vPT (not naira), up to 8 decimals.">
              <input value={vpt} onChange={(e) => setVpt(e.target.value)} inputMode="decimal" className={inputClass} placeholder="e.g. 2.5" />
            </Field>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Plan">
                <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
                  {["plus", "studio"].map((p) => <option key={p} value={p} className="bg-[var(--av-dark-blue)] capitalize">{p}</option>)}
                </select>
              </Field>
              <Field label="Days">
                <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className={inputClass} />
              </Field>
            </div>
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
        const r = await oms.createVoucherBatch({
          type, ...(type === "vpt" ? { vpt: Number(vpt) } : { plan, days: d }), count: n, vendor: vendor.trim(), note: reason,
        });
        onCreated();
        setResult(r);
        downloadCsv(r);
      }}
    />
  );
}

function BatchStatus({ batch, onClose }) {
  const codes = useAsync(() => oms.batchVouchers(batch.id), [batch.id]);
  const [voiding, setVoiding] = useState(false);
  const [notice, setNotice] = useState(null);
  const items = codes.data?.items || [];
  const tally = items.reduce((t, v) => ({ ...t, [v.status]: (t[v.status] || 0) + 1 }), {});
  const cols = [
    { key: "id", label: "Fingerprint", render: (v) => <span className="font-mono text-xs text-white/50">{v.id.slice(0, 12)}…</span> },
    { key: "status", label: "Status", render: (v) => <StatusBadge status={vStatus(v.status)} /> },
    { key: "redeemedBy", label: "Redeemed by", render: (v) => (v.redeemedBy ? <span className="font-mono text-xs text-white/60">{v.redeemedBy}</span> : "—") },
    { key: "redeemedAt", label: "When", render: (v) => <span className="text-xs text-white/60">{formatDate(v.redeemedAt)}</span> },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(2,6,23,0.72)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl space-y-4 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface-strong)] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold capitalize text-white">{batch.vendor} · {valueLabel(batch)}</h3>
            <p className="text-xs text-white/45">
              {items.length} codes · {tally.unused || 0} unused · {tally.redeemed || 0} redeemed · {tally.void || 0} void
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="danger" disabled={!tally.unused} onClick={() => setVoiding(true)}>Void {tally.unused || 0} unused</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
        {notice ? <p className="text-sm text-emerald-200">{notice}</p> : null}
        <ErrorNote error={codes.error} onRetry={codes.reload} />
        {codes.loading && !codes.data ? <Spinner /> : <DataTable columns={cols} rows={items} getRowId={(v) => v.id} defaultPageSize={25} />}
      </div>
      <ReasonDialog
        open={voiding}
        onClose={() => setVoiding(false)}
        destructive
        title={`Void ${tally.unused || 0} unused codes?`}
        message="Redeemed codes aren't affected. Voided codes can never be redeemed."
        confirmLabel="Void codes"
        onConfirm={async (reason) => {
          const r = await oms.voidVouchers({ batchId: batch.id, reason });
          setNotice(`${r.voided} codes voided.${r.skipped ? ` ${r.skipped} were already used or void.` : ""}`);
          codes.reload();
        }}
      />
    </div>
  );
}
