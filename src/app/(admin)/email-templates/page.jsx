"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getTemplates, saveTemplate, sendTestEmail } from "@/services/emailTemplates";

const VARIABLE_TOKENS = ["{{name}}", "{{email}}"];

function toTemplateId(name) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  if (!base) return null;
  return base.endsWith(".html") ? base : `${base}.html`;
}

function withPreviewVars(html, vars) {
  return String(html || "")
    .replace(/\{\{name\}\}/g, vars?.name || "")
    .replace(/\{\{email\}\}/g, vars?.email || "");
}

function TemplatePreview({ html, title, minHeight }) {
  const safeDoc = html || "<!doctype html><html><body></body></html>";
  return (
    <iframe
      title={title}
      sandbox=""
      srcDoc={safeDoc}
      className={`w-full rounded-2xl border border-white/10 bg-white ${minHeight}`}
    />
  );
}

// Renders an editable HTML document inside a sandboxed iframe so the
// template's own CSS cannot bleed into the admin page styles.
function WysiwygIframeEditor({ value, onChange, iframeRef: externalRef }) {
  const localRef = useRef(null);
  const ref = externalRef || localRef;
  const initialised = useRef(false);

  // Write the full HTML document into the iframe on mount or when the value
  // changes from outside (e.g. switching templates).
  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(typeof value === "string" ? value : "");
    doc.close();

    if (doc.body) {
      doc.body.contentEditable = "true";
      doc.body.style.outline = "none";
      doc.body.style.cursor = "text";
    }

    // Keep handler reference stable so we can remove it on cleanup.
    function handleInput() {
      if (doc.documentElement) {
        onChange("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
      }
    }

    doc.addEventListener("input", handleInput);
    return () => doc.removeEventListener("input", handleInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <iframe
      ref={ref}
      title="WYSIWYG template editor"
      sandbox="allow-same-origin"
      className="min-h-[580px] w-full flex-1 rounded-2xl border border-white/10 bg-white"
    />
  );
}

export default function EmailTemplatesPage() {
  const wysiwygIframeRef = useRef(null);
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState(null);
  const [originalTemplateHtml, setOriginalTemplateHtml] = useState("");
  const [editorValue, setEditorValue] = useState("");
  const [previewVars, setPreviewVars] = useState({ name: "Jane Doe", email: "jane@example.com" });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [testing, setTesting] = useState(false);

  const [newTemplateName, setNewTemplateName] = useState("");
  const [editorMode, setEditorMode] = useState("html");

  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const data = await getTemplates();
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        const first = list[0] || null;
        setTemplates(list);
        setSelected(first?.id || null);
        setEditorValue(first?.html || "");
        setOriginalTemplateHtml(first?.html || "");
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load templates");
        setTemplates([]);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const renderedPreview = useMemo(() => withPreviewVars(editorValue, previewVars), [editorValue, previewVars]);
  const isDirty = editorValue !== originalTemplateHtml;

  function handleSelect(id) {
    const tpl = templates.find((item) => item.id === id);
    if (!tpl) return;
    setSelected(id);
    setEditorValue(tpl.html || "");
    setOriginalTemplateHtml(tpl.html || "");
    setTestResult(null);
  }

  async function handleSave() {
    if (!selected) return;
    try {
      setSaving(true);
      await saveTemplate(selected, editorValue);
      setTemplates((prev) =>
        prev.map((tpl) => (tpl.id === selected ? { ...tpl, html: editorValue } : tpl))
      );
      setOriginalTemplateHtml(editorValue);
      setTestResult({ ok: true, message: `Saved ${selected}` });
    } catch (err) {
      setTestResult({ ok: false, message: err?.message || "Failed to save template" });
    } finally {
      setSaving(false);
    }
  }

  function handleRevert() {
    setEditorValue(originalTemplateHtml);
    setTestResult({ ok: true, message: "Reverted unsaved changes" });
  }

  async function handleCreate() {
    const id = toTemplateId(newTemplateName);
    if (!id) {
      setTestResult({ ok: false, message: "Enter a valid template name (letters/numbers)." });
      return;
    }
    if (templates.some((tpl) => tpl.id === id)) {
      setTestResult({ ok: false, message: `Template ${id} already exists.` });
      return;
    }

    const starter =
      "<!DOCTYPE html>\n<html>\n<head><meta charset=\"UTF-8\"><title>New Template</title></head>\n<body>\n  <h1>Hello {{name}}</h1>\n  <p>Your email is {{email}}</p>\n</body>\n</html>\n";

    try {
      setCreating(true);
      await saveTemplate(id, starter);
      const created = { id, name: id.replace(/[-_]/g, " ").replace(/\.html$/, ""), html: starter };
      setTemplates((prev) => [created, ...prev]);
      setSelected(id);
      setEditorValue(starter);
      setOriginalTemplateHtml(starter);
      setNewTemplateName("");
      setTestResult({ ok: true, message: `Created ${id}` });
    } catch (err) {
      setTestResult({ ok: false, message: err?.message || "Failed to create template" });
    } finally {
      setCreating(false);
    }
  }

  async function handleTest() {
    if (!selected || !testEmail) {
      setTestResult({ ok: false, message: "Select a template and enter a test email address." });
      return;
    }

    try {
      setTesting(true);
      setTestResult({ ok: true, message: "Sending test email..." });
      const res = await sendTestEmail(selected, testEmail, previewVars);
      setTestResult(
        res.success
          ? { ok: true, message: "Test email sent successfully." }
          : { ok: false, message: `Send failed: ${res.error || "Unknown error"}` }
      );
    } catch (err) {
      setTestResult({ ok: false, message: err?.message || "Failed to send test email" });
    } finally {
      setTesting(false);
    }
  }

  function applyWysiwygCommand(command) {
    const frame = wysiwygIframeRef.current;
    if (!frame) return;
    const doc = frame.contentDocument || frame.contentWindow?.document;
    if (!doc) return;
    doc.execCommand(command, false);
    if (doc.documentElement) {
      setEditorValue("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
    }
  }

  function handleInsertVariable(token) {
    if (editorMode === "wysiwyg") {
      const frame = wysiwygIframeRef.current;
      if (!frame) return;
      const doc = frame.contentDocument || frame.contentWindow?.document;
      if (!doc) return;
      doc.execCommand("insertText", false, token);
      if (doc.documentElement) {
        setEditorValue("<!DOCTYPE html>\n" + doc.documentElement.outerHTML);
      }
      return;
    }
    setEditorValue((prev) => `${prev}${token}`);
  }

  if (loading) {
    return <div className="p-8 text-white/75">Loading templates...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-300">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Email Templates</h1>
        <p className="mt-2 text-sm text-white/58">
          Manage, preview, and test email templates used for onboarding and challenge communications.
        </p>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/75">Select Template</label>
            <select
              value={selected || ""}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id} className="text-black">
                  {tpl.name || tpl.id}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/70">
            {isDirty ? "Unsaved changes" : "Saved"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            type="text"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            placeholder="new-template-name"
            className="min-w-[240px] flex-1 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-60"
          >
            {creating ? "Creating..." : "Create New Template"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="flex flex-col space-y-4 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Edit Template</h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditorMode("html")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                editorMode === "html"
                  ? "bg-[var(--av-orange)] text-[var(--av-dark-blue)]"
                  : "border border-white/10 bg-white/6 text-white/70"
              }`}
            >
              HTML
            </button>
            <button
              type="button"
              onClick={() => setEditorMode("wysiwyg")}
              className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                editorMode === "wysiwyg"
                  ? "bg-[var(--av-orange)] text-[var(--av-dark-blue)]"
                  : "border border-white/10 bg-white/6 text-white/70"
              }`}
            >
              WYSIWYG
            </button>

            {editorMode === "wysiwyg" && (
              <>
                <button type="button" onClick={() => applyWysiwygCommand("bold")} className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm font-bold text-white">B</button>
                <button type="button" onClick={() => applyWysiwygCommand("italic")} className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm italic text-white">I</button>
                <button type="button" onClick={() => applyWysiwygCommand("underline")} className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm underline text-white">U</button>
                <button type="button" onClick={() => applyWysiwygCommand("insertUnorderedList")} className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white">• List</button>
              </>
            )}

            {VARIABLE_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                onClick={() => handleInsertVariable(token)}
                className="rounded-xl border border-[var(--av-light-orange)]/35 bg-[rgba(23,58,109,0.5)] px-3 py-2 text-xs text-[var(--av-light-orange)]"
              >
                {token}
              </button>
            ))}
          </div>

          {editorMode === "html" ? (
            <textarea
              value={editorValue}
              onChange={(e) => setEditorValue(e.target.value)}
              className="min-h-[580px] w-full flex-1 resize-y rounded-2xl border border-white/10 bg-white/6 p-3 font-mono text-sm text-white outline-none"
              placeholder="Paste or edit HTML template here..."
            />
          ) : (
            <WysiwygIframeEditor
              value={editorValue}
              onChange={setEditorValue}
              iframeRef={wysiwygIframeRef}
            />
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
            <button
              type="button"
              onClick={handleRevert}
              disabled={!isDirty}
              className="rounded-2xl border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              Revert Changes
            </button>
          </div>
        </section>

        <div className="space-y-6">
          <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Preview</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/75">Name</label>
                <input
                  type="text"
                  value={previewVars.name}
                  onChange={(e) => setPreviewVars((v) => ({ ...v, name: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white/75">Email</label>
                <input
                  type="text"
                  value={previewVars.email}
                  onChange={(e) => setPreviewVars((v) => ({ ...v, email: e.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>

            <TemplatePreview html={renderedPreview} title="Email template preview" minHeight="min-h-[480px]" />
          </section>

          <section className="space-y-4 rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white">Test Email</h2>

            <div>
              <label className="mb-2 block text-sm font-medium text-white/75">Test Email Address</label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleTest}
              disabled={testing}
              className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-60"
            >
              {testing ? "Sending..." : "Send Test Email"}
            </button>

            {testResult ? (
              <div
                className={`rounded-2xl border px-4 py-3 text-sm ${
                  testResult.ok
                    ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-200"
                    : "border-red-400/35 bg-red-400/10 text-red-200"
                }`}
              >
                {testResult.message}
              </div>
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/70">
              <div className="mb-2 font-semibold text-white/85">Send Preview Snapshot</div>
              <div><strong>Template:</strong> {selected || "None selected"}</div>
              <div><strong>To:</strong> {testEmail || "No recipient entered"}</div>
              <div className="mt-2"><strong>Rendered sample:</strong></div>
              <div className="mt-2 overflow-hidden rounded-xl">
                <TemplatePreview html={renderedPreview} title="Test snapshot preview" minHeight="min-h-[260px]" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
