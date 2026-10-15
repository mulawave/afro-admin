"use client";

import { useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import { oms, formatDate } from "@/services/oms";
import { Button, ErrorNote, Field, OmsHeader, Spinner, inputClass } from "@/components/oms/OmsUi";

const ACTIONS = [
  "user.adjust_balance", "user.plan.grant", "user.plan.extend", "user.plan.end", "user.reset_trial", "user.streak",
  "user.disable", "user.enable", "user.delete", "user.notify", "voucher.batch_create", "voucher.void",
  "support.reply", "support.status", "payment.assign", "operations.resolve_failed_effect", "announcement.send",
];

export default function OmsAuditPage() {
  const [action, setAction] = useState("");
  const [items, setItems] = useState([]);
  const [before, setBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  async function load(more) {
    setLoading(true);
    setError(null);
    try {
      const r = await oms.auditLog({ action: action || undefined, before: more || undefined });
      setItems((p) => (more ? [...p, ...r.items] : r.items));
      setBefore(r.nextBefore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action]);

  const cols = [
    { key: "at", label: "When", render: (e) => <span className="text-xs text-white/60">{formatDate(e.at)}</span> },
    { key: "actor", label: "Admin", render: (e) => <span className="text-xs">{e.actorEmail || e.actorUid}</span> },
    { key: "action", label: "Action", render: (e) => <span className="font-mono text-xs">{e.action}</span> },
    { key: "target", label: "Target", render: (e) => <span className="break-all font-mono text-xs text-white/60">{e.target}</span> },
    { key: "reason", label: "Reason", render: (e) => <span className="text-xs text-white/75">{e.reason || "—"}</span> },
    { key: "detail", label: "", render: (e) => (e.before || e.after ? <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setOpen(open === e.id ? null : e.id)}>{open === e.id ? "Hide" : "Details"}</Button> : null) },
  ];

  const detail = items.find((e) => e.id === open);

  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Audit" subtitle="Every change made from the OMS- pages: who, what, to whom, and why. Written before the change is applied." />
      <Field label="Action">
        <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputClass} max-w-xs`}>
          <option value="" className="bg-[var(--av-dark-blue)]">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a} className="bg-[var(--av-dark-blue)]">{a}</option>)}
        </select>
      </Field>
      <ErrorNote error={error} onRetry={() => load()} />
      {loading && !items.length ? <Spinner /> : <DataTable columns={cols} rows={items} getRowId={(e) => e.id} emptyMessage="Nothing logged yet." defaultPageSize={25} />}
      {detail ? (
        <div className="grid gap-3 lg:grid-cols-2">
          <pre className="max-h-80 overflow-auto rounded-2xl bg-black/30 p-3 text-xs text-white/70">Before{"\n"}{JSON.stringify(detail.before, null, 2)}</pre>
          <pre className="max-h-80 overflow-auto rounded-2xl bg-black/30 p-3 text-xs text-white/70">After{"\n"}{JSON.stringify(detail.after, null, 2)}</pre>
        </div>
      ) : null}
      {before ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => load(before)} disabled={loading}>Older entries</Button>
        </div>
      ) : null}
    </div>
  );
}
