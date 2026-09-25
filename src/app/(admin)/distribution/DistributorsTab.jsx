"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Drawer from "@/components/ui/Drawer";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import StatusBadge from "@/components/ui/StatusBadge";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNgn(amount) {
  return `₦${(Number(amount) || 0).toLocaleString("en-NG")}`;
}

const DIST_STATUS_COLORS = {
  active: "border border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
  frozen: "border border-sky-400/30 bg-sky-500/10 text-sky-200",
  banned: "border border-red-400/30 bg-red-500/10 text-red-200",
};

export default function DistributorsTab({ onFeedback }) {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/distribution/admin/distributors");
      setDistributors(res.distributors || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load distributors");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = distributors.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (d.company_name || "").toLowerCase().includes(q) ||
      (d.email || "").toLowerCase().includes(q) ||
      (d.contact_name || "").toLowerCase().includes(q)
    );
  });

  async function handleSave(data) {
    const isEdit = Boolean(data.id);
    try {
      if (isEdit) {
        await api.patch(`/distribution/admin/distributors/${data.id}`, data.body);
        onFeedback("success", "Distributor updated successfully");
      } else {
        await api.post("/distribution/admin/distributors", data.body);
        onFeedback("success", "Distributor created successfully");
      }
      setDrawer(null);
      await load();
    } catch (err) {
      throw err;
    }
  }

  function requestDelete(distributor) {
    setConfirm({
      title: "Delete Distributor",
      message: `Permanently delete "${distributor.company_name}"? All marketers will be disabled and unused codes revoked. Activated TVs remain functional.`,
      confirmLabel: "Delete",
      destructive: true,
      action: async () => {
        setConfirm((c) => ({ ...c, busy: true, error: null }));
        try {
          await api.delete(`/distribution/admin/distributors/${distributor.id}`);
          onFeedback("success", "Distributor deleted");
          await load();
          return true;
        } catch (err) {
          setConfirm((c) => ({ ...c, busy: false, error: err.message }));
          return false;
        }
      },
    });
  }

  const columns = [
    {
      key: "company",
      label: "Company",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.company_name}</div>
          <div className="text-xs text-white/45">{row.contact_name || "—"}</div>
        </div>
      ),
    },
    { key: "email", label: "Email", render: (row) => <span className="text-sm text-white/70">{row.email}</span> },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${DIST_STATUS_COLORS[row.status] || DIST_STATUS_COLORS.active}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: "quota",
      label: "Quota",
      render: (row) => (
        <span className="font-mono text-sm text-white/70">
          {row.quota_used} / {row.quota_total}
        </span>
      ),
    },
    {
      key: "license",
      label: "License",
      render: (row) => {
        const valid = new Date(row.license_expires_at) > new Date();
        return (
          <div>
            <span className={`text-xs font-medium ${valid ? "text-emerald-300" : "text-red-300"}`}>
              {valid ? "Valid" : "Expired"}
            </span>
            <div className="text-xs text-white/45">{formatDate(row.license_expires_at)}</div>
          </div>
        );
      },
    },
    {
      key: "split",
      label: "Split",
      render: (row) => (
        <span className="text-sm text-white/70">
          {row.split_percent_afrovision != null ? `${row.split_percent_afrovision}%` : "Default"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrawer({ mode: "edit", distributor: row })}
            className="text-sm font-medium text-sky-300 hover:text-sky-200"
          >
            Edit
          </button>
          <button
            onClick={() => requestDelete(row)}
            className="text-sm font-medium text-red-300/60 hover:text-red-200"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Search by company, email, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
        </div>
        <button
          onClick={() => setDrawer({ mode: "create" })}
          className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-2.5 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
        >
          + Add Distributor
        </button>
      </div>

      {error && !loading && (
        <div className="rounded-[1.5rem] border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
          <button onClick={load} className="ml-3 underline">Retry</button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}

      {!loading && (
        <DataTable columns={columns} rows={filtered} emptyMessage="No distributors found" storageKey="distribution-distributors" />
      )}

      {drawer && (
        <DistributorDrawer
          mode={drawer.mode}
          distributor={drawer.distributor}
          onClose={() => setDrawer(null)}
          onSave={handleSave}
        />
      )}

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
          const ok = await confirm.action();
          if (ok !== false) setConfirm(null);
        }}
      />
    </div>
  );
}

function DistributorDrawer({ mode, distributor, onClose, onSave }) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState({
    company_name: distributor?.company_name || "",
    contact_name: distributor?.contact_name || "",
    email: distributor?.email || "",
    phone: distributor?.phone || "",
    password: "",
    license_duration_days: distributor?.license_expires_at
      ? Math.ceil((new Date(distributor.license_expires_at) - new Date()) / (1000 * 60 * 60 * 24))
      : 365,
    quota_total: distributor?.quota_total || 100,
    split_percent_afrovision: distributor?.split_percent_afrovision ?? "",
    status: distributor?.status || "active",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  function update(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const body = {
        company_name: form.company_name,
        contact_name: form.contact_name || undefined,
        email: form.email,
        phone: form.phone || undefined,
        status: form.status,
        quota_total: Number(form.quota_total) || 0,
      };
      if (form.split_percent_afrovision !== "") {
        body.split_percent_afrovision = Number(form.split_percent_afrovision);
      }
      if (form.password) {
        body.password = form.password;
      }
      if (isEdit) {
        if (form.license_duration_days) {
          body.license_duration_days = Number(form.license_duration_days);
        }
      } else {
        body.license_duration_days = Number(form.license_duration_days) || 365;
        body.password = form.password;
      }

      await onSave({ id: distributor?.id, body });
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer open onClose={onClose} title={isEdit ? "Edit Distributor" : "Add Distributor"} width="max-w-xl">
      <form onSubmit={submit} className="space-y-4">
        <FormField label="Company Name" required>
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            required
            className="input-base"
          />
        </FormField>

        <FormField label="Contact Name">
          <input
            type="text"
            value={form.contact_name}
            onChange={(e) => update("contact_name", e.target.value)}
            className="input-base"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Email" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              className="input-base"
            />
          </FormField>

          <FormField label="Phone">
            <input
              type="text"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="input-base"
            />
          </FormField>
        </div>

        <FormField label={isEdit ? "New Password (leave blank to keep)" : "Password"} required={!isEdit}>
          <input
            type="password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            required={!isEdit}
            minLength={6}
            className="input-base"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Quota Total">
            <input
              type="number"
              min="0"
              value={form.quota_total}
              onChange={(e) => update("quota_total", e.target.value)}
              className="input-base"
            />
          </FormField>

          <FormField label="License Days">
            <input
              type="number"
              min="1"
              value={form.license_duration_days}
              onChange={(e) => update("license_duration_days", e.target.value)}
              className="input-base"
            />
          </FormField>

          <FormField label="Split % (AfroVision)">
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Default"
              value={form.split_percent_afrovision}
              onChange={(e) => update("split_percent_afrovision", e.target.value)}
              className="input-base"
            />
          </FormField>
        </div>

        {isEdit && (
          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className="input-base"
            >
              <option value="active">Active</option>
              <option value="frozen">Frozen</option>
              <option value="banned">Banned</option>
            </select>
          </FormField>
        )}

        {err && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
          >
            {saving && (
              <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--av-dark-blue)]" />
            )}
            {saving ? "Saving..." : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.06);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: white;
          outline: none;
        }
        .input-base::placeholder { color: rgba(255,255,255,0.32); }
        .input-base:focus { border-color: var(--av-light-orange); }
      `}</style>
    </Drawer>
  );
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs text-white/50">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
