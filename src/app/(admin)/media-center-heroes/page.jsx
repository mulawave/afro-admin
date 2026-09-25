"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

const LINK_TYPES = [
  { value: "movie", label: "Movie" },
  { value: "series", label: "Series" },
  { value: "channel", label: "Channel" },
  { value: "url", label: "URL" },
];

const EMPTY_FORM = {
  id: null,
  title: "",
  subtitle: "",
  image_url: "",
  link_type: "movie",
  link_target: "",
  priority: 0,
  is_active: true,
  starts_at: "",
  ends_at: "",
};

export default function MediaCenterHeroesPage() {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [editing, setEditing] = useState(null); // form state or null

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/media-center/heroes");
      setHeroes(Array.isArray(res?.heroes) ? res.heroes : []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load heroes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search) return heroes;
    const q = search.toLowerCase();
    return heroes.filter((h) =>
      [h.title, h.subtitle, h.link_type, h.link_target]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [search, heroes]);

  function openCreate() {
    setEditing({ ...EMPTY_FORM });
  }

  function openEdit(hero) {
    setEditing({
      id: hero.id,
      title: hero.title || "",
      subtitle: hero.subtitle || "",
      image_url: hero.image_url || "",
      link_type: hero.link_type || "movie",
      link_target: hero.link_target || "",
      priority: hero.priority ?? 0,
      is_active: hero.is_active !== false,
      starts_at: hero.starts_at ? new Date(hero.starts_at).toISOString().slice(0, 16) : "",
      ends_at: hero.ends_at ? new Date(hero.ends_at).toISOString().slice(0, 16) : "",
    });
  }

  async function submitEdit() {
    if (!editing) return;
    const payload = {
      title: editing.title.trim(),
      subtitle: editing.subtitle.trim(),
      image_url: editing.image_url.trim(),
      link_type: editing.link_type,
      link_target: editing.link_target.trim(),
      priority: Number(editing.priority) || 0,
      is_active: !!editing.is_active,
      starts_at: editing.starts_at ? new Date(editing.starts_at).getTime() : null,
      ends_at: editing.ends_at ? new Date(editing.ends_at).getTime() : null,
    };
    try {
      if (editing.id) {
        await api.patch(`/admin/media-center/heroes/${editing.id}`, payload);
        setFeedback({ tone: "success", message: `Updated "${payload.title}".` });
      } else {
        await api.post("/admin/media-center/heroes", payload);
        setFeedback({ tone: "success", message: `Created "${payload.title}".` });
      }
      setEditing(null);
      await load();
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Save failed" });
    }
  }

  async function uploadImage(file) {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await api.upload("/admin/media-center/heroes/image", fd);
      if (res?.image_url) {
        setEditing((cur) => cur ? { ...cur, image_url: res.image_url } : cur);
      }
    } catch (err) {
      setFeedback({ tone: "error", message: err.message || "Image upload failed" });
    }
  }

  function requestDelete(hero) {
    setConfirm({
      title: "Delete Hero",
      message: `Delete "${hero.title}"? This cannot be undone.`,
      destructive: true,
      confirmLabel: "Delete",
      action: async () => {
        try {
          await api.delete(`/admin/media-center/heroes/${hero.id}`);
          setFeedback({ tone: "success", message: `Deleted "${hero.title}".` });
          await load();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message || "Delete failed" }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "hero",
      label: "Hero",
      render: (row) => (
        <div className="flex items-center gap-3">
          {row.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.image_url} alt="" className="h-10 w-16 rounded-md object-cover" />
          ) : (
            <div className="h-10 w-16 rounded-md bg-white/6" />
          )}
          <div>
            <div className="font-medium text-white">{row.title}</div>
            <div className="text-xs text-white/45">{row.subtitle}</div>
          </div>
        </div>
      ),
    },
    { key: "link", label: "Link", render: (row) => `${row.link_type}: ${row.link_target || "—"}` },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Status", render: (row) => <StatusBadge status={row.is_active ? "active" : "inactive"} /> },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEdit(row)} className="text-sm font-medium text-sky-300 hover:text-sky-200">Edit</button>
          <button onClick={() => requestDelete(row)} className="text-sm font-medium text-red-300 hover:text-red-200">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Media Center Heroes</h1>
          <p className="mt-2 text-sm text-white/58">Curate the hero banners shown at the top of the Media Center on mobile.</p>
        </div>
        <button onClick={openCreate} className="rounded-2xl border border-[var(--av-light-orange)]/40 bg-[var(--av-light-orange)]/12 px-5 py-3 text-sm font-medium text-[var(--av-light-orange)]">
          + New hero
        </button>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <input
          type="text"
          placeholder="Search by title, link…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
        />
      </div>

      <NoticeBanner tone="error" message={error} actionLabel="Retry" onAction={load} />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      ) : (
        <DataTable columns={columns} rows={filtered} emptyMessage="No heroes yet" />
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#101d43] p-6 shadow-2xl">
            <h2 className="mb-4 text-xl font-semibold text-white">{editing.id ? "Edit hero" : "New hero"}</h2>
            <div className="space-y-4">
              <Field label="Title">
                <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className={fieldClass} />
              </Field>
              <Field label="Subtitle (optional)">
                <input value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} className={fieldClass} />
              </Field>
              <Field label="Image URL">
                <input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={fieldClass} placeholder="https://…" />
                <div className="mt-2 flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files?.[0])} className="text-xs text-white/60" />
                  {editing.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={editing.image_url} alt="" className="h-12 w-20 rounded-md object-cover" />
                  )}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Link type">
                  <select value={editing.link_type} onChange={(e) => setEditing({ ...editing, link_type: e.target.value })} className={fieldClass}>
                    {LINK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </Field>
                <Field label="Link target">
                  <input value={editing.link_target} onChange={(e) => setEditing({ ...editing, link_target: e.target.value })} className={fieldClass} placeholder={editing.link_type === "url" ? "https://…" : "id"} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Priority (higher first)">
                  <input type="number" min="0" max="1000" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: e.target.value })} className={fieldClass} />
                </Field>
                <Field label="Active">
                  <label className="flex items-center gap-2 pt-3 text-sm text-white/80">
                    <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} />
                    Publish now
                  </label>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Starts at (optional)">
                  <input type="datetime-local" value={editing.starts_at} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} className={fieldClass} />
                </Field>
                <Field label="Ends at (optional)">
                  <input type="datetime-local" value={editing.ends_at} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} className={fieldClass} />
                </Field>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/80">Cancel</button>
              <button onClick={submitEdit} className="rounded-xl bg-[var(--av-light-orange)] px-4 py-2 text-sm font-medium text-[#26170a]">Save</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title || ""}
        message={confirm?.message || ""}
        destructive={confirm?.destructive}
        busy={confirm?.busy}
        error={confirm?.error}
        confirmLabel={confirm?.confirmLabel}
        onCancel={() => setConfirm(null)}
        onConfirm={async () => {
          if (!confirm?.action) { setConfirm(null); return; }
          const close = await confirm.action();
          if (close !== false) setConfirm(null);
        }}
      />
    </div>
  );
}

const fieldClass = "w-full rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/32";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wider text-white/55">{label}</span>
      {children}
    </label>
  );
}
