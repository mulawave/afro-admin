"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/plans");
      setPlans(Array.isArray(res) ? res : res.data ?? []);
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
    setEditing({
      ...plan,
      _name: plan.name || "",
      _price_ngn: plan.price_ngn ?? "",
      _features: { ...(plan.features || {}) },
    });
  }

  async function savePlan() {
    if (!editing) return;

    const payload = {
      name: editing._name.trim(),
      price_ngn: Number(editing._price_ngn),
      features: editing._features,
    };

    if (!payload.name) return;
    if (payload.price_ngn < 0) return;

    setConfirm({
      title: "Update Plan",
      message: `Save changes to "${payload.name}"? This will affect feature access for all subscribers on this plan.`,
      destructive: false,
      action: async () => {
        try {
          await api.patch(`/admin/plans/${editing.id}`, payload);
          setEditing(null);
          await loadPlans();
        } catch {
          // handled by api
        }
      },
    });
  }

  const columns = [
    { key: "name", label: "Plan Name" },
    {
      key: "price_ngn",
      label: "Price (₦)",
      render: (row) => `₦${(row.price_ngn ?? 0).toLocaleString()}`,
    },
    {
      key: "private_channels",
      label: "Private Channels",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.features?.private_channels
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {row.features?.private_channels ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "badges",
      label: "Badges",
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.features?.badges
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {row.features?.badges ? "Yes" : "No"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button
          onClick={() => startEdit(row)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <span className="text-sm text-gray-500">
          {plans.length} plan{plans.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadPlans} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          <DataTable
            columns={columns}
            rows={plans}
            emptyMessage="No plans configured"
          />
        </div>
      )}

      {/* Edit Drawer */}
      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Edit Plan: ${editing.name}` : "Edit Plan"}
      >
        {editing && (
          <div className="space-y-4">
            {/* Plan Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={editing._name}
                onChange={(e) =>
                  setEditing((prev) => ({ ...prev, _name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₦)
              </label>
              <input
                type="number"
                min="0"
                value={editing._price_ngn}
                onChange={(e) =>
                  setEditing((prev) => ({
                    ...prev,
                    _price_ngn: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editing._features?.private_channels || false}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        _features: {
                          ...prev._features,
                          private_channels: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Private Channels
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editing._features?.badges || false}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        _features: {
                          ...prev._features,
                          badges: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Subscriber Badges
                </label>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editing._features?.priority_support || false}
                    onChange={(e) =>
                      setEditing((prev) => ({
                        ...prev,
                        _features: {
                          ...prev._features,
                          priority_support: e.target.checked,
                        },
                      }))
                    }
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Priority Support
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={savePlan}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Drawer>

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
