"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

// ─── Styles ────────────────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/60 transition";
const TEXTAREA_CLS =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/60 transition min-h-[80px] resize-y";
const SELECT_CLS =
  "rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none";
const LABEL_CLS = "mb-1 block text-xs font-medium text-[var(--av-light-orange)]";
const SECTION_CLS =
  "rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-4";
const ADD_BTN =
  "mt-2 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[var(--av-light-orange)] transition hover:bg-white/10";
const REMOVE_BTN =
  "flex-shrink-0 rounded-lg border border-red-400/20 bg-red-500/10 px-2 py-1 text-xs text-red-300 transition hover:bg-red-500/20";
const REORDER_BTN =
  "flex-shrink-0 rounded-lg border border-white/10 bg-white/8 px-2 py-1 text-xs text-[var(--av-light-orange)] transition hover:bg-white/15 disabled:opacity-40 disabled:cursor-not-allowed";
const RAW_EDITOR_CLS =
  "w-full min-h-[420px] rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-[var(--av-light-orange)] font-mono";

const FALLBACK_SLUGS = ["about", "careers", "press", "contact", "updates"];

// ─── Page schema definitions ───────────────────────────────────────────────
const PAGE_SCHEMAS = {
  about: [
    { key: "eyebrow", label: "Eyebrow Text", type: "text" },
    { key: "title", label: "Page Title", type: "text" },
    { key: "intro", label: "Introduction", type: "textarea" },
    { key: "mission_title", label: "Mission Section Title", type: "text" },
    { key: "mission_body", label: "Mission Body", type: "textarea" },
    { key: "values_title", label: "Values Section Title", type: "text" },
    {
      key: "values",
      label: "Values",
      type: "array",
      itemSchema: [
        { key: "icon", label: "Icon (emoji)", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "desc", label: "Description", type: "textarea" },
      ],
    },
    { key: "cta_title", label: "CTA Title", type: "text" },
    { key: "cta_body", label: "CTA Body", type: "text" },
    { key: "cta_label", label: "CTA Button Label", type: "text" },
    { key: "cta_href", label: "CTA Button URL", type: "text" },
  ],
  careers: [
    { key: "eyebrow", label: "Eyebrow Text", type: "text" },
    { key: "title", label: "Page Title", type: "text" },
    { key: "intro", label: "Introduction", type: "textarea" },
    { key: "perks_title", label: "Perks Section Title", type: "text" },
    {
      key: "perks",
      label: "Perks",
      type: "array",
      itemSchema: [
        { key: "icon", label: "Icon (emoji)", type: "text" },
        { key: "text", label: "Perk Text", type: "text" },
      ],
    },
    { key: "open_roles_title", label: "Open Roles Title", type: "text" },
    { key: "open_roles_body", label: "Open Roles Body", type: "textarea" },
    { key: "careers_email", label: "Careers Email", type: "text" },
  ],
  press: [
    { key: "eyebrow", label: "Eyebrow Text", type: "text" },
    { key: "title", label: "Page Title", type: "text" },
    { key: "intro", label: "Introduction", type: "textarea" },
    { key: "press_contact_title", label: "Press Contact Title", type: "text" },
    { key: "press_contact_body", label: "Press Contact Body", type: "text" },
    { key: "press_email", label: "Press Email", type: "text" },
    { key: "about_title", label: "About Section Title", type: "text" },
    { key: "about_paragraphs", label: "About Paragraphs", type: "string-array" },
  ],
  contact: [
    { key: "eyebrow", label: "Eyebrow Text", type: "text" },
    { key: "title", label: "Page Title", type: "text" },
    { key: "intro", label: "Introduction", type: "textarea" },
    {
      key: "contacts",
      label: "Contact Cards",
      type: "array",
      itemSchema: [
        { key: "icon", label: "Icon (emoji)", type: "text" },
        { key: "title", label: "Title", type: "text" },
        { key: "detail", label: "Detail", type: "text" },
        { key: "href", label: "Link (mailto: or URL)", type: "text" },
      ],
    },
    { key: "social_cta_title", label: "Social CTA Title", type: "text" },
    { key: "social_cta_body", label: "Social CTA Body", type: "text" },
    {
      key: "social_links",
      label: "Social Links",
      type: "array",
      itemSchema: [
        { key: "label", label: "Label", type: "text" },
        { key: "href", label: "URL", type: "text" },
      ],
    },
  ],
  updates: [
    { key: "eyebrow", label: "Eyebrow Text", type: "text" },
    { key: "title", label: "Page Title", type: "text" },
    { key: "intro", label: "Introduction", type: "textarea" },
    { key: "contact_title", label: "Bottom CTA Text", type: "text" },
    { key: "contact_cta_label", label: "Bottom CTA Button Label", type: "text" },
    { key: "contact_cta_href", label: "Bottom CTA Button URL", type: "text" },
    {
      key: "items",
      label: "Update Timeline Items",
      type: "array",
      itemSchema: [
        { key: "date", label: "Date Label", type: "text" },
        { key: "tag", label: "Tag", type: "text" },
        { key: "tone", label: "Tag Tone (orange, purple, red, green, blue, amber, cyan)", type: "text" },
        { key: "icon", label: "Icon / Emoji", type: "text" },
        { key: "title", label: "Card Title", type: "text" },
        { key: "summary", label: "Summary", type: "textarea" },
        { key: "details", label: "Detail Bullet Points", type: "string-array" },
      ],
    },
  ],
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function safeStringify(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function emptyItem(itemSchema) {
  return Object.fromEntries(itemSchema.map((f) => [f.key, ""]));
}

// ─── Field-level components ────────────────────────────────────────────────
function StringArrayField({ label, value, onChange }) {
  const items = Array.isArray(value) ? value : [];

  function updateItem(i, v) {
    const next = [...items];
    next[i] = v;
    onChange(next);
  }

  function addItem() {
    onChange([...items, ""]);
  }

  function removeItem(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function moveItem(i, direction) {
    const nextIndex = i + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(i, 1);
    next.splice(nextIndex, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <p className={LABEL_CLS}>{label}</p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              className={TEXTAREA_CLS}
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              placeholder={`Paragraph ${i + 1}`}
            />
            <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className={REORDER_BTN}>
              Up
            </button>
            <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className={REORDER_BTN}>
              Down
            </button>
            <button type="button" onClick={() => removeItem(i)} className={REMOVE_BTN}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className={ADD_BTN}>
        + Add Paragraph
      </button>
    </div>
  );
}

function ArrayField({ label, value, itemSchema, onChange }) {
  const items = Array.isArray(value) ? value : [];

  function updateField(i, key, v) {
    const next = items.map((item, idx) => (idx === i ? { ...item, [key]: v } : item));
    onChange(next);
  }

  function addItem() {
    onChange([...items, emptyItem(itemSchema)]);
  }

  function removeItem(i) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  function moveItem(i, direction) {
    const nextIndex = i + direction;
    if (nextIndex < 0 || nextIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(i, 1);
    next.splice(nextIndex, 0, moved);
    onChange(next);
  }

  return (
    <div>
      <p className={LABEL_CLS}>{label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className={SECTION_CLS}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/40">Item {i + 1}</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => moveItem(i, -1)} disabled={i === 0} className={REORDER_BTN}>
                  Up
                </button>
                <button type="button" onClick={() => moveItem(i, 1)} disabled={i === items.length - 1} className={REORDER_BTN}>
                  Down
                </button>
                <button type="button" onClick={() => removeItem(i)} className={REMOVE_BTN}>
                  Remove
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {itemSchema.map((field) => (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                  <label className={LABEL_CLS}>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      className={TEXTAREA_CLS}
                      value={item[field.key] ?? ""}
                      onChange={(e) => updateField(i, field.key, e.target.value)}
                    />
                  ) : field.type === "string-array" ? (
                    <StringArrayField
                      label={field.label}
                      value={item[field.key]}
                      onChange={(v) => updateField(i, field.key, v)}
                    />
                  ) : (
                    <input
                      type="text"
                      className={INPUT_CLS}
                      value={item[field.key] ?? ""}
                      onChange={(e) => updateField(i, field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={addItem} className={ADD_BTN}>
        + Add Item
      </button>
    </div>
  );
}

function FormEditor({ schema, value, onChange }) {
  function updateField(key, v) {
    onChange({ ...value, [key]: v });
  }

  if (!schema || !value) return null;

  return (
    <div className="space-y-5">
      {schema.map((field) => {
        const val = value[field.key];

        if (field.type === "array") {
          return (
            <ArrayField
              key={field.key}
              label={field.label}
              value={val}
              itemSchema={field.itemSchema}
              onChange={(v) => updateField(field.key, v)}
            />
          );
        }

        if (field.type === "string-array") {
          return (
            <StringArrayField
              key={field.key}
              label={field.label}
              value={val}
              onChange={(v) => updateField(field.key, v)}
            />
          );
        }

        return (
          <div key={field.key}>
            <label className={LABEL_CLS}>{field.label}</label>
            {field.type === "textarea" ? (
              <textarea
                className={TEXTAREA_CLS}
                value={val ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className={INPUT_CLS}
                value={val ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function StaticPagesContentPage() {
  const [slugs, setSlugs] = useState(FALLBACK_SLUGS);
  const [selectedSlug, setSelectedSlug] = useState(FALLBACK_SLUGS[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formValue, setFormValue] = useState({});
  const [activeTab, setActiveTab] = useState("form"); // "form" | "json"
  const [rawJson, setRawJson] = useState("{}");
  const [jsonError, setJsonError] = useState(null);

  const schema = PAGE_SCHEMAS[selectedSlug] ?? null;

  const loadSlugs = useCallback(async () => {
    try {
      const res = await api.get("/home/page-content-slugs");
      const next = Array.isArray(res?.slugs) && res.slugs.length > 0 ? res.slugs : FALLBACK_SLUGS;
      setSlugs(next);
      setSelectedSlug((prev) => (next.includes(prev) ? prev : next[0]));
    } catch {
      setSlugs(FALLBACK_SLUGS);
      setSelectedSlug((prev) => (FALLBACK_SLUGS.includes(prev) ? prev : FALLBACK_SLUGS[0]));
    }
  }, []);

  const loadContent = useCallback(async (slug) => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/content/pages/${encodeURIComponent(slug)}`);
      const content = res?.content || {};
      setFormValue(content);
      setRawJson(safeStringify(content));
      setJsonError(null);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load page content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSlugs();
  }, [loadSlugs]);

  useEffect(() => {
    if (!selectedSlug) return;
    loadContent(selectedSlug);
  }, [selectedSlug, loadContent]);

  // Sync raw JSON → form when switching to form tab
  function handleTabChange(tab) {
    if (tab === "form" && activeTab === "json") {
      try {
        const parsed = JSON.parse(rawJson || "{}");
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          setFormValue(parsed);
          setJsonError(null);
        } else {
          setJsonError("Content must be a JSON object.");
          return;
        }
      } catch (e) {
        setJsonError(e.message || "Invalid JSON");
        return;
      }
    }
    if (tab === "json" && activeTab === "form") {
      setRawJson(safeStringify(formValue));
      setJsonError(null);
    }
    setActiveTab(tab);
  }

  function handleFormChange(newValue) {
    setFormValue(newValue);
    setSuccess(null);
    if (error) setError(null);
  }

  function handleJsonChange(text) {
    setRawJson(text);
    setSuccess(null);
    if (error) setError(null);
    try {
      const parsed = JSON.parse(text || "{}");
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        setJsonError("Content must be a JSON object.");
      } else {
        setJsonError(null);
      }
    } catch (e) {
      setJsonError(e.message || "Invalid JSON");
    }
  }

  async function handleSave() {
    let payload = formValue;

    if (activeTab === "json") {
      if (jsonError) {
        setError(jsonError);
        return;
      }
      try {
        payload = JSON.parse(rawJson || "{}");
      } catch (e) {
        setError(e.message || "Invalid JSON");
        return;
      }
    }

    if (!selectedSlug) return;

    try {
      setSaving(true);
      const res = await api.patch(`/admin/content/pages/${encodeURIComponent(selectedSlug)}`, {
        content: payload,
      });
      const saved = res?.content || payload;
      setFormValue(saved);
      setRawJson(safeStringify(saved));
      setSuccess(`Changes saved to the ${selectedSlug} page.`);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to save page content");
      setSuccess(null);
    } finally {
      setSaving(false);
    }
  }

  const canSave = activeTab === "json" ? !jsonError : true;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Static Pages Content</h1>
          <p className="mt-2 text-sm text-[var(--av-light-orange)]">
            Edit CMS text for About, Careers, Press, Contact, and Updates pages.
          </p>
          <p className="mt-1 text-xs text-white/60">
            Tip: choose <span className="text-[var(--av-light-orange)]">updates</span> in the Page selector to manage the public Updates page.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => loadContent(selectedSlug)}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-white/10"
          >
            Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !canSave}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[1.25rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-[1.25rem] border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm text-[var(--av-light-orange)]">Page:</label>
          <select
            className={SELECT_CLS}
            value={selectedSlug}
            onChange={(e) => {
              setSelectedSlug(e.target.value);
              setSuccess(null);
              setError(null);
            }}
          >
            {slugs.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setSelectedSlug("updates")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-[var(--av-light-orange)] transition hover:bg-white/10"
          >
            Open Updates CMS
          </button>
        </div>

        {/* Tabs */}
        <div className="flex rounded-2xl border border-white/10 bg-white/5 p-1 text-sm">
          {["form", "json"].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`rounded-xl px-4 py-1.5 font-medium capitalize transition ${
                activeTab === tab
                  ? "bg-[var(--av-light-orange)] text-[var(--av-dark-blue)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {tab === "form" ? "Form Editor" : "Raw JSON"}
            </button>
          ))}
        </div>
      </div>

      {/* Editor surface */}
      <section className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
          </div>
        ) : activeTab === "form" ? (
          schema ? (
            <FormEditor schema={schema} value={formValue} onChange={handleFormChange} />
          ) : (
            <div className="py-8 text-center text-sm text-white/40">
              No form schema defined for this page. Use the Raw JSON tab.
            </div>
          )
        ) : (
          <>
            <textarea
              className={RAW_EDITOR_CLS}
              value={rawJson}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
            />
            {jsonError ? (
              <p className="mt-2 text-xs text-red-300">JSON error: {jsonError}</p>
            ) : (
              <p className="mt-2 text-xs text-[var(--av-light-orange)]">JSON is valid.</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
