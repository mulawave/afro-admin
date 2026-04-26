"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

const INPUT = "w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--av-light-orange)]";
const TEXTAREA = "w-full min-h-24 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-[var(--av-light-orange)]";
const SELECT = "w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none";
const SECTION = "rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5";

const SECTIONS = [
  {
    title: "Page Metadata & UI Labels",
    fields: [
      { key: "page_meta_title", label: "Browser Title", type: "text" },
      { key: "hero_badge_icon", label: "Hero Badge Icon", type: "text" },
      { key: "lifecycle_current_badge_label", label: "Current Lifecycle Badge Label", type: "text" },
      { key: "lifecycle_phase_prefix", label: "Lifecycle Phase Prefix", type: "text" },
      { key: "page_meta_description", label: "Browser Description", type: "textarea", full: true },
    ],
  },
  {
    title: "Hero",
    toggleKey: "hero_enabled",
    fields: [
      { key: "hero_badge", label: "Badge", type: "text" },
      { key: "hero_title_primary", label: "Primary Title", type: "text" },
      { key: "hero_title_highlight", label: "Highlight Title", type: "text" },
      { key: "hero_cta_label", label: "Primary CTA Label", type: "text" },
      { key: "hero_cta_href", label: "Primary CTA URL", type: "text" },
      { key: "hero_secondary_label", label: "Secondary CTA Label", type: "text" },
      { key: "hero_secondary_href", label: "Secondary CTA URL", type: "text" },
      { key: "hero_intro", label: "Hero Intro", type: "textarea", full: true },
      { key: "hero_note", label: "Hero Note", type: "textarea", full: true },
    ],
  },
  {
    title: "Hero Stats",
    fields: [
      {
        key: "hero_stats",
        type: "array",
        itemLabel: "Stat",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "value", label: "Value", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    title: "Season Identity",
    toggleKey: "season_enabled",
    fields: [
      { key: "season_eyebrow", label: "Eyebrow", type: "text" },
      { key: "season_title", label: "Title", type: "text" },
      { key: "season_description", label: "Description", type: "textarea", full: true },
    ],
  },
  {
    title: "Themes",
    fields: [
      {
        key: "themes",
        type: "array",
        itemLabel: "Theme",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "icon", label: "Icon", type: "text" },
          { key: "label", label: "Label", type: "text" },
        ],
      },
    ],
  },
  {
    title: "Challenge Lifecycle",
    toggleKey: "lifecycle_enabled",
    fields: [
      { key: "lifecycle_title", label: "Section Title", type: "text" },
      { key: "lifecycle_subtitle", label: "Section Subtitle", type: "text" },
      {
        key: "lifecycle_phases",
        type: "array",
        itemLabel: "Lifecycle Phase",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "icon", label: "Icon", type: "text" },
          { key: "phase", label: "Phase Title", type: "text" },
          { key: "subtitle", label: "Phase Subtitle", type: "text" },
          { key: "status", label: "Status (active/upcoming/completed)", type: "text" },
          { key: "desc", label: "Description", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "What Makes It Unstoppable",
    toggleKey: "unstoppable_enabled",
    fields: [
      { key: "unstoppable_title", label: "Section Title", type: "text" },
      { key: "unstoppable_subtitle", label: "Section Subtitle", type: "text" },
      {
        key: "unstoppable_layout",
        label: "Cards Layout",
        type: "select",
        options: [
          { value: "grid", label: "Grid (cards side by side)" },
          { value: "rows", label: "Rows (one card per row)" },
        ],
      },
      {
        key: "unstoppable_text_align",
        label: "Card Text Alignment",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "justify", label: "Justify" },
        ],
      },
      {
        key: "unstoppable_items",
        type: "array",
        itemLabel: "Unstoppable Card",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "icon", label: "Icon", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "desc", label: "Description", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "Show Structure",
    toggleKey: "structure_enabled",
    fields: [
      { key: "structure_title", label: "Section Title", type: "text" },
      { key: "structure_subtitle", label: "Section Subtitle", type: "text" },
      {
        key: "structure_phases",
        type: "array",
        itemLabel: "Show Phase",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "ep", label: "Episode Label", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "desc", label: "Description", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "Prizes & Rewards",
    toggleKey: "prizes_enabled",
    fields: [
      { key: "prizes_title", label: "Section Title", type: "text" },
      { key: "prizes_subtitle", label: "Section Subtitle", type: "text" },
      {
        key: "prizes",
        type: "array",
        itemLabel: "Prize",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "icon", label: "Icon", type: "text" },
          { key: "place", label: "Place", type: "text" },
          { key: "amount", label: "Amount", type: "text" },
          { key: "desc", label: "Description", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "How To Join",
    toggleKey: "join_enabled",
    fields: [
      { key: "join_title", label: "Section Title", type: "text" },
      { key: "join_subtitle", label: "Section Subtitle", type: "text" },
      {
        key: "join_layout",
        label: "Steps Layout",
        type: "select",
        options: [
          { value: "grid", label: "Grid" },
          { value: "rows", label: "Rows" },
        ],
      },
      {
        key: "join_single_item_position",
        label: "Single Card Position",
        type: "select",
        options: [
          { value: "auto", label: "Auto" },
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
      {
        key: "join_steps",
        type: "array",
        itemLabel: "Join Step",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "step", label: "Step Number", type: "text" },
          { key: "title", label: "Step Title", type: "text" },
          { key: "desc", label: "Description", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "Platform Integration",
    toggleKey: "platform_enabled",
    fields: [
      { key: "platform_eyebrow", label: "Eyebrow", type: "text" },
      { key: "platform_title", label: "Section Title", type: "text" },
      { key: "platform_body", label: "Section Body", type: "textarea", full: true },
      {
        key: "platform_features",
        type: "array",
        itemLabel: "Platform Feature",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "icon", label: "Icon", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "desc", label: "Description", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "Frequently Asked Questions",
    toggleKey: "faq_enabled",
    fields: [
      { key: "faq_title", label: "Section Title", type: "text" },
      { key: "faq_subtitle", label: "Section Subtitle", type: "text" },
      {
        key: "faqs",
        type: "array",
        itemLabel: "FAQ Item",
        itemSchema: [
          { key: "id", label: "ID", type: "text" },
          { key: "q", label: "Question", type: "textarea", full: true },
          { key: "a", label: "Answer", type: "textarea", full: true },
        ],
      },
    ],
  },
  {
    title: "Bottom CTA",
    toggleKey: "bottom_cta_enabled",
    fields: [
      { key: "bottom_cta_title", label: "CTA Title", type: "text" },
      { key: "bottom_cta_body", label: "CTA Body", type: "textarea", full: true },
      { key: "bottom_cta_primary_label", label: "Primary Button Label", type: "text" },
      { key: "bottom_cta_primary_href", label: "Primary Button URL", type: "text" },
      { key: "bottom_cta_secondary_label", label: "Secondary Button Label", type: "text" },
      { key: "bottom_cta_secondary_href", label: "Secondary Button URL", type: "text" },
    ],
  },
];

function buildEmptyItem(fieldSchema, index, key) {
  const next = {};
  for (const field of fieldSchema) {
    if (field.key === "sort_order") {
      next[field.key] = index + 1;
    } else if (field.key === "id") {
      next[field.key] = `${key}-${Date.now()}-${index + 1}`;
    } else {
      next[field.key] = "";
    }
  }
  return next;
}

function resequenceItems(items) {
  return items.map((item, index) => ({ ...item, sort_order: index + 1 }));
}

function FieldInput({ field, value, onChange }) {
  if (field.type === "textarea") {
    return <textarea className={TEXTAREA} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }

  if (field.type === "select") {
    return (
      <select className={SELECT} value={value || ""} onChange={(e) => onChange(e.target.value)}>
        {(field.options || []).map((option) => (
          <option key={option.value} value={option.value} className="bg-[var(--admin-surface)] text-white">
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white">
        <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.checkboxLabel || "Enabled"}</span>
      </label>
    );
  }

  return <input className={INPUT} value={value || ""} onChange={(e) => onChange(e.target.value)} />;
}

function ArrayEditor({ title, items, itemSchema, onChange, keyName }) {
  const safeItems = Array.isArray(items) ? items : [];

  function updateItem(index, field, value) {
    const next = safeItems.map((item, i) => (i === index ? { ...item, [field]: value } : item));
    onChange(resequenceItems(next));
  }

  function addItem() {
    const next = [...safeItems, buildEmptyItem(itemSchema, safeItems.length, keyName)];
    onChange(resequenceItems(next));
  }

  function removeItem(index) {
    const next = safeItems.filter((_, i) => i !== index);
    onChange(resequenceItems(next));
  }

  function moveItem(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= safeItems.length) return;
    const next = [...safeItems];
    const [item] = next.splice(index, 1);
    next.splice(nextIndex, 0, item);
    onChange(resequenceItems(next));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button type="button" onClick={addItem} className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-[var(--av-light-orange)] hover:bg-white/10">
          + Add Item
        </button>
      </div>

      {safeItems.map((item, index) => (
        <div key={item.id || `${keyName}-${index}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--av-light-orange)]">Item {index + 1}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-[var(--av-light-orange)] disabled:opacity-40"
              >
                Up
              </button>
              <button
                type="button"
                onClick={() => moveItem(index, 1)}
                disabled={index === safeItems.length - 1}
                className="rounded-2xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-[var(--av-light-orange)] disabled:opacity-40"
              >
                Down
              </button>
              <button type="button" onClick={() => removeItem(index)} className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-200">
                Remove
              </button>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {itemSchema.map((field) => (
              <div key={`${keyName}-${field.key}-${index}`} className={field.full ? "lg:col-span-2" : ""}>
                <label className="mb-2 block text-sm text-[var(--av-light-orange)]">{field.label}</label>
                {field.type === "textarea" ? (
                  <textarea
                    className={TEXTAREA}
                    value={item[field.key] ?? ""}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                  />
                ) : (
                  <input
                    className={INPUT}
                    value={item[field.key] ?? ""}
                    onChange={(e) => updateItem(index, field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ChallengeContentPage() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/content/challenge");
      setContent(res.content || null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load challenge content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(key, value) {
    setContent((current) => ({ ...(current || {}), [key]: value }));
  }

  async function save() {
    try {
      setSaving(true);
      const res = await api.patch("/admin/content/challenge", { content });
      setContent(res.content || content);
      setSuccess("Challenge page content saved successfully.");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to save challenge content");
      setSuccess(null);
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

  if (!content) {
    return (
      <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
        Could not load challenge content.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Challenge Page Content</h1>
          <p className="mt-2 text-sm text-[var(--av-light-orange)]">
            Manage every visible section on the public Challenge page from this CMS.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={load} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-white/10">Refresh</button>
          <button onClick={save} disabled={saving} className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {error ? <div className="rounded-[1.25rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div> : null}
      {success ? <div className="rounded-[1.25rem] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{success}</div> : null}

      {SECTIONS.map((section) => (
        <section key={section.title} className={SECTION}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">{section.title}</h2>
            {section.toggleKey ? (
              <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-1.5 text-xs text-[var(--av-light-orange)]">
                <input
                  type="checkbox"
                  checked={Boolean(content[section.toggleKey])}
                  onChange={(e) => updateField(section.toggleKey, e.target.checked)}
                />
                <span>{content[section.toggleKey] ? "Enabled" : "Disabled"}</span>
              </label>
            ) : null}
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {section.fields
                .filter((field) => field.type !== "array")
                .map((field) => (
                  <div key={field.key} className={field.full ? "lg:col-span-2" : ""}>
                    <label className="mb-2 block text-sm text-[var(--av-light-orange)]">{field.label}</label>
                    <FieldInput field={field} value={content[field.key]} onChange={(next) => updateField(field.key, next)} />
                  </div>
                ))}
            </div>

            {section.fields
              .filter((field) => field.type === "array")
              .map((field) => (
                <ArrayEditor
                  key={field.key}
                  title={field.itemLabel}
                  items={content[field.key]}
                  itemSchema={field.itemSchema}
                  keyName={field.key}
                  onChange={(nextItems) => updateField(field.key, nextItems)}
                />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
