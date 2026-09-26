"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Drawer from "@/components/ui/Drawer";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { ods, formatDate, formatVpt } from "@/services/ods";
import { Button, ErrorNote, Field, OdsHeader, Spinner, inputClass } from "@/components/ods/OdsUi";

const CATEGORIES = {
  download: "A download failed or won't play",
  payment: "Payment or subscription",
  voucher: "Voucher",
  wallet: "vPT, streak or rewards",
  account: "Account or profile",
  bug: "Something isn't working",
  feedback: "Suggestion or feedback",
  other: "Something else",
};
const statusTone = (s) => ({ open: "pending", answered: "success", closed: "inactive" })[s] || s;

function age(iso) {
  if (!iso) return "—";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h` : `${Math.round(h / 24)}d`;
}

export default function OdsSupportPage() {
  const [filters, setFilters] = useState({ status: "", category: "", unread: false });
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(
    async (more) => {
      setLoading(true);
      setError(null);
      try {
        const r = await ods.supportTickets({
          q: q.trim() || undefined,
          status: filters.status || undefined,
          category: filters.category || undefined,
          unread: filters.unread ? "true" : undefined,
          cursor: more || undefined,
        });
        setItems((p) => (more ? [...p, ...r.items] : r.items));
        setCursor(r.nextCursor);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [filters, q],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const cols = [
    {
      key: "subject",
      label: "Ticket",
      render: (t) => (
        <div className="min-w-0 max-w-md">
          <p className={`truncate ${t.unreadForAdmin ? "font-semibold text-white" : "text-white/85"}`}>
            {t.unreadForAdmin ? <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[var(--av-light-orange)]" /> : null}
            {t.subject}
          </p>
          <p className="truncate font-mono text-xs text-white/40">{t.id}</p>
        </div>
      ),
    },
    {
      key: "user",
      label: "User",
      render: (t) => (
        <div className="min-w-0">
          <p className="truncate text-sm text-white/80">{t.userSnapshot?.fullName || t.email || "—"}</p>
          <p className="truncate font-mono text-xs text-white/40">{t.uid}</p>
        </div>
      ),
    },
    { key: "category", label: "Topic", render: (t) => <span className="text-xs text-white/70">{CATEGORIES[t.category] || t.category}</span> },
    { key: "status", label: "Status", render: (t) => <span className="inline-flex items-center gap-1.5"><StatusBadge status={statusTone(t.status)} /><span className="text-xs capitalize text-white/55">{t.status}</span></span> },
    { key: "age", label: "Updated", render: (t) => <span className="text-xs text-white/55" title={formatDate(t.updatedAt)}>{age(t.updatedAt)} ago</span> },
    { key: "open", label: "", render: (t) => <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => setOpenId(t.id)}>Open</Button> },
  ];

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Support" subtitle="Tickets from the ODS app's Help & support. Replies reach the user as a push and in their notification centre." />

      <div className="flex flex-wrap items-end gap-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex flex-1 flex-wrap items-end gap-2"
        >
          <input value={q} onChange={(e) => setQ(e.target.value)} className={`${inputClass} max-w-sm`} placeholder="Ticket ID, Account ID, email or subject" />
          <Button type="submit">Search</Button>
          {q ? (
            <Button type="button" variant="ghost" onClick={() => { setQ(""); setTimeout(() => load(), 0); }}>
              Clear
            </Button>
          ) : null}
        </form>
        <Field label="Status">
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className={`${inputClass} w-36`}>
            {["", "open", "answered", "closed"].map((s) => <option key={s} value={s} className="bg-[var(--av-dark-blue)]">{s || "All"}</option>)}
          </select>
        </Field>
        <Field label="Topic">
          <select value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className={`${inputClass} w-56`}>
            <option value="" className="bg-[var(--av-dark-blue)]">All topics</option>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k} className="bg-[var(--av-dark-blue)]">{v}</option>)}
          </select>
        </Field>
        <label className="mb-2.5 flex items-center gap-2 text-sm text-white/75">
          <input type="checkbox" checked={filters.unread} onChange={(e) => setFilters((f) => ({ ...f, unread: e.target.checked }))} className="accent-[var(--av-orange)]" />
          Unread only
        </label>
      </div>

      <ErrorNote error={error} onRetry={() => load()} />
      {loading && !items.length ? <Spinner /> : <DataTable columns={cols} rows={items} getRowId={(t) => t.id} emptyMessage="No tickets." defaultPageSize={25} />}
      {cursor ? (
        <div className="flex justify-center">
          <Button variant="ghost" onClick={() => load(cursor)} disabled={loading}>Load older</Button>
        </div>
      ) : null}

      <TicketDrawer
        id={openId}
        onClose={() => setOpenId(null)}
        onChanged={(t) => setItems((p) => p.map((x) => (x.id === t.id ? { ...x, ...t } : x)))}
      />
    </div>
  );
}

function TicketDrawer({ id, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const r = await ods.supportTicket(id);
      setData(r);
      onChanged(r.ticket);
    } catch (err) {
      setError(err.message);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    setData(null);
    setReply("");
    setNotice(null);
    load();
  }, [load]);

  async function send(close) {
    setBusy(true);
    setNotice(null);
    setError(null);
    try {
      const r = await ods.supportReply(id, reply.trim(), close);
      setData((d) => ({ ...d, ticket: r.ticket, messages: r.messages }));
      onChanged(r.ticket);
      setReply("");
      setNotice(r.notification?.delivered ? "Reply sent. The user got a push notification." : "Reply saved to the user's inbox (no device registered for push).");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(status) {
    setBusy(true);
    setError(null);
    try {
      const r = await ods.supportStatus(id, status);
      setData((d) => ({ ...d, ticket: r.ticket }));
      onChanged(r.ticket);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const t = data?.ticket;
  const u = data?.user;
  return (
    <Drawer open={!!id} onClose={onClose} title={t ? t.subject : "Ticket"} width="max-w-3xl">
      <ErrorNote error={error} onRetry={load} />
      {!data && !error ? <Spinner /> : null}
      {t ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="font-mono">{t.id}</span>·<span>{CATEGORIES[t.category] || t.category}</span>·<StatusBadge status={statusTone(t.status)} />
            <span className="capitalize">{t.status}</span>·<span>opened {formatDate(t.createdAt)}</span>
          </div>

          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
            {u ? (
              <div className="flex flex-wrap items-start gap-4">
                {u.profile?.photoUrl ? <img src={u.profile.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-semibold text-white">{u.profile?.fullName || t.email || "Unnamed user"}</p>
                  <p className="text-white/60">{[u.profile?.email || t.email, u.profile?.phone].filter(Boolean).join(" · ") || "No contact details"}</p>
                  <p className="mt-1 font-mono text-xs text-white/40">Account ID {u.uid}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-white/65">
                  <span>Plan</span><span className="capitalize text-white">{u.plan}{u.master ? " (master)" : ""}</span>
                  <span>Balance</span><span className="text-white">{formatVpt(u.vptBalance)}</span>
                  <span>App</span><span className="text-white">{u.appVersion || t.diagnostics?.appVersion || "—"}</span>
                  <span>Last seen</span><span className="text-white">{formatDate(u.lastSeenAt)}</span>
                </div>
                <Link href={`/ods-users?q=${encodeURIComponent(u.uid)}`} className="text-xs text-[var(--av-light-orange)] underline">Open user</Link>
              </div>
            ) : (
              <p className="text-sm text-white/50">The user account for this ticket no longer exists.</p>
            )}
            {t.diagnostics && Object.keys(t.diagnostics).length ? (
              <p className="mt-3 break-all text-xs text-white/40">
                {Object.entries(t.diagnostics).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </p>
            ) : null}
          </div>

          <ul className="space-y-3">
            {data.messages.map((m) => (
              <li key={m.id} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.from === "support" ? "ml-auto bg-[var(--av-orange)]/15 text-white" : "bg-white/6 text-white/90"}`}>
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[11px] text-white/40">{m.from === "support" ? "Support" : "User"} · {formatDate(m.createdAt)}</p>
              </li>
            ))}
          </ul>

          {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}

          <div className="space-y-2 border-t border-white/8 pt-4">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} maxLength={4000} className={inputClass} placeholder="Write a reply…" />
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                {t.status === "closed" ? (
                  <Button variant="ghost" disabled={busy} onClick={() => setStatus("open")}>Reopen</Button>
                ) : (
                  <Button variant="ghost" disabled={busy} onClick={() => setStatus("closed")}>Close without reply</Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" disabled={busy || !reply.trim()} onClick={() => send(true)}>Reply &amp; close</Button>
                <Button disabled={busy || !reply.trim()} onClick={() => send(false)}>{busy ? "Sending..." : "Reply"}</Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Drawer>
  );
}
