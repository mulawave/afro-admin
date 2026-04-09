"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

const FEATURE_OPTIONS = [
  { key: "digital_tv", label: "Digital TV" },
  { key: "sync_live", label: "Sync Live" },
  { key: "sim_live", label: "Sim Live" },
  { key: "private_channel", label: "Private Channel" },
  { key: "premium_stream", label: "Premium Stream" },
  { key: "1_premium_channel", label: "1 Premium Channel" },
  { key: "up_to_4_channels", label: "Up to 4 Channels" },
  { key: "unlimited_channels", label: "Unlimited Channels" },
  { key: "unlimited_premium_channels", label: "Unlimited Premium Channels" },
  { key: "badges", label: "Subscriber Badges" },
  { key: "priority_support", label: "Priority Support" },
];

export default function PlansPage() {
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
      const res = await api.get("/admin/plans?type=creator");
      setPlans(res.plans ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load plans");
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
      _currency: plan?.currency || "NGN",
      _badge: plan?.badge || "",
      _features: new Set(plan?.features || []),
    });
  }

  async function savePlan() {
    if (!editing) return;

    const payload = {
      name: editing._name.trim(),
      price: Number(editing._price),
      currency: editing._currency,
      badge: editing._badge || null,
      features: Array.from(editing._features || []),
      display_labels: Array.from(editing._features || []).reduce((labels, feature) => {
        const option = FEATURE_OPTIONS.find((item) => item.key === feature);
        labels[feature] = option?.label || feature;
        return labels;
      }, {}),
    };

    if (!payload.name) {
      setFormError("Plan name is required.");
      return;
    }
    if (Number.isNaN(payload.price) || payload.price < 0) {
      setFormError("Price must be zero or greater.");
      return;
    }

    setConfirm({
      title: editing.id ? "Update Plan" : "Create Plan",
      message: `${editing.id ? "Save changes to" : "Create"} "${payload.name}"? This affects creator feature access and subscription commerce immediately.`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: editing.id ? "Save Plan" : "Create Plan",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          if (editing.id) {
            await api.patch(`/admin/plans/${editing.id}`, payload);
          } else {
            await api.post("/admin/plans", payload);
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
      title: "Delete Plan",
      message: `Delete "${plan.name}" from the subscription catalog? This cannot be undone.`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Delete Plan",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.delete(`/admin/plans/${plan.id}`);
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

  const columns = [
    { key: "name", label: "Plan Name" },
    {
      key: "price",
      label: "Price (₦)",
      render: (row) => `₦${(row.price ?? 0).toLocaleString()}`,
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
          <h1 className="text-3xl font-semibold text-white">Subscription Plans</h1>
          <p className="mt-2 text-sm text-white/58">Define plan pricing and entitlement bundles for creator subscriptions.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {plans.length} plan{plans.length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={() => startEdit(null)}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            + Add Plan
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
        <DataTable columns={columns} rows={plans} emptyMessage="No plans configured" />
      )}

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit Plan: ${editing.name}` : "Create Plan"}
      >
        {editing && (
          <div className="space-y-4">
            <NoticeBanner tone="error" message={formError} />
            <div>
              <label className="mb-1 block text-sm font-medium text-white/72">Plan Name</label>
              <input
                type="text"
                value={editing._name}
                onChange={(e) => setEditing((prev) => ({ ...prev, _name: e.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-white/72">Price (₦)</label>
                <input
                  type="number"
                  min="0"
                  value={editing._price}
                  onChange={(e) => setEditing((prev) => ({ ...prev, _price: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-white/72">Badge</label>
                <input
                  type="text"
                  value={editing._badge}
                  onChange={(e) => setEditing((prev) => ({ ...prev, _badge: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/72">Features</label>
              <div className="grid gap-3 md:grid-cols-2">
                {FEATURE_OPTIONS.map((feature) => {
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
