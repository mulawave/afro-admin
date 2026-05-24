"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { name: "Dashboard", path: "/dashboard", tone: "Core" },
  { name: "Users", path: "/users", tone: "Core" },
  { name: "Channels", path: "/channels", tone: "Core" },
  { name: "Library Moderation", path: "/library", tone: "Operations" },
  { name: "Categories", path: "/categories", tone: "Core" },
  { name: "Design", path: "/design", tone: "Content" },
  { name: "Email Templates", path: "/email-templates", tone: "Content" },
  { name: "Gifts", path: "/gifts", tone: "Monetization" },
  { name: "Plans", path: "/plans", tone: "Monetization" },
  { name: "Viewer Plans", path: "/viewer-plans", tone: "Monetization" },
  { name: "Community Pool", path: "/community-pool", tone: "Monetization" },
  { name: "Operations Pool", path: "/operations-pool", tone: "Monetization" },
  { name: "RBD Pool", path: "/rbd-pool", tone: "Monetization" },
  { name: "Promo Modal", path: "/promo-modal", tone: "Content" },
  { name: "Wallets", path: "/wallets", tone: "Finance" },
  { name: "Withdrawals", path: "/withdrawals", tone: "Finance" },
  { name: "Ledger", path: "/ledger", tone: "Finance" },
  { name: "Economy", path: "/economy", tone: "Finance" },
  { name: "Subscriptions", path: "/creator-subscriptions", tone: "Operations" },
  { name: "Batches", path: "/batches", tone: "Operations" },
  { name: "Blockchain", path: "/blockchain", tone: "Infrastructure" },
  { name: "Communication", path: "/communication", tone: "Operations" },
  { name: "Feature Flags", path: "/feature-flags", tone: "Operations" },
  { name: "Challenge", path: "/challenge", tone: "Operations" },
  { name: "Audition Signups", path: "/audition-signups", tone: "Operations" },
  { name: "KYC", path: "/kyc", tone: "Compliance" },
  { name: "Copyright", path: "/copyright", tone: "Legal" },
  { name: "Advertisements", path: "/advertisements", tone: "Monetization" },
  { name: "Ad Analytics", path: "/ad-analytics", tone: "Monetization" },
  { name: "Marquee", path: "/marquee", tone: "Content" },
  { name: "Settings", path: "/settings", tone: "Infrastructure" },
  { name: "Audit", path: "/audit", tone: "Infrastructure" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-6 left-6 z-40 hidden w-64 max-h-[calc(100vh-3rem)] flex-col overflow-y-auto rounded-[2.25rem] border border-[var(--admin-border)] bg-[var(--admin-surface-strong)] px-5 py-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl md:flex">
      <div className="mb-4 flex items-center justify-between lg:block">
        <div>
          <p className="text-[10px] uppercase tracking-[0.34em] text-[var(--av-light-orange)]/85">AfroVision</p>
          <h1 className="mt-1 text-xl font-semibold text-white">Admin Console</h1>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/60 lg:mt-4 lg:inline-flex">
          Command Center
        </div>
      </div>

      <nav aria-label="Admin Navigation" className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1 pb-4 overscroll-contain">
        {links.map((link) => {
          const active = pathname === link.path;

          return (
            <Link
              key={link.path}
              href={link.path}
              className={`group flex min-w-0 flex-col rounded-2xl border px-4 py-3 transition-all ${
                active
                  ? "border-[var(--av-light-orange)]/50 bg-[linear-gradient(135deg,rgba(244,150,23,0.22),rgba(23,58,109,0.3))] text-white shadow-[0_12px_32px_rgba(0,0,0,0.24)]"
                  : "border-white/8 bg-white/4 text-white/72 hover:border-white/16 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-sm font-semibold">{link.name}</span>
              <span className={`mt-1 text-[10px] uppercase tracking-[0.22em] ${active ? "text-[var(--av-light-orange)]" : "text-white/40 group-hover:text-white/55"}`}>
                {link.tone}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
