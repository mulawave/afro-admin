"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAdminSession } from "@/lib/api";

const TITLES = {
  "/dashboard": "Platform Overview",
  "/users": "User Operations",
  "/channels": "Channel Moderation",
  "/categories": "Channel Categories",
  "/design": "Brand Design",
  "/gifts": "Gift Catalog",
  "/plans": "Subscription Plans",
  "/wallets": "Wallet Visibility",
  "/withdrawals": "Withdrawal Queue",
  "/ledger": "Financial Ledger",
  "/economy": "Economy Controls",
  "/creator-subscriptions": "Creator Memberships",
  "/batches": "Batch Operations",
  "/blockchain": "Blockchain Readiness",
  "/communication": "Operator Broadcasts",
  "/feature-flags": "Feature Rollouts",
  "/challenge": "Challenge Management",
  "/kyc": "Identity Verification",
  "/copyright": "Copyright Claims",
  "/settings": "System Settings",
  "/advertisements": "Ad Management",
  "/ad-analytics": "Ad Analytics & Revenue",
  "/marquee": "Marquee Ticker",
  "/audit": "Audit Trail",
  "/distribution": "TV Distribution",
};

export default function Header({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  function logout() {
    setLoggingOut(true);
    clearAdminSession();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[linear-gradient(180deg,rgba(5,10,48,0.92),rgba(5,10,48,0.65))] px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--av-light-orange)]/85">Admin Surface</p>
          <h2 className="mt-1 text-2xl font-semibold text-white">{TITLES[pathname] || "AfroVision Admin"}</h2>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-right shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">Signed in</p>
            <p className="mt-1 text-sm font-semibold text-white">{user?.email || "Admin"}</p>
          </div>

          <button
            onClick={logout}
            disabled={loggingOut}
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--av-orange)]/40 bg-[linear-gradient(135deg,rgba(244,150,23,0.18),rgba(245,193,108,0.12))] px-4 py-2 text-sm font-semibold text-white transition hover:border-[var(--av-light-orange)]/55 hover:bg-[linear-gradient(135deg,rgba(244,150,23,0.32),rgba(245,193,108,0.18))] disabled:opacity-50"
          >
            {loggingOut && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />}
            {loggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>
    </header>
  );
}
