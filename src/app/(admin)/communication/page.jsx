"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const CHANNEL_OPTIONS = [
  { value: "push", label: "Push Notification" },
  { value: "email", label: "Email" },
  { value: "sms", label: "SMS" },
];

export default function CommunicationPage() {
  const [type, setType] = useState("push");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [confirm, setConfirm] = useState(null);

  function handleSend() {
    if (!message.trim()) return;

    const channelLabel = CHANNEL_OPTIONS.find((c) => c.value === type)?.label || type;

    setConfirm({
      title: "Send Broadcast",
      message: `Send ${channelLabel} to all users?\n\nMessage: "${message.trim().slice(0, 100)}${message.trim().length > 100 ? "..." : ""}"`,
      destructive: false,
      action: async () => {
        setSending(true);
        setResult(null);
        try {
          await api.post("/admin/communication/send", {
            type,
            message: message.trim(),
          });
          setResult({ success: true, text: `${channelLabel} broadcast sent successfully.` });
          setMessage("");
        } catch (err) {
          setResult({ success: false, text: err.message || "Failed to send broadcast" });
        } finally {
          setSending(false);
        }
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Communication</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        {/* Channel selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel
          </label>
          <div className="flex gap-3">
            {CHANNEL_OPTIONS.map((ch) => (
              <button
                key={ch.value}
                onClick={() => setType(ch.value)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  type === ch.value
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {ch.value === "push" && "🔔 "}
                {ch.value === "email" && "📧 "}
                {ch.value === "sms" && "💬 "}
                {ch.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your broadcast message..."
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {message.length} characters
          </div>
        </div>

        {/* Result */}
        {result && (
          <div
            className={`px-4 py-3 rounded-lg text-sm ${
              result.success
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            {result.text}
          </div>
        )}

        {/* Send */}
        <div className="flex justify-end">
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Broadcast"}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
        ⚠ All broadcasts are logged to the audit trail and cannot be undone.
      </div>

      {/* Confirm Dialog */}
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
