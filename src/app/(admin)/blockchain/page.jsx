"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function BlockchainPage() {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsRes, readinessRes, treasuryRes] = await Promise.allSettled([
        api.get("/admin/settings"),
        api.get("/vpt/admin/preflight"),
        api.get("/vpt/admin/treasury"),
      ]);

      if (settingsRes.status !== "fulfilled") {
        throw settingsRes.reason;
      }

      const config = (settingsRes.value.settings ?? []).reduce((accumulator, setting) => {
        accumulator[setting.key] = setting.value;
        return accumulator;
      }, {});

      setCfg({
        ...config,
        readiness: readinessRes.status === "fulfilled" ? readinessRes.value.readiness : null,
        treasury: treasuryRes.status === "fulfilled" ? treasuryRes.value.treasury : null,
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load blockchain config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function requestSave(key, value, label) {
    setConfirm({
      title: "Update Blockchain Config",
      message: `Change "${label}" to "${value}"? This modifies the live blockchain configuration.`,
      destructive: false,
      action: async () => {
        setSaving(key);
        try {
          await api.patch(`/admin/settings/${key}`, { value });
          await load();
        } catch {
          // handled by api
        } finally {
          setSaving(null);
        }
      },
    });
  }

  function requestEnvSwitch(value) {
    requestSave("ENVIRONMENT", value, "Environment");
  }

  function requestKeyUpdate(value) {
    setConfirm({
      title: "Update Treasury Key",
      message: "Update the treasury private key? This is an extremely sensitive operation. The key is stored encrypted and never returned.",
      destructive: true,
      action: async () => {
        setSaving("TREASURY_PRIVATE_KEY");
        try {
          await api.patch("/admin/settings/TREASURY_PRIVATE_KEY", { value });
          await load();
        } catch {
          // handled by api
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Blockchain Control</h1>
          <p className="mt-2 text-sm text-white/58">Review readiness, treasury state, and core execution settings for swaps and distributions.</p>
        </div>
        <EnvBadge env={cfg?.ENVIRONMENT} />
      </div>

      <Section title="Readiness">
        <div className="grid gap-4 md:grid-cols-3">
          <ReadinessCard label="Status" value={cfg?.readiness?.ready ? "Ready" : "Not ready"} tone={cfg?.readiness?.ready ? "good" : "warn"} />
          <ReadinessCard label="Environment" value={cfg?.readiness?.environment || cfg?.ENVIRONMENT || "—"} />
          <ReadinessCard label="Treasury" value={cfg?.treasury?.address || cfg?.readiness?.treasury_address || "Unavailable"} />
        </div>
        {Array.isArray(cfg?.readiness?.missing) && cfg.readiness.missing.length > 0 ? (
          <p className="mt-4 text-sm text-red-200">Missing: {cfg.readiness.missing.join(", ")}</p>
        ) : null}
        {Array.isArray(cfg?.readiness?.invalid) && cfg.readiness.invalid.length > 0 ? (
          <p className="mt-2 text-sm text-amber-200">Invalid: {cfg.readiness.invalid.join(", ")}</p>
        ) : null}
      </Section>

      <Section title="Environment">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-white/72">Active Environment</span>
          <div className="flex items-center gap-3">
            <select
              value={cfg?.ENVIRONMENT || "staging"}
              onChange={(e) => requestEnvSwitch(e.target.value)}
              disabled={saving === "ENVIRONMENT"}
              className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-white outline-none disabled:opacity-50"
            >
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            {saving === "ENVIRONMENT" && (
              <span className="text-xs text-white/45">Switching...</span>
            )}
          </div>
        </div>
        <p className="mt-1 text-xs text-white/45">
          Environment guards affect which chain configuration the distribution engine expects.
        </p>
      </Section>

      <Section title="Contract Addresses">
        <EditableField
          label="VPT Token"
          value={cfg?.VPT_TOKEN_ADDRESS}
          saving={saving === "VPT_TOKEN_ADDRESS"}
          onSave={(v) => requestSave("VPT_TOKEN_ADDRESS", v, "VPT Token Address")}
        />
        <EditableField
          label="Router"
          value={cfg?.PANCAKE_ROUTER}
          saving={saving === "PANCAKE_ROUTER"}
          onSave={(v) => requestSave("PANCAKE_ROUTER", v, "PancakeSwap Router")}
        />
        <EditableField
          label="WBNB"
          value={cfg?.WBNB_ADDRESS}
          saving={saving === "WBNB_ADDRESS"}
          onSave={(v) => requestSave("WBNB_ADDRESS", v, "WBNB Address")}
        />
      </Section>

      <Section title="RPC Configuration">
        <EditableField
          label="BSC RPC URL"
          value={cfg?.BSC_RPC}
          saving={saving === "BSC_RPC"}
          onSave={(v) => requestSave("BSC_RPC", v, "BSC RPC URL")}
        />
      </Section>

      <Section title="Treasury">
        <div className="mb-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
          Treasury balance: {cfg?.treasury?.balance_bnb ? `${cfg.treasury.balance_bnb} BNB` : "Unavailable"}
        </div>
        <TreasuryKeyField
          saving={saving === "TREASURY_PRIVATE_KEY"}
          onSave={requestKeyUpdate}
        />
      </Section>

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

function EnvBadge({ env }) {
  const isProd = env === "production";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
      isProd ? "border border-red-400/30 bg-red-500/10 text-red-200" : "border border-amber-400/30 bg-amber-500/10 text-amber-200"
    }`}>
      {isProd ? "🔴 PRODUCTION" : "🟡 STAGING"}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function EditableField({ label, value, onSave, saving }) {
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
    <div className="flex items-center justify-between border-b border-white/8 py-2 last:border-b-0">
      <span className="w-48 text-sm font-medium text-white/72">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-64 rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm font-mono text-white outline-none"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-3 py-1.5 text-xs font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="max-w-xs truncate font-mono text-sm text-white">
            {value ?? "—"}
          </span>
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

function TreasuryKeyField({ saving, onSave }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  function handleSave() {
    if (!val.trim()) return;
    onSave(val.trim());
    setVal("");
    setEditing(false);
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white/72">Private Key</span>
        {!editing ? (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-white/40">••••••••••••••••</span>
            <button
              onClick={() => setEditing(true)}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-red-200 hover:text-white disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Key"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="Paste new private key"
              className="w-64 rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-sm font-mono text-white outline-none placeholder:text-white/32"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="rounded-2xl bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-500"
            >
              Save
            </button>
            <button
              onClick={() => { setVal(""); setEditing(false); }}
              className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-red-200">
        Key is stored encrypted and never returned by the API.
      </p>
    </div>
  );
}

function ReadinessCard({ label, value, tone = "default" }) {
  const tones = {
    default: "border-white/10 bg-white/[0.03]",
    good: "border-emerald-400/20 bg-emerald-500/10",
    warn: "border-amber-400/20 bg-amber-500/10",
  };

  return (
    <div className={`rounded-2xl border px-4 py-4 ${tones[tone] || tones.default}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
