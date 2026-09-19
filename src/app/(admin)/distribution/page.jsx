"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import NoticeBanner from "@/components/ui/NoticeBanner";
import OverviewTab from "./OverviewTab";
import DistributorsTab from "./DistributorsTab";
import MarketersTab from "./MarketersTab";
import DevicesTab from "./DevicesTab";
import SettingsTab from "./SettingsTab";
import LedgerTab from "./LedgerTab";
import MessagingTab from "./MessagingTab";
import ChatTab from "./ChatTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "distributors", label: "Distributors" },
  { id: "marketers", label: "Marketers" },
  { id: "devices", label: "Devices" },
  { id: "settings", label: "Settings" },
  { id: "messaging", label: "Messaging" },
  { id: "chat", label: "TV Chat" },
  { id: "ledger", label: "Ledger" },
];

export default function DistributionPage() {
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/distribution/admin/overview");
      setOverview(res);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load distribution overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  function showFeedback(tone, message) {
    setFeedback({ tone, message });
    setTimeout(() => setFeedback(null), 4000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">TV Distribution</h1>
          <p className="mt-2 text-sm text-white/58">
            Manage distributors, marketers, TV device activations, kill switch, financials, and global settings.
          </p>
        </div>
        {overview?.stats && (
          <div className="flex flex-wrap gap-2">
            <StatPill label="Distributors" value={overview.stats.distributor_count} />
            <StatPill label="Devices" value={overview.stats.device_count} />
            <StatPill label="Active" value={overview.stats.active_devices} tone="green" />
            <StatPill label="Disabled" value={overview.stats.disabled_devices} tone="red" />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {feedback && (
        <NoticeBanner tone={feedback.tone} message={feedback.message} />
      )}

      {error && !loading && tab === "overview" && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadOverview} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && tab === "overview" && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && tab === "overview" && overview && (
        <OverviewTab overview={overview} />
      )}

      {tab === "distributors" && (
        <DistributorsTab onFeedback={showFeedback} />
      )}

      {tab === "marketers" && (
        <MarketersTab onFeedback={showFeedback} />
      )}

      {tab === "devices" && (
        <DevicesTab onFeedback={showFeedback} />
      )}

      {tab === "settings" && (
        <SettingsTab onFeedback={showFeedback} />
      )}

      {tab === "messaging" && (
        <MessagingTab onFeedback={showFeedback} />
      )}

      {tab === "chat" && (
        <ChatTab onFeedback={showFeedback} />
      )}

      {tab === "ledger" && (
        <LedgerTab onFeedback={showFeedback} />
      )}
    </div>
  );
}

function StatPill({ label, value, tone }) {
  const toneClass = tone === "green"
    ? "border-emerald-400/30 text-emerald-200"
    : tone === "red"
    ? "border-red-400/30 text-red-200"
    : "border-white/10 text-white/72";
  return (
    <span className={`rounded-full border bg-white/6 px-3 py-1 text-sm ${toneClass}`}>
      {value} {label}
    </span>
  );
}
