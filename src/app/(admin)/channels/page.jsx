"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

// â”€â”€ Stream source mode badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SourceModeBadge({ mode }) {
  if (!mode || mode === "native") {
    return (
      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-medium text-white/50">
        Native
      </span>
    );
  }
  const config = {
    external_youtube: { label: "YouTube", cls: "border-red-400/30 bg-red-500/10 text-red-300" },
    external_hls: { label: "HLS", cls: "border-sky-400/30 bg-sky-500/10 text-sky-300" },
    external_dash: { label: "DASH", cls: "border-violet-400/30 bg-violet-500/10 text-violet-300" },
  }[mode] || { label: mode, cls: "border-white/10 bg-white/6 text-white/50" };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${config.cls}`}>
      {config.label}
    </span>
  );
}

// â”€â”€ Stream status badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function StreamStatusBadge({ status }) {
  if (!status || status === "unknown") return null;
  const config = {
    live: { label: "Live", cls: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300", dot: true },
    valid: { label: "Reachable", cls: "border-sky-400/30 bg-sky-500/10 text-sky-300" },
    scheduled: { label: "Scheduled", cls: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
    offline: { label: "Probe Failed", cls: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
    invalid: { label: "Probe Failed", cls: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
    access_denied: { label: "Probe Blocked", cls: "border-amber-400/30 bg-amber-500/10 text-amber-300" },
  }[status] || { label: status, cls: "border-white/10 bg-white/6 text-white/50" };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.cls}`}>
      {config.dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {config.label}
    </span>
  );
}

function OwnerDisplayBadge({ mode, brandName }) {
  if (mode === "hide_owner") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
        Hidden
      </span>
    );
  }
  if (mode === "brand_only") {
    return (
      <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-medium text-sky-300">
        Brand: {brandName || "Unnamed"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
      Visible
    </span>
  );
}

// â”€â”€ Import Channel Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function ImportChannelModal({ onClose, onImported }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    source_url: "",
    stream_source_mode: "external_youtube",
    type: "public",
  });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [urlValidation, setUrlValidation] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCategories(true);
        const res = await api.get("/admin/categories");
        if (!mounted) return;
        const active = (res.categories || [])
          .filter((c) => c?.is_active)
          .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
        setCategories(active);
      } catch (err) {
        if (!mounted) return;
        setError(err.message || "Failed to load categories");
      } finally {
        if (mounted) setLoadingCategories(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  function setField(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleFileChange(setter) {
    return (e) => {
      const file = e.target.files?.[0] || null;
      setter(file);
      if (error) setError(null);
    };
  }

  function sourceLabel(mode) {
    if (mode === "external_hls") return "HLS Stream";
    if (mode === "external_dash") return "DASH Stream";
    return "YouTube";
  }

  async function validateSourceUrl() {
    const url = form.source_url.trim();
    if (!url) {
      setError("Source URL is required for validation");
      return;
    }

    setValidatingUrl(true);
    setError(null);
    setUrlValidation(null);
    try {
      const res = await api.post("/channels/resolve-source", { source_url: url });
      if (!res?.resolved) {
        throw new Error("Unable to validate source URL");
      }
      const resolvedMode = res.resolved.stream_source_mode;
      const streamStatus = res.resolved.stream_status || "unknown";
      const matched = resolvedMode === form.stream_source_mode;
      setUrlValidation({
        ok: matched,
        message: matched
          ? `Valid ${sourceLabel(resolvedMode)} • Status: ${streamStatus}`
          : `Resolved ${sourceLabel(resolvedMode)} but selected ${sourceLabel(form.stream_source_mode)}.`,
      });
    } catch (err) {
      setUrlValidation({ ok: false, message: err.message || "Validation failed" });
    } finally {
      setValidatingUrl(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) return setError("Channel name is required");
    if (!form.description.trim()) return setError("Description is required");
    if (!form.category.trim()) return setError("Category is required");
    if (!form.source_url.trim()) return setError("Source URL is required");
    if (!form.type.trim()) return setError("Channel type is required");
    setLoading(true);
    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("description", form.description.trim());
      body.append("category", form.category.trim());
      body.append("source_url", form.source_url.trim());
      body.append("stream_source_mode", form.stream_source_mode);
      body.append("type", form.type);
      if (logoFile) body.append("logo", logoFile);
      if (bannerFile) body.append("banner", bannerFile);

      const res = await api.upload("/admin/channels/import-with-media", body);
      onImported(res.channel);
    } catch (err) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Import Channel</h2>
            <p className="mt-1 text-sm text-white/50">Mirror Creator Studio channel setup with required category, provider, and upload-only channel images.</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors text-xl leading-none">Ã—</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Channel Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. NTA News 24"
              className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/50"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Description *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Describe your channel"
              className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/50"
              disabled={loading}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Category *</label>
            <select
              value={form.category}
              onChange={(e) => setField("category", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[var(--av-light-orange)]/50"
              disabled={loading || loadingCategories}
            >
              <option value="" className="bg-slate-900 text-white/70">
                {loadingCategories ? "Loading categories..." : "Select category"}
              </option>
              {categories.map((cat) => (
                <option key={cat.id || cat.name} value={cat.name} className="bg-slate-900 text-white">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-white/60">Source Provider *</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "external_youtube", label: "YouTube" },
                { value: "external_hls", label: "HLS" },
                { value: "external_dash", label: "DASH" },
              ].map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setField("stream_source_mode", mode.value)}
                  disabled={loading}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.stream_source_mode === mode.value
                      ? "border-[var(--av-orange)]/60 bg-[var(--av-orange)]/15 text-[var(--av-light-orange)]"
                      : "border-white/10 bg-white/6 text-white/60 hover:text-white/85"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-white/60">Channel Type *</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: "public", label: "Public" },
                { value: "private", label: "Private" },
              ].map((kind) => (
                <button
                  key={kind.value}
                  type="button"
                  onClick={() => setField("type", kind.value)}
                  disabled={loading}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    form.type === kind.value
                      ? "border-[var(--av-orange)]/60 bg-[var(--av-orange)]/15 text-[var(--av-light-orange)]"
                      : "border-white/10 bg-white/6 text-white/60 hover:text-white/85"
                  }`}
                >
                  {kind.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">
              Source URL * <span className="text-white/30">({sourceLabel(form.stream_source_mode)})</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={form.source_url}
                onChange={(e) => {
                  setField("source_url", e.target.value);
                  setUrlValidation(null);
                }}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/50 font-mono"
                disabled={loading}
              />
              <button
                type="button"
                onClick={validateSourceUrl}
                disabled={loading || validatingUrl}
                className="rounded-xl bg-[var(--av-orange)] px-3 py-2.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {validatingUrl ? "Checking..." : "Validate"}
              </button>
            </div>
            {urlValidation && (
              <p className={`mt-1 text-xs ${urlValidation.ok ? "text-emerald-300" : "text-red-300"}`}>
                {urlValidation.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Channel Logo</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange(setLogoFile)}
                className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--av-orange)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-white/35">Upload only. URL input is disabled by project policy.</p>
              {logoFile && (
                <p className="mt-1 text-[11px] text-[var(--av-light-orange)]">Selected: {logoFile.name}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Channel Background / Cover</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange(setBannerFile)}
                className="block w-full cursor-pointer rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs text-white file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--av-orange)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                disabled={loading}
              />
              <p className="mt-1 text-[11px] text-white/35">Upload only. URL input is disabled by project policy.</p>
              {bannerFile && (
                <p className="mt-1 text-[11px] text-[var(--av-light-orange)]">Selected: {bannerFile.name}</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-white/10 bg-white/6 py-2.5 text-sm font-medium text-white/70 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-[var(--av-orange)] py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {loading ? "Validating & Importing..." : "Import Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€ Update Source URL Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UpdateSourceModal({ channel, onClose, onUpdated }) {
  const [sourceUrl, setSourceUrl] = useState(channel.external_url || channel.resolved_playback_url || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!sourceUrl.trim()) return setError("Source URL is required");
    setLoading(true);
    try {
      const res = await api.patch(`/admin/channels/${channel.id}/external-source`, { source_url: sourceUrl.trim() });
      onUpdated(res.channel);
    } catch (err) {
      setError(err.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Update Source â€” {channel.name}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xl leading-none">Ã—</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">New Source URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/50 font-mono"
              disabled={loading}
            />
          </div>
          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl border border-white/10 bg-white/6 py-2.5 text-sm font-medium text-white/70 hover:text-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[var(--av-orange)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {loading ? "Updating..." : "Update Source"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function OwnerDisplayModal({ channel, onClose, onUpdated }) {
  const [mode, setMode] = useState(channel.owner_display_mode || "show_owner");
  const [brandName, setBrandName] = useState(channel.owner_brand_name || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (mode === "brand_only" && !brandName.trim()) {
      setError("Brand name is required for brand-only mode.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.patch(`/admin/channels/${channel.id}/owner-display`, {
        owner_display_mode: mode,
        owner_brand_name: mode === "brand_only" ? brandName.trim() : null,
      });
      onUpdated(res.channel);
    } catch (err) {
      setError(err.message || "Failed to update owner display settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Owner Display - {channel.name}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 text-xl leading-none">x</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-white/60">Public owner display</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none focus:border-[var(--av-light-orange)]/50"
              disabled={loading}
            >
              <option value="show_owner">Show channel owner</option>
              <option value="hide_owner">Hide owner details</option>
              <option value="brand_only">Show brand name only</option>
            </select>
          </div>

          {mode === "brand_only" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-white/60">Brand name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. BoxTV"
                className="w-full rounded-xl border border-white/10 bg-white/6 px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[var(--av-light-orange)]/50"
                disabled={loading}
              />
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-sm text-red-300">{error}</div>
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} disabled={loading} className="flex-1 rounded-xl border border-white/10 bg-white/6 py-2.5 text-sm font-medium text-white/70 hover:text-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-xl bg-[var(--av-orange)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function ChannelsPage() {
  const [channels, setChannels] = useState([]);
  const [channelCounts, setChannelCounts] = useState({ total: 0, active: 0, disabled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all"); // "all" | "imported"
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [recheckingId, setRecheckingId] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [updateSourceChannel, setUpdateSourceChannel] = useState(null);
  const [ownerDisplayChannel, setOwnerDisplayChannel] = useState(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);
  const [bulkRechecking, setBulkRechecking] = useState(false);
  const [bulkRecheckResult, setBulkRecheckResult] = useState(null);
  const [cleaningEvents, setCleaningEvents] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);

  const loadChannels = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/channels");
      setChannels(res.channels ?? []);
      setChannelCounts({ total: res.total ?? 0, active: res.active ?? 0, disabled: res.disabled ?? 0 });
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChannels();
  }, [loadChannels]);

  function updateChannel(updated) {
    setChannels((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
  }

  function toggleChannel(channel) {
    const action = channel.is_active ? "Disable" : "Enable";
    setConfirm({
      title: `${action} Channel`,
      message: `${action} "${channel.name}"? ${
        channel.is_active
          ? "This channel will be hidden from users and streams will stop."
          : "This channel will become visible and accessible to users."
      }`,
      destructive: channel.is_active,
      action: async () => {
        setActionLoading(true);
        try {
          await api.post(`/admin/channels/${channel.id}/${channel.is_active ? "disable" : "enable"}`);
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function togglePremium(channel) {
    const requiresPayment = !channel.requires_payment;
    setConfirm({
      title: requiresPayment ? "Enable Premium Access" : "Disable Premium Access",
      message: requiresPayment
        ? `Turn "${channel.name}" into a paid stream entry channel using its current default fees?`
        : `Remove paid entry requirements from "${channel.name}"?`,
      destructive: false,
      action: async () => {
        setActionLoading(true);
        try {
          await api.patch(`/admin/channels/${channel.id}/premium`, {
            requires_payment: requiresPayment,
            entry_fee_type: channel.entry_fee_type || "ngn",
            entry_fee_ngn: channel.entry_fee_ngn || 500,
            entry_fee_vpt_units: channel.entry_fee_vpt_units || 100,
            access_duration_minutes: channel.access_duration_minutes || 120,
          });
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  async function handleBulkRecheck() {
    setBulkRechecking(true);
    setBulkRecheckResult(null);
    try {
      const res = await api.post("/admin/channels/bulk-recheck-sources");
      setBulkRecheckResult({
        ok: true,
        message: `Rechecked ${res.checked} channel${res.checked !== 1 ? 's' : ''}${
          res.failed > 0 ? `, ${res.failed} failed` : ''
        }.`,
      });
      if (res.checked > 0) await loadChannels();
    } catch (err) {
      setBulkRecheckResult({ ok: false, message: err.message || "Bulk recheck failed" });
    } finally {
      setBulkRechecking(false);
      setTimeout(() => setBulkRecheckResult(null), 6000);
    }
  }

  async function handleBackfill() {
    setBackfillResult(null);
    try {
      const res = await api.post("/admin/channels/backfill-defaults");
      setBackfillResult({ ok: true, message: `Backfill complete - ${res.updated} channel${res.updated !== 1 ? 's' : ''} updated, ${res.skipped} already up to date.` });
      if (res.updated > 0) await loadChannels();
    } catch (err) {
      setBackfillResult({ ok: false, message: err.message || "Backfill failed" });
    } finally {
      setBackfilling(false);
      setTimeout(() => setBackfillResult(null), 6000);
    }
  }

  async function handleCleanupEvents() {
    setCleanupResult(null);
    setCleaningEvents(true);
    try {
      const res = await api.post("/admin/channels/cleanup-orphaned-events");
      setCleanupResult({
        ok: true,
        message: `Cleanup complete — scanned ${res.scanned} event${res.scanned !== 1 ? "s" : ""}, deleted ${res.deleted} orphaned, ${res.remaining} valid remaining.`,
      });
    } catch (err) {
      setCleanupResult({ ok: false, message: err.message || "Cleanup failed" });
    } finally {
      setCleaningEvents(false);
      setTimeout(() => setCleanupResult(null), 8000);
    }
  }

  async function recheckSource(channel) {
    setRecheckingId(channel.id);
    try {
      const res = await api.post(`/admin/channels/${channel.id}/recheck-source`);
      updateChannel(res.channel);
    } catch {
      // handled by api
    } finally {
      setRecheckingId(null);
    }
  }

  function hardDeleteChannel(channel) {
    setConfirm({
      title: "Permanently Delete Channel",
      message: `Permanently delete "${channel.name}"? This will remove the channel and all associated stats/events from the database. This action CANNOT be undone.`,
      destructive: true,
      confirmLabel: "Delete Permanently",
      action: async () => {
        setActionLoading(true);
        try {
          await api.delete(`/admin/channels/${channel.id}`, { confirm: "DELETE" });
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function banChannel(channel) {
    setConfirm({
      title: "Ban Channel",
      message: `Ban "${channel.name}"? The channel will be hidden and the creator will be restricted from this channel.`,
      destructive: true,
      confirmLabel: "Ban Channel",
      action: async () => {
        setActionLoading(true);
        try {
          await api.post(`/admin/channels/${channel.id}/ban`, {});
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  function unbanChannel(channel) {
    setConfirm({
      title: "Unban Channel",
      message: `Unban "${channel.name}"? The channel will become accessible again.`,
      destructive: false,
      confirmLabel: "Unban Channel",
      action: async () => {
        setActionLoading(true);
        try {
          await api.post(`/admin/channels/${channel.id}/unban`, {});
          await loadChannels();
        } catch {
          // handled by api
        } finally {
          setActionLoading(false);
        }
      },
    });
  }

  const isImported = (c) => c.stream_source_mode && c.stream_source_mode !== "native";

  /** Returns true when last_checked_at is older than 24 hours (or never set). */
  function isStale(channel) {
    if (!channel.last_checked_at) return false;
    const diff = Date.now() - new Date(channel.last_checked_at).getTime();
    return diff > 24 * 60 * 60 * 1000;
  }

  /** Format an ISO timestamp as a relative human-readable string. */
  function timeAgo(isoString) {
    if (!isoString) return null;
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  const tabFiltered = tab === "imported" ? channels.filter(isImported) : channels;

  const filtered = tabFiltered.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.owner_id && c.owner_id.toLowerCase().includes(q)) ||
      (c.owner_display_name && c.owner_display_name.toLowerCase().includes(q)) ||
      (c.owner_email && c.owner_email.toLowerCase().includes(q)) ||
      (c.external_url && c.external_url.toLowerCase().includes(q))
    );
  });

  const importedCount = channels.filter(isImported).length;

  const columns = [
    { key: "name", label: "Name" },
    {
      key: "owner_display_name",
      label: "Owner",
      render: (row) => (
        <div className="space-y-0.5">
          <p className="font-medium text-white">
            {row.owner_id === "system_import"
              ? <span className="text-white/40 italic text-xs">Admin import</span>
              : row.owner_display_name || row.owner_id || "Unknown owner"}
          </p>
          <div className="pt-1">
            <OwnerDisplayBadge mode={row.owner_display_mode} brandName={row.owner_brand_name} />
          </div>
          {row.owner_id !== "system_import" && (
            <p className="text-xs text-white/42">{row.owner_email || row.owner_id || "No owner email"}</p>
          )}
        </div>
      ),
    },
    {
      key: "stream_source_mode",
      label: "Source",
      render: (row) => (
        <div className="space-y-1">
          <SourceModeBadge mode={row.stream_source_mode} />
          {row.stream_status && row.stream_status !== "unknown" && (
            <StreamStatusBadge status={row.stream_status} />
          )}
          {isImported(row) && isStale(row) && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300">
              Stale
            </span>
          )}
          {isImported(row) && row.last_checked_at && (
            <p className="text-[10px] text-white/35 mt-0.5">{timeAgo(row.last_checked_at)}</p>
          )}
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            row.type === "private"
              ? "border border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
              : "border border-sky-400/30 bg-sky-500/10 text-sky-200"
          }`}
        >
          {row.type === "private" ? "Private" : "Public"}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        if (row.is_banned) return <StatusBadge status="banned" />;
        return <StatusBadge status={row.is_active ? "active" : "disabled"} />;
      },
    },
    {
      key: "premium",
      label: "Premium",
      render: (row) => <StatusBadge status={row.requires_payment ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleChannel(row)}
            disabled={actionLoading}
            className={`inline-flex items-center gap-1.5 text-sm font-medium disabled:opacity-50 ${
              row.is_active
                ? "text-amber-300 hover:text-amber-200"
                : "text-emerald-300 hover:text-emerald-200"
            }`}
          >
            {actionLoading && <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />}
            {row.is_active ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => togglePremium(row)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-300 hover:text-sky-200 disabled:opacity-50"
          >
            {row.requires_payment ? "Unpremium" : "Premium"}
          </button>
          <button
            onClick={() => setOwnerDisplayChannel(row)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-300 hover:text-amber-200"
          >
            Owner Display
          </button>
          {row.type === "exclusive" && (
            <button
              onClick={() => router.push(`/channels/${row.id}/subscribers`)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200"
            >
              Manage Subscribers
            </button>
          )}
          {isImported(row) && (
            <>
              <button
                onClick={() => recheckSource(row)}
                disabled={recheckingId === row.id}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-300 hover:text-violet-200 disabled:opacity-50"
              >
                {recheckingId === row.id
                  ? <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                  : null}
                Recheck
              </button>
              <button
                onClick={() => setUpdateSourceChannel(row)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white/80"
              >
                Edit Source
              </button>
            </>
          )}
          <Link
            href={`/channels/${row.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-300 hover:text-indigo-200"
          >
            Audit
          </Link>
          {row.is_banned ? (
            <button
              onClick={() => unbanChannel(row)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-300 hover:text-emerald-200 disabled:opacity-50"
            >
              Unban
            </button>
          ) : (
            <button
              onClick={() => banChannel(row)}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-red-300 hover:text-red-200 disabled:opacity-50"
            >
              Ban
            </button>
          )}
          <button
            onClick={() => hardDeleteChannel(row)}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-400/70 hover:text-red-300 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Channels</h1>
          <p className="mt-2 text-sm text-white/58">Manage creator channels and imported free-to-air streams.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {channelCounts.total} total · {channelCounts.active} active · {channelCounts.disabled} disabled
          </span>
          <button
            onClick={handleBackfill}
            disabled={backfilling}
            title="Apply default external-source fields to legacy channel documents"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {backfilling
              ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" /></svg>
            }
            {backfilling ? "Backfilling..." : "Backfill Defaults"}
          </button>
          <button
            onClick={handleCleanupEvents}
            disabled={cleaningEvents}
            title="Remove channel events (reactions/gifts) sent to user UIDs instead of channel IDs"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {cleaningEvents
              ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298A.75.75 0 0 0 3 5.24v.07c0 .67.092 1.318.265 1.935L3.072 7.5H16.928l.007-.255c.173-.617.265-1.265.265-1.935v-.07a.75.75 0 0 0-.635-.749A41.76 41.76 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM5.5 9a.75.75 0 0 0-1.5 0v6.25A2.75 2.75 0 0 0 6.75 18h6.5A2.75 2.75 0 0 0 16 15.25V9a.75.75 0 0 0-1.5 0v6.25c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25V9Z" clipRule="evenodd" /></svg>
            }
            {cleaningEvents ? "Cleaning..." : "Cleanup Events"}
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--av-orange)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Import Channel
          </button>
        </div>
      </div>

      {/* Filter tabs + Recheck All */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/4 p-1">
          {[
            { key: "all", label: "All Channels" },
            { key: "imported", label: `Imported (${importedCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-[var(--av-orange)] text-white shadow"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {importedCount > 0 && (
          <button
            onClick={handleBulkRecheck}
            disabled={bulkRechecking}
            title="Re-probe all imported channel sources and refresh their health status"
            className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300 hover:text-violet-200 hover:bg-violet-500/15 transition-all disabled:opacity-50"
          >
            {bulkRechecking
              ? <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
              : <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z" clipRule="evenodd" /></svg>
            }
            {bulkRechecking ? `Rechecking ${importedCount}...` : "Recheck All"}
          </button>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <input
          type="text"
          placeholder="Search by name, owner, or source URL..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
      </div>

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadChannels} className="ml-3 underline">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {backfillResult && (
        <div className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
          backfillResult.ok
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border-red-400/30 bg-red-500/10 text-red-200"
        }`}>
          {backfillResult.message}
        </div>
      )}

      {bulkRecheckResult && (
        <div className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
          bulkRecheckResult.ok
            ? "border-violet-400/30 bg-violet-500/10 text-violet-200"
            : "border-red-400/30 bg-red-500/10 text-red-200"
        }`}>
          {bulkRecheckResult.message}
        </div>
      )}

      {cleanupResult && (
        <div className={`rounded-[1.5rem] border px-4 py-3 text-sm ${
          cleanupResult.ok
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border-red-400/30 bg-red-500/10 text-red-200"
        }`}>
          {cleanupResult.message}
        </div>
      )}

      {!loading && !error && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No channels found" />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        confirmLabel={confirm?.confirmLabel || "Confirm"}
        busy={actionLoading}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (confirm?.action) await confirm.action();
          setConfirm(null);
        }}
      />

      {showImportModal && (
        <ImportChannelModal
          onClose={() => setShowImportModal(false)}
          onImported={(channel) => {
            setChannels((prev) => [channel, ...prev]);
            setShowImportModal(false);
            setTab("imported");
          }}
        />
      )}

      {updateSourceChannel && (
        <UpdateSourceModal
          channel={updateSourceChannel}
          onClose={() => setUpdateSourceChannel(null)}
          onUpdated={(updated) => {
            updateChannel(updated);
            setUpdateSourceChannel(null);
          }}
        />
      )}

      {ownerDisplayChannel && (
        <OwnerDisplayModal
          channel={ownerDisplayChannel}
          onClose={() => setOwnerDisplayChannel(null)}
          onUpdated={(updated) => {
            updateChannel(updated);
            setOwnerDisplayChannel(null);
          }}
        />
      )}

    </div>
  );
}

function fmtNum(val) {
  if (val === null || val === undefined || val === "") return "0";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return num.toLocaleString("en-NG", { maximumFractionDigits: 2 });
}
