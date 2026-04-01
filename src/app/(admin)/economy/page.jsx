"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function EconomyPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/economy");
      setData(res.data ?? res);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load economy data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function requestUpdate(key, value, label) {
    setConfirm({
      title: "Update Economy Setting",
      message: `Change "${label}" to "${value}"? This affects the live economy immediately.`,
      destructive: false,
      action: async () => {
        setSaving(key);
        try {
          await api.patch("/admin/economy", { key, value });
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
        <h1 className="text-2xl font-bold text-gray-900">Economy Control</h1>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-gray-500">Live</span>
        </div>
      </div>

      {/* Rates */}
      <Section title="Exchange Rates">
        <EditableField
          label="VPT Price (₦)"
          value={data?.VPT_PRICE_NGN}
          saving={saving === "VPT_PRICE_NGN"}
          onSave={(v) => requestUpdate("VPT_PRICE_NGN", +v, "VPT Price (₦)")}
          type="number"
        />
        <EditableField
          label="NGN → BNB Rate"
          value={data?.NGN_TO_BNB_RATE}
          saving={saving === "NGN_TO_BNB_RATE"}
          onSave={(v) => requestUpdate("NGN_TO_BNB_RATE", +v, "NGN → BNB Rate")}
          type="number"
        />
      </Section>

      {/* Split Rules */}
      <SplitSection
        data={data}
        saving={saving}
        onUpdate={requestUpdate}
      />

      {/* Pools */}
      <Section title="Pool Balances">
        <div className="grid grid-cols-2 gap-4">
          <PoolTile label="Operations NGN" value={data?.pools?.operations_ngn} color="blue" />
          <PoolTile label="Community NGN" value={data?.pools?.community_ngn} color="green" />
          <PoolTile label="Operations vPT" value={data?.pools?.operations_vpt} color="purple" />
          <PoolTile label="Community vPT" value={data?.pools?.community_vpt} color="amber" />
        </div>
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
    </div>
  );
}

function SplitSection({ data, saving, onUpdate }) {
  const creator = data?.SPLIT_CREATOR ?? 0;
  const ops = data?.SPLIT_OPS ?? 0;
  const community = data?.SPLIT_COMMUNITY ?? 0;
  const total = creator + ops + community;
  const isValid = total === 100;

  return (
    <Section title="Split Rules">
      <div className="space-y-3">
        <EditableField
          label="Creator %"
          value={creator}
          saving={saving === "SPLIT_CREATOR"}
          onSave={(v) => onUpdate("SPLIT_CREATOR", +v, "Creator %")}
          type="number"
        />
        <EditableField
          label="Operations %"
          value={ops}
          saving={saving === "SPLIT_OPS"}
          onSave={(v) => onUpdate("SPLIT_OPS", +v, "Operations %")}
          type="number"
        />
        <EditableField
          label="Community %"
          value={community}
          saving={saving === "SPLIT_COMMUNITY"}
          onSave={(v) => onUpdate("SPLIT_COMMUNITY", +v, "Community %")}
          type="number"
        />
        <div className={`text-sm font-medium mt-2 px-3 py-2 rounded ${
          isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          Total: {total}% {isValid ? "✓" : "⚠ Must equal 100%"}
        </div>
      </div>
    </Section>
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

function EditableField({ label, value, onSave, saving, type = "text" }) {
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
            type={type}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-40 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <span className="text-sm text-gray-900 font-mono">{value ?? "—"}</span>
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

function PoolTile({ label, value, color }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.blue}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="text-xl font-bold mt-1">
        {typeof value === "number" ? value.toLocaleString() : value ?? "—"}
      </div>
    </div>
  );
}
