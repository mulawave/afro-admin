"use client";

import { useEffect, useState } from "react";

// If onConfirm throws, the dialog stays open and shows the error, so a failed
// sensitive action is never silently dismissed. Callers let errors propagate
// out of onConfirm instead of catching them.
export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  destructive = false,
  busy = false,
  error = null,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  const [running, setRunning] = useState(false);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    if (!open) {
      setRunning(false);
      setActionError(null);
    }
  }, [open]);

  if (!open) return null;

  const isBusy = busy || running;
  const shownError = actionError || error;

  async function handleConfirm() {
    setActionError(null);
    setRunning(true);
    try {
      await onConfirm?.();
    } catch (err) {
      setActionError(err?.message || "Action failed. Please retry.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-sm" onClick={onCancel} />

      <div className="relative mx-4 w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface-strong)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        <p className="mb-6 text-sm leading-6 text-white/66">{message}</p>

        {shownError ? <p role="alert" className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{shownError}</p> : null}

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition-colors hover:bg-white/10"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isBusy}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white transition-colors ${
              destructive
                ? "bg-red-600 hover:bg-red-500"
                : "bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] text-[var(--av-dark-blue)] hover:brightness-105"
            }`}
          >
            {isBusy && (
              <span className={`h-4 w-4 animate-spin rounded-full border-b-2 ${destructive ? "border-white" : "border-[var(--av-dark-blue)]"}`} />
            )}
            {isBusy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
