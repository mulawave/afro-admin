"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const TYPE_STYLES = {
  program_update: "border-sky-400/30 bg-sky-500/10 text-sky-300",
  psa: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  marketing: "border-purple-400/30 bg-purple-500/10 text-purple-300",
  critical: "border-red-400/30 bg-red-500/10 text-red-300",
};

const TYPE_LABELS = {
  program_update: "Program Update",
  psa: "PSA",
  marketing: "Marketing",
  critical: "Critical",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagingTab({ onFeedback }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComposer, setShowComposer] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Composer form state
  const [form, setForm] = useState({
    type: "program_update",
    title: "",
    body: "",
    targetScope: "all",
    distributorId: "",
    deviceId: "",
    allowReply: true,
  });

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/distribution/admin/messages");
      setMessages(res.messages || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  async function submitMessage(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      onFeedback("error", "Title and body are required");
      return;
    }
    setSaving(true);
    try {
      const target = { scope: form.targetScope };
      if (form.targetScope === "distributor" && form.distributorId) {
        target.distributor_id = form.distributorId;
      }
      if (form.targetScope === "device" && form.deviceId) {
        target.device_id = form.deviceId;
      }

      const res = await api.post("/distribution/admin/messages", {
        type: form.type,
        title: form.title.trim(),
        body: form.body.trim(),
        target,
        allow_reply: form.allowReply,
      });
      if (res.error) throw new Error(res.error);
      onFeedback("success", "Message sent to TV devices");
      setForm({
        type: "program_update",
        title: "",
        body: "",
        targetScope: "all",
        distributorId: "",
        deviceId: "",
        allowReply: true,
      });
      setShowComposer(false);
      await loadMessages();
    } catch (err) {
      onFeedback("error", err.message || "Failed to send message");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-white">TV Messaging ({messages.length})</h2>
        <button
          onClick={() => setShowComposer((s) => !s)}
          className="rounded-xl bg-gradient-to-r from-[var(--av-light-orange)] to-[var(--av-orange)] px-5 py-2.5 text-sm font-bold text-[var(--av-dark-blue)] hover:shadow-lg hover:shadow-[var(--av-orange)]/25 transition-all"
        >
          {showComposer ? "Cancel" : "+ Compose Message"}
        </button>
      </div>

      {/* Composer */}
      {showComposer && (
        <form onSubmit={submitMessage} className="rounded-2xl border border-white/10 bg-white/4 p-6 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--av-light-orange)]">New TV Message</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Message Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--av-orange)]/60"
              >
                <option value="program_update">Program Update</option>
                <option value="psa">Public Service Announcement</option>
                <option value="marketing">Marketing</option>
                <option value="critical">Critical Alert</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Target Audience</label>
              <select
                value={form.targetScope}
                onChange={(e) => setForm({ ...form, targetScope: e.target.value })}
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/10 text-sm text-white focus:outline-none focus:border-[var(--av-orange)]/60"
              >
                <option value="all">All TV Devices</option>
                <option value="distributor">Specific Distributor</option>
                <option value="device">Specific Device</option>
              </select>
            </div>
          </div>

          {form.targetScope === "distributor" && (
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Distributor ID</label>
              <input
                type="text"
                value={form.distributorId}
                onChange={(e) => setForm({ ...form, distributorId: e.target.value })}
                placeholder="Enter distributor ID"
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--av-orange)]/60"
              />
            </div>
          )}

          {form.targetScope === "device" && (
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1.5">Device ID</label>
              <input
                type="text"
                value={form.deviceId}
                onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                placeholder="Enter device ID"
                className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--av-orange)]/60"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Message title..."
              required
              className="w-full h-11 px-4 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--av-orange)]/60"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1.5">Body</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="Message content..."
              rows={4}
              required
              className="w-full px-4 py-3 rounded-xl bg-white/6 border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--av-orange)]/60"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowReply}
              onChange={(e) => setForm({ ...form, allowReply: e.target.checked })}
              className="h-4 w-4 rounded accent-[var(--av-orange)]"
            />
            <span className="text-sm text-white/70">Allow TV devices to reply</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--av-light-orange)] to-[var(--av-orange)] px-6 py-2.5 text-sm font-bold text-[var(--av-dark-blue)] disabled:opacity-50"
          >
            {saving && <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--av-dark-blue)]" />}
            {saving ? "Sending..." : "Send Message"}
          </button>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadMessages} className="ml-3 underline">Retry</button>
        </div>
      )}

      {/* Messages list */}
      {!loading && !error && messages.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-8 text-center">
          <p className="text-sm text-white/50">No messages sent yet. Click "Compose Message" to create one.</p>
        </div>
      )}

      {!loading && !error && messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-white/10 bg-white/4 px-4 py-4 cursor-pointer hover:bg-white/6 transition"
              onClick={() => setSelectedMessage(selectedMessage?.id === m.id ? null : m)}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${TYPE_STYLES[m.type] || TYPE_STYLES.program_update}`}>
                      {TYPE_LABELS[m.type] || m.type}
                    </span>
                    <p className="text-sm font-medium text-white">{m.title}</p>
                  </div>
                  <p className="text-xs text-white/50 line-clamp-2">{m.body}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/40">
                    <span>Target: <span className="text-white/60">{m.target?.scope || "all"}</span></span>
                    <span>Replies: <span className="text-white/60">{m.reply_count || 0}</span></span>
                    {m.allow_reply === false && <span className="text-white/40">Replies disabled</span>}
                  </div>
                </div>
                <div className="text-right text-xs text-white/40">
                  <p>{formatDate(m.created_at)}</p>
                </div>
              </div>

              {/* Expanded replies */}
              {selectedMessage?.id === m.id && m.replies && m.replies.length > 0 && (
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Replies</p>
                  {m.replies.map((r) => (
                    <div key={r.id} className="rounded-lg bg-white/4 px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50">Device: <span className="font-mono text-white/70">{r.device_id}</span></span>
                        <span className="text-xs text-white/40">{formatDate(r.created_at)}</span>
                      </div>
                      <p className="text-sm text-white/80 mt-1">{r.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {selectedMessage?.id === m.id && (!m.replies || m.replies.length === 0) && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-xs text-white/40">No replies yet.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
