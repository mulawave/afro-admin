"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const STATUS_OPTIONS = ["all", "draft", "published", "archived"];

export default function LibraryModerationPage() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const [channels, setChannels] = useState([]);
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [series, setSeries] = useState([]);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");

  const selectedChannel = useMemo(
    () => channels.find((channel) => channel.id === selectedChannelId) || null,
    [channels, selectedChannelId],
  );

  const visibleItems = useMemo(() => {
    if (status === "all") return items;
    return items.filter((item) => item.status === status);
  }, [items, status]);

  const loadChannels = useCallback(async () => {
    const res = await api.get("/channels");
    const source = Array.isArray(res?.channels) ? res.channels : [];
    const exclusiveChannels = source.filter((channel) => channel.type === "exclusive");

    setChannels(exclusiveChannels);
    if (exclusiveChannels.length > 0) {
      setSelectedChannelId((current) => current || exclusiveChannels[0].id);
    }
  }, []);

  const loadLibrary = useCallback(async (channelId) => {
    const [seriesRes, itemsRes] = await Promise.all([
      api.get(`/creator/channels/${channelId}/library/series`),
      api.get(`/creator/channels/${channelId}/library/items`),
    ]);

    setSeries(Array.isArray(seriesRes?.data) ? seriesRes.data : []);
    setItems(Array.isArray(itemsRes?.data) ? itemsRes.data : []);
  }, []);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await loadChannels();
    } catch (loadError) {
      setError(loadError.message || "Failed to load channels");
    } finally {
      setLoading(false);
    }
  }, [loadChannels]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!selectedChannelId) {
      setSeries([]);
      setItems([]);
      return;
    }

    const fetchLibrary = async () => {
      try {
        setError(null);
        await loadLibrary(selectedChannelId);
      } catch (loadError) {
        setError(loadError.message || "Failed to load library content");
      }
    };

    void fetchLibrary();
  }, [selectedChannelId, loadLibrary]);

  const refresh = useCallback(async () => {
    if (!selectedChannelId) return;
    await loadLibrary(selectedChannelId);
  }, [loadLibrary, selectedChannelId]);

  const moderate = async (itemId, action) => {
    if (!selectedChannelId) return;

    try {
      setWorking(true);
      setError(null);

      if (action === "publish") {
        await api.post(`/creator/channels/${selectedChannelId}/library/items/${itemId}/publish`, {});
      } else if (action === "archive") {
        await api.post(`/creator/channels/${selectedChannelId}/library/items/${itemId}/archive`, {});
      } else if (action === "delete") {
        const confirmed = window.confirm("Delete this item permanently?");
        if (!confirmed) {
          setWorking(false);
          return;
        }
        await api.delete(`/creator/channels/${selectedChannelId}/library/items/${itemId}`);
      }

      setNotice(
        action === "publish"
          ? "Item published successfully"
          : action === "archive"
            ? "Item archived successfully"
            : "Item deleted successfully",
      );
      await refresh();
    } catch (actionError) {
      setError(actionError.message || `Failed to ${action} item`);
    } finally {
      setWorking(false);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white">Library Moderation</h1>
          <p className="mt-2 text-sm text-white/60">
            Review, publish, archive, and remove exclusive library content with full audit coverage.
          </p>
        </div>
        <Link href="/audit" className="inline-flex rounded-2xl border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/80 hover:border-white/20 hover:text-white">
          Open Audit Logs
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : channels.length === 0 ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-5 py-8 text-sm text-white/70">
          No exclusive channels found.
        </div>
      ) : (
        <>
          <div className="rounded-[1.5rem] border border-white/10 bg-[var(--admin-surface)] p-5">
            <label className="text-xs uppercase tracking-[0.2em] text-white/60">Moderation channel</label>
            <select
              value={selectedChannelId}
              onChange={(event) => setSelectedChannelId(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-3 text-sm text-white outline-none"
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>{channel.name}</option>
              ))}
            </select>
            {selectedChannel ? (
              <p className="mt-2 text-xs text-white/55">
                Active: {selectedChannel.name} • {series.length} series • {items.length} items
              </p>
            ) : null}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[var(--admin-surface)] p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-white">Content Queue</h2>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option === "all" ? "All statuses" : option}</option>
                ))}
              </select>
            </div>

            {visibleItems.length === 0 ? (
              <p className="text-sm text-white/60">No items in this moderation filter.</p>
            ) : (
              <div className="space-y-3">
                {visibleItems.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="font-semibold text-white">{item.title}</p>
                        <p className="mt-1 text-xs text-white/60">
                          {item.author} • {item.contentType} • {item.totalPages} pages • {item.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {item.status !== "published" ? (
                          <button
                            type="button"
                            onClick={() => moderate(item.id, "publish")}
                            disabled={working}
                            className="rounded-full border border-emerald-400/40 bg-emerald-500/12 px-3 py-1.5 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                          >
                            Publish
                          </button>
                        ) : null}
                        {item.status !== "archived" ? (
                          <button
                            type="button"
                            onClick={() => moderate(item.id, "archive")}
                            disabled={working}
                            className="rounded-full border border-amber-400/40 bg-amber-500/12 px-3 py-1.5 text-xs font-semibold text-amber-200 disabled:opacity-50"
                          >
                            Archive
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => moderate(item.id, "delete")}
                          disabled={working}
                          className="rounded-full border border-rose-400/40 bg-rose-500/12 px-3 py-1.5 text-xs font-semibold text-rose-200 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
