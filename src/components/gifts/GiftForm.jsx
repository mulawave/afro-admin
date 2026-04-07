"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import Drawer from "@/components/ui/Drawer";

const EMOJI_GRID = [
  "⭐", "🌟", "💫", "✨", "🔥", "💎", "👑", "🏆",
  "🎁", "🎀", "🎉", "🎊", "🎯", "🚀", "💖", "❤️",
  "💙", "💜", "💛", "🧡", "🤍", "💕", "💗", "💝",
  "🌹", "🌸", "🌺", "🌻", "🦋", "🦄", "🐉", "🦅",
  "🍀", "🎵", "🎶", "🎤", "🎬", "📺", "🎮", "🎲",
  "🍕", "🍔", "🍟", "🍣", "🍩", "🍰", "🧁", "🍫",
  "☕", "🍷", "🥂", "🍺", "🥤", "🧃", "🍹", "🧋",
  "🏅", "🥇", "🥈", "🥉", "🎖️", "🏵️", "💰", "💵",
  "💸", "💳", "🪙", "🔑", "🗝️", "🛡️", "⚔️", "🏹",
  "🎭", "🎨", "🖌️", "🎻", "🥁", "🎺", "🎸", "🎹",
];

export default function GiftForm({ gift, onClose }) {
  const isNew = !gift.id;
  const [form, setForm] = useState({
    name: gift.name || "",
    icon: gift.icon || "",
    image_url: gift.image_url || "",
    currency: gift.currency || "vpt",
    vpt_units: gift.vpt_units ?? "",
    naira_value: gift.naira_value ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectEmoji(emoji) {
    update("icon", emoji);
    setShowEmojiPicker(false);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.upload("/interactions/gifts/upload-image", formData);
      if (res.image_url) {
        update("image_url", res.image_url);
      }
    } catch (err) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeImage() {
    update("image_url", "");
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    if (!form.icon.trim() && !form.image_url) {
      setError("An emoji or uploaded image is required");
      return;
    }

    if (form.currency === "vpt" && (!form.vpt_units || Number(form.vpt_units) <= 0)) {
      setError("vPT units must be greater than 0");
      return;
    }

    if (form.currency === "ngn" && (!form.naira_value || Number(form.naira_value) <= 0)) {
      setError("Naira value must be greater than 0");
      return;
    }

    const payload = {
      name: form.name.trim(),
      icon: form.icon.trim(),
      image_url: form.image_url || null,
      currency: form.currency,
      ...(form.currency === "vpt"
        ? { vpt_units: Number(form.vpt_units) }
        : { naira_value: Number(form.naira_value) }),
    };

    setSaving(true);
    setError(null);
    try {
      if (isNew) {
        await api.post("/interactions/gifts", payload);
      } else {
        await api.patch(`/interactions/gifts/${gift.id}`, payload);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save gift");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={isNew ? "Add Gift" : `Edit "${gift.name}"`}
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-white/72">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Star Gift"
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32"
          />
        </div>

        {/* Icon — emoji picker */}
        <div>
          <label className="mb-1 block text-sm font-medium text-white/72">
            Icon (emoji)
          </label>
          <div className="flex items-center gap-2">
            <div
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="flex h-10 w-14 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/6 text-2xl transition-colors hover:border-[var(--av-orange)]/50"
            >
              {form.icon || "?"}
            </div>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => update("icon", e.target.value)}
              placeholder="Select or type emoji"
              className="flex-1 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32"
            />
          </div>
          {showEmojiPicker && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-white/6 p-2">
              <div className="grid grid-cols-8 gap-1">
                {EMOJI_GRID.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => selectEmoji(emoji)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl transition-all hover:scale-110 hover:bg-white/10 ${form.icon === emoji ? "bg-[var(--av-orange)]/20 ring-1 ring-[var(--av-orange)]" : ""}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Gift design image upload */}
        <div>
          <label className="mb-1 block text-sm font-medium text-white/72">
            Gift Design Image <span className="text-white/40">(optional)</span>
          </label>
          {form.image_url ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/6 p-3">
              <img
                src={form.image_url}
                alt="Gift design"
                className="h-16 w-16 rounded-lg border border-white/10 object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs text-white/50">{form.image_url}</p>
              </div>
              <button
                type="button"
                onClick={removeImage}
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-xs text-red-300 transition-colors hover:bg-red-500/20"
              >
                Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/20 bg-white/4 px-3 py-4 text-sm text-white/50 transition-colors hover:border-[var(--av-orange)]/40 hover:text-white/70 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--av-orange)] border-t-transparent" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  Upload gift image (PNG, JPG, WebP — max 5 MB)
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-white/72">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
          >
            <option value="vpt">vPT (tokens)</option>
            <option value="ngn">NGN (naira)</option>
          </select>
        </div>

        {/* Value */}
        {form.currency === "vpt" ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-white/72">
              vPT Units
            </label>
            <input
              type="number"
              min="1"
              value={form.vpt_units}
              onChange={(e) => update("vpt_units", e.target.value)}
              placeholder="e.g. 100"
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32"
            />
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-white/72">
              Naira Value (₦)
            </label>
            <input
              type="number"
              min="1"
              value={form.naira_value}
              onChange={(e) => update("naira_value", e.target.value)}
              placeholder="e.g. 500"
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32"
            />
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
          <button
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition-colors hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
          >
            {saving ? "Saving..." : isNew ? "Create Gift" : "Save Changes"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
