"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const PHASES = ["pre-register", "registration-and-audition", "kickoff", "running", "incubation"];
const PHASE_COLORS = {
  "pre-register": "bg-sky-500/15 text-sky-300 border-sky-500/30",
  "registration-and-audition": "bg-blue-500/15 text-blue-300 border-blue-500/30",
  kickoff: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  running: "bg-green-500/15 text-green-300 border-green-500/30",
  incubation: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

export default function ChallengePage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    season: 1,
    max_contestants: 15,
    video_min_seconds: 30,
    video_max_seconds: 60,
    rules: "",
    phase: "registration-and-audition",
    status: "active",
    audition_price_ngn: 2500,
    user_reward_vpt_ngn: 1000,
    community_pool_vpt_ngn: 500,
    ops_pool_ngn: 1000,
  });
  const [saving, setSaving] = useState(false);

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/challenge/admin/list");
      setChallenges(res.items ?? res.challenges ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChallenges();
  }, [loadChallenges]);

  function openCreate() {
    setEditId(null);
    setForm({
      title: "",
      subtitle: "",
      season: 1,
      max_contestants: 15,
      video_min_seconds: 30,
      video_max_seconds: 60,
      rules: "",
      phase: "registration-and-audition",
      status: "active",
      audition_price_ngn: 2500,
      user_reward_vpt_ngn: 1000,
      community_pool_vpt_ngn: 500,
      ops_pool_ngn: 1000,
    });
    setShowForm(true);
  }

  function openEdit(ch) {
    setEditId(ch.id);
    setForm({
      title: ch.title || "",
      subtitle: ch.subtitle || "",
      season: ch.season || 1,
      max_contestants: ch.max_contestants || 15,
      video_min_seconds: ch.video_min_seconds || 30,
      video_max_seconds: ch.video_max_seconds || 60,
      rules: (ch.rules || []).join("\n"),
      phase: ch.phase || "registration-and-audition",
      status: ch.status || "active",
      audition_price_ngn: ch.audition_price_ngn || 2500,
      user_reward_vpt_ngn: ch.user_reward_vpt_ngn || 1000,
      community_pool_vpt_ngn: ch.community_pool_vpt_ngn || 500,
      ops_pool_ngn: ch.ops_pool_ngn || 1000,
    });
    setShowForm(true);
  }

  async function saveChallenge(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        ...form,
        season: Number(form.season),
        max_contestants: Number(form.max_contestants),
        video_min_seconds: Number(form.video_min_seconds),
        video_max_seconds: Number(form.video_max_seconds),
        audition_price_ngn: Number(form.audition_price_ngn),
        user_reward_vpt_ngn: Number(form.user_reward_vpt_ngn),
        community_pool_vpt_ngn: Number(form.community_pool_vpt_ngn),
        ops_pool_ngn: Number(form.ops_pool_ngn),
        rules: form.rules ? form.rules.split("\n").filter(Boolean) : [],
      };

      if (editId) {
        await api.patch(`/challenge/admin/${editId}`, body);
        setFeedback({ tone: "success", message: "Challenge updated" });
      } else {
        await api.post("/challenge/admin/create", body);
        setFeedback({ tone: "success", message: "Challenge created" });
      }

      setShowForm(false);
      await loadChallenges();
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(ch) {
    setConfirm({
      title: "Delete Challenge",
      message: `Permanently delete "${ch.title}"? This cannot be undone.`,
      destructive: true,
      confirmLabel: "Delete Challenge",
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.delete(`/challenge/admin/${ch.id}`);
          setFeedback({ tone: "success", message: "Challenge deleted" });
          await loadChallenges();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  function requestAdvancePhase(ch) {
    const currentIdx = PHASES.indexOf(ch.phase);
    const next = PHASES[currentIdx + 1];
    if (!next) return;

    setConfirm({
      title: "Advance Phase",
      message: `Move "${ch.title}" from "${ch.phase}" to "${next}"? This action broadcasts to all participants.`,
      confirmLabel: `Advance to ${next}`,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.patch(`/challenge/admin/${ch.id}/phase`);
          setFeedback({ tone: "success", message: `Phase advanced to ${next}` });
          await loadChallenges();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  const challengeColumns = [
    {
      key: "title",
      label: "Challenge",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.title || "Untitled"}</div>
          <div className="text-xs text-white/45">Season {row.season}</div>
        </div>
      ),
    },
    {
      key: "phase",
      label: "Phase",
      render: (row) => (
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            PHASE_COLORS[row.phase] || "bg-white/8 text-white/50 border-white/10"
          }`}
        >
          {row.phase}
        </span>
      ),
    },
    { key: "max_contestants", label: "Max Contestants" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEdit(row)}
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            Edit
          </button>
          {row.phase !== "incubation" && row.status !== "completed" && (
            <button
              onClick={() => requestAdvancePhase(row)}
              className="text-sm font-medium text-amber-300 hover:text-amber-200"
            >
              Advance
            </button>
          )}
          <button
            onClick={() => requestDelete(row)}
            className="text-sm font-medium text-red-300 hover:text-red-200"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const filteredChallenges = challenges.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.title || "").toLowerCase().includes(q) || (c.phase || "").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Challenge</h1>
          <p className="mt-2 text-sm text-white/58">Manage competition seasons, phases, and challenge configuration.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="rounded-2xl border border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/15 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25"
          >
            + New Challenge
          </button>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {filteredChallenges.length} challenges
          </span>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search challenges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
        </div>
      </div>

      {feedback && !loading && (
        <div
          className={`rounded-[1.5rem] px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
              : "border border-red-400/30 bg-red-500/10 text-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadChallenges} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {showForm && (
        <div className="rounded-[1.75rem] border border-[var(--av-light-orange)]/30 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-4 text-lg font-semibold text-white">{editId ? "Edit Challenge" : "Create Challenge"}</h2>
          <form onSubmit={saveChallenge} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Subtitle</label>
              <input
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Season</label>
              <input
                type="number"
                min="1"
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Max Contestants</label>
              <input
                type="number"
                min="1"
                value={form.max_contestants}
                onChange={(e) => setForm({ ...form, max_contestants: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-white/50">Min Video (sec)</label>
                <input
                  type="number"
                  min="1"
                  value={form.video_min_seconds}
                  onChange={(e) => setForm({ ...form, video_min_seconds: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-white/50">Max Video (sec)</label>
                <input
                  type="number"
                  min="1"
                  value={form.video_max_seconds}
                  onChange={(e) => setForm({ ...form, video_max_seconds: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Rules (one per line)</label>
              <textarea
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none resize-none"
              />
            </div>

            <div className="sm:col-span-2 border-t border-white/10 pt-4 mt-2">
              <h3 className="mb-3 text-xs font-medium text-white/70">Audition Pricing</h3>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Audition Price (₦)</label>
              <input
                type="number"
                min="0"
                value={form.audition_price_ngn}
                onChange={(e) => setForm({ ...form, audition_price_ngn: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
              <div className="mt-1 text-xs text-white/40">Amount users pay to participate</div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">User Reward (vPT equiv. ₦)</label>
              <input
                type="number"
                min="0"
                value={form.user_reward_vpt_ngn}
                onChange={(e) => setForm({ ...form, user_reward_vpt_ngn: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
              <div className="mt-1 text-xs text-white/40">vPT value (in ₦) awarded to user</div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Community Pool (vPT equiv. ₦)</label>
              <input
                type="number"
                min="0"
                value={form.community_pool_vpt_ngn}
                onChange={(e) => setForm({ ...form, community_pool_vpt_ngn: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
              <div className="mt-1 text-xs text-white/40">vPT value (in ₦) to community pool</div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Operations Pool (₦)</label>
              <input
                type="number"
                min="0"
                value={form.ops_pool_ngn}
                onChange={(e) => setForm({ ...form, ops_pool_ngn: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              />
              <div className="mt-1 text-xs text-white/40">₦ allocated to operations</div>
            </div>
            <div className="sm:col-span-2 text-xs text-white/40 bg-white/4 rounded-lg p-2">
              Total allocations: ₦{Number(form.user_reward_vpt_ngn || 0) + Number(form.community_pool_vpt_ngn || 0) + Number(form.ops_pool_ngn || 0)} (fee: ₦{form.audition_price_ngn})
            </div>

            <div className="sm:col-span-2 border-t border-white/10 pt-4 mt-2">
              <h3 className="mb-3 text-xs font-medium text-white/70">Challenge Configuration</h3>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Phase</label>
              <select
                value={form.phase}
                onChange={(e) => setForm({ ...form, phase: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              >
                <option value="pre-register" className="bg-[#050A30]">Pre-register</option>
                <option value="registration-and-audition" className="bg-[#050A30]">Registration & Audition</option>
                <option value="kickoff" className="bg-[#050A30]">Kickoff</option>
                <option value="running" className="bg-[#050A30]">Running</option>
                <option value="incubation" className="bg-[#050A30]">Incubation</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none"
              >
                <option value="active" className="bg-[#050A30]">Active</option>
                <option value="completed" className="bg-[#050A30]">Completed</option>
              </select>
            </div>

            <div className="flex gap-3 sm:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl border border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/15 px-6 py-2.5 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25 disabled:opacity-50"
              >
                {saving ? "Saving..." : editId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-2xl border border-white/10 bg-white/4 px-6 py-2.5 text-sm text-white/60 hover:bg-white/8"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && <DataTable columns={challengeColumns} rows={filteredChallenges} emptyMessage="No challenges found" />}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        busy={confirm?.busy}
        error={confirm?.error}
        destructive={confirm?.destructive}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) setConfirm(null);
        }}
      />
    </div>
  );
}
