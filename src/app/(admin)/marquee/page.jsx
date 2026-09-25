"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function MarqueePage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // topic being edited, or { _new: true } for create
  const [form, setForm] = useState({ text: "", priority: 1, active: true });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/marquee");
      setTopics(res ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load marquee topics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function startCreate() {
    setEditing({ _new: true });
    setForm({ text: "", priority: 1, active: true });
  }

  function startEdit(topic) {
    setEditing(topic);
    setForm({ text: topic.text, priority: topic.priority ?? 1, active: topic.active !== false });
  }

  function cancelEdit() {
    setEditing(null);
    setSaveError(null);
    setForm({ text: "", priority: 1, active: true });
  }

  async function handleSave() {
    if (!form.text.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      if (editing._new) {
        await api.post("/admin/marquee", form);
      } else {
        await api.patch(`/admin/marquee/${editing.id}`, form);
      }
      cancelEdit();
      await load();
    } catch (err) {
      setSaveError(err.message || "Save failed. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(topic) {
    setConfirm({
      title: "Delete Topic",
      message: `Delete "${topic.text.slice(0, 60)}…"? This cannot be undone.`,
      destructive: true,
      action: async () => {
        try {
          await api.delete(`/admin/marquee/${topic.id}`);
          await load();
        } catch {
          // handled
        }
      },
    });
  }

  async function toggleActive(topic) {
    try {
      await api.patch(`/admin/marquee/${topic.id}`, { active: !topic.active });
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
          <h1 className="text-3xl font-semibold text-white">Marquee Ticker</h1>
          <p className="mt-2 text-sm text-white/58">
            Manage scrolling news ticker topics displayed on the website between the navigation and community pool bar.
          </p>
        </div>
        <button
          onClick={startCreate}
          className="rounded-full border border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25"
        >
          + Add Topic
        </button>
      </div>

      {/* Create / Edit Form */}
      {editing && (
        <div className="overflow-hidden rounded-[1.75rem] border border-[var(--av-light-orange)]/30 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="border-b border-white/8 px-5 py-3">
            <h2 className="text-sm font-semibold text-white">
              {editing._new ? "New Marquee Topic" : "Edit Topic"}
            </h2>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Text</label>
              <textarea
                value={form.text}
                onChange={(e) => setForm({ ...form, text: e.target.value })}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
                placeholder="Breaking: AfroVision launches new features..."
              />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Priority</label>
                <input
                  type="number"
                  min={0}
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })}
                  className="mt-1 w-24 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none focus:border-[var(--av-light-orange)]/50"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/40">Active</label>
                <div className="mt-1">
                  <button
                    onClick={() => setForm({ ...form, active: !form.active })}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${form.active ? "bg-green-500/40" : "bg-white/10"}`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${form.active ? "translate-x-6" : "translate-x-1"}`} />
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
                disabled={saving || !form.text.trim()}
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

      {/* Topics List */}
      {topics.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          No marquee topics yet. Add one to get started.
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <div className="divide-y divide-white/6">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center gap-4 px-5 py-4 transition hover:bg-white/3"
              >
                {/* Status dot */}
                <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${topic.active ? "bg-green-400" : "bg-white/20"}`} />

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/85 line-clamp-2">{topic.text}</p>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-white/40">
                    <span>Priority: {topic.priority ?? 0}</span>
                    <span className={topic.active ? "text-green-400" : "text-white/30"}>
                      {topic.active ? "Active" : "Inactive"}
                    </span>
                    {topic.updatedAt && (
                      <span>
                        Updated: {new Date(topic.updatedAt._seconds ? topic.updatedAt._seconds * 1000 : topic.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(topic)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition ${
                      topic.active
                        ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25"
                        : "border-green-500/40 bg-green-500/15 text-green-300 hover:bg-green-500/25"
                    }`}
                  >
                    {topic.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => startEdit(topic)}
                    className="rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300 transition hover:bg-blue-500/25"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => requestDelete(topic)}
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
