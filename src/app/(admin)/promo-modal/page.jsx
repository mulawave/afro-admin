"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { api } from "@/lib/api";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

const INPUT_CLASS =
  "w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40 transition-colors";
const TEXTAREA_CLASS =
  "w-full min-h-[120px] rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/40 transition-colors resize-y";
const LABEL_CLASS = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-[var(--av-light-orange)]/80";

const DIRECT_API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://afrovision-backend-134538542038.us-central1.run.app"
).replace(/\/$/, "");

export default function PromoModalPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const fileRef = useRef(null);

  // ── Load ────────────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/promo-modal");
      setConfig(res.promo_modal || {
        enabled: false,
        image_url: "",
        title: "",
        subtitle: "",
        body_text: "",
        button_text: "",
        button_link: "",
        open_in_new_tab: true,
      });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load promo modal config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // ── Field update ────────────────────────────────────────
  function updateField(key, value) {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }

  // ── Image upload ────────────────────────────────────────
  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({ type: "error", message: "Image must be under 5 MB" });
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.upload("/admin/promo-modal/image", fd);
      updateField("image_url", res.image_url);
      setFeedback({ type: "success", message: "Image uploaded" });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Upload failed" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // ── Save ────────────────────────────────────────────────
  function handleSave() {
    if (!config.title?.trim() && config.enabled) {
      setFeedback({ type: "error", message: "Title is required when the modal is enabled" });
      return;
    }
    setConfirm({
      title: "Save Promo Modal",
      message: config.enabled
        ? "This will enable the promo modal on the homepage for all users."
        : "This will save the config but the modal will remain disabled.",
      action: async () => {
        try {
          setSaving(true);
          const res = await api.patch("/admin/promo-modal", config);
          setConfig(res.promo_modal);
          setDirty(false);
          setFeedback({ type: "success", message: "Promo modal saved successfully" });
        } catch (err) {
          setFeedback({ type: "error", message: err.message || "Failed to save" });
        } finally {
          setSaving(false);
          setConfirm(null);
        }
      },
    });
  }

  // ── Quick toggle ────────────────────────────────────────
  async function handleToggle() {
    try {
      setSaving(true);
      const newEnabled = !config.enabled;
      const res = await api.patch("/admin/promo-modal", { ...config, enabled: newEnabled });
      setConfig(res.promo_modal);
      setFeedback({
        type: "success",
        message: newEnabled ? "Promo modal enabled" : "Promo modal disabled",
      });
    } catch (err) {
      setFeedback({ type: "error", message: err.message || "Toggle failed" });
    } finally {
      setSaving(false);
    }
  }

  // ── Render ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--av-light-orange)] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="mb-4 text-red-400">{error}</p>
        <button onClick={loadConfig} className="rounded-full border border-white/10 bg-white/6 px-6 py-2 text-sm text-white hover:bg-white/10 transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Promo Modal</h1>
          <p className="mt-1 text-sm text-[var(--av-light-orange)]/70">
            Homepage announcement modal — introduce new products, features, seasons, and more.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`rounded-full border px-5 py-2 text-sm font-semibold transition-all ${
              config.enabled
                ? "border-green-400/40 bg-green-500/15 text-green-300 hover:bg-green-500/25"
                : "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            }`}
          >
            {config.enabled ? "● Enabled" : "○ Disabled"}
          </button>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <NoticeBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      {/* Main card */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="space-y-5">
          {/* Image upload */}
          <div>
            <label className={LABEL_CLASS}>Banner Image</label>
            <div className="flex items-start gap-4">
              {config.image_url ? (
                <div className="relative group">
                  <img
                    src={config.image_url}
                    alt="Promo"
                    className="h-36 w-64 rounded-xl border border-white/10 object-cover"
                  />
                  <button
                    onClick={() => updateField("image_url", "")}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-red-500/90 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex h-36 w-64 items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02]">
                  <span className="text-xs text-white/30">No image</span>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-xl border border-[var(--av-light-orange)]/30 bg-[rgba(245,193,108,0.08)] px-4 py-2 text-xs font-semibold text-[var(--av-light-orange)] hover:bg-[rgba(245,193,108,0.15)] transition-colors"
                >
                  {uploading ? "Uploading…" : "Upload Image"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-[10px] text-white/30">JPG, PNG or WebP · Max 5 MB</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className={LABEL_CLASS}>Title</label>
            <input
              type="text"
              value={config.title || ""}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Season 2 Is Here!"
              className={INPUT_CLASS}
              maxLength={100}
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className={LABEL_CLASS}>Subtitle</label>
            <input
              type="text"
              value={config.subtitle || ""}
              onChange={(e) => updateField("subtitle", e.target.value)}
              placeholder="e.g. The biggest challenge yet"
              className={INPUT_CLASS}
              maxLength={150}
            />
          </div>

          {/* Body text */}
          <div>
            <label className={LABEL_CLASS}>Body Text</label>
            <textarea
              value={config.body_text || ""}
              onChange={(e) => updateField("body_text", e.target.value)}
              placeholder="Describe the announcement or promotion…"
              className={TEXTAREA_CLASS}
              maxLength={500}
            />
          </div>

          {/* Button text + link */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={LABEL_CLASS}>Button Text</label>
              <input
                type="text"
                value={config.button_text || ""}
                onChange={(e) => updateField("button_text", e.target.value)}
                placeholder="e.g. Learn More"
                className={INPUT_CLASS}
                maxLength={40}
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>Button Link</label>
              <input
                type="text"
                value={config.button_link || ""}
                onChange={(e) => updateField("button_link", e.target.value)}
                placeholder="e.g. /challenge or https://example.com"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          {/* Open in new tab toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateField("open_in_new_tab", !config.open_in_new_tab)}
              className={`flex h-6 w-11 items-center rounded-full border transition-all ${
                config.open_in_new_tab
                  ? "border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/20 justify-end"
                  : "border-white/16 bg-white/6 justify-start"
              }`}
            >
              <div
                className={`mx-0.5 h-5 w-5 rounded-full transition-colors ${
                  config.open_in_new_tab ? "bg-[var(--av-light-orange)]" : "bg-white/30"
                }`}
              />
            </button>
            <span className="text-sm text-white/70">Open link in new tab</span>
          </div>
        </div>

        {/* Save button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-full border border-[var(--av-light-orange)]/40 bg-[linear-gradient(135deg,rgba(244,150,23,0.22),rgba(23,58,109,0.3))] px-8 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-all hover:shadow-[0_12px_36px_rgba(244,150,23,0.15)] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Live preview card */}
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[var(--av-light-orange)]/70">
          Live Preview
        </h2>
        <div className="mx-auto max-w-sm">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#050A30]">
            {config.image_url && (
              <img
                src={config.image_url}
                alt="Preview"
                className="h-48 w-full object-cover"
              />
            )}
            <div className="p-5 text-center">
              {config.title && (
                <h3 className="text-lg font-bold text-white">{config.title}</h3>
              )}
              {config.subtitle && (
                <p className="mt-1 text-sm text-[#F5C16C]">{config.subtitle}</p>
              )}
              {config.body_text && (
                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  {config.body_text}
                </p>
              )}
              {config.button_text && (
                <div className="mt-5">
                  <span className="inline-block rounded-full bg-gradient-to-r from-[#F49617] to-[#F5C16C] px-6 py-2.5 text-sm font-bold text-[#050A30]">
                    {config.button_text}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.action}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
