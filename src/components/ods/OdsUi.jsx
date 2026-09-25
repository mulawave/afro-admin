"use client";

import { useEffect, useState } from "react";

/** Page header for ODS- pages. */
export function OdsHeader({ title, subtitle, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--av-light-orange)]/85">Obroh Download Suite</p>
        <h1 className="mt-1 text-3xl font-semibold text-white">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm text-white/58">{subtitle}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}

export function Card({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl ${className}`}>
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            {title ? <h2 className="text-lg font-semibold text-white">{title}</h2> : null}
            {subtitle ? <p className="mt-1 text-xs text-white/50">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone = "default" }) {
  const accent = { default: "text-white", good: "text-emerald-200", warn: "text-amber-200", bad: "text-red-200" }[tone];
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/45">{label}</p>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${accent}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-white/45">{hint}</p> : null}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] text-[var(--av-dark-blue)] hover:brightness-105",
    ghost: "border border-white/10 bg-white/6 text-white/82 hover:bg-white/10",
    danger: "border border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20",
  }[variant];
  return (
    <button {...props} className={`rounded-2xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles} ${className}`}>
      {children}
    </button>
  );
}

export const inputClass =
  "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/32 focus:border-[var(--av-light-orange)]/50";

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-white/65">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-white/40">{hint}</span> : null}
    </label>
  );
}

export function ErrorNote({ error, onRetry }) {
  if (!error) return null;
  return (
    <div role="alert" className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {error}
      {onRetry ? (
        <button onClick={onRetry} className="ml-3 underline underline-offset-4">
          Retry
        </button>
      ) : null}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
    </div>
  );
}

/**
 * Confirm dialog with a required reason (every ODS admin mutation is audited
 * with a reason, spec §7). `fields` renders extra inputs above the reason.
 * The action receives the reason; if it throws, the dialog stays open and
 * shows the error.
 */
export function ReasonDialog({ open, title, message, confirmLabel = "Confirm", destructive = false, requireReason = true, fields, canConfirm = true, onConfirm, onClose }) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;
  const reasonOk = !requireReason || reason.trim().length >= 3;

  async function submit(e) {
    e.preventDefault();
    if (!reasonOk || !canConfirm || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err) {
      setError(err?.message || "Action failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <form onSubmit={submit} className="relative mx-4 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface-strong)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
        {message ? <p className="mb-4 text-sm leading-6 text-white/66">{message}</p> : null}
        {fields ? <div className="mb-4 space-y-3">{fields}</div> : null}
        {requireReason ? (
          <Field label="Reason (saved to the audit log)">
            <textarea autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={300} className={inputClass} placeholder="e.g. Support ticket #123" />
          </Field>
        ) : null}
        {error ? <p role="alert" className="mt-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" variant={destructive ? "danger" : "primary"} disabled={!reasonOk || !canConfirm || busy}>
            {busy ? "Working..." : confirmLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => !cancelled && setState({ loading: false, error: null, data }))
      .catch((err) => !cancelled && setState({ loading: false, error: err.message || "Failed to load", data: null }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1), setData: (data) => setState((s) => ({ ...s, data })) };
}
