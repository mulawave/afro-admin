"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const links = [
  { name: "Dashboard", path: "/dashboard", tone: "Core" },
  { name: "Users", path: "/users", tone: "Core" },
  { name: "Channels", path: "/channels", tone: "Core" },
  { name: "Live Viewers", path: "/live-viewers", tone: "Core" },
  { name: "Data Injection", path: "/data-injection", tone: "Operations" },
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
  { name: "Media Center Heroes", path: "/media-center-heroes", tone: "Content" },
  { name: "Wallets", path: "/wallets", tone: "Finance" },
  { name: "Withdrawals", path: "/withdrawals", tone: "Finance" },
  { name: "Ledger", path: "/ledger", tone: "Finance" },
  { name: "Economy", path: "/economy", tone: "Finance" },
  { name: "Subscriptions", path: "/creator-subscriptions", tone: "Operations" },
  { name: "Batches", path: "/batches", tone: "Operations" },
  { name: "Blockchain", path: "/blockchain", tone: "Infrastructure" },
  { name: "Communication", path: "/communication", tone: "Operations" },
  { name: "Feature Flags", path: "/feature-flags", tone: "Operations" },
  { name: "AI Video", path: "/ai-video", tone: "Operations" },
  { name: "Challenge", path: "/challenge", tone: "Operations" },
  { name: "Audition Signups", path: "/audition-signups", tone: "Operations" },
  { name: "KYC", path: "/kyc", tone: "Compliance", badgeKey: "kyc" },
  { name: "Guardians", path: "/guardians", tone: "Compliance" },
  { name: "Copyright", path: "/copyright", tone: "Legal" },
  { name: "Advertisements", path: "/advertisements", tone: "Monetization" },
  { name: "Ad Analytics", path: "/ad-analytics", tone: "Monetization" },
  { name: "Marquee", path: "/marquee", tone: "Content" },
  { name: "TV Distribution", path: "/distribution", tone: "Distribution" },
  { name: "Settings", path: "/settings", tone: "Infrastructure" },
  { name: "Audit", path: "/audit", tone: "Infrastructure" },
  // Obroh Download Suite: same admin login, ODS- prefixed pages.
  { name: "ODS-Dashboard", path: "/ods-dashboard", tone: "ODS" },
  { name: "ODS-Support", path: "/ods-support", tone: "ODS", badgeKey: "odsSupport" },
  { name: "ODS-Users", path: "/ods-users", tone: "ODS" },
  { name: "ODS-Payments", path: "/ods-payments", tone: "ODS" },
  { name: "ODS-Vouchers", path: "/ods-vouchers", tone: "ODS" },
  { name: "ODS-Config", path: "/ods-config", tone: "ODS" },
  { name: "ODS-Settings", path: "/ods-settings", tone: "ODS" },
  { name: "ODS-Announcements", path: "/ods-announcements", tone: "ODS" },
  { name: "ODS-Public Pool", path: "/ods-pool", tone: "ODS" },
  { name: "ODS-Audit", path: "/ods-audit", tone: "ODS" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [kycPending, setKycPending] = useState(null);
  const [odsUnread, setOdsUnread] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchKycStats() {
      try {
        const res = await api.get("/kyc/admin/stats");
        if (!cancelled && res?.pending > 0) setKycPending(res.pending);
        else if (!cancelled) setKycPending(null);
      } catch {
        if (!cancelled) setKycPending(null);
      }
    }
    fetchKycStats();
    const interval = setInterval(fetchKycStats, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Unread ODS support tickets: two cheap count queries, every 5 min, only while visible.
  useEffect(() => {
    let cancelled = false;
    async function fetchOdsSupport() {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      try {
        const { ods } = await import("@/services/ods");
        const r = await ods.supportSummary();
        if (!cancelled) setOdsUnread(r?.unread > 0 ? r.unread : null);
      } catch {
        if (!cancelled) setOdsUnread(null);
      }
    }
    fetchOdsSupport();
    const interval = setInterval(fetchOdsSupport, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  const badgeFor = (link) => {
    if (link.badgeKey === "kyc" && kycPending) return kycPending;
    if (link.badgeKey === "odsSupport" && odsUnread) return odsUnread;
    return null;
  };

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
          const badge = badgeFor(link);

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
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{link.name}</span>
                {badge !== null && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/90 px-1.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                )}
              </div>
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
