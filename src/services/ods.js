// Client for the ODS (Obroh Download Suite) admin API, via the /api/ods relay.
// Uses the same AfroVision admin session as the rest of the console.

import { clearAdminSession, getAdminToken } from "@/lib/api";

async function request(path, { method = "GET", body, query } = {}) {
  const qs = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString()}`
    : "";
  const token = getAdminToken();
  const res = await fetch(`/api/ods/${path.replace(/^\//, "")}${qs}`, {
    method,
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    if (res.status === 401) clearAdminSession();
    const message =
      (payload && typeof payload === "object" && (payload.error?.message || (typeof payload.error === "string" && payload.error))) ||
      `ODS request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = payload?.error?.code;
    throw err;
  }
  return payload;
}

/** Download a CSV (or any file) from the ODS API through the relay. */
async function download(path, query, filename) {
  const qs = `?${new URLSearchParams(query).toString()}`;
  const res = await fetch(`/api/ods/${path}${qs}`, { headers: { Authorization: `Bearer ${getAdminToken()}` }, cache: "no-store" });
  if (!res.ok) throw new Error(`Export failed (${res.status})`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const ods = {
  // Dashboard & config
  dashboard: (days = 30, fresh = false) => request("dashboard", { query: { days, fresh: fresh ? 1 : undefined } }),
  getConfig: () => request("config"),
  updateConfig: (patch, reason) => request("config", { method: "PATCH", body: { patch, reason } }),

  // Users
  searchUsers: (q) => request("users", { query: { q } }),
  listUsers: (before) => request("users", { query: { before } }),
  user: (uid) => request(`users/${encodeURIComponent(uid)}`),
  userLedger: (uid, before) => request(`users/${encodeURIComponent(uid)}/ledger`, { query: { before } }),
  adjustBalance: (uid, vpt, reason) => request(`users/${encodeURIComponent(uid)}/adjust-balance`, { method: "POST", body: { vpt, reason } }),
  planAction: (uid, body) => request(`users/${encodeURIComponent(uid)}/plan`, { method: "POST", body }),
  resetTrial: (uid, reason) => request(`users/${encodeURIComponent(uid)}/reset-trial`, { method: "POST", body: { reason } }),
  setMaster: (uid, enabled, reason) => request(`users/${encodeURIComponent(uid)}/master`, { method: "POST", body: { enabled, reason } }),
  deleteUser: (uid, reason) => request(`users/${encodeURIComponent(uid)}/delete`, { method: "POST", body: { reason } }),
  legacy: (installId) => request(`legacy/${encodeURIComponent(installId)}`),
  notifyUser: (uid, title, body) => request(`users/${encodeURIComponent(uid)}/notify`, { method: "POST", body: { title, body } }),
  transferUser: (uid, toUid, reason) => request(`users/${encodeURIComponent(uid)}/transfer`, { method: "POST", body: { toUid, reason } }),

  // Support
  supportTickets: (query) => request("support/tickets", { query }),
  supportTicket: (id) => request(`support/tickets/${encodeURIComponent(id)}`),
  supportReply: (id, message, close = false) => request(`support/tickets/${encodeURIComponent(id)}/reply`, { method: "POST", body: { message, close } }),
  supportStatus: (id, status, reason) => request(`support/tickets/${encodeURIComponent(id)}/status`, { method: "POST", body: { status, reason } }),
  supportSummary: () => request("support/summary"),

  // Payments
  payments: (query) => request("payments", { query }),
  reverifyPayment: (ref) => request(`payments/${encodeURIComponent(ref)}/reverify`, { method: "POST", body: {} }),
  reconcilePayment: (ref, action, reason) => request(`payments/${encodeURIComponent(ref)}/reconcile`, { method: "POST", body: { action, reason } }),
  paymentSettings: () => request("settings/payments"),
  savePaystackKeys: (body) => request("settings/payments/keys", { method: "PUT", body }),
  setPaystackMode: (mode) => request("settings/payments/mode", { method: "PUT", body: { mode } }),
  testPaystack: (mode) => request("settings/payments/test", { method: "POST", body: { mode } }),
  pangleSettings: () => request("settings/pangle"),
  savePangleKey: (securityKey) => request("settings/pangle", { method: "PUT", body: { securityKey } }),

  // Vouchers
  voucherBatches: () => request("vouchers/batches"),
  createVoucherBatch: (body) => request("vouchers/batches", { method: "POST", body }),
  vouchers: (query) => request("vouchers", { query }),
  voidVouchers: (body) => request("vouchers/void", { method: "POST", body }),
  exportVouchersCsv: (batchId) => download("vouchers", { batchId, format: "csv" }, `ods-vouchers-${batchId}.csv`),

  // Comms, pool, audit
  announcements: () => request("announcements"),
  sendAnnouncement: (body) => request("announcements", { method: "POST", body }),
  publicPool: (before) => request("public-pool", { query: { before } }),
  auditLog: (query) => request("audit-log", { query }),
};

export const formatVpt = (v) =>
  `${Number(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} vPT`;
export const formatNgn = (v) => `₦${Number(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const formatDate = (v) => (v ? new Date(v).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—");
