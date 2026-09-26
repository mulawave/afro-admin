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
      const [settingsRes, totalsRes, queueRes] = await Promise.all([
        api.get("/admin/settings"),
        api.get("/withdrawals/admin/system-totals"),
        api.get("/vpt/admin/stats"),
      ]);

      const settingsMap = (settingsRes.settings ?? []).reduce((accumulator, setting) => {
        accumulator[setting.key] = setting.value;
        return accumulator;
      }, {});

      setData({
        ...settingsMap,
        pools: {
          operations_ngn: totalsRes.pools?.operations?.balance_ngn ?? 0,
          community_ngn: totalsRes.pools?.community?.balance_ngn ?? 0,
          operations_vpt: totalsRes.pools?.operations?.balance_vpt ?? 0,
          community_vpt: totalsRes.pools?.community?.balance_vpt ?? 0,
        },
        pending_withdrawals: totalsRes.pending_withdrawals ?? { count: 0, total_amount: 0 },
        ledger: totalsRes.ledger ?? {},
        queue: queueRes.stats?.queue ?? {},
        batches: queueRes.stats?.batches ?? {},
      });
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Economy Control</h1>
          <p className="mt-2 text-sm text-white/58">Tune economic ratios, inspect pool balances, and watch distribution queues.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs text-white/45">Live</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pending Queue" value={data?.queue?.pending} />
        <MetricCard label="Batches Failed" value={data?.batches?.failed} accent="amber" />
        <MetricCard label="Pending Withdrawals" value={data?.pending_withdrawals?.count} accent="green" />
      </div>

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

      <SplitSection
        data={data}
        saving={saving}
        onUpdate={requestUpdate}
      />

      <Section title="Pool Balances">
        <div className="grid grid-cols-2 gap-4">
          <PoolTile label="Operations NGN" value={data?.pools?.operations_ngn} color="blue" />
          <PoolTile label="Community NGN" value={data?.pools?.community_ngn} color="green" />
          <PoolTile label="Operations vPT" value={data?.pools?.operations_vpt} color="purple" />
          <PoolTile label="Community vPT" value={data?.pools?.community_vpt} color="amber" />
        </div>
      </Section>

      <Section title="Settlement Snapshot">
        <div className="space-y-3">
          <SettlementRow label="Pending withdrawal value" value={`₦${Number(data?.pending_withdrawals?.total_amount || 0).toLocaleString("en-NG")}`} />
          <SettlementRow label="Total plan revenue" value={`₦${Number(data?.ledger?.total_ngn_in || 0).toLocaleString("en-NG")}`} />
          <SettlementRow label="Total vPT distributed" value={Number(data?.ledger?.total_vpt_distributed || 0).toLocaleString("en-NG")} />
        </div>
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

/**
 * Split rules as the backend defines them (settings.model.js):
 *   COMMUNITY_POOL_PERCENT  — % of each subscription price to the community pool
 *   VPT_EXTRACTION_PERCENT  — % OF THE COMMUNITY POOL extracted for vPT conversion
 * Both must be 0–100 (enforced by the backend too).
 * NOTE: as of 2026-09-26 no payment code reads these two settings; live
 * splits are fixed in backend code. The banner says so, to avoid false confidence.
 */
function SplitSection({ data, saving, onUpdate }) {
  const community = Number(data?.COMMUNITY_POOL_PERCENT ?? 20);
  const extraction = Number(data?.VPT_EXTRACTION_PERCENT ?? 30);
  const valid = [community, extraction].every((n) => Number.isFinite(n) && n >= 0 && n <= 100);
  const vptShare = (community * extraction) / 100; // % of each subscription price
  const communityCash = community - vptShare;
  const rest = 100 - community;
  const fmt = (n) => (Number.isInteger(n) ? n : n.toFixed(2));

  return (
    <Section title="Split Rules">
      <div className="mb-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-100">
        These two percentages are saved but <strong>not yet applied</strong> by the payment code. Live revenue splits are
        currently fixed in the backend (for example, interactions: creator 50% / operations 30% / community 20%). Changing
        them here doesn&apos;t move any money until the backend is wired to use them.
      </div>
      <div className="space-y-3">
        <EditableField
          label="Community Pool % (of price)"
          value={community}
          saving={saving === "COMMUNITY_POOL_PERCENT"}
          onSave={(v) => onUpdate("COMMUNITY_POOL_PERCENT", +v, "Community Pool %")}
          type="number"
          percent
        />
        <EditableField
          label="vPT Extraction % (of community pool)"
          value={extraction}
          saving={saving === "VPT_EXTRACTION_PERCENT"}
          onSave={(v) => onUpdate("VPT_EXTRACTION_PERCENT", +v, "vPT Extraction %")}
          type="number"
          percent
        />
        <div className={`mt-2 rounded-2xl px-3 py-2 text-sm ${valid ? "bg-white/[0.04] text-white/75" : "bg-red-500/10 text-red-200"}`}>
          {valid ? (
            <>
              Of each ₦100 of subscription: <strong className="text-white">₦{fmt(communityCash)}</strong> community pool (cash),{" "}
              <strong className="text-white">₦{fmt(vptShare)}</strong> converted to vPT, <strong className="text-white">₦{fmt(rest)}</strong> everything else.
            </>
          ) : (
            "Each percentage must be between 0 and 100."
          )}
        </div>
      </div>
    </Section>
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

function EditableField({ label, value, onSave, saving, type = "text", readOnly = false, percent = false }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(value ?? ""));
  const [fieldError, setFieldError] = useState(null);

  function handleSave() {
    if (readOnly) return;
    if (val === String(value)) {
      setEditing(false);
      return;
    }
    if (percent) {
      const n = Number(val);
      if (val.trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) {
        setFieldError("Enter a number from 0 to 100.");
        return;
      }
    }
    setFieldError(null);
    onSave(val);
    setEditing(false);
  }

  function handleCancel() {
    setVal(String(value ?? ""));
    setFieldError(null);
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between border-b border-white/8 py-2 last:border-b-0">
      <span className="w-48 text-sm font-medium text-white/72">{label}</span>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={val}
            onChange={(e) => { setVal(e.target.value); setFieldError(null); }}
            {...(percent ? { min: 0, max: 100, step: "any" } : {})}
            className={`w-40 rounded-2xl border bg-white/6 px-3 py-1.5 text-sm text-white outline-none ${fieldError ? "border-red-400/60" : "border-white/10"}`}
            autoFocus
            title={fieldError || undefined}
          />
          {fieldError ? <span className="text-xs text-red-200">{fieldError}</span> : null}
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
          <span className="font-mono text-sm text-white">{value ?? "—"}</span>
          <button
            onClick={() => { if (!readOnly) { setVal(String(value ?? "")); setEditing(true); } }}
            disabled={saving || readOnly}
            className="px-3 py-1.5 text-xs font-medium text-[var(--av-light-orange)] hover:text-white disabled:opacity-50"
          >
            {readOnly ? "Derived" : saving ? "Saving..." : "Edit"}
          </button>
        </div>
      )}
    </div>
  );
}

function PoolTile({ label, value, color }) {
  const colors = {
    blue: "bg-sky-500/8 border-sky-300/18 text-sky-100",
    green: "bg-emerald-500/8 border-emerald-300/18 text-emerald-100",
    purple: "bg-indigo-500/8 border-indigo-300/18 text-indigo-100",
    amber: "bg-amber-500/8 border-amber-300/18 text-amber-100",
  };

  return (
    <div className={`rounded-lg border p-4 ${colors[color] || colors.blue}`}>
      <div className="text-xs font-medium opacity-75">{label}</div>
      <div className="mt-1 text-xl font-bold">
        {typeof value === "number" ? value.toLocaleString() : value ?? "—"}
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent = "blue" }) {
  const accents = {
    blue: "from-sky-400/18 to-sky-500/4 border-sky-300/18",
    green: "from-emerald-400/18 to-emerald-500/4 border-emerald-300/18",
    amber: "from-amber-300/24 to-orange-400/6 border-amber-200/22",
  };

  return (
    <div className={`rounded-[1.75rem] border bg-gradient-to-br p-5 shadow-[0_18px_50px_rgba(0,0,0,0.2)] ${accents[accent] || accents.blue}`}>
      <p className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value ?? 0}</p>
    </div>
  );
}

function SettlementRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
      <span className="text-sm text-white/58">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
