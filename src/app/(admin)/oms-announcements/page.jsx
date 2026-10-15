"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { oms, formatDate } from "@/services/oms";
import { Button, Card, ErrorNote, Field, OmsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/oms/OmsUi";

const AUDIENCE = { all: "Everyone", plus: "Plus & Studio (incl. trials)", free: "Free users" };

export default function OmsAnnouncementsPage() {
  const list = useAsync(() => oms.announcements(), []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState(null);

  const cols = [
    { key: "sentAt", label: "Sent", render: (a) => <span className="text-xs text-white/60">{formatDate(a.sentAt)}</span> },
    { key: "title", label: "Announcement", render: (a) => <div className="max-w-md"><p className="text-white">{a.title}</p><p className="truncate text-xs text-white/50">{a.body}</p></div> },
    { key: "audience", label: "To", render: (a) => <span className="text-xs">{AUDIENCE[a.audience] || a.audience}</span> },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status === "sent" ? "success" : a.status === "failed" ? "failed" : "pending"} /> },
  ];

  return (
    <div className="space-y-6">
      <OmsHeader title="OMS-Announcements" subtitle="Push a message to everyone using OMS, or just paid or free users. Tapping it opens the app's Home." />

      <Card title="New announcement">
        <div className="space-y-3">
          <Field label={`Title (${title.length}/80)`}>
            <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>
          <Field label={`Message (${body.length}/400)`}>
            <textarea value={body} maxLength={400} rows={3} onChange={(e) => setBody(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Send to">
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className={`${inputClass} max-w-xs`}>
              {Object.entries(AUDIENCE).map(([k, v]) => <option key={k} value={k} className="bg-[var(--av-dark-blue)]">{v}</option>)}
            </select>
          </Field>
          {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{notice}</p> : null}
          <Button disabled={!title.trim() || !body.trim()} onClick={() => setConfirming(true)}>Send…</Button>
        </div>
      </Card>

      <ErrorNote error={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? <Spinner /> : <DataTable columns={cols} rows={list.data?.items || []} getRowId={(a) => a.id} emptyMessage="No announcements yet." />}

      <ReasonDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        requireReason={false}
        title={`Send to ${AUDIENCE[audience].toLowerCase()}?`}
        message={`“${title.trim()}” — ${body.trim()}. This goes out immediately and can't be recalled.`}
        confirmLabel="Send now"
        onConfirm={async () => {
          await oms.sendAnnouncement({ title: title.trim(), body: body.trim(), audience });
          setNotice("Announcement sent.");
          setTitle("");
          setBody("");
          list.reload();
        }}
      />
    </div>
  );
}
