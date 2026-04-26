"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import NoticeBanner from "@/components/ui/NoticeBanner";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [formError, setFormError] = useState(null);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/categories");
      setCategories(res.categories ?? []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function startEdit(category) {
    setFormError(null);
    setEditing({
      ...(category || {}),
      _name: category?.name || "",
      _is_active: category?.is_active ?? true,
    });
  }

  async function saveCategory() {
    if (!editing) return;

    const payload = {
      name: editing._name.trim(),
      is_active: editing._is_active,
    };

    if (!payload.name) {
      setFormError("Category name is required.");
      return;
    }

    setConfirm({
      title: editing.id ? "Update Category" : "Create Category",
      message: `${editing.id ? "Save changes to" : "Create"} "${payload.name}"? This affects channel categorization across the platform.`,
      destructive: false,
      busy: false,
      error: null,
      confirmLabel: editing.id ? "Save Category" : "Create Category",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          if (editing.id) {
            await api.patch(`/admin/categories/${editing.id}`, payload);
          } else {
            await api.post("/admin/categories", payload);
          }
          setFeedback({ tone: "success", message: editing.id ? `Updated ${payload.name}.` : `Created ${payload.name}.` });
          setEditing(null);
          await loadCategories();
          return true;
        } catch (err) {
          const messageText = err.message || "Failed to save category";
          setConfirm((current) => ({ ...current, busy: false, error: messageText }));
          setFormError(messageText);
          return false;
        }
      },
    });
  }

  function toggleActive(category) {
    const nextActive = !category.is_active;
    const verb = nextActive ? "Activate" : "Deactivate";

    setConfirm({
      title: `${verb} Category`,
      message: `${verb} "${category.name}"? ${nextActive ? "It will appear in category lists across the platform." : "It will be hidden from public category lists."}`,
      destructive: !nextActive,
      busy: false,
      error: null,
      confirmLabel: verb,
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.patch(`/admin/categories/${category.id}`, { is_active: nextActive });
          setFeedback({ tone: "success", message: `${verb}d ${category.name}.` });
          await loadCategories();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || `Failed to ${verb.toLowerCase()} category` }));
          return false;
        }
      },
    });
  }

  function deleteCategory(category) {
    setConfirm({
      title: "Delete Category",
      message: `Delete "${category.name}"? Channels using this category will retain their current label, but the category will no longer appear in selection lists. This cannot be undone.`,
      destructive: true,
      busy: false,
      error: null,
      confirmLabel: "Delete Category",
      action: async () => {
        setConfirm((current) => ({ ...current, busy: true, error: null }));
        try {
          await api.delete(`/admin/categories/${category.id}`);
          setFeedback({ tone: "success", message: `Deleted ${category.name}.` });
          await loadCategories();
          return true;
        } catch (err) {
          setConfirm((current) => ({ ...current, busy: false, error: err.message || "Failed to delete category" }));
          return false;
        }
      },
    });
  }

  const activeCount = categories.filter((c) => c.is_active).length;

  const columns = [
    {
      key: "name",
      label: "Category Name",
      render: (row) => <span className="font-medium text-white">{row.name}</span>,
    },
    {
      key: "is_active",
      label: "Status",
      render: (row) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${row.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "id",
      label: "ID",
      render: (row) => <span className="font-mono text-xs text-[var(--av-light-orange)]">{row.id}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex gap-3">
          <button onClick={() => startEdit(row)} className="text-sm font-medium text-sky-300 hover:text-sky-200">
            Edit
          </button>
          <button onClick={() => toggleActive(row)} className={`text-sm font-medium ${row.is_active ? "text-amber-300 hover:text-amber-200" : "text-emerald-300 hover:text-emerald-200"}`}>
            {row.is_active ? "Deactivate" : "Activate"}
          </button>
          <button onClick={() => deleteCategory(row)} className="text-sm font-medium text-red-300 hover:text-red-200">
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
          <h1 className="text-3xl font-semibold text-white">Channel Categories</h1>
          <p className="mt-2 text-sm text-[var(--av-light-orange)]">Manage categories that creators can assign to their channels across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-[var(--av-light-orange)]">
            {activeCount} active · {categories.length} total
          </span>
          <button
            onClick={() => startEdit(null)}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            + Add Category
          </button>
        </div>
      </div>

      <NoticeBanner tone={feedback?.tone} message={feedback?.message} />

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={loadCategories} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && !error && (
        <DataTable columns={columns} rows={categories} emptyMessage="No categories configured" />
      )}

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? `Edit Category: ${editing.name}` : "Create Category"}>
        {editing && (
          <div className="space-y-4">
            <NoticeBanner tone="error" message={formError} />

            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--av-light-orange)]">Category Name</label>
              <input
                type="text"
                value={editing._name}
                onChange={(e) => setEditing((prev) => ({ ...prev, _name: e.target.value }))}
                placeholder="e.g. Music, Sports, Education"
                className="w-full rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--av-light-orange)]">Status</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditing((prev) => ({ ...prev, _is_active: true }))}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${editing._is_active ? "border-emerald-400/40 bg-emerald-500/12 text-emerald-300" : "border-white/10 bg-white/6 text-[var(--av-light-orange)] hover:bg-white/10"}`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setEditing((prev) => ({ ...prev, _is_active: false }))}
                  className={`rounded-2xl border px-4 py-3 text-sm transition ${!editing._is_active ? "border-red-400/40 bg-red-500/12 text-red-300" : "border-white/10 bg-white/6 text-[var(--av-light-orange)] hover:bg-white/10"}`}
                >
                  Inactive
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-white/8 pt-4">
              <button
                onClick={() => setEditing(null)}
                className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-[var(--av-light-orange)] transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={saveCategory}
                className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-4 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
              >
                {editing.id ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        )}
      </Drawer>

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
          if (!confirm?.action) {
            setConfirm(null);
            return;
          }
          const shouldClose = await confirm.action();
          if (shouldClose !== false) {
            setConfirm(null);
          }
        }}
      />
    </div>
  );
}
