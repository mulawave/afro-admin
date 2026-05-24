// Service for fetching, saving, and testing email templates via the admin Next.js API routes.
// Template file management is handled server-side; SMTP delivery is proxied to the backend.

import { getAdminToken } from "@/lib/api";

function authHeaders() {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseResponse(res) {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status}`);
  return data;
}

export async function getTemplates() {
  const res = await fetch("/api/email-templates", { headers: authHeaders() });
  const data = await parseResponse(res);
  return Array.isArray(data.templates) ? data.templates : [];
}

export async function saveTemplate(id, html) {
  const res = await fetch("/api/email-templates", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ id, html }),
  });
  return parseResponse(res);
}

export async function sendTestEmail(templateId, to, vars) {
  const res = await fetch("/api/email-templates/test", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ templateId, to, vars }),
  });
  return parseResponse(res);
}
