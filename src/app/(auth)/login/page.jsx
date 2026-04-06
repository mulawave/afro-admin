"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { useBranding } from "@/lib/branding";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { logo_url } = useBranding();

  async function handleLogin() {
    try {
      setError("");
      setIsLoading(true);
      await loginAdmin(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <form onSubmit={(event) => { event.preventDefault(); handleLogin(); }} className="w-full max-w-md rounded-[2rem] border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
        {logo_url ? (
          <img src={logo_url} alt="AfroVision" className="h-12 w-auto object-contain mb-4" />
        ) : (
          <p className="text-[11px] uppercase tracking-[0.34em] text-[var(--av-light-orange)]/85">AfroVision</p>
        )}
        <h1 className="mt-3 text-3xl font-semibold text-white">Admin Console</h1>
        <p className="mt-2 text-sm text-white/65">Use an administrator account to access moderation, finance, and operational controls.</p>

        <input
          className="mt-6 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mt-3 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? <p className="mt-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-5 w-full rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-60"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
