"use client";

import { useCallback, useEffect, useState } from "react";
import Drawer from "@/components/ui/Drawer";
import { ods, formatDate } from "@/services/ods";
import { Button, ErrorNote, Field, OdsHeader, Spinner, inputClass } from "@/components/ods/OdsUi";

const ACTIONS = [
  "", "config.update", "user.adjust_balance", "user.plan.grant", "user.plan.extend", "user.plan.end", "user.reset_trial",
  "user.master", "user.delete", "payment.reverify", "payment.mark_success", "payment.mark_failed",
  "paystack.keys.update", "paystack.mode.update", "paystack.keys.test", "voucher.batch.create", "voucher.void", "announcement.send",
];

export default function OdsAuditPage() {
  const [action, setAction] = useState("");
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  const load = useCallback(async (before) => {
    setLoading(true);
    setError(null);
    try {
      const r = await ods.auditLog({ action, before });
      setItems((p) => (before ? [...p, ...r.items] : r.items));
      setNext(r.nextBefore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Audit" subtitle="Every ODS admin write, recorded before the action completes: who, what, before/after and why." />
      <Field label="Action">
        <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputClass} max-w-xs`}>
          {ACTIONS.map((a) => <option key={a} value={a} className="bg-[var(--av-dark-blue)]">{a || "All actions"}</option>)}
        </select>
      </Field>
      <ErrorNote error={error} onRetry={() => load()} />
      {loading && !items.length ? <Spinner /> : null}
      <ul className="divide-y divide-white/6 rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)]">
        {!loading && !items.length ? <li className="px-5 py-10 text-center text-sm text-white/40">No audit entries.</li> : null}
        {items.map((a) => (
          <li key={a.id}>
            <button onClick={() => setOpen(a)} className="flex w-full items-center justify-between gap-4 px-5 py-3 text-left hover:bg-white/[0.03]">
              <div className="min-w-0">
                <p className="font-mono text-sm text-white">{a.action}</p>
                <p className="truncate text-xs text-white/45">{a.target}{a.reason ? ` · “${a.reason}”` : ""}</p>
              </div>
              <div className="shrink-0 text-right text-xs text-white/50">
                <p>{a.actorEmail || a.actorUid}</p>
                <p>{formatDate(a.at)}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      {next ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => load(next)} disabled={loading}>Load more</Button>
        </div>
      ) : null}
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.action || ""} width="max-w-2xl">
        {open ? (
          <div className="space-y-4 text-sm">
            <p className="text-white/70">{open.actorEmail || open.actorUid} · {formatDate(open.at)}</p>
            <p className="font-mono text-xs text-white/50">{open.target}</p>
            {open.reason ? <p className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-white/80">Reason: {open.reason}</p> : null}
            {["before", "after"].map((k) => (
              <div key={k}>
                <p className="mb-1 text-xs uppercase tracking-[0.2em] text-white/40">{k}</p>
                <pre className="max-h-80 overflow-auto rounded-2xl bg-black/30 p-3 text-xs text-white/75">{JSON.stringify(open[k], null, 2)}</pre>
              </div>
            ))}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
