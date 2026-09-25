"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const PRIORITIES = ['normal', 'high', 'urgent'];

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", icon: "campaign", color: "#FF9800", priority: "normal", is_active: true });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/announcements/admin/list?includeInactive=true");
      setAnnouncements(res?.items ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditing({ _new: true });
    setForm({ title: "", body: "", icon: "campaign", color: "#FF9800", priority: "normal", is_active: true });
  }

  function startEdit(announcement) {
    setEditing(announcement);
    setForm({ 
      title: announcement.title, 
      body: announcement.body, 
      icon: announcement.icon || "campaign", 
      color: announcement.color || "#FF9800", 
      priority: announcement.priority || "normal", 
      is_active: announcement.is_active !== false 
    });
  }

  function cancelEdit() {
    setEditing(null);
    setSaveError(null);
    setForm({ title: "", body: "", icon: "campaign", color: "#FF9800", priority: "normal", is_active: true });
  }

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing._new) {
        await api.post("/announcements/admin/create", form);
      } else {
        await api.patch(`/announcements/admin/${editing.id}`, form);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err.message || "Save failed. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(announcement) {
    setConfirm({
      title: "Delete Announcement",
      message: `Delete "${announcement.title.slice(0, 60)}…"? This cannot be undone.`,
      destructive: true,
      action: async () => {
        try {
          await api.delete(`/announcements/admin/${announcement.id}`);
          await load();
        } catch {
          // handled
        }
      },
    });
  }

  async function toggleActive(announcement) {
    try {
      await api.patch(`/announcements/admin/${announcement.id}`, { is_active: !announcement.is_active });
      await load();
    } catch {
      // handled
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Announcements</h1>
          <p className="mt-2 text-sm text-white/58">
            Manage updates and announcements displayed on the mobile app homepage.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-full border border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25"
        >
          + Add Announcement
        </button>
      </div>

      {/* Create / Edit Form */}
      {editing && (
        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--av-light-orange)]/30 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-semibold text-white">
              {editing._new ? "New Announcement" : "Edit Announcement"}
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
                placeholder="Platform Launch"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Body</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
                placeholder="AfroVision is live! Start creating & exploring channels."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Icon</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
                  placeholder="campaign"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="h-10 w-16 rounded-lg border border-white/10 bg-white/6"
                  />
                  <input
                    type="text"
                    value={form.color}
                    onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="flex-1 rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
                    placeholder="#FF9800"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--av-light-orange)]/50"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p} className="bg-gray-900">{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Active</label>
                <div className="mt-1">
                  <button
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.is_active ? "bg-green-500/40" : "bg-white/10"}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${form.is_active ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            </div>
            {saveError && (
              <p role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{saveError}</p>
            )}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.body.trim()}
                className="rounded-full border border-green-500/40 bg-green-500/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-green-300 transition hover:bg-green-500/25 disabled:opacity-30"
              >
                {saving ? "Saving..." : editing._new ? "Create" : "Update"}
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-full border border-white/10 bg-white/4 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-white/60 transition hover:bg-white/8"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          No announcements yet. Add one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="divide-y divide-white/6">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/3"
              >
                {/* Status dot */}
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${announcement.is_active ? "bg-green-400" : "bg-white/20"}`} />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white/85">{announcement.title}</p>
                    <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      announcement.priority === 'urgent' ? 'bg-red-500/20 text-red-300' :
                      announcement.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/60 line-clamp-2">{announcement.body}</p>
                  <div className="mt-2 flex items-center gap-3 text-[10px] text-white/40">
                    <span className={announcement.is_active ? "text-green-400" : "text-white/30"}>
                      {announcement.is_active ? "Active" : "Inactive"}
                    </span>
                    <span>Created: {new Date(announcement.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(announcement)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                      announcement.is_active
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                        : "border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500/25"
                    }`}
                  >
                    {announcement.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => startEdit(announcement)}
                    className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300 transition hover:bg-blue-500/25"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => requestDelete(announcement)}
                    className="rounded-full border border-red-500/40 bg-red-500/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-300 transition hover:bg-red-500/25"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />
    </div>
  );
}
