"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/settings");
      setSettings(res.settings ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function requestSave(key, value) {
    setConfirm({
      title: "Update Setting",
      message: `Change "${formatKey(key)}" to "${value}"? This update applies immediately.`,
      destructive: false,
      action: async () => {
        setSaving(key);
        try {
          await api.patch(`/admin/settings/${key}`, { value });
          await load();
        } finally {
          setSaving(null);
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  const grouped = (settings || []).reduce((accumulator, setting) => {
    const groupKey = setting.category_label || setting.category || "Other";
    accumulator[groupKey] = accumulator[groupKey] || [];
    accumulator[groupKey].push(setting);
    return accumulator;
  }, {});
  const groups = Object.entries(grouped);
  const tabNames = groups.map(([group]) => group);

  const currentTab = activeTab && tabNames.includes(activeTab) ? activeTab : tabNames[0];
  const currentEntries = (grouped[currentTab] || []).filter((setting) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      setting.key.toLowerCase().includes(q) ||
      formatKey(setting.key).toLowerCase().includes(q) ||
      (setting.description || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">System Settings</h1>
          <p className="mt-2 text-sm text-white/58">Firestore-backed platform settings spanning blockchain, rates, and runtime configuration.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settings..."
            className="w-56 rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-[var(--av-light-orange)]/40"
          />
          <span className="whitespace-nowrap rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {settings.length} setting{settings.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {settings.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          No settings configured
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 border-b border-white/8 pb-1">
            {tabNames.map((tab) => {
              const isActive = tab === currentTab;
              const count = (grouped[tab] || []).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative rounded-t-xl px-4 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-[var(--admin-surface)] text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab}
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                        isActive ? "bg-[var(--av-light-orange)]/20 text-[var(--av-light-orange)]" : "bg-white/8 text-white/45"
                      }`}
                    >
                      {count}
                    </span>
                  </span>
                  {isActive ? (
                    <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-[linear-gradient(90deg,var(--av-orange),var(--av-light-orange))]" />
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <div className="border-b border-white/8 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">{currentTab}</h2>
            </div>
            {currentEntries.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-white/40">
                No settings match &quot;{search}&quot; in this section.
              </div>
            ) : (
              <div className="divide-y divide-white/6">
                {currentEntries.map((setting) => (
                  <SettingRow
                    key={setting.key}
                    setting={setting}
                    saving={saving === setting.key}
                    onSave={(value) => requestSave(setting.key, value)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />
    </div>
  );
}

function SettingRow({ setting, saving, onSave }) {
  const settingKey = setting.key;
  const value = setting.value;
  const isBoolean = setting.type === "boolean";
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value ?? ""));

  function handleSave() {
    if (val === String(value)) {
      setEditing(false);
      return;
    }
    onSave(val);
    setEditing(false);
  }

  function handleCancel() {
    setVal(String(value ?? ""));
    setEditing(false);
  }

  return (
    <div className="flex flex-col justify-between gap-4 px-5 py-4 lg:flex-row lg:items-center">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white">{formatKey(settingKey)}</div>
        <div className="mt-1 text-xs font-mono text-white/38">{settingKey}</div>
        {setting.description ? <div className="mt-2 text-sm text-white/55">{setting.description}</div> : null}
      </div>
      {editing ? (
        <div className="flex items-center gap-2 ml-4">
          {isBoolean ? (
            <select
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              className="w-44 rounded-2xl border border-white/10 bg-[var(--admin-surface)] px-3 py-2 text-sm text-white outline-none cursor-pointer appearance-none"
            >
              <option value="true">✓ true — Enabled</option>
              <option value="false">✗ false — Disabled</option>
            </select>
          ) : (
            <input
              type={setting.is_secret ? "password" : "text"}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-64 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
              autoFocus
            />
          )}
          <button
            onClick={handleSave}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-3 py-2 text-xs font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 ml-4">
          {isBoolean ? (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${String(value) === "true" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${String(value) === "true" ? "bg-emerald-400" : "bg-red-400"}`} />
              {String(value) === "true" ? "Enabled" : "Disabled"}
            </span>
          ) : (
            <span className="max-w-xs truncate font-mono text-sm text-white/78">
              {renderValue(value, setting.is_secret, setting.has_value, setting.value_preview)}
            </span>
          )}
          <button
            onClick={() => { setVal(String(value ?? "")); setEditing(true); }}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-[var(--av-light-orange)] hover:text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Edit"}
          </button>
        </div>
      )}
    </div>
  );
}

function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderValue(value, isSecret, hasValue, valuePreview) {
  if (isSecret) return hasValue ? (valuePreview || "Configured") : "Not set";
  if (value === true) return "✓ Enabled";
  if (value === false) return "✗ Disabled";
  if (value === null || value === undefined) return "—";
  return String(value);
}
