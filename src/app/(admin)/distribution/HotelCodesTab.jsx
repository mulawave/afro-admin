"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Drawer from "@/components/ui/Drawer";

const naira = (n) => `₦${Number(n || 0).toLocaleString("en-NG")}`;

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function HotelCodesTab({ onFeedback }) {
  const [codes, setCodes] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [codeRes, distRes] = await Promise.all([
        api.get("/distribution/admin/hotel-codes"),
        api.get("/distribution/admin/distributors"),
      ]);
      setCodes(codeRes.hotel_codes || []);
      setDistributors(distRes.distributors || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load hotel codes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = codes.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.hotel_name || "").toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.contact_name || "").toLowerCase().includes(q)
    );
  });

  const columns = [
    {
      key: "hotel",
      label: "Hotel",
      render: (row) => (
        <div>
          <div className="font-medium text-white">{row.hotel_name}</div>
          <div className="text-xs text-white/45">{row.contact_name || "—"} {row.contact_phone ? `· ${row.contact_phone}` : ""}</div>
        </div>
      ),
    },
    {
      key: "code",
      label: "Code",
      render: (row) => <CopyCode code={row.code} onFeedback={onFeedback} />,
    },
    {
      key: "seats",
      label: "TVs activated",
      render: (row) => <SeatBar used={row.activations_count} total={row.max_activations} />,
    },
    {
      key: "price",
      label: "Paid",
      render: (row) => <span className="text-sm text-white/80">{naira(row.price_ngn)}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (row) => <StatusBadge status={row.status === "issued" ? "active" : row.status} />,
    },
    {
      key: "issued_at",
      label: "Created",
      render: (row) => <span className="text-xs text-white/50">{formatDate(row.issued_at)}</span>,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <button onClick={() => setViewing(row.code)} className="text-sm font-medium text-[var(--av-light-orange)] hover:brightness-110">
          View TVs
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <input
            type="text"
            placeholder="Search by hotel, code, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
          />
          <button
            onClick={() => setCreating(true)}
            className="rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-3 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105"
          >
            New hotel code
          </button>
        </div>
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
        <DataTable columns={columns} rows={filtered} emptyMessage="No hotel codes yet" defaultPageSize={25} storageKey="distribution-hotel-codes" />
      )}

      <CreateHotelCodeDrawer
        open={creating}
        distributors={distributors}
        onClose={() => setCreating(false)}
        onCreated={async () => { await load(); }}
        onFeedback={onFeedback}
      />

      <HotelCodeDrawer
        code={viewing}
        onClose={() => setViewing(null)}
        onChanged={load}
        onFeedback={onFeedback}
      />
    </div>
  );
}

function SeatBar({ used = 0, total = 0 }) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="min-w-[120px]">
      <div className="text-sm text-white">{used} / {total}</div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-[var(--av-light-orange)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function CopyCode({ code, onFeedback, large = false }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      onFeedback?.("success", "Code copied");
    } catch {
      onFeedback?.("error", "Could not copy the code");
    }
  }
  return (
    <button onClick={copy} title="Copy code" className={`font-mono ${large ? "text-xl text-white" : "text-xs text-white/70"} hover:text-white`}>
      {code}
    </button>
  );
}

function CreateHotelCodeDrawer({ open, distributors, onClose, onCreated, onFeedback }) {
  const empty = { hotel_name: "", tv_count: "", contact_name: "", contact_phone: "", distributor_id: "" };
  const [form, setForm] = useState(empty);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    if (open) { setForm(empty); setPreview(null); setErr(null); setCreated(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Price comes from the backend so the admin always sees what will be charged.
  useEffect(() => {
    const count = Number(form.tv_count);
    if (!Number.isInteger(count) || count < 1) { setPreview(null); return; }
    const timer = setTimeout(async () => {
      try {
        setPreview(await api.get(`/distribution/admin/hotel-codes/price?tv_count=${count}`));
      } catch {
        setPreview(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [form.tv_count]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    const count = Number(form.tv_count);
    if (form.hotel_name.trim().length < 2) return setErr("Enter the hotel name");
    if (!Number.isInteger(count) || count < 1) return setErr("Enter the number of TVs");
    setSaving(true);
    try {
      const body = {
        hotel_name: form.hotel_name.trim(),
        tv_count: count,
        contact_name: form.contact_name.trim(),
        contact_phone: form.contact_phone.trim(),
      };
      if (form.distributor_id) body.distributor_id = form.distributor_id;
      const res = await api.post("/distribution/admin/hotel-codes", body);
      setCreated(res.hotel_code);
      onFeedback("success", `Hotel code created for ${res.hotel_code.hotel_name}`);
      await onCreated();
    } catch (error) {
      setErr(error.message || "Failed to create hotel code");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer open={open} onClose={onClose} title={created ? "Hotel code created" : "New hotel code"}>
      {created ? (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[var(--av-light-orange)]/30 bg-[var(--av-light-orange)]/10 p-5 text-center">
            <div className="text-xs uppercase tracking-wide text-white/50">Activation code</div>
            <div className="mt-2"><CopyCode code={created.code} onFeedback={onFeedback} large /></div>
            <div className="mt-2 text-xs text-white/50">Tap the code to copy it</div>
          </div>
          <div className="space-y-1 text-sm text-white/72">
            <div><span className="text-white/45">Hotel:</span> {created.hotel_name}</div>
            <div><span className="text-white/45">TVs:</span> {created.max_activations}</div>
            <div><span className="text-white/45">Paid:</span> {naira(created.price_ngn)} (one-off)</div>
          </div>
          <p className="text-sm leading-6 text-white/58">
            Every TV in the hotel uses this same code. The first TV registers the hotel&apos;s account;
            the others choose &quot;Sign in&quot; with that account. The code stops working once {created.max_activations} TVs are activated.
          </p>
          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10">
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <FormField label="Hotel name" required>
            <input className="input-base" value={form.hotel_name} onChange={(e) => update("hotel_name", e.target.value)} placeholder="e.g. Presidential Hotel, Port Harcourt" />
          </FormField>
          <FormField label="Number of TVs" required>
            <input className="input-base" type="number" min="1" max="1000" value={form.tv_count} onChange={(e) => update("tv_count", e.target.value)} placeholder="e.g. 50" />
          </FormField>

          {preview && (
            <div className="rounded-2xl border border-white/10 bg-white/4 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/58">Price</span>
                <span className="text-xl font-semibold text-white">{naira(preview.price_ngn)}</span>
              </div>
              <div className="mt-1 text-right text-xs text-white/45">
                {naira(Math.round(preview.price_ngn / preview.tv_count))} per TV · one-off
              </div>
              <PriceBreakdown count={preview.tv_count} bands={preview.bands} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Contact name">
              <input className="input-base" value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
            </FormField>
            <FormField label="Contact phone">
              <input className="input-base" value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Sold by distributor (optional)">
            <select className="input-base" value={form.distributor_id} onChange={(e) => update("distributor_id", e.target.value)}>
              <option value="">AfroVision direct</option>
              {distributors.map((d) => (
                <option key={d.id} value={d.id}>{d.company_name || d.email}</option>
              ))}
            </select>
          </FormField>

          {err && (
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--av-orange),var(--av-light-orange))] px-5 py-2 text-sm font-semibold text-[var(--av-dark-blue)] transition hover:brightness-105 disabled:opacity-50"
            >
              {saving && <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--av-dark-blue)]" />}
              {saving ? "Creating..." : "Create code"}
            </button>
          </div>
        </form>
      )}
      <InputStyles />
    </Drawer>
  );
}

function PriceBreakdown({ count, bands }) {
  const rows = [];
  let previous = 0;
  for (const band of bands || []) {
    const upTo = band.up_to ?? Infinity;
    if (count <= previous) break;
    const tvs = Math.min(count, upTo) - previous;
    const label = Number.isFinite(upTo) ? `TVs ${previous + 1}–${upTo}` : `TVs ${previous + 1}+`;
    rows.push({ label, tvs, rate: band.per_tv_ngn });
    previous = upTo;
  }
  return (
    <div className="mt-3 space-y-1 border-t border-white/8 pt-3">
      {rows.map((r) => (
        <div key={r.label} className="flex justify-between text-xs text-white/55">
          <span>{r.label}: {r.tvs} × {naira(r.rate)}</span>
          <span>{naira(r.tvs * r.rate)}</span>
        </div>
      ))}
    </div>
  );
}

function HotelCodeDrawer({ code, onClose, onChanged, onFeedback }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [releasing, setReleasing] = useState(null);

  const load = useCallback(async () => {
    if (!code) return;
    try {
      setLoading(true);
      setData(await api.get(`/distribution/admin/hotel-codes/${encodeURIComponent(code)}`));
      setErr(null);
    } catch (error) {
      setErr(error.message || "Failed to load hotel code");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => { setData(null); load(); }, [load]);

  async function release() {
    setReleasing((r) => ({ ...r, busy: true, error: null }));
    try {
      await api.post(`/distribution/admin/hotel-codes/${encodeURIComponent(code)}/release-seat`, {
        device_id: releasing.device.device_id,
        reason: releasing.reason || undefined,
      });
      onFeedback("success", "Seat released. That TV is disabled and a replacement can now activate.");
      setReleasing(null);
      await load();
      await onChanged();
    } catch (error) {
      setReleasing((r) => ({ ...r, busy: false, error: error.message }));
    }
  }

  const entry = data?.hotel_code;
  const devices = data?.devices || [];

  return (
    <Drawer open={Boolean(code)} onClose={onClose} title={entry?.hotel_name || "Hotel code"} width="max-w-2xl">
      {loading && !data && (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[var(--av-light-orange)]" />
        </div>
      )}
      {err && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}
      {entry && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <InfoBox label="Code"><CopyCode code={entry.code} onFeedback={onFeedback} /></InfoBox>
            <InfoBox label="TVs activated"><SeatBar used={entry.activations_count} total={entry.max_activations} /></InfoBox>
            <InfoBox label="Paid">{naira(entry.price_ngn)}</InfoBox>
            <InfoBox label="Contact">{entry.contact_name || "—"} {entry.contact_phone ? `· ${entry.contact_phone}` : ""}</InfoBox>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-white">Activated TVs</h3>
            {devices.length === 0 ? (
              <p className="text-sm text-white/50">No TVs activated yet.</p>
            ) : (
              <div className="divide-y divide-white/8 rounded-2xl border border-white/10">
                {devices.map((d) => (
                  <div key={d.device_id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="text-sm text-white">{d.device_name || "TV"}</div>
                      <div className="truncate font-mono text-xs text-white/40">{d.device_id}</div>
                      <div className="text-xs text-white/45">Activated {formatDate(d.activated_at)} · last seen {timeAgo(d.last_seen_at)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <StatusBadge status={d.status} />
                      <button onClick={() => setReleasing({ device: d, reason: "" })} className="text-sm font-medium text-red-300 hover:text-red-200">
                        Release seat
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {releasing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-sm" onClick={() => !releasing.busy && setReleasing(null)} />
          <div className="relative mx-4 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[var(--admin-surface-strong)] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.38)] backdrop-blur-2xl">
            <h3 className="mb-2 text-lg font-semibold text-white">Release this TV&apos;s seat?</h3>
            <p className="mb-4 text-sm leading-6 text-white/66">
              &quot;{releasing.device.device_name || releasing.device.device_id}&quot; will be disabled and its seat freed,
              so a replacement TV can activate with the same code.
            </p>
            <textarea
              placeholder="Reason (e.g. TV replaced, TV reported stolen)..."
              value={releasing.reason}
              onChange={(e) => setReleasing((r) => ({ ...r, reason: e.target.value }))}
              className="mb-4 w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white outline-none placeholder:text-white/32"
              rows={3}
            />
            {releasing.error && (
              <p className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{releasing.error}</p>
            )}
            <div className="flex justify-end gap-3">
              <button onClick={() => setReleasing(null)} disabled={releasing.busy} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/78 transition hover:bg-white/10">
                Cancel
              </button>
              <button onClick={release} disabled={releasing.busy} className="flex items-center gap-2 rounded-2xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50">
                {releasing.busy && <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />}
                {releasing.busy ? "Releasing..." : "Release seat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Drawer>
  );
}

function InfoBox({ label, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/4 p-3">
      <div className="mb-1 text-xs text-white/45">{label}</div>
      <div className="text-sm text-white">{children}</div>
    </div>
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

function InputStyles() {
  return (
    <style jsx global>{`
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
  );
}
