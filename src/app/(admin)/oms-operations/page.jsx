"use client";

import { useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { oms, formatDate, formatVpt } from "@/services/oms";
import { Button, Card, ErrorNote, OmsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/oms/OmsUi";

const userLink = (uid) => (uid ? <Link href={`/oms-users?q=${encodeURIComponent(uid)}`} className="font-mono text-xs underline">{uid}</Link> : "—");

export default function OmsOperationsPage() {
  const [tab, setTab] = useState("failed");
  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Operations" subtitle="Background work that needs a human: side effects that failed, referral credits still waiting, and the referral graph." />
      <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        {[["failed", "Failed effects"], ["credits", "Pending credits"], ["referrals", "Referrals"]].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-xl px-3 py-1.5 text-sm ${tab === k ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "failed" ? <FailedEffects /> : null}
      {tab === "credits" ? <PendingCredits /> : null}
      {tab === "referrals" ? <Referrals /> : null}
    </div>
  );
}

function FailedEffects() {
  const [all, setAll] = useState(false);
  const list = useAsync(() => oms.failedEffects(all), [all]);
  const [resolving, setResolving] = useState(null);
  const cols = [
    { key: "at", label: "When", render: (x) => <span className="text-xs text-white/60">{formatDate(x.at)}</span> },
    { key: "uid", label: "Account", render: (x) => userLink(x.uid) },
    {
      key: "error",
      label: "What failed",
      render: (x) => (
        <div className="max-w-lg">
          <p className="break-all text-xs text-white/80">{x.error}</p>
          {x.credit ? <p className="mt-1 text-xs text-amber-200">Unrecorded credit: {formatVpt((x.credit.units || 0) / 1e8)} to {x.credit.uid} ({x.credit.type})</p> : null}
        </div>
      ),
    },
    {
      key: "state",
      label: "",
      render: (x) => (x.resolvedAt
        ? <span className="text-xs text-white/45">Resolved {formatDate(x.resolvedAt)}</span>
        : <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setResolving(x)}>Mark resolved</Button>),
    },
  ];
  return (
    <>
      <p className="text-sm text-white/55">
        After a user&apos;s balance or plan has saved, OMS writes the ledger row, leaderboard and pool. If one of those fails it lands here. Fix it (often an
        adjustment on OMS-Users), then mark it resolved with what you did.
      </p>
      <label className="flex items-center gap-2 text-sm text-white/75">
        <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-[var(--av-orange)]" />
        Show resolved too
      </label>
      <ErrorNote error={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? <Spinner /> : <DataTable columns={cols} rows={list.data?.items || []} getRowId={(x) => x.id} emptyMessage="Nothing has failed." defaultPageSize={25} />}
      <ReasonDialog
        open={!!resolving}
        onClose={() => setResolving(null)}
        title="Mark resolved"
        message="Say what you did about it — it's saved to the audit log."
        confirmLabel="Resolve"
        onConfirm={async (reason) => {
          await oms.resolveFailedEffect(resolving.id, reason);
          list.reload();
        }}
      />
    </>
  );
}

function PendingCredits() {
  const [state, setState] = useState("pending");
  const list = useAsync(() => oms.pendingCredits(state), [state]);
  const tone = { pending: "pending", applied: "success", dead: "inactive" };
  const cols = [
    { key: "createdAt", label: "Created", render: (x) => <span className="text-xs text-white/60">{formatDate(x.createdAt)}</span> },
    { key: "uid", label: "To", render: (x) => userLink(x.uid) },
    { key: "title", label: "For", render: (x) => <span className="text-xs">{x.title}</span> },
    { key: "vpt", label: "Amount", render: (x) => <span className="font-mono text-xs">{formatVpt(x.vpt)}</span> },
    { key: "attempts", label: "Attempts", render: (x) => x.attempts || 0 },
    { key: "state", label: "State", render: (x) => <StatusBadge status={tone[x.state] || x.state} /> },
    { key: "lastError", label: "Last error", render: (x) => <span className="text-xs text-white/50">{x.lastError || "—"}</span> },
  ];
  return (
    <>
      <p className="text-sm text-white/55">Referral bonuses owed to other users. Pending ones are retried every 15 minutes; dead ones were owed to an account that no longer exists.</p>
      <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        {["pending", "applied", "dead"].map((s) => (
          <button key={s} onClick={() => setState(s)} className={`rounded-xl px-3 py-1.5 text-sm capitalize ${state === s ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}>{s}</button>
        ))}
      </div>
      <ErrorNote error={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? <Spinner /> : <DataTable columns={cols} rows={list.data?.items || []} getRowId={(x) => x.id} emptyMessage={`No ${state} credits.`} defaultPageSize={25} />}
    </>
  );
}

function Referrals() {
  const [uid, setUid] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  async function find(e) {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      setResult(await oms.referrals(uid.trim()));
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <Card title="Referral graph" subtitle="Who invited an account, and who it invited.">
      <form onSubmit={find} className="flex flex-wrap gap-2">
        <input value={uid} onChange={(e) => setUid(e.target.value)} className={`${inputClass} max-w-md font-mono`} placeholder="Account ID" />
        <Button type="submit" disabled={!uid.trim()}>Show</Button>
      </form>
      {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
      {result ? (
        <div className="mt-4 space-y-3 text-sm text-white/80">
          <p>Invited by: {result.referredBy ? <>{userLink(result.referredBy.uid)} <span className="text-xs text-white/45">{formatDate(result.referredBy.at)}</span></> : "nobody"}</p>
          <p>Invited {result.made.length} account{result.made.length === 1 ? "" : "s"}:</p>
          <ul className="space-y-1">
            {result.made.map((r) => (
              <li key={r.uid} className="flex justify-between gap-3">{userLink(r.uid)}<span className="text-xs text-white/45">{formatDate(r.at)}</span></li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
