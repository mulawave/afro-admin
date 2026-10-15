"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import StatusBadge from "@/components/ui/StatusBadge";
import { oms, formatDate, formatNgn, formatVpt } from "@/services/oms";
import { Button, Card, ErrorNote, Field, OmsHeader, PlanBadge, ReasonDialog, Spinner, Stat, inputClass } from "@/components/oms/OmsUi";

export default function OmsUsersPage() {
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
      const r = await oms.listUsers(before);
      setItems((prev) => (before ? [...prev, ...r.items] : r.items));
      setNextBefore(r.nextBefore);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Deep link from OMS-Support: /oms-users?q=<Account ID>
    const initial = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") : null;
    if (!initial) {
      loadRecent();
      return;
    }
    setQuery(initial);
    (async () => {
      setLoading(true);
      try {
        const r = await oms.searchUsers(initial);
        setItems(r.items);
        setNextBefore(null);
        if (r.items.length === 1) setSelected(r.items[0].uid);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadRecent]);

  async function search(e) {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return loadRecent();
    setLoading(true);
    setError(null);
    try {
      const r = await oms.searchUsers(q);
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
          <p className="truncate font-medium text-white">{u.name || u.email || "Unnamed"}</p>
          <p className="truncate font-mono text-xs text-white/40">{u.uid}</p>
        </div>
      ),
    },
    { key: "plan", label: "Plan", render: (u) => <PlanBadge u={u} /> },
    { key: "vpt", label: "vPT", render: (u) => <span className={`font-mono tabular-nums ${u.vpt < 0 ? "text-red-200" : ""}`}>{formatVpt(u.vpt)}</span> },
    { key: "referralCode", label: "Referral", render: (u) => <span className="font-mono text-xs">{u.referralCode || "—"}</span> },
    { key: "lastSeenAt", label: "Last seen", render: (u) => <span className="text-xs text-white/60">{formatDate(u.lastSeenAt)}</span> },
    { key: "open", label: "", render: (u) => <Button variant="ghost" onClick={() => setSelected(u.uid)} className="px-3 py-1.5 text-xs">Open</Button> },
  ];

  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Users" subtitle="Find OMS accounts, see their wallet, plan, streak and history, and take audited support actions." />

      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Account ID, email, phone or referral code" className={`${inputClass} max-w-xl`} />
        <Button type="submit">Search</Button>
        {query ? (
          <Button type="button" variant="ghost" onClick={() => { setQuery(""); loadRecent(); }}>
            Clear
          </Button>
        ) : null}
      </form>

      <ErrorNote error={error} onRetry={() => search()} />
      {loading && !items.length ? <Spinner /> : <DataTable columns={columns} rows={items} getRowId={(u) => u.uid} emptyMessage={query ? "No OMS user matches that search." : "No OMS users yet."} defaultPageSize={25} />}
      {nextBefore && !query ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => loadRecent(nextBefore)} disabled={loading}>{loading ? "Loading..." : "Load more"}</Button>
        </div>
      ) : null}

      <UserDrawer uid={selected} onClose={() => setSelected(null)} onChanged={(u) => setItems((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, ...u } : x)))} />
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
      setDetail(await oms.user(uid));
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
  const done = async (msg, updated) => {
    setNotice(msg);
    if (updated) onChanged({ uid, ...updated });
    await load();
  };

  return (
    <Drawer open={!!uid} onClose={onClose} title="OMS-User" width="max-w-2xl">
      <ErrorNote error={error} onRetry={load} />
      {!detail && !error ? <Spinner /> : null}
      {u ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            {u.profile.photo ? (
              <img src={`data:image/jpeg;base64,${u.profile.photo}`} alt="" className="h-14 w-14 shrink-0 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/8 text-lg font-semibold text-white/60">
                {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold text-white">{u.name || u.email || "Unnamed user"}</p>
              <p className="font-mono text-xs text-white/45">{u.uid}</p>
              <div className="mt-2"><PlanBadge u={u} /></div>
            </div>
          </div>

          {u.disabled ? (
            <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">This account is disabled: the user can't sign in.</p>
          ) : null}
          {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}

          <div className="inline-flex flex-wrap rounded-2xl border border-white/8 bg-white/[0.03] p-1">
            {["overview", "ledger", "payments", "referrals", "streak", "tickets"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-3 py-1.5 text-sm capitalize ${tab === t ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === "overview" ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="vPT balance" value={formatVpt(u.vpt)} tone={u.vpt < 0 ? "bad" : "default"} />
                <Stat label="Streak" value={`Day ${u.streak.day}`} hint={u.streak.lastClaimAt ? `Last claim ${formatDate(u.streak.lastClaimAt)} · ${formatVpt(u.streak.earnedVpt)} this run` : "No active run"} />
                <Stat
                  label="Plan"
                  value={<span className="capitalize">{u.plan}</span>}
                  hint={u.planActive ? `Until ${formatDate(u.planExpiresAt)}${u.autoRenew ? " · renews" : " · won't renew"}` : u.queuedPlan ? `Queued: ${u.queuedPlan}` : "No paid plan running"}
                />
                <Stat label="Trial" value={u.trialRunning ? "Running" : "Used"} hint={u.trialEndsAt ? `Ends ${formatDate(u.trialEndsAt)}` : null} />
              </div>
              <Card title="Profile">
                <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  {[
                    ["Email", u.email],
                    ["Email verified", u.emailVerified ? "Yes" : "No"],
                    ["Phone", u.phone],
                    ["Gender", u.profile.gender],
                    ["About", u.profile.about],
                    ["Referral code", u.referralCode],
                    ["Referred by", u.referredBy],
                    ["Has paid", u.hasPaid ? "Yes" : "No"],
                    ["Joined", formatDate(u.createdAt)],
                    ["Last seen", formatDate(u.lastSeenAt)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-white/40">{k}</dt>
                      <dd className="break-all text-white/85">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
              {u.exists ? (
                <Card title="Actions" subtitle="Every action needs a reason and is written to the OMS audit log.">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setDialog("balance")}>Adjust balance</Button>
                    <Button variant="ghost" onClick={() => setDialog("grant")}>Grant plan</Button>
                    <Button variant="ghost" onClick={() => setDialog("extend")} disabled={!u.planActive}>Extend plan</Button>
                    <Button variant="ghost" onClick={() => setDialog("end")} disabled={!u.planActive}>End plan</Button>
                    <Button variant="ghost" onClick={() => setDialog("trial")} disabled={u.trialRunning}>New trial</Button>
                    <Button variant="ghost" onClick={() => setDialog("streak")}>Set streak</Button>
                    <Button variant="ghost" onClick={() => setDialog("message")}>Send message</Button>
                    <Button variant="ghost" onClick={() => setDialog("disable")}>{u.disabled ? "Enable account" : "Disable account"}</Button>
                    <Button variant="danger" onClick={() => setDialog("delete")}>Delete account</Button>
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}

          {tab === "ledger" ? (
            detail.ledger.length ? (
              <ul className="divide-y divide-white/6 rounded-2xl border border-white/8 bg-white/[0.02]">
                {detail.ledger.map((e) => (
                  <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-white">{e.title}</p>
                      <p className="truncate text-xs text-white/40">{e.type} · {formatDate(e.at)}{e.note ? ` · ${e.note}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono tabular-nums ${e.vpt > 0 ? "text-emerald-200" : e.vpt < 0 ? "text-red-200" : "text-white/50"}`}>
                        {e.vpt > 0 ? "+" : ""}{e.vpt}
                      </p>
                      {e.balanceVpt !== null ? <p className="font-mono text-[10px] text-white/35">bal {e.balanceVpt}</p> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-white/40">No ledger entries yet.</p>
          ) : null}

          {tab === "payments" ? (
            <ul className="space-y-2">
              {detail.payments.length === 0 ? <p className="text-sm text-white/40">No Paystack payments.</p> : null}
              {detail.payments.map((p) => (
                <li key={p.reference} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-white">{formatNgn(p.amountNgn)} → {formatVpt(p.vpt)}</p>
                    <p className="truncate font-mono text-xs text-white/40">{p.reference} · {formatDate(p.at)}</p>
                  </div>
                  <StatusBadge status="success" />
                </li>
              ))}
            </ul>
          ) : null}

          {tab === "referrals" ? (
            <Card
              title={`Invited ${detail.referrals.made.length} user${detail.referrals.made.length === 1 ? "" : "s"}`}
              subtitle={detail.referrals.referredBy ? `This user was referred by ${detail.referrals.referredBy}` : "This user wasn't referred."}
            >
              <ul className="space-y-1 text-sm">
                {detail.referrals.made.map((r) => (
                  <li key={r.uid} className="flex justify-between gap-3 text-white/75">
                    <Link href={`/oms-users?q=${encodeURIComponent(r.uid)}`} className="truncate font-mono text-xs underline">{r.uid}</Link>
                    <span className="text-xs text-white/40">{formatDate(r.at)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {tab === "streak" ? (
            detail.streakDays.length ? (
              <ul className="space-y-1 text-sm">
                {detail.streakDays.map((s) => (
                  <li key={s.day} className="flex justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-white/80">
                    <span>Day {s.day}{s.mult > 1 ? ` (${s.mult}×)` : ""}</span>
                    <span className="font-mono text-xs">{formatVpt(s.vpt)}</span>
                    <span className="text-xs text-white/40">{formatDate(s.at)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-white/40">No claims in the current streak.</p>
          ) : null}

          {tab === "tickets" ? (
            detail.tickets.length ? (
              <ul className="space-y-2">
                {detail.tickets.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm">
                    <div className="min-w-0">
                      <p className="truncate text-white">{t.subject}</p>
                      <p className="font-mono text-xs text-white/40">{t.id} · {formatDate(t.updatedAt)}</p>
                    </div>
                    <span className="text-xs capitalize text-white/60">{t.status}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-white/40">No support tickets.</p>
          ) : null}
        </div>
      ) : null}

      {u ? <UserActions dialog={dialog} setDialog={setDialog} u={u} onDone={done} /> : null}
    </Drawer>
  );
}

function UserActions({ dialog, setDialog, u, onDone }) {
  const [vpt, setVpt] = useState("");
  const [plan, setPlan] = useState("plus");
  const [days, setDays] = useState("30");
  const [streakDay, setStreakDay] = useState("");
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  useEffect(() => {
    setVpt("");
    setDays(dialog === "extend" ? "7" : "30");
    setStreakDay(String(u.streak.day || ""));
    setMsgTitle("");
    setMsgBody("");
  }, [dialog, u.streak.day]);

  const close = () => setDialog(null);
  const common = { open: true, onClose: close };
  const amount = Number(vpt);
  const amountOk = vpt.trim() !== "" && Number.isFinite(amount) && amount !== 0 && Math.abs(amount) <= 1_000_000;
  const daysOk = Number.isInteger(Number(days)) && Number(days) >= 1 && Number(days) <= 3650;
  const dayOk = streakDay.trim() !== "" && Number.isInteger(Number(streakDay)) && Number(streakDay) >= 0 && Number(streakDay) <= 3650;

  switch (dialog) {
    case "balance":
      return (
        <ReasonDialog
          {...common}
          title="Adjust vPT balance"
          message={`Current balance: ${formatVpt(u.vpt)}. Use a negative amount to debit; a debit can't take the balance below zero. Writes an admin_adjustment ledger entry.`}
          canConfirm={amountOk}
          fields={
            <Field label="Amount (vPT, up to 8 decimals)" hint={amountOk ? `New balance ≈ ${formatVpt(u.vpt + amount)}` : "e.g. 1.5 or -0.25"}>
              <input value={vpt} onChange={(e) => setVpt(e.target.value)} inputMode="decimal" className={inputClass} placeholder="0.00" />
            </Field>
          }
          confirmLabel={amount < 0 ? "Debit" : "Credit"}
          onConfirm={async (reason) => {
            const r = await oms.adjustBalance(u.uid, amount, reason);
            onDone(`Balance adjusted. New balance ${formatVpt(r.user.vpt)}.`, r.user);
          }}
        />
      );
    case "grant":
      return (
        <ReasonDialog
          {...common}
          title="Grant a plan"
          message="Starts now. Time left on the same plan carries over; a different plan starts fresh."
          canConfirm={daysOk}
          fields={
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
          }
          confirmLabel="Grant"
          onConfirm={async (reason) => {
            const r = await oms.planAction(u.uid, { action: "grant", plan, days: Number(days), reason });
            onDone(`OMS ${plan} granted for ${days} days.`, r.user);
          }}
        />
      );
    case "extend":
      return (
        <ReasonDialog
          {...common}
          title={`Extend ${u.plan}`}
          canConfirm={daysOk}
          fields={
            <Field label="Days to add">
              <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" className={inputClass} />
            </Field>
          }
          confirmLabel="Extend"
          onConfirm={async (reason) => {
            const r = await oms.planAction(u.uid, { action: "extend", days: Number(days), reason });
            onDone(`Plan extended by ${days} days.`, r.user);
          }}
        />
      );
    case "end":
      return (
        <ReasonDialog
          {...common}
          destructive
          title={`End ${u.plan} now`}
          message="The plan ends immediately. No refund is issued."
          confirmLabel="End plan"
          onConfirm={async (reason) => {
            const r = await oms.planAction(u.uid, { action: "end", reason });
            onDone("Plan ended.", r.user);
          }}
        />
      );
    case "trial":
      return (
        <ReasonDialog
          {...common}
          title="Give a new trial"
          message="Starts a fresh 3-day Plus trial now."
          confirmLabel="Start trial"
          onConfirm={async (reason) => {
            const r = await oms.resetTrial(u.uid, reason);
            onDone("New trial started.", r.user);
          }}
        />
      );
    case "streak":
      return (
        <ReasonDialog
          {...common}
          title="Set the streak"
          message="For a streak that broke unfairly. Sets the day and leaves today's claim open, so the streak isn't seen as broken."
          canConfirm={dayOk}
          fields={
            <Field label="Streak day" hint={`Currently day ${u.streak.day}. 0 clears the streak.`}>
              <input value={streakDay} onChange={(e) => setStreakDay(e.target.value)} inputMode="numeric" className={inputClass} />
            </Field>
          }
          confirmLabel="Set streak"
          onConfirm={async (reason) => {
            const r = await oms.setStreak(u.uid, Number(streakDay), reason);
            onDone(`Streak set to day ${streakDay}.`, r.user);
          }}
        />
      );
    case "message":
      return (
        <ReasonDialog
          {...common}
          requireReason={false}
          title="Send a message"
          message="Sent as a push notification. If the device isn't registered, nothing is delivered."
          canConfirm={msgTitle.trim().length > 0 && msgBody.trim().length > 0}
          fields={
            <>
              <Field label={`Title (${msgTitle.length}/80)`}>
                <input value={msgTitle} maxLength={80} onChange={(e) => setMsgTitle(e.target.value)} className={inputClass} placeholder="About your account" />
              </Field>
              <Field label={`Message (${msgBody.length}/400)`}>
                <textarea value={msgBody} maxLength={400} rows={4} onChange={(e) => setMsgBody(e.target.value)} className={inputClass} />
              </Field>
            </>
          }
          confirmLabel="Send"
          onConfirm={async () => {
            const r = await oms.notifyUser(u.uid, msgTitle.trim(), msgBody.trim());
            onDone(r.delivered ? "Message sent." : "Not delivered: this account has no registered device.");
          }}
        />
      );
    case "disable":
      return (
        <ReasonDialog
          {...common}
          destructive={!u.disabled}
          title={u.disabled ? "Enable this account" : "Disable this account"}
          message={u.disabled ? "The user can sign in again." : "Signs the user out everywhere now and stops them signing in. Their data is kept."}
          confirmLabel={u.disabled ? "Enable" : "Disable"}
          onConfirm={async (reason) => {
            const r = await oms.setDisabled(u.uid, !u.disabled, reason);
            onDone(u.disabled ? "Account enabled." : "Account disabled.", r.user);
          }}
        />
      );
    case "delete":
      return (
        <ReasonDialog
          {...common}
          destructive
          title="Delete this OMS account"
          message="Removes the profile, wallet, plan, streak, referrals and sign-in — the same as the user deleting it in the app. Payment records are kept and tickets are anonymised. This can't be undone."
          confirmLabel="Delete account"
          onConfirm={async (reason) => {
            await oms.deleteUser(u.uid, reason);
            onDone("Account deleted.", { exists: false });
          }}
        />
      );
    default:
      return null;
  }
}
