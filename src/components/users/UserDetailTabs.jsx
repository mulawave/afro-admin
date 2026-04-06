"use client";

import { useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "economy", label: "Economy" },
  { id: "activity", label: "Activity" },
  { id: "engagement", label: "Engagement" },
  { id: "system", label: "System" },
];

export default function UserDetailTabs({ activeTab, onTabChange }) {
  return (
    <div className="flex gap-1 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
            activeTab === tab.id
              ? "bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] text-[var(--av-dark-blue)] shadow-lg"
              : "text-white/50 hover:bg-white/[0.06] hover:text-white/70"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export { TABS };
