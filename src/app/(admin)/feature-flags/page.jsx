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
      const res = await api.get("/admin/features");
      setFlags(res.flags ?? []);
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
          await api.post("/admin/features", { key: flag.key, enabled: !flag.enabled });
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
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-semibold text-white">Feature Flags</h1>
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
        <div>
          <h1 className="text-3xl font-semibold text-white">Feature Flags</h1>
          <p className="mt-2 text-sm text-white/58">Roll out or disable platform capabilities instantly across the stack.</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
          {enabledCount}/{flags.length} enabled
        </span>
      </div>

      {flags.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-8 text-center text-white/40 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          No feature flags configured
        </div>
      ) : (
        <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="flex items-center justify-between border-b border-white/6 px-5 py-4 last:border-b-0"
            >
              <div>
                <div className="text-sm font-medium text-white">{flag.key}</div>
                {flag.description && (
                  <div className="mt-0.5 text-xs text-white/45">{flag.description}</div>
                )}
              </div>

              <div className="flex items-center gap-3">
                {toggling === flag.key && (
                  <span className="text-xs text-white/42">Updating...</span>
                )}
                <button
                  onClick={() => toggleFlag(flag)}
                  disabled={toggling === flag.key}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
                    flag.enabled ? "bg-[var(--av-orange)]" : "bg-white/18"
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

      <div className="rounded-[1.5rem] border border-[var(--av-light-orange)]/20 bg-[rgba(245,193,108,0.08)] px-4 py-3 text-sm text-white/72">
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
