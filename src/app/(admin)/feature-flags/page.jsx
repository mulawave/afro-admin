"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toggling, setToggling] = useState(null);

  const loadFlags = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/flags");
      setFlags(Array.isArray(res) ? res : res.data ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  function toggleFlag(flag) {
    const action = flag.enabled ? "Disable" : "Enable";
    setConfirm({
      title: `${action} Feature Flag`,
      message: `${action} "${flag.key}"? This change applies instantly across the platform.`,
      destructive: flag.enabled,
      action: async () => {
        setToggling(flag.key);
        try {
          await api.patch(`/admin/flags/${flag.key}`, {
            enabled: !flag.enabled,
          });
          await loadFlags();
        } catch {
          // handled by api
        } finally {
          setToggling(null);
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
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button onClick={loadFlags} className="ml-3 underline">Retry</button>
        </div>
      </div>
    );
  }

  const enabledCount = flags.filter((f) => f.enabled).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
        <span className="text-sm text-gray-500">
          {enabledCount}/{flags.length} enabled
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          No feature flags configured
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between px-5 py-4"
            >
              <div>
                <div className="text-sm font-medium text-gray-900">{flag.key}</div>
                {flag.description && (
                  <div className="text-xs text-gray-500 mt-0.5">{flag.description}</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {toggling === flag.key && (
                  <span className="text-xs text-gray-400">Updating...</span>
                )}
                <button
                  onClick={() => toggleFlag(flag)}
                  disabled={toggling === flag.key}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
                    flag.enabled ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  role="switch"
                  aria-checked={flag.enabled}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        Flag changes apply instantly and are logged to the audit trail.
      </div>

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
