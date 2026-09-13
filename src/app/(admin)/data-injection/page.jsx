"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  searchChannels,
  injectChannelViews,
  removeChannelViews,
  injectChannelFollowers,
  removeChannelFollowers,
  searchWaves,
  injectWaveViews,
  removeWaveViews,
  injectWaveReplays,
  removeWaveReplays,
} from "@/services/dataInjection";

function AmountAction({ label, busy, onInject, onRemove }) {
  const [amount, setAmount] = useState("");

  const parsed = Number(amount);
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="mb-3 text-sm font-semibold text-white/80">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Amount"
          className="w-32 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50 focus:outline-none"
        />
        <button
          disabled={!valid || busy}
          onClick={() => onInject(parsed).then(() => setAmount(""))}
          className="rounded-xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-3.5 py-2 text-sm font-medium text-[var(--av-dark-blue)] disabled:opacity-40"
        >
          Inject
        </button>
        <button
          disabled={!valid || busy}
          onClick={() => onRemove(parsed).then(() => setAmount(""))}
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2 text-sm font-medium text-red-300 disabled:opacity-40"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function ChannelsTab() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await searchChannels();
        setChannels(res.channels || []);
      } catch (err) {
        setError(err.message || "Failed to load channels");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channels.slice(0, 20);
    return channels
      .filter((c) => (c.name || "").toLowerCase().includes(q) || (c.owner_email || "").toLowerCase().includes(q))
      .slice(0, 20);
  }, [channels, search]);

  const run = useCallback(async (action, successMessage) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await action();
      setMessage(successMessage(res));
      // Refresh followers/views snapshot for the selected channel
      const res2 = await searchChannels();
      setChannels(res2.channels || []);
      const refreshed = (res2.channels || []).find((c) => c.id === selected?.id);
      if (refreshed) setSelected(refreshed);
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }, [selected]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] p-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channel by name or owner email..."
          className="mb-3 w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50 focus:outline-none"
        />
        {loading ? (
          <p className="p-3 text-sm text-white/40">Loading channels...</p>
        ) : (
          <div className="max-h-[520px] space-y-1 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelected(c); setMessage(null); setError(null); }}
                className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  selected?.id === c.id ? "bg-[var(--av-orange)]/15 text-white" : "text-white/70 hover:bg-white/6"
                }`}
              >
                <p className="truncate font-medium">{c.name || "Untitled channel"}</p>
                <p className="truncate text-xs text-white/40">{c.owner_email || c.owner_id}</p>
              </button>
            ))}
            {filtered.length === 0 && <p className="p-3 text-sm text-white/40">No channels match.</p>}
          </div>
        )}
      </div>

      <div>
        {!selected ? (
          <div className="flex h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-white/12 text-white/40">
            Select a channel to manage its views &amp; followers
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] p-5">
              <h3 className="text-lg font-semibold text-white">{selected.name || "Untitled channel"}</h3>
              <p className="text-sm text-white/48">{selected.owner_email || selected.owner_id}</p>
            </div>

            {message && <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{message}</p>}
            {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}

            <AmountAction
              label="Channel Views"
              busy={busy}
              onInject={(amount) => run(() => injectChannelViews(selected.id, amount), (res) => `Injected — total views now ${res.total_views.toLocaleString("en-NG")}`)}
              onRemove={(amount) => run(() => removeChannelViews(selected.id, amount), (res) => `Removed — total views now ${res.total_views.toLocaleString("en-NG")}`)}
            />

            <AmountAction
              label="Channel Followers"
              busy={busy}
              onInject={(amount) => run(() => injectChannelFollowers(selected.id, amount), (res) => `Injected — followers now ${res.followers_count.toLocaleString("en-NG")}`)}
              onRemove={(amount) => run(() => removeChannelFollowers(selected.id, amount), (res) => `${res.message} — followers now ${res.followers_count.toLocaleString("en-NG")}`)}
            />
            <p className="text-xs text-white/35">
              Follower removal only deletes admin-injected followers — real subscribers are never touched.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function WavesTab() {
  const [query, setQuery] = useState("");
  const [waves, setWaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await searchWaves({ limit: 20 });
      setWaves(res.waves || []);
    } catch (err) {
      setError(err.message || "Failed to load waves");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecent();
  }, [loadRecent]);

  const doSearch = useCallback(async () => {
    const q = query.trim();
    if (!q) return loadRecent();
    setLoading(true);
    setError(null);
    try {
      // Try as an exact wave id first; fall back to treating it as a channel id.
      const byId = await searchWaves({ waveId: q });
      if (byId.waves?.length) {
        setWaves(byId.waves);
      } else {
        const byChannel = await searchWaves({ channelId: q, limit: 20 });
        setWaves(byChannel.waves || []);
      }
    } catch (err) {
      setError(err.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }, [query, loadRecent]);

  const run = useCallback(async (action, successMessage) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await action();
      setMessage(successMessage(res));
      setSelected((prev) => (prev ? { ...prev, views_count: res.views_count ?? prev.views_count, repeat_play_count: res.repeat_play_count ?? prev.repeat_play_count } : prev));
    } catch (err) {
      setError(err.message || "Action failed");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
      <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] p-4">
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()}
            placeholder="Wave ID or channel ID..."
            className="w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50 focus:outline-none"
          />
          <button
            onClick={doSearch}
            className="shrink-0 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white/78 hover:bg-white/10"
          >
            Search
          </button>
        </div>
        {loading ? (
          <p className="p-3 text-sm text-white/40">Loading waves...</p>
        ) : (
          <div className="max-h-[500px] space-y-1 overflow-y-auto">
            {waves.map((w) => (
              <button
                key={w.id}
                onClick={() => { setSelected(w); setMessage(null); setError(null); }}
                className={`block w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  selected?.id === w.id ? "bg-[var(--av-orange)]/15 text-white" : "text-white/70 hover:bg-white/6"
                }`}
              >
                <p className="truncate font-medium">{w.title || w.id}</p>
                <p className="truncate text-xs text-white/40">{w.channel_name || w.channel_id}</p>
              </button>
            ))}
            {waves.length === 0 && <p className="p-3 text-sm text-white/40">No waves found.</p>}
          </div>
        )}
      </div>

      <div>
        {!selected ? (
          <div className="flex h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-white/12 text-white/40">
            Select a wave to manage its views &amp; replays
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] p-5">
              <h3 className="text-lg font-semibold text-white">{selected.title || "Untitled wave"}</h3>
              <p className="text-sm text-white/48">{selected.channel_name || selected.channel_id}</p>
              <p className="mt-2 text-xs text-white/35">
                Views: {(selected.views_count || 0).toLocaleString("en-NG")} · Replays: {(selected.repeat_play_count || 0).toLocaleString("en-NG")}
              </p>
            </div>

            {message && <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{message}</p>}
            {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}

            <AmountAction
              label="Wave Views"
              busy={busy}
              onInject={(amount) => run(() => injectWaveViews(selected.id, amount), (res) => `Injected — views now ${res.views_count.toLocaleString("en-NG")}`)}
              onRemove={(amount) => run(() => removeWaveViews(selected.id, amount), (res) => `Removed — views now ${res.views_count.toLocaleString("en-NG")}`)}
            />

            <AmountAction
              label="Wave Replays"
              busy={busy}
              onInject={(amount) => run(() => injectWaveReplays(selected.id, amount), (res) => `Injected — replays now ${res.repeat_play_count.toLocaleString("en-NG")}`)}
              onRemove={(amount) => run(() => removeWaveReplays(selected.id, amount), (res) => `Removed — replays now ${res.repeat_play_count.toLocaleString("en-NG")}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DataInjectionPage() {
  const [tab, setTab] = useState("channels");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Data Injection</h1>
        <p className="mt-1 text-sm text-white/48">Manually adjust views, followers, and wave replays.</p>
      </div>

      <div className="inline-flex rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        {[
          { key: "channels", label: "Channels" },
          { key: "waves", label: "Waves" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "bg-[var(--av-orange)]/20 text-white" : "text-white/55 hover:text-white/80"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "channels" ? <ChannelsTab /> : <WavesTab />}
    </div>
  );
}
