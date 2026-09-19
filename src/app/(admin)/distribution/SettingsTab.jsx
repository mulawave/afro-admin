"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

function formatNgn(amount) {
  return `₦${(Number(amount) || 0).toLocaleString("en-NG")}`;
}

export default function SettingsTab({ onFeedback }) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(null);
  const [whitelistInput, setWhitelistInput] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/distribution/admin/settings");
      setSettings(res.settings);
      setForm({
        activation_price_ngn: res.settings.activation_price_ngn,
        default_split_percent_afrovision: res.settings.default_split_percent_afrovision,
        license_fee_ngn: res.settings.license_fee_ngn,
        license_duration_days: res.settings.license_duration_days,
        qr_whitelist_user_ids: res.settings.qr_whitelist_user_ids || [],
        tv_app_latest_version_code: res.settings.tv_app?.latest_version_code || 1,
        tv_app_latest_version_name: res.settings.tv_app?.latest_version_name || "1.0.0",
        tv_app_apk_url: res.settings.tv_app?.apk_url || "",
        imdb_api_key: res.settings.imdb_api_key || "",
        imdb_api_token: res.settings.imdb_api_token || "",
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addWhitelist() {
    const id = whitelistInput.trim();
    if (!id) return;
    if (form.qr_whitelist_user_ids.includes(id)) return;
    update("qr_whitelist_user_ids", [...form.qr_whitelist_user_ids, id]);
    setWhitelistInput("");
  }

  function removeWhitelist(id) {
    update("qr_whitelist_user_ids", form.qr_whitelist_user_ids.filter((x) => x !== id));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        activation_price_ngn: Number(form.activation_price_ngn) || 0,
        default_split_percent_afrovision: Number(form.default_split_percent_afrovision) || 0,
        license_fee_ngn: Number(form.license_fee_ngn) || 0,
        license_duration_days: Number(form.license_duration_days) || 365,
        qr_whitelist_user_ids: form.qr_whitelist_user_ids,
        tv_app: {
          latest_version_code: Number(form.tv_app_latest_version_code) || 1,
          latest_version_name: form.tv_app_latest_version_name || "1.0.0",
          apk_url: form.tv_app_apk_url || null,
        },
        imdb_api_key: form.imdb_api_key || "",
        imdb_api_token: form.imdb_api_token || "",
      };
      const res = await api.patch("/distribution/admin/settings", body);
      setSettings(res.settings);
      onFeedback("success", "Settings updated successfully");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        {error}
        <button onClick={load} className="ml-3 underline">Retry</button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* Pricing */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Pricing & Revenue</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Activation Price (₦)">
            <input
              type="number"
              min="0"
              value={form.activation_price_ngn}
              onChange={(e) => update("activation_price_ngn", e.target.value)}
              className="input-base"
            />
          </Field>
          <Field label="License Fee (₦)">
            <input
              type="number"
              min="0"
              value={form.license_fee_ngn}
              onChange={(e) => update("license_fee_ngn", e.target.value)}
              className="input-base"
            />
          </Field>
          <Field label="License Duration (days)">
            <input
              type="number"
              min="1"
              value={form.license_duration_days}
              onChange={(e) => update("license_duration_days", e.target.value)}
              className="input-base"
            />
          </Field>
          <Field label="Default Split — AfroVision (%)">
            <input
              type="number"
              min="0"
              max="100"
              value={form.default_split_percent_afrovision}
              onChange={(e) => update("default_split_percent_afrovision", e.target.value)}
              className="input-base"
            />
          </Field>
        </div>
      </div>

      {/* TV App Update Config */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">TV App Update</h3>
        <p className="mb-4 text-xs text-white/50">
          Every TV polls this on heartbeat and self-updates whenever Latest Version Code is greater than its own installed
          code. It must exactly match the <code className="text-white/70">versionCode</code> baked into the APK at{" "}
          <code className="text-white/70">tv/build.gradle.kts</code> for the build you uploaded to the APK URL below — a
          stray higher value (e.g. left over from testing) will make every TV re-prompt to update forever, even after
          installing the real latest build.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Latest Version Code">
            <input
              type="number"
              min="1"
              value={form.tv_app_latest_version_code}
              onChange={(e) => update("tv_app_latest_version_code", e.target.value)}
              className="input-base"
            />
          </Field>
          <Field label="Latest Version Name">
            <input
              type="text"
              value={form.tv_app_latest_version_name}
              onChange={(e) => update("tv_app_latest_version_name", e.target.value)}
              className="input-base"
            />
          </Field>
          <Field label="APK Download URL">
            <input
              type="url"
              placeholder="https://storage.googleapis.com/..."
              value={form.tv_app_apk_url}
              onChange={(e) => update("tv_app_apk_url", e.target.value)}
              className="input-base"
            />
          </Field>
        </div>
      </div>

      {/* Catch-up IMDb/TMDB credentials */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">Catch-up Feed</h3>
        <p className="mb-4 text-xs text-white/50">
          IMDb-style discovery feed is powered by The Movie Database (TMDB). Provide a TMDB API key or a TMDB API Read Access Token. If a read access token is provided it is used as the Authorization: Bearer header; otherwise the API key is used. They are stored server-side and never sent to clients.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="IMDb/TMDB API Key">
            <input
              type="text"
              value={form.imdb_api_key}
              onChange={(e) => update("imdb_api_key", e.target.value)}
              placeholder="Paste TMDB API key..."
              className="input-base"
            />
          </Field>
          <Field label="TMDB API Read Access Token">
            <input
              type="text"
              value={form.imdb_api_token}
              onChange={(e) => update("imdb_api_token", e.target.value)}
              placeholder="Paste TMDB API Read Access Token..."
              className="input-base"
            />
          </Field>
        </div>
      </div>

      {/* QR Whitelist */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-white/50">QR Pairing Whitelist</h3>
        <p className="mb-4 text-xs text-white/50">
          Only admin users and user IDs on this list can pair a TV via QR code. All other TVs must use activation codes from distributors.
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter user ID..."
            value={whitelistInput}
            onChange={(e) => setWhitelistInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addWhitelist(); } }}
            className="flex-1 min-w-[200px] max-w-sm rounded-2xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/32"
          />
          <button
            type="button"
            onClick={addWhitelist}
            className="rounded-2xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/12"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {form.qr_whitelist_user_ids.length === 0 ? (
            <span className="text-xs text-white/40">No whitelisted users. Only admins can QR-pair.</span>
          ) : (
            form.qr_whitelist_user_ids.map((id) => (
              <span
                key={id}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/70"
              >
                <span className="font-mono">{id}</span>
                <button
                  type="button"
                  onClick={() => removeWhitelist(id)}
                  className="text-white/40 hover:text-red-300"
                >
                  ✕
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-8 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--av-dark-blue)]" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input-base::placeholder { color: rgba(255,255,255,0.32); }
        .input-base:focus { border-color: var(--av-light-orange); }
      `}</style>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-white/50">{label}</label>
      {children}
    </div>
  );
}
