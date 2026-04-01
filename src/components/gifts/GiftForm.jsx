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
        await api.post("/admin/gifts", payload);
      } else {
        await api.patch(`/admin/gifts/${gift.id}`, payload);
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
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="e.g. Star Gift"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Icon (emoji)
          </label>
          <input
            type="text"
            value={form.icon}
            onChange={(e) => update("icon", e.target.value)}
            placeholder="e.g. ⭐"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(e) => update("currency", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="vpt">vPT (tokens)</option>
            <option value="ngn">NGN (naira)</option>
          </select>
        </div>

        {/* Value */}
        {form.currency === "vpt" ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              vPT Units
            </label>
            <input
              type="number"
              min="1"
              value={form.vpt_units}
              onChange={(e) => update("vpt_units", e.target.value)}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naira Value (₦)
            </label>
            <input
              type="number"
              min="1"
              value={form.naira_value}
              onChange={(e) => update("naira_value", e.target.value)}
              placeholder="e.g. 500"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : isNew ? "Create Gift" : "Save Changes"}
          </button>
        </div>
      </div>
    </Drawer>
  );
}
