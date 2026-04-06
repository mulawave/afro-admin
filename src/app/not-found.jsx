import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] p-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--av-light-orange)]/85">AfroVision</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Page Not Found</h1>
        <p className="mt-3 text-sm text-white/62">
          The requested admin surface does not exist or is no longer available.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            Back to Dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-medium text-white/78 transition hover:bg-white/10"
          >
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}