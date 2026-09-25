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

// Per-action limits; keep in sync with the backend (admin.controller.js).
const MAX_VIEWS_PER_ACTION = 1000000;
const MAX_FOLLOWERS_PER_ACTION = 100000;

// Amounts at or above this need a second click, to catch typos (e.g. an extra
// zero) without adding a modal to every routine adjustment.
const CONFIRM_THRESHOLD = 10000;
const CONFIRM_WINDOW_MS = 5000;

function formatCount(n) {
  return Number(n || 0).toLocaleString("en-NG");
}

function AmountAction({ label, busy, max, onInject, onRemove }) {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(null); // "inject" | "remove" awaiting second click

  const trimmed = amount.trim();
  const isWhole = /^\d+$/.test(trimmed);
  const parsed = isWhole ? Number(trimmed) : NaN;
  const valid = isWhole && parsed > 0 && parsed <= max;
  const hint = !trimmed
    ? null
    : !isWhole
      ? "Whole numbers only."
      : parsed <= 0
        ? "Amount must be at least 1."
        : parsed > max
          ? `Max ${formatCount(max)} per action.`
          : null;

  useEffect(() => {
    if (!pending) return undefined;
    const timer = setTimeout(() => setPending(null), CONFIRM_WINDOW_MS);
    return () => clearTimeout(timer);
  }, [pending]);

  function onAmountChange(value) {
    setAmount(value);
    setPending(null);
  }

  function trigger(kind) {
    if (!valid || busy) return;
    if (parsed >= CONFIRM_THRESHOLD && pending !== kind) {
      setPending(kind);
      return;
    }
    setPending(null);
    const handler = kind === "inject" ? onInject : onRemove;
    handler(parsed).then((ok) => {
      if (ok) setAmount("");
    });
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="mb-3 text-sm font-semibold text-white/80">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="Amount"
          aria-invalid={Boolean(hint)}
          className="w-32 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-[var(--av-light-orange)]/50 focus:outline-none"
        />
        <button
          disabled={!valid || busy}
          onClick={() => trigger("inject")}
          className="rounded-xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-3.5 py-2 text-sm font-medium text-[var(--av-dark-blue)] disabled:opacity-40"
        >
          {pending === "inject" ? `Confirm +${formatCount(parsed)}` : "Inject"}
        </button>
        <button
          disabled={!valid || busy}
          onClick={() => trigger("remove")}
          className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2 text-sm font-medium text-red-300 disabled:opacity-40"
        >
          {pending === "remove" ? `Confirm −${formatCount(parsed)}` : "Remove"}
        </button>
      </div>
      {hint ? <p className="mt-2 text-xs text-amber-200/80">{hint}</p> : null}
      {pending ? <p className="mt-2 text-xs text-white/45">Large amount. Click again within 5s to confirm.</p> : null}
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

  // Latest counts per channel, taken from each action's response. Avoids
  // re-reading the whole channel collection after every adjustment.
  const [counts, setCounts] = useState({});

  const run = useCallback(async (channelId, action, successMessage) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await action();
      setMessage(successMessage(res));
      setCounts((prev) => ({
        ...prev,
        [channelId]: {
          ...prev[channelId],
          ...(res.total_views != null ? { views: res.total_views } : {}),
          ...(res.followers_count != null ? { followers: res.followers_count } : {}),
        },
      }));
      return true;
    } catch (err) {
      setError(err.message || "Action failed");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const selectedCounts = selected ? counts[selected.id] : null;

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
              {selectedCounts ? (
                <p className="mt-2 text-xs text-white/35">
                  {[
                    selectedCounts.views != null ? `Views: ${formatCount(selectedCounts.views)}` : null,
                    selectedCounts.followers != null ? `Followers: ${formatCount(selectedCounts.followers)}` : null,
                  ].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>

            {message && <p className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-200">{message}</p>}
            {error && <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-200">{error}</p>}

            <AmountAction
              label="Channel Views"
              busy={busy}
              max={MAX_VIEWS_PER_ACTION}
              onInject={(amount) => run(selected.id, () => injectChannelViews(selected.id, amount), (res) => `Injected ${formatCount(amount)} — total views now ${formatCount(res.total_views)}`)}
              onRemove={(amount) => run(selected.id, () => removeChannelViews(selected.id, amount), (res) => `Removed ${formatCount(amount)} — total views now ${formatCount(res.total_views)}`)}
            />

            <AmountAction
              label="Channel Followers"
              busy={busy}
              max={MAX_FOLLOWERS_PER_ACTION}
              onInject={(amount) => run(selected.id, () => injectChannelFollowers(selected.id, amount), (res) => `Injected ${formatCount(amount)} — followers now ${formatCount(res.followers_count)}`)}
              onRemove={(amount) => run(selected.id, () => removeChannelFollowers(selected.id, amount), (res) => `${res.message} — followers now ${formatCount(res.followers_count)}`)}
            />
            <p className="text-xs text-white/35">
              Follower removal only deletes admin-injected followers — real subscribers are never touched.
              Each injected follower is a stored record, so large follower injections add database writes.
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

  const run = useCallback(async (waveId, action, successMessage) => {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const res = await action();
      setMessage(successMessage(res));
      const patch = (w) => ({
        ...w,
        views_count: res.views_count ?? w.views_count,
        repeat_play_count: res.repeat_play_count ?? w.repeat_play_count,
      });
      setSelected((prev) => (prev ? patch(prev) : prev));
      setWaves((prev) => prev.map((w) => (w.id === waveId ? patch(w) : w)));
      return true;
    } catch (err) {
      setError(err.message || "Action failed");
      return false;
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
              max={MAX_VIEWS_PER_ACTION}
              onInject={(amount) => run(selected.id, () => injectWaveViews(selected.id, amount), (res) => `Injected ${formatCount(amount)} — views now ${formatCount(res.views_count)}`)}
              onRemove={(amount) => run(selected.id, () => removeWaveViews(selected.id, amount), (res) => `Removed ${formatCount(amount)} — views now ${formatCount(res.views_count)}`)}
            />

            <AmountAction
              label="Wave Replays"
              busy={busy}
              max={MAX_VIEWS_PER_ACTION}
              onInject={(amount) => run(selected.id, () => injectWaveReplays(selected.id, amount), (res) => `Injected ${formatCount(amount)} — replays now ${formatCount(res.repeat_play_count)}`)}
              onRemove={(amount) => run(selected.id, () => removeWaveReplays(selected.id, amount), (res) => `Removed ${formatCount(amount)} — replays now ${formatCount(res.repeat_play_count)}`)}
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
