"use client";

import { useState } from "react";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import { ods, formatDate } from "@/services/ods";
import { Button, Card, ErrorNote, Field, OdsHeader, ReasonDialog, Spinner, inputClass, useAsync } from "@/components/ods/OdsUi";

const AUDIENCES = [
  ["all", "Everyone", "ods_announcements"],
  ["pro", "Pro users", "ods_pro"],
  ["free", "Free users", "ods_free"],
];

export default function OdsAnnouncementsPage() {
  const list = useAsync(() => ods.announcements(), []);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState(null);

  const valid = title.trim() && body.trim();
  const cols = [
    { key: "title", label: "Announcement", render: (a) => (
      <div className="max-w-md">
        <p className="font-medium text-white">{a.title}</p>
        <p className="truncate text-xs text-white/50">{a.body}</p>
      </div>
    ) },
    { key: "audience", label: "Audience", render: (a) => <span className="capitalize">{a.audience}</span> },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status === "sent" ? "success" : a.status} /> },
    { key: "sentAt", label: "Sent", render: (a) => <span className="text-xs text-white/60">{formatDate(a.sentAt)}</span> },
  ];

  return (
    <div className="space-y-6">
      <OdsHeader title="ODS-Announcements" subtitle="Push notifications to ODS app users through FCM topics." />
      {notice ? <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{notice}</p> : null}

      <Card title="Compose">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            <Field label={`Title (${title.length}/80)`}>
              <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="4K downloads are here" />
            </Field>
            <Field label={`Message (${body.length}/400)`}>
              <textarea value={body} maxLength={400} rows={4} onChange={(e) => setBody(e.target.value)} className={inputClass} placeholder="Update ODS to try the new…" />
            </Field>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map(([k, label, topic]) => (
                <button key={k} onClick={() => setAudience(k)} className={`rounded-2xl border px-4 py-2 text-left text-sm ${audience === k ? "border-[var(--av-light-orange)]/50 bg-[var(--av-orange)]/15 text-white" : "border-white/10 bg-white/5 text-white/70"}`}>
                  {label}
                  <span className="block font-mono text-[10px] text-white/40">{topic}</span>
                </button>
              ))}
            </div>
            <Button disabled={!valid} onClick={() => setConfirm(true)}>Send now</Button>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/40">Preview</p>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <p className="text-[11px] text-white/45">ODS · now</p>
              <p className="mt-1 text-sm font-semibold text-white">{title || "Title"}</p>
              <p className="mt-0.5 text-sm text-white/70">{body || "Your message appears here."}</p>
            </div>
          </div>
        </div>
      </Card>

      <ErrorNote error={list.error} onRetry={list.reload} />
      {list.loading && !list.data ? <Spinner /> : <DataTable columns={cols} rows={list.data?.items || []} emptyMessage="Nothing sent yet." />}

      <ReasonDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        requireReason={false}
        title={`Send to ${AUDIENCES.find(([k]) => k === audience)[1].toLowerCase()}?`}
        message="Push notifications can't be recalled once sent."
        confirmLabel="Send"
        onConfirm={async () => {
          await ods.sendAnnouncement({ title: title.trim(), body: body.trim(), audience });
          setTitle("");
          setBody("");
          setNotice("Announcement sent.");
          list.reload();
        }}
      />
    </div>
  );
}
