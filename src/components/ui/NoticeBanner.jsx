"use client";

const TONES = {
  success: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  error: "border-red-400/30 bg-red-500/10 text-red-200",
  info: "border-sky-400/30 bg-sky-500/10 text-sky-200",
  warn: "border-amber-400/30 bg-amber-500/10 text-amber-200",
};

export default function NoticeBanner({ tone = "info", message, actionLabel, onAction }) {
  if (!message) return null;

  return (
    <div className={`rounded-[1.5rem] border px-4 py-3 text-sm ${TONES[tone] || TONES.info}`}>
      <div className="flex items-center justify-between gap-3">
        <span>{message}</span>
        {actionLabel && onAction ? (
          <button onClick={onAction} className="shrink-0 underline underline-offset-4">
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}