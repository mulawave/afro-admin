// Client for the OMS (Obroh Media Suite) admin API, via the /api/oms relay.
// Uses the same AfroVision admin session as the rest of the console.

import { clearAdminSession, getAdminToken } from "@/lib/api";

async function request(path, { method = "GET", body, query } = {}) {
  const qs = query
    ? `?${new URLSearchParams(Object.entries(query).filter(([, v]) => v !== undefined && v !== null && v !== "")).toString()}`
    : "";
  const token = getAdminToken();
  const res = await fetch(`/api/oms/${path.replace(/^\//, "")}${qs}`, {
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
      `OMS request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.code = payload?.error?.code;
    throw err;
  }
  return payload;
}

const u = (uid) => encodeURIComponent(uid);

export const oms = {
  // Dashboard & config (config is read-only: prices and the rate are deploy-time parameters)
  dashboard: (days = 30, fresh = false) => request("dashboard", { query: { days, fresh: fresh ? 1 : undefined } }),
  config: () => request("config"),

  // Users
  searchUsers: (q) => request("users", { query: { q } }),
  listUsers: (before) => request("users", { query: { before } }),
  user: (uid) => request(`users/${u(uid)}`),
  adjustBalance: (uid, vpt, reason) => request(`users/${u(uid)}/adjust-balance`, { method: "POST", body: { vpt, reason } }),
  planAction: (uid, body) => request(`users/${u(uid)}/plan`, { method: "POST", body }),
  resetTrial: (uid, reason) => request(`users/${u(uid)}/reset-trial`, { method: "POST", body: { reason } }),
  setStreak: (uid, day, reason) => request(`users/${u(uid)}/streak`, { method: "POST", body: { day, reason } }),
  setDisabled: (uid, disabled, reason) => request(`users/${u(uid)}/disable`, { method: "POST", body: { disabled, reason } }),
  deleteUser: (uid, reason) => request(`users/${u(uid)}/delete`, { method: "POST", body: { reason } }),
  notifyUser: (uid, title, body) => request(`users/${u(uid)}/notify`, { method: "POST", body: { title, body } }),

  // Support
  supportTickets: (query) => request("support/tickets", { query }),
  supportTicket: (id) => request(`support/tickets/${u(id)}`),
  supportReply: (id, message, close = false) => request(`support/tickets/${u(id)}/reply`, { method: "POST", body: { message, close } }),
  supportStatus: (id, status, reason) => request(`support/tickets/${u(id)}/status`, { method: "POST", body: { status, reason } }),
  supportSummary: () => request("support/summary"),

  // Vouchers. Codes are only ever returned by createVoucherBatch, once.
  voucherBatches: () => request("vouchers/batches"),
  createVoucherBatch: (body) => request("vouchers/batches", { method: "POST", body }),
  lookupVoucher: (code) => request("vouchers", { query: { code } }),
  batchVouchers: (batch) => request("vouchers", { query: { batch } }),
  voidVouchers: (body) => request("vouchers/void", { method: "POST", body }),

  // Payments
  payments: (query) => request("payments", { query }),
  unmatchedPayments: () => request("payments/unmatched"),
  assignPayment: (ref, uid, reason) => request(`payments/${u(ref)}/assign`, { method: "POST", body: { uid, reason } }),
  reconcileStatus: () => request("payments/reconcile-status"),

  // Operations
  failedEffects: (all = false) => request("failed-effects", { query: { all: all ? 1 : undefined } }),
  resolveFailedEffect: (id, reason) => request(`failed-effects/${u(id)}/resolve`, { method: "POST", body: { reason } }),
  pendingCredits: (state) => request("pending-credits", { query: { state } }),
  referrals: (uid) => request("referrals", { query: { uid } }),

  // Announcements & audit
  announcements: () => request("announcements"),
  sendAnnouncement: (body) => request("announcements", { method: "POST", body }),
  auditLog: (query) => request("audit-log", { query }),
};

export const formatVpt = (v) =>
  `${Number(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 8 })} vPT`;
export const formatNgn = (v) => `₦${Number(v || 0).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const formatDate = (v) => (v ? new Date(v).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "—");

/** Download text as a file, in the browser. */
export function saveText(filename, text, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
