"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

const VIEWER_FEATURE_OPTIONS = [
  { key: "public_channels", label: "Public Channels" },
  { key: "private_channels", label: "Private Channels" },
  { key: "premium_channels", label: "Premium Channels" },
  { key: "all_channels", label: "All Channels" },
  { key: "ads_viewing", label: "Ads Viewing" },
  { key: "ad_free", label: "Ad-Free Viewing" },
  { key: "priority_support", label: "Priority Support" },
  { key: "early_access", label: "Early Access" },
  { key: "exclusive_deals", label: "Exclusive Deals" },
];

const MULTIPLIER_PRESETS = [
  { value: 0, label: "0.0x — No Rewards" },
  { value: 0.5, label: "0.5x — Lite" },
  { value: 1, label: "1.0x — Standard" },
  { value: 1.5, label: "1.5x — Enhanced" },
  { value: 2, label: "2.0x — Double" },
  { value: 2.5, label: "2.5x — Boosted" },
  { value: 3, label: "3.0x — Triple" },
  { value: 3.5, label: "3.5x — Premium" },
  { value: 5, label: "5.0x — Ultra" },
];

export default function ViewerPlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/viewer-plans?all=true");
      setPlans(res.plans ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load viewer plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  function startEdit(plan) {
    setFormError(null);
    setEditing({
      ...(plan || {}),
      _name: plan?.name || "",
      _price: plan?.price ?? "",
      _yearly_price: plan?.yearly_price ?? "",
      _currency: plan?.currency || "NGN",
      _badge: plan?.badge || "",
      _reward_multiplier: plan?.reward_multiplier ?? "",
      _features: new Set(plan?.features || []),
    });
  }

  async function savePlan() {
    if (!editing) return;

    const payload = {
      name: editing._name.trim(),
      price: Number(editing._price),
      yearly_price: editing._yearly_price !== "" ? Number(editing._yearly_price) : null,
      currency: editing._currency,
      badge: editing._badge || null,
      reward_multiplier: editing._reward_multiplier !== "" ? Number(editing._reward_multiplier) : null,
      features: Array.from(editing._features || []),
      display_labels: Array.from(editing._features || []).reduce((labels, feature) => {
        const option = VIEWER_FEATURE_OPTIONS.find((item) => item.key === feature);
        labels[feature] = option?.label || feature;
        return labels;
      }, {}),
    };

    if (!payload.name) {
      setFormError("Plan name is required.");
      return;
    }
    if (Number.isNaN(payload.price) || payload.price < 0) {
      setFormError("Monthly price must be zero or greater.");
      return;
    }
    if (payload.yearly_price !== null && (Number.isNaN(payload.yearly_price) || payload.yearly_price < 0)) {
      setFormError("Yearly price must be zero or greater.");
      return;
    }
    if (payload.reward_multiplier !== null && (Number.isNaN(payload.reward_multiplier) || payload.reward_multiplier < 0)) {
      setFormError("Reward multiplier must be zero or greater.");
      return;
    }

    setConfirm({
      title: editing.id ? "Update Viewer Plan" : "Create Viewer Plan",
      message: `${editing.id ? "Save changes to" : "Create"} "${payload.name}"? This affects viewer entitlements and reward multipliers immediately.`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: editing.id ? "Save Plan" : "Create Plan",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          if (editing.id) {
            await api.patch(`/admin/viewer-plans/${editing.id}`, payload);
          } else {
            await api.post("/admin/viewer-plans", payload);
          }
          setFeedback({ tone: "success", message: editing.id ? `Updated ${payload.name}.` : `Created ${payload.name}.` });
          setEditing(null);
          await loadPlans();
          return true;
        } catch (err) {
          const messageText = err.message || "Failed to save plan";
          setConfirm((current) => ({ ...current, busy: false, error: messageText }));
          setFormError(messageText);
          return false;
        }
      },
    });
  }

  function deletePlan(plan) {
    setConfirm({
      title: "Delete Viewer Plan",
      message: `Permanently delete "${plan.name}" from the viewer subscription catalog? This cannot be undone.`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Delete Plan",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.delete(`/admin/viewer-plans/${plan.id}`);
          setFeedback({ tone: "success", message: `Deleted ${plan.name}.` });
          await loadPlans();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to delete plan" }));
          return false;
        }
      },
    });
  }

  function toggleActive(plan) {
    const nextState = !plan.is_active;
    setConfirm({
      title: nextState ? "Activate Plan" : "Deactivate Plan",
      message: nextState
        ? `Activate "${plan.name}"? Viewers will be able to subscribe to this plan.`
        : `Deactivate "${plan.name}"? New subscriptions will be blocked. Existing subscribers are not affected.`,
      destructive: !nextState,
      busy: false,
      error: null,
      confirmLabel: nextState ? "Activate" : "Deactivate",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.post(`/admin/viewer-plans/${plan.id}/toggle-active`);
          setFeedback({ tone: "success", message: `${plan.name} is now ${nextState ? "active" : "inactive"}.` });
          await loadPlans();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to toggle plan status" }));
          return false;
        }
      },
    });
  }

  const activePlans = plans.filter((p) => p.is_active);
  const inactivePlans = plans.filter((p) => !p.is_active);

  const columns = [
    {
      key: "name",
      label: "Plan Name",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{row.name}</span>
          {!row.is_active && (
            <span className="rounded-full border border-white/10 bg-white/6 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">
              Inactive
            </span>
          )}
        </div>
      ),
    },
    {
      key: "price",
      label: "Monthly",
      render: (row) => (
        <span className={row.price === 0 ? "text-emerald-300" : "text-white"}>
          {row.price === 0 ? "Free" : `₦${(row.price ?? 0).toLocaleString()}`}
        </span>
      ),
    },
    {
      key: "yearly_price",
      label: "Yearly",
      render: (row) => (
        <span className="text-white/72">
          {row.yearly_price != null ? (row.yearly_price === 0 ? "Free" : `₦${row.yearly_price.toLocaleString()}`) : "—"}
        </span>
      ),
    },
    {
      key: "reward_multiplier",
      label: "Reward Multiplier",
      render: (row) => (
        <span className={`font-mono text-sm ${
          (row.reward_multiplier ?? 0) >= 3 ? "text-[var(--av-light-orange)]" :
          (row.reward_multiplier ?? 0) >= 1 ? "text-emerald-300" : "text-white/50"
        }`}>
          {row.reward_multiplier != null ? `${row.reward_multiplier}x` : "—"}
        </span>
      ),
    },
    {
      key: "badge",
      label: "Badge",
      render: (row) => (
        <span className="text-white/72">{row.badge || "—"}</span>
      ),
    },
    {
      key: "features",
      label: "Features",
      render: (row) => (
        <span className="text-white/72">{row.features?.length || 0} enabled</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-3">
          <button
            onClick={() => startEdit(row)}
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            Edit
          </button>
          <button
            onClick={() => toggleActive(row)}
            className={`text-sm font-medium ${row.is_active ? "text-amber-300 hover:text-amber-200" : "text-emerald-300 hover:text-emerald-200"}`}
          >
            {row.is_active ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => deletePlan(row)}
            className="text-sm font-medium text-red-300 hover:text-red-200"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  function toggleFeature(feature) {
    setEditing((prev) => {
      const nextFeatures = new Set(prev._features || []);
      if (nextFeatures.has(feature)) {
        nextFeatures.delete(feature);
      } else {
        nextFeatures.add(feature);
      }
      return { ...prev, _features: nextFeatures };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Viewer Plans</h1>
          <p className="mt-2 text-sm text-white/58">
            Manage viewer subscription tiers, pricing, entitlements, and community pool reward multipliers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {activePlans.length} active · {inactivePlans.length} inactive
          </span>
          <button
            onClick={() => startEdit(null)}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            + Add Viewer Plan
          </button>
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadPlans} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && !error && (
        <DataTable columns={columns} rows={plans} emptyMessage="No viewer plans configured yet. Create one to get started." />
      )}

      {/* --- Edit / Create Drawer --- */}
      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit Plan: ${editing.name}` : "Create Viewer Plan"}
      >
        {editing && (
          <div className="space-y-5">
            <NoticeBanner tone="error" message={formError} />

            {/* Plan Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-white/72">Plan Name</label>
              <input
                type="text"
                value={editing._name}
                onChange={(e) => setEditing((prev) => ({ ...prev, _name: e.target.value }))}
                placeholder="e.g. pro_viewer"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40"
              />
            </div>

            {/* Pricing Row */}
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/72">Monthly Price (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={editing._price}
                  onChange={(e) => setEditing((prev) => ({ ...prev, _price: e.target.value }))}
                  placeholder="0"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/72">Yearly Price (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={editing._yearly_price}
                  onChange={(e) => setEditing((prev) => ({ ...prev, _yearly_price: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/72">Badge</label>
                <input
                  type="text"
                  value={editing._badge}
                  onChange={(e) => setEditing((prev) => ({ ...prev, _badge: e.target.value }))}
                  placeholder="e.g. Pro"
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40"
                />
              </div>
            </div>

            {/* Reward Multiplier */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/72">
                Community Pool Reward Multiplier
              </label>
              <p className="mb-3 text-xs text-white/42">
                Controls how much of the community pool vPT rewards this tier earns. Higher tiers get larger shares.
              </p>
              <div className="grid gap-2 md:grid-cols-3">
                {MULTIPLIER_PRESETS.map((preset) => {
                  const selected = Number(editing._reward_multiplier) === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setEditing((prev) => ({ ...prev, _reward_multiplier: preset.value }))}
                      className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition ${
                        selected
                          ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white"
                          : "border-white/10 bg-white/6 text-white/68 hover:bg-white/10"
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <label className="mb-1 block text-xs text-white/50">Or enter custom multiplier:</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={editing._reward_multiplier}
                  onChange={(e) => setEditing((prev) => ({ ...prev, _reward_multiplier: e.target.value }))}
                  placeholder="e.g. 3.5"
                  className="w-36 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40"
                />
              </div>
            </div>

            {/* Features */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/72">Features & Entitlements</label>
              <div className="grid gap-3 md:grid-cols-2">
                {VIEWER_FEATURE_OPTIONS.map((feature) => {
                  const checked = editing._features?.has(feature.key);
                  return (
                    <button
                      key={feature.key}
                      type="button"
                      onClick={() => toggleFeature(feature.key)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        checked
                          ? "border-[var(--av-light-orange)]/40 bg-[rgba(245,193,108,0.12)] text-white"
                          : "border-white/10 bg-white/6 text-white/68 hover:bg-white/10"
                      }`}
                    >
                      {feature.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
              <button
                onClick={() => setEditing(null)}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
              >
                {editing.id ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        busy={confirm?.busy}
        error={confirm?.error}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) {
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}
