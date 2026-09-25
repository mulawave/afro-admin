"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import StatusBadge from "@/components/ui/StatusBadge";
import { ods, formatDate, formatNgn, formatVpt } from "@/services/ods";
import { Button, Card, ErrorNote, Field, OdsHeader, ReasonDialog, Spinner, Stat, inputClass } from "@/components/ods/OdsUi";

const PLANS = ["weekly", "monthly", "yearly", "lifetime"];

function planStatus(u) {
  if (u.deleted) return "deleted";
  if (!u.proActive) return "free";
  return u.subscription.isTrialActive ? "trial" : u.subscription.plan || "pro";
}

function PlanBadge({ u }) {
  const s = planStatus(u);
  const tone = { free: "none", deleted: "deleted", trial: "pending" }[s] || "active";
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusBadge status={tone === "active" ? "active" : tone} />
      <span className="text-xs capitalize text-white/60">{s}</span>
      {u.master ? <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-200">master</span> : null}
    </span>
  );
}

export default function OdsUsersPage() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [nextBefore, setNextBefore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const loadRecent = useCallback(async (before) => {
    setLoading(true);
    setError(null);
    try {
      const r = await ods.listUsers(before);
      setItems((prev) => (before ? [...prev, ...r.items] : r.items));
      setNextBefore(r.nextBefore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  async function search(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return loadRecent();
    setLoading(true);
    setError(null);
    try {
      const r = await ods.searchUsers(q);
      setItems(r.items);
      setNextBefore(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      key: "user",
      label: "User",
      render: (u) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-white">{u.fullName || u.email || "Unnamed"}</p>
          <p className="truncate font-mono text-xs text-white/40">{u.uid}</p>
        </div>
      ),
    },
    { key: "plan", label: "Plan", render: (u) => <PlanBadge u={u} /> },
    { key: "vptBalance", label: "vPT", render: (u) => <span className={`font-mono tabular-nums ${u.vptBalance < 0 ? "text-red-200" : ""}`}>{formatVpt(u.vptBalance)}</span> },
    { key: "referralCode", label: "Referral", render: (u) => <span className="font-mono text-xs">{u.referralCode}</span> },
    { key: "lastSeenAt", label: "Last seen", render: (u) => <span className="text-xs text-white/60">{formatDate(u.lastSeenAt)}</span> },
    {
      key: "open",
      label: "",
      render: (u) => (
        <Button variant="ghost" onClick={() => setSelected(u.uid)} className="px-3 py-1.5 text-xs">
          Open
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Users" subtitle="Search ODS accounts, inspect wallets and ledgers, and take audited support actions." />

      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search uid, email, phone, referral code or install ID" className={`${inputClass} max-w-xl`} />
        <Button type="submit">Search</Button>
        {query ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setQuery("");
              loadRecent();
            }}
          >
            Clear
          </Button>
        ) : null}
      </form>

      <ErrorNote error={error} onRetry={() => search()} />
      {loading && !items.length ? <Spinner /> : <DataTable columns={columns} rows={items} getRowId={(u) => u.uid} emptyMessage={query ? "No ODS user matches that search." : "No ODS users yet."} defaultPageSize={25} />}
      {nextBefore && !query ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => loadRecent(nextBefore)} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}

      <UserDrawer
        uid={selected}
        onClose={() => setSelected(null)}
        onChanged={(u) => setItems((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, ...u } : x)))}
      />
    </div>
  );
}

function UserDrawer({ uid, onClose, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    if (!uid) return;
    setError(null);
    try {
      setDetail(await ods.user(uid));
    } catch (err) {
      setError(err.message);
    }
  }, [uid]);

  useEffect(() => {
    setDetail(null);
    setTab("overview");
    setNotice(null);
    load();
  }, [load]);

  const u = detail?.user;
  const done = async (msg) => {
    setNotice(msg);
    await load();
  };

  return (
    <Drawer open={!!uid} onClose={onClose} title="ODS-User" width="max-w-2xl">
      <ErrorNote error={error} onRetry={load} />
      {!detail && !error ? <Spinner /> : null}
      {u ? (
        <div className="space-y-5">
          <div>
            <p className="text-lg font-semibold text-white">{u.profile.fullName || u.email || "Unnamed user"}</p>
            <p className="font-mono text-xs text-white/45">{u.uid}</p>
            <div className="mt-2">
              <PlanBadge u={u} />
            </div>
          </div>

          {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}

          <div className="inline-flex flex-wrap rounded-2xl border border-white/8 bg-white/[0.03] p-1">
            {["overview", "ledger", "payments", "referrals", "legacy"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="vPT balance" value={formatVpt(u.vptBalance)} tone={u.vptBalance < 0 ? "bad" : "default"} />
                <Stat label="Streak" value={`Day ${u.streak.day}`} hint={u.streak.lastClaimDate ? `Last claim ${u.streak.lastClaimDate}` : "No active run"} />
                <Stat label="Pro until" value={u.subscription.endsAt ? new Date(u.subscription.endsAt).toLocaleDateString("en-NG") : u.proActive ? "Lifetime" : "—"} hint={u.subscription.source ? `Source: ${u.subscription.source}` : null} />
                <Stat label="Trial" value={u.subscription.trialUsed ? "Used" : "Available"} />
              </div>
              <Card title="Profile">
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Email", u.profile.email],
                    ["Phone", u.profile.phone],
                    ["Referral code", u.referralCode],
                    ["Referred by", u.referredByUid],
                    ["App version", u.appVersion],
                    ["Joined", formatDate(u.createdAt)],
                    ["Last seen", formatDate(u.lastSeenAt)],
                    ["Legacy installs", (u.installIds || []).join(", ")],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-white/40">{k}</dt>
                      <dd className="break-all text-white/85">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              {!u.deleted ? (
                <Card title="Actions" subtitle="Every action needs a reason and is written to the ODS audit log.">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setDialog("balance")}>Adjust balance</Button>
                    <Button variant="ghost" onClick={() => setDialog("grant")}>Grant plan</Button>
                    <Button variant="ghost" onClick={() => setDialog("extend")} disabled={!u.proActive || !u.subscription.endsAt}>Extend Pro</Button>
                    <Button variant="ghost" onClick={() => setDialog("end")} disabled={!u.proActive}>End Pro</Button>
                    <Button variant="ghost" onClick={() => setDialog("trial")} disabled={!u.subscription.trialUsed}>Reset trial</Button>
                    <Button variant="ghost" onClick={() => setDialog("master")}>{u.master ? "Clear master" : "Set master"}</Button>
                    <Button variant="danger" onClick={() => setDialog("delete")}>Delete account</Button>
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}

          {tab === "ledger" ? <LedgerList uid={u.uid} initial={detail.ledger} /> : null}

          {tab === "payments" ? (
            <ul className="space-y-2">
              {detail.payments.length === 0 ? <p className="text-sm text-white/40">No payments.</p> : null}
              {detail.payments.map((p) => (
                <li key={p.reference} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium capitalize text-white">{p.plan} · {formatNgn(p.amountNgn)}</p>
                    <p className="truncate font-mono text-xs text-white/40">{p.reference} · {formatDate(p.createdAt)}</p>
                  </div>
                  <StatusBadge status={p.status === "initialized" ? "pending" : p.status} />
                </li>
              ))}
            </ul>
          ) : null}

          {tab === "referrals" ? (
            <Card title={`Invited ${detail.referrals.madeCount} user${detail.referrals.madeCount === 1 ? "" : "s"}`} subtitle={u.referredByUid ? `This user was referred by ${u.referredByUid}` : "This user wasn't referred."}>
              <ul className="space-y-1 text-sm">
                {detail.referrals.made.map((r) => (
                  <li key={r.uid} className="flex justify-between gap-3 text-white/75">
                    <span className="truncate">{r.name || r.uid}</span>
                    <span className="text-xs text-white/40">{formatDate(r.at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {tab === "legacy" ? (
            detail.legacy.length ? (
              detail.legacy.map((l) => (
                <Card key={l.installId} title={`Legacy install ${l.installId.slice(0, 8)}…`} subtitle="Read-only record mirrored by the old app. Values are client-reported and not trusted.">
                  <pre className="max-h-72 overflow-auto rounded-2xl bg-black/30 p-3 text-xs text-white/70">{JSON.stringify(l, null, 2)}</pre>
                </Card>
              ))
            ) : (
              <p className="text-sm text-white/40">No legacy install linked.</p>
            )
          ) : null}
        </div>
      ) : null}

      {u ? <UserActions dialog={dialog} setDialog={setDialog} u={u} onDone={(msg, updated) => { if (updated) onChanged(updated); done(msg); }} /> : null}
    </Drawer>
  );
}

function LedgerList({ uid, initial }) {
  const [items, setItems] = useState(initial);
  const [before, setBefore] = useState(initial.length === 100 ? initial[initial.length - 1].createdAt : null);
  const [loading, setLoading] = useState(false);
  async function more() {
    setLoading(true);
    try {
      const r = await ods.userLedger(uid, before);
      setItems((p) => [...p, ...r.items]);
      setBefore(r.nextBefore);
    } finally {
      setLoading(false);
    }
  }
  if (!items.length) return <p className="text-sm text-white/40">No ledger entries yet.</p>;
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-white/6 rounded-2xl border border-white/8 bg-white/[0.02]">
        {items.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="truncate text-white">{e.title}</p>
              <p className="truncate text-xs text-white/40">
                {e.type} · {e.source} · {formatDate(e.createdAt)}
                {e.subtitle ? ` · ${e.subtitle}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className={`font-mono tabular-nums ${e.vpt > 0 ? "text-emerald-200" : e.vpt < 0 ? "text-red-200" : "text-white/50"}`}>
                {e.vpt > 0 ? "+" : ""}
                {e.vpt}
              </p>
              <p className="font-mono text-[10px] text-white/35">bal {e.balanceAfter}</p>
            </div>
          </li>
        ))}
      </ul>
      {before ? (
        <Button variant="ghost" onClick={more} disabled={loading}>
          {loading ? "Loading..." : "Older entries"}
        </Button>
      ) : null}
    </div>
  );
}

function UserActions({ dialog, setDialog, u, onDone }) {
  const [vpt, setVpt] = useState("");
  const [plan, setPlan] = useState("monthly");
  const [days, setDays] = useState("7");
  useEffect(() => {
    setVpt("");
    setDays("7");
  }, [dialog]);

  const close = () => setDialog(null);
  const common = { open: true, onClose: close };
  const amount = Number(vpt);
  const amountOk = vpt.trim() !== "" && Number.isFinite(amount) && amount !== 0 && Math.abs(amount) <= 1_000_000;

  switch (dialog) {
    case "balance":
      return (
        <ReasonDialog
          {...common}
          title="Adjust vPT balance"
          message={`Current balance: ${formatVpt(u.vptBalance)}. Use a negative amount to debit. This writes an admin_adjustment ledger entry; balances are never edited directly.`}
          canConfirm={amountOk}
          fields={
            <Field label="Amount (vPT, up to 8 decimals)" hint={amountOk ? `New balance ≈ ${formatVpt(u.vptBalance + amount)}` : "e.g. 1.5 or -0.25"}>
              <input value={vpt} onChange={(e) => setVpt(e.target.value)} inputMode="decimal" className={inputClass} placeholder="0.00" />
            </Field>
          }
          confirmLabel={amount < 0 ? "Debit" : "Credit"}
          onConfirm={async (reason) => {
            const r = await ods.adjustBalance(u.uid, amount, reason);
            onDone(`Balance adjusted. New balance ${formatVpt(r.entry.balanceAfter)}.`, r.user);
          }}
        />
      );
    case "grant":
      return (
        <ReasonDialog
          {...common}
          title="Grant a plan"
          message="Starts the plan now. Any remaining paid time is carried over."
          fields={
            <Field label="Plan">
              <select value={plan} onChange={(e) => setPlan(e.target.value)} className={inputClass}>
                {PLANS.map((p) => (
                  <option key={p} value={p} className="bg-[var(--av-dark-blue)] capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </Field>
          }
          confirmLabel="Grant"
          onConfirm={async (reason) => {
            const r = await ods.planAction(u.uid, { action: "grant", plan, reason });
            onDone(`${plan} Pro granted.`, r.user);
          }}
        />
      );
    case "extend":
      return (
        <ReasonDialog
          {...common}
          title="Extend Pro"
          canConfirm={Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 3650}
          fields={
            <Field label="Days to add">
              <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className={inputClass} />
            </Field>
          }
          confirmLabel="Extend"
          onConfirm={async (reason) => {
            const r = await ods.planAction(u.uid, { action: "extend", days: Number(days), reason });
            onDone(`Pro extended by ${days} days.`, r.user);
          }}
        />
      );
    case "end":
      return (
        <ReasonDialog
          {...common}
          destructive
          title="End Pro now"
          message="Pro ends immediately. No refund is issued."
          confirmLabel="End Pro"
          onConfirm={async (reason) => {
            const r = await ods.planAction(u.uid, { action: "end", reason });
            onDone("Pro ended.", r.user);
          }}
        />
      );
    case "trial":
      return (
        <ReasonDialog
          {...common}
          title="Reset trial"
          message="Lets this user start the free trial again."
          confirmLabel="Reset trial"
          onConfirm={async (reason) => {
            const r = await ods.resetTrial(u.uid, reason);
            onDone("Trial reset.", r.user);
          }}
        />
      );
    case "master":
      return (
        <ReasonDialog
          {...common}
          title={u.master ? "Clear master mode" : "Set master mode"}
          message={u.master ? "The server will stop treating this account as Pro." : "The server will treat this account as Pro for all checks. Owner-level action."}
          confirmLabel={u.master ? "Clear" : "Set master"}
          onConfirm={async (reason) => {
            const r = await ods.setMaster(u.uid, !u.master, reason);
            onDone(u.master ? "Master mode cleared." : "Master mode set.", r.user);
          }}
        />
      );
    case "delete":
      return (
        <ReasonDialog
          {...common}
          destructive
          title="Delete this ODS account"
          message="Removes the profile, photo and sign-in. Ledger and payment records are kept (anonymised) for accounting. This can't be undone."
          confirmLabel="Delete account"
          onConfirm={async (reason) => {
            await ods.deleteUser(u.uid, reason);
            onDone("Account deleted.", { uid: u.uid, deleted: true, proActive: false });
          }}
        />
      );
    default:
      return null;
  }
}
