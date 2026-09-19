"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const STATUS_STYLES = {
  pending: "border-amber-400/30 bg-amber-500/10 text-amber-300",
  accepted: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  declined: "border-white/15 bg-white/5 text-white/50",
  blocked: "border-red-400/30 bg-red-500/10 text-red-300",
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

export default function ChatTab({ onFeedback }) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const loadConnections = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/distribution/admin/chat/connections");
      setConnections(res.connections || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load chat connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  async function openConnection(connection) {
    setSelected(connection);
    setMessagesLoading(true);
    try {
      const res = await api.get(`/distribution/admin/chat/connections/${connection.id}/messages`);
      setMessages(res.messages || []);
    } catch (err) {
      onFeedback("error", err.message || "Failed to load messages");
    } finally {
      setMessagesLoading(false);
    }
  }

  async function setStatus(connection, status) {
    try {
      await api.patch(`/distribution/admin/chat/connections/${connection.id}`, { status });
      onFeedback("success", `Connection marked ${status}`);
      loadConnections();
      if (selected?.id === connection.id) {
        setSelected({ ...selected, status });
      }
    } catch (err) {
      onFeedback("error", err.message || "Failed to update connection");
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">TV-to-TV connections</h2>
          <span className="text-xs text-white/50">{connections.length} total</span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
          </div>
        )}

        {error && !loading && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
            <button onClick={loadConnections} className="ml-3 underline">Retry</button>
          </div>
        )}

        {!loading && !error && connections.length === 0 && (
          <p className="text-sm text-white/50">No chat connections yet.</p>
        )}

        <div className="space-y-2">
          {connections.map((c) => (
            <button
              key={c.id}
              onClick={() => openConnection(c)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                selected?.id === c.id
                  ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/10"
                  : "border-white/10 bg-white/3 hover:bg-white/6"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-white">
                  {c.user_a_info?.name || c.user_a} ↔ {c.user_b_info?.name || c.user_b}
                </span>
                <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[c.status] || STATUS_STYLES.pending}`}>
                  {c.status}
                </span>
              </div>
              <div className="mt-1 text-xs text-white/45">{formatDate(c.created_at)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-white/4 p-5">
        {!selected && (
          <p className="text-sm text-white/50">Select a connection to view its messages and moderate it.</p>
        )}

        {selected && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {selected.user_a_info?.name || selected.user_a} ↔ {selected.user_b_info?.name || selected.user_b}
                </h3>
                <span className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLES[selected.status] || STATUS_STYLES.pending}`}>
                  {selected.status}
                </span>
              </div>
              <div className="flex gap-2">
                {selected.status !== "blocked" && (
                  <button
                    onClick={() => setStatus(selected, "blocked")}
                    className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                  >
                    Block
                  </button>
                )}
                {selected.status === "blocked" && (
                  <button
                    onClick={() => setStatus(selected, "accepted")}
                    className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
                  >
                    Unblock
                  </button>
                )}
              </div>
            </div>

            {messagesLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-white/50">No messages in this conversation yet.</p>
            ) : (
              <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
                {messages.map((m) => {
                  const fromA = m.sender_id === selected.user_a;
                  const senderName = fromA
                    ? selected.user_a_info?.name || selected.user_a
                    : selected.user_b_info?.name || selected.user_b;
                  return (
                    <div key={m.id} className="rounded-2xl border border-white/10 bg-white/3 px-4 py-3">
                      <div className="flex items-center justify-between text-xs text-white/45">
                        <span>{senderName}</span>
                        <span>{formatDate(m.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm text-white/85">{m.body}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
