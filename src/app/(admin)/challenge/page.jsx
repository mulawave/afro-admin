"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const PHASES = ["registration", "audition", "running", "completed"];
const PHASE_COLORS = {
  registration: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  audition: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  running: "bg-green-500/15 text-green-300 border-green-500/30",
  completed: "bg-white/8 text-white/50 border-white/10",
};
const REG_STATUSES = ["pending", "approved", "shortlisted", "finalist", "eliminated", "winner"];

export default function ChallengePage() {
  /* ── State ─────────────────────────────────────────────── */
  const [challenges, setChallenges] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [tab, setTab] = useState("challenges"); // challenges | registrations
  const [search, setSearch] = useState("");
  const [regFilter, setRegFilter] = useState("");
  const [confirm, setConfirm] = useState(null);

  // Challenge form
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    title: "", subtitle: "", season: 1, prize_pool: "₦10,000,000",
    max_contestants: 15, video_min_seconds: 30, video_max_seconds: 60,
    rules: "", banner_url: "", trailer_url: "",
  });
  const [saving, setSaving] = useState(false);

  // Selected registration detail
  const [selReg, setSelReg] = useState(null);

  /* ── Data loading ──────────────────────────────────────── */
  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/challenge/admin/list");
      setChallenges(res.challenges ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load challenges");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRegistrations = useCallback(async () => {
    try {
      const res = await api.get(
        regFilter
          ? `/challenge/admin/registrations?status=${regFilter}`
          : "/challenge/admin/registrations"
      );
      setRegistrations(res.registrations ?? []);
    } catch {
      // silently handle
    }
  }, [regFilter]);

  useEffect(() => { loadChallenges(); }, [loadChallenges]);
  useEffect(() => { if (tab === "registrations") loadRegistrations(); }, [tab, loadRegistrations]);

  /* ── Challenge CRUD ────────────────────────────────────── */
  function openCreate() {
    setEditId(null);
    setForm({
      title: "", subtitle: "", season: 1, prize_pool: "₦10,000,000",
      max_contestants: 15, video_min_seconds: 30, video_max_seconds: 60,
      rules: "", banner_url: "", trailer_url: "",
    });
    setShowForm(true);
  }

  function openEdit(ch) {
    setEditId(ch.id);
    setForm({
      title: ch.title || "", subtitle: ch.subtitle || "", season: ch.season || 1,
      prize_pool: ch.prize_pool || "", max_contestants: ch.max_contestants || 15,
      video_min_seconds: ch.video_min_seconds || 30, video_max_seconds: ch.video_max_seconds || 60,
      rules: (ch.rules || []).join("\n"), banner_url: ch.banner_url || "",
      trailer_url: ch.trailer_url || "",
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
      message: `Permanently delete "${ch.title}"? This also removes all associated registrations. This cannot be undone.`,
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

  /* ── Registration management ───────────────────────────── */
  function requestRegStatusChange(reg, newStatus) {
    setConfirm({
      title: "Update Registration Status",
      message: `Change ${reg.name || reg.email}'s status to "${newStatus}"?`,
      confirmLabel: `Set ${newStatus}`,
      destructive: newStatus === "eliminated",
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.patch(`/challenge/admin/registrations/${reg.id}`, { status: newStatus });
          setFeedback({ tone: "success", message: `Status updated to ${newStatus}` });
          await loadRegistrations();
          if (selReg?.id === reg.id) setSelReg((prev) => ({ ...prev, status: newStatus }));
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  /* ── Columns ───────────────────────────────────────────── */
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
        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${PHASE_COLORS[row.phase] || "bg-white/8 text-white/50 border-white/10"}`}>
          {row.phase}
        </span>
      ),
    },
    { key: "prize_pool", label: "Prize Pool" },
    { key: "max_contestants", label: "Max" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => openEdit(row)} className="text-sm font-medium text-sky-300 hover:text-sky-200">Edit</button>
          {row.phase !== "completed" && (
            <button onClick={() => requestAdvancePhase(row)} className="text-sm font-medium text-amber-300 hover:text-amber-200">Advance</button>
          )}
          <button onClick={() => requestDelete(row)} className="text-sm font-medium text-red-300 hover:text-red-200">Delete</button>
        </div>
      ),
    },
  ];

  const regColumns = [
    {
      key: "name",
      label: "Contestant",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.name || "—"}</div>
          <div className="text-xs text-white/45">{row.email}</div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "video",
      label: "Video",
      render: (row) =>
        row.video_url ? (
          <a href={row.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-300 hover:text-sky-200 underline">Watch</a>
        ) : (
          <span className="text-xs text-white/30">—</span>
        ),
    },
    {
      key: "scores",
      label: "Total Score",
      render: (row) => (
        <span className="text-sm text-white/70">{row.scores?.total ?? "—"}</span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setSelReg(row)} className="text-sm font-medium text-sky-300 hover:text-sky-200">Details</button>
          {row.status === "pending" && (
            <button onClick={() => requestRegStatusChange(row, "approved")} className="text-sm font-medium text-green-300 hover:text-green-200">Approve</button>
          )}
          {["approved", "shortlisted"].includes(row.status) && (
            <button onClick={() => requestRegStatusChange(row, "shortlisted")} className="text-sm font-medium text-amber-300 hover:text-amber-200">Shortlist</button>
          )}
          {!["eliminated", "winner"].includes(row.status) && (
            <button onClick={() => requestRegStatusChange(row, "eliminated")} className="text-sm font-medium text-red-300 hover:text-red-200">Eliminate</button>
          )}
        </div>
      ),
    },
  ];

  const filteredChallenges = challenges.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.title || "").toLowerCase().includes(q) || (c.phase || "").toLowerCase().includes(q);
  });

  const filteredRegs = registrations.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (r.name || "").toLowerCase().includes(q) || (r.email || "").toLowerCase().includes(q);
  });

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Challenge</h1>
          <p className="mt-2 text-sm text-white/58">Manage competition seasons, phases, and contestant registrations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openCreate}
            className="rounded-2xl border border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/15 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25"
          >
            + New Challenge
          </button>
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/62">
            {tab === "challenges" ? `${filteredChallenges.length} challenges` : `${filteredRegs.length} registrations`}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {["challenges", "registrations"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setSearch(""); }}
            className={`rounded-2xl border px-4 py-2 text-sm font-medium transition ${
              tab === t
                ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]"
                : "border-white/10 bg-white/4 text-white/60 hover:bg-white/8 hover:text-white"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder={tab === "challenges" ? "Search challenges..." : "Search contestants..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          {tab === "registrations" && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRegFilter("")}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  !regFilter ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]" : "border-white/10 bg-white/4 text-white/50 hover:text-white"
                }`}
              >
                All
              </button>
              {REG_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setRegFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
                    regFilter === s ? "border-[var(--av-light-orange)]/50 bg-[var(--av-light-orange)]/15 text-[var(--av-light-orange)]" : "border-white/10 bg-white/4 text-white/50 hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && !loading && (
        <div className={`rounded-[1.5rem] px-4 py-3 text-sm ${
          feedback.tone === "success"
            ? "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border border-red-400/30 bg-red-500/10 text-red-200"
        }`}>
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

      {/* Challenge Form */}
      {showForm && (
        <div className="rounded-[1.75rem] border border-[var(--av-light-orange)]/30 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <h2 className="mb-4 text-lg font-semibold text-white">{editId ? "Edit Challenge" : "Create Challenge"}</h2>
          <form onSubmit={saveChallenge} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Subtitle</label>
              <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Season</label>
              <input type="number" min="1" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Prize Pool</label>
              <input value={form.prize_pool} onChange={(e) => setForm({ ...form, prize_pool: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Max Contestants</label>
              <input type="number" min="1" value={form.max_contestants} onChange={(e) => setForm({ ...form, max_contestants: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-white/50">Min Video (sec)</label>
                <input type="number" min="1" value={form.video_min_seconds} onChange={(e) => setForm({ ...form, video_min_seconds: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-white/50">Max Video (sec)</label>
                <input type="number" min="1" value={form.video_max_seconds} onChange={(e) => setForm({ ...form, video_max_seconds: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Banner URL</label>
              <input value={form.banner_url} onChange={(e) => setForm({ ...form, banner_url: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/50">Trailer URL</label>
              <input value={form.trailer_url} onChange={(e) => setForm({ ...form, trailer_url: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs text-white/50">Rules (one per line)</label>
              <textarea value={form.rules} onChange={(e) => setForm({ ...form, rules: e.target.value })} rows={4} className="w-full rounded-xl border border-white/10 bg-white/6 px-4 py-2.5 text-sm text-white outline-none resize-none" />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <button type="submit" disabled={saving} className="rounded-2xl border border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/15 px-6 py-2.5 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/25 disabled:opacity-50">
                {saving ? "Saving…" : editId ? "Update" : "Create"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="rounded-2xl border border-white/10 bg-white/4 px-6 py-2.5 text-sm text-white/60 hover:bg-white/8">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {!loading && tab === "challenges" && (
        <DataTable columns={challengeColumns} rows={filteredChallenges} emptyMessage="No challenges found" />
      )}
      {!loading && tab === "registrations" && (
        <DataTable columns={regColumns} rows={filteredRegs} emptyMessage="No registrations found" />
      )}

      {/* Registration Detail Panel */}
      {selReg && (
        <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Registration Detail</h2>
            <button onClick={() => setSelReg(null)} className="text-sm text-white/50 hover:text-white">Close ✕</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" value={selReg.name} />
            <Field label="Email" value={selReg.email} />
            <Field label="Gender" value={selReg.gender} />
            <Field label="Status" value={selReg.status} />
            <Field label="Video Duration" value={selReg.video_duration_seconds ? `${selReg.video_duration_seconds}s` : "—"} />
            <Field label="Referral Score" value={selReg.scores?.referral ?? "—"} />
            <Field label="Engagement Score" value={selReg.scores?.engagement ?? "—"} />
            <Field label="Judge Score" value={selReg.scores?.judge ?? "—"} />
            <Field label="Total Score" value={selReg.scores?.total ?? "—"} />
            <div className="sm:col-span-2">
              <Field label="Pitch Description" value={selReg.pitch_description || "—"} />
            </div>
            {selReg.video_url && (
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-white/50">Video</label>
                <a href={selReg.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-300 hover:text-sky-200 underline break-all">{selReg.video_url}</a>
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {selReg.status !== "approved" && (
              <button onClick={() => requestRegStatusChange(selReg, "approved")} className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-2 text-sm font-medium text-green-200 transition hover:bg-green-500/20">Approve</button>
            )}
            {selReg.status !== "shortlisted" && (
              <button onClick={() => requestRegStatusChange(selReg, "shortlisted")} className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-500/20">Shortlist</button>
            )}
            {selReg.status !== "finalist" && (
              <button onClick={() => requestRegStatusChange(selReg, "finalist")} className="rounded-xl border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-500/20">Finalist</button>
            )}
            {selReg.status !== "winner" && (
              <button onClick={() => requestRegStatusChange(selReg, "winner")} className="rounded-xl border border-[var(--av-light-orange)]/30 bg-[var(--av-light-orange)]/10 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-[var(--av-light-orange)]/20">Winner</button>
            )}
            {selReg.status !== "eliminated" && (
              <button onClick={() => requestRegStatusChange(selReg, "eliminated")} className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20">Eliminate</button>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
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
          if (!confirm?.action) { setConfirm(null); return; }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) setConfirm(null);
        }}
      />
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-white/50">{label}</label>
      <p className="text-sm text-white">{value || "—"}</p>
    </div>
  );
}
