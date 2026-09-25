"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { ods, formatDate, formatNgn } from "@/services/ods";
import { Button, ErrorNote, Field, OdsHeader, ReasonDialog, Spinner, inputClass } from "@/components/ods/OdsUi";

const STATUSES = ["", "initialized", "success", "failed", "abandoned"];
const badge = (s) => ({ initialized: "pending", abandoned: "inactive" })[s] || s;

export default function OdsPaymentsPage() {
  const [status, setStatus] = useState("");
  const [uid, setUid] = useState("");
  const [items, setItems] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyRef, setBusyRef] = useState(null);
  const [reconcile, setReconcile] = useState(null);

  const load = useCallback(
    async (before) => {
      setLoading(true);
      setError(null);
      try {
        const r = await ods.payments({ status, uid: uid.trim(), before });
        setItems((p) => (before ? [...p, ...r.items] : r.items));
        setNextBefore(r.nextBefore);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [status, uid],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function patch(reference, fields) {
    setItems((p) => p.map((x) => (x.reference === reference ? { ...x, ...fields } : x)));
  }

  async function reverify(p) {
    setBusyRef(p.reference);
    setNotice(null);
    try {
      const r = await ods.reverifyPayment(p.reference);
      patch(p.reference, { status: r.status });
      setNotice({ tone: "ok", text: `Paystack says ${p.reference} is ${r.status}.` });
    } catch (err) {
      setNotice({ tone: "err", text: err.message });
    } finally {
      setBusyRef(null);
    }
  }

  const columns = [
    {
      key: "reference",
      label: "Payment",
      render: (p) => (
        <div className="min-w-0">
          <p className="font-medium capitalize text-white">{p.plan} · {formatNgn(p.amountNgn)}</p>
          <p className="truncate font-mono text-xs text-white/40">{p.reference}</p>
        </div>
      ),
    },
    { key: "status", label: "Status", render: (p) => <StatusBadge status={badge(p.status)} /> },
    { key: "mode", label: "Mode", render: (p) => <span className={`text-xs uppercase ${p.mode === "live" ? "text-emerald-200" : "text-amber-200"}`}>{p.mode}</span> },
    { key: "uid", label: "User", render: (p) => <span className="font-mono text-xs text-white/60">{p.uid}</span> },
    { key: "createdAt", label: "Created", render: (p) => <span className="text-xs text-white/60">{formatDate(p.createdAt)}</span> },
    {
      key: "actions",
      label: "",
      render: (p) =>
        p.status === "success" ? (
          <span className="text-xs text-white/35">Credited {formatDate(p.verifiedAt)}</span>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" className="px-3 py-1.5 text-xs" disabled={busyRef === p.reference} onClick={() => reverify(p)}>
              {busyRef === p.reference ? "Checking..." : "Re-verify"}
            </Button>
            <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setReconcile(p)}>
              Reconcile
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Payments" subtitle="Paystack checkouts for ODS Pro plans. Paystack's webhook is the source of truth; re-verify asks Paystack directly." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${inputClass} w-44`}>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="bg-[var(--av-dark-blue)]">
                {s || "All"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="User uid">
          <input value={uid} onChange={(e) => setUid(e.target.value)} className={`${inputClass} w-72`} placeholder="Optional" />
        </Field>
        <Button type="submit">Apply</Button>
      </form>

      {notice ? (
        <p className={`rounded-2xl border px-4 py-2.5 text-sm ${notice.tone === "ok" ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-red-400/30 bg-red-500/10 text-red-200"}`}>{notice.text}</p>
      ) : null}
      <ErrorNote error={error} onRetry={() => load()} />
      {loading && !items.length ? <Spinner /> : <DataTable columns={columns} rows={items} getRowId={(p) => p.reference} emptyMessage="No payments match." defaultPageSize={25} />}
      {nextBefore ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => load(nextBefore)} disabled={loading}>
            Load more
          </Button>
        </div>
      ) : null}

      <ReconcileDialog
        payment={reconcile}
        onClose={() => setReconcile(null)}
        onDone={(p, st) => {
          patch(p.reference, { status: st });
          setNotice({ tone: "ok", text: `${p.reference} marked ${st}.` });
        }}
      />
    </div>
  );
}

function ReconcileDialog({ payment, onClose, onDone }) {
  const [action, setAction] = useState("mark_success");
  useEffect(() => setAction("mark_success"), [payment]);
  if (!payment) return null;
  return (
    <ReasonDialog
      open
      onClose={onClose}
      destructive={action === "mark_success"}
      title="Reconcile payment"
      message={
        action === "mark_success"
          ? `Credits ${payment.plan} Pro to ${payment.uid} WITHOUT Paystack confirmation. Only do this after confirming the money arrived in the Paystack dashboard.`
          : "Marks this payment as failed. No plan is granted."
      }
      fields={
        <Field label="Action">
          <select value={action} onChange={(e) => setAction(e.target.value)} className={inputClass}>
            <option value="mark_success" className="bg-[var(--av-dark-blue)]">Mark as paid (credit plan)</option>
            <option value="mark_failed" className="bg-[var(--av-dark-blue)]">Mark as failed</option>
          </select>
        </Field>
      }
      confirmLabel={action === "mark_success" ? "Credit plan" : "Mark failed"}
      onConfirm={async (reason) => {
        const r = await ods.reconcilePayment(payment.reference, action, reason);
        onDone(payment, r.status);
      }}
    />
  );
}
