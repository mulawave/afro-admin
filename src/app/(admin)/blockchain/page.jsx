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
  const [reAuthPassword, setReAuthPassword] = useState("");
  const [reAuthOpen, setReAuthOpen] = useState(false);
  const [pendingEnvSwitch, setPendingEnvSwitch] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/blockchain");
      setCfg(res.data ?? res);
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
          await api.patch("/admin/blockchain", { key, value });
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
    setPendingEnvSwitch(value);
    setReAuthPassword("");
    setReAuthOpen(true);
  }

  async function confirmEnvSwitch() {
    if (!reAuthPassword) return;
    setSaving("ENVIRONMENT");
    setReAuthOpen(false);
    try {
      await api.patch("/admin/blockchain", {
        key: "ENVIRONMENT",
        value: pendingEnvSwitch,
        password: reAuthPassword,
      });
      await load();
    } catch {
      // handled by api
    } finally {
      setSaving(null);
      setPendingEnvSwitch(null);
      setReAuthPassword("");
    }
  }

  function requestKeyUpdate(value) {
    setConfirm({
      title: "Update Treasury Key",
      message: "Update the treasury private key? This is an extremely sensitive operation. The key is stored encrypted and never returned.",
      destructive: true,
      action: async () => {
        setSaving("TREASURY_PRIVATE_KEY");
        try {
          await api.patch("/admin/blockchain", {
            key: "TREASURY_PRIVATE_KEY",
            value,
          });
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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
        {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blockchain Control</h1>
        <EnvBadge env={cfg?.ENVIRONMENT} />
      </div>

      {/* Environment */}
      <Section title="Environment">
        <div className="flex items-center justify-between py-2">
          <span className="text-sm font-medium text-gray-700">Active Environment</span>
          <div className="flex items-center gap-3">
            <select
              value={cfg?.ENVIRONMENT || "staging"}
              onChange={(e) => requestEnvSwitch(e.target.value)}
              disabled={saving === "ENVIRONMENT"}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            {saving === "ENVIRONMENT" && (
              <span className="text-xs text-gray-500">Switching...</span>
            )}
          </div>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          ⚠ Environment switch requires password re-entry
        </p>
      </Section>

      {/* Contract Addresses */}
      <Section title="Contract Addresses">
        <EditableField
          label="VPT Token"
          value={cfg?.VPT_TOKEN_ADDRESS}
          saving={saving === "VPT_TOKEN_ADDRESS"}
          onSave={(v) => requestSave("VPT_TOKEN_ADDRESS", v, "VPT Token Address")}
        />
        <EditableField
          label="Router"
          value={cfg?.PANCAKE_ROUTER_ADDRESS}
          saving={saving === "PANCAKE_ROUTER_ADDRESS"}
          onSave={(v) => requestSave("PANCAKE_ROUTER_ADDRESS", v, "PancakeSwap Router")}
        />
        <EditableField
          label="WBNB"
          value={cfg?.WBNB_ADDRESS}
          saving={saving === "WBNB_ADDRESS"}
          onSave={(v) => requestSave("WBNB_ADDRESS", v, "WBNB Address")}
        />
      </Section>

      {/* RPC */}
      <Section title="RPC Configuration">
        <EditableField
          label="BSC RPC URL"
          value={cfg?.BSC_RPC_URL}
          saving={saving === "BSC_RPC_URL"}
          onSave={(v) => requestSave("BSC_RPC_URL", v, "BSC RPC URL")}
        />
      </Section>

      {/* Treasury */}
      <Section title="Treasury">
        <TreasuryKeyField
          saving={saving === "TREASURY_PRIVATE_KEY"}
          onSave={requestKeyUpdate}
        />
      </Section>

      {/* Confirm Dialog */}
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

      {/* Re-Auth Modal for Environment Switch */}
      {reAuthOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setReAuthOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirm Environment Switch
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Switching to <strong>{pendingEnvSwitch}</strong> requires password re-entry.
            </p>
            <input
              type="password"
              placeholder="Enter your password"
              value={reAuthPassword}
              onChange={(e) => setReAuthPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setReAuthOpen(false); setPendingEnvSwitch(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnvSwitch}
                disabled={!reAuthPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                Switch Environment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EnvBadge({ env }) {
  const isProd = env === "production";
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
      isProd ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
    }`}>
      {isProd ? "🔴 PRODUCTION" : "🟡 STAGING"}
    </span>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
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
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <span className="text-sm font-medium text-gray-700 w-48">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900 font-mono truncate max-w-xs">
            {value ?? "—"}
          </span>
          <button
            onClick={() => { setVal(String(value ?? "")); setEditing(true); }}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
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
        <span className="text-sm font-medium text-gray-700">Private Key</span>
        {!editing ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 font-mono">••••••••••••••••</span>
            <button
              onClick={() => setEditing(true)}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
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
              className="w-64 px-3 py-1.5 border border-gray-300 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => { setVal(""); setEditing(false); }}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-red-500 mt-1">
        ⚠ Key is stored encrypted. Never returned in API responses.
      </p>
    </div>
  );
}
