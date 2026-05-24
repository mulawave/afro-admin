"use client";

export default function GlobalError({ error, reset }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="rounded-[2rem] border border-white/10 bg-[var(--admin-surface)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl max-w-md w-full">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-red-400/30 bg-red-500/10">
          <span className="text-red-300 text-xl">!</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p className="text-sm text-white/55 mb-6">
          {error?.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-6 py-2.5 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
