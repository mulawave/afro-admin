"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import Drawer from "@/components/ui/Drawer";

export default function GiftForm({ gift, onClose }) {
  const isNew = !gift.id;
  const [form, setForm] = useState({
    name: gift.name || "",
    icon: gift.icon || "",
    currency: gift.currency || "vpt",
    vpt_units: gift.vpt_units ?? "",
    naira_value: gift.naira_value ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setError("Name is required");
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

        <div>
          <label className="mb-1 block text-sm font-medium text-white/72">
            Icon (emoji)
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => update("icon", e.target.value)}
            placeholder="e.g. ⭐"
            className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32"
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
