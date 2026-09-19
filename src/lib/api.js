function resolveApiBase() {
  if (typeof window !== "undefined") {
    return "/api/proxy";
  }

  const configuredBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (configuredBase) return configuredBase;

  return "https://afrovision-backend-zoeqld5lsa-uc.a.run.app";
}

export const ADMIN_TOKEN_KEY = "admin_token";
export const ADMIN_USER_KEY = "admin_user";

function getStorageItem(key) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(key);
}

export function getAdminToken() {
  return getStorageItem(ADMIN_TOKEN_KEY);
}

export function getStoredAdmin() {
  const raw = getStorageItem(ADMIN_USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.localStorage.removeItem(ADMIN_USER_KEY);
}

function setAdminSession(token, user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token);
  window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
}

function buildHeaders(options) {
  const token = getAdminToken();
  const hasBody = options.body !== undefined;

  return {
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
}

function extractErrorMessage(payload, fallback, status, path) {
  if (typeof payload === "string" && payload.trim()) {
    const trimmed = payload.trim();
    if (trimmed.startsWith("<!DOCTYPE html") || trimmed.startsWith("<html")) {
      return `Admin API request to ${path} returned HTML instead of JSON. Check NEXT_PUBLIC_API_BASE_URL and point the admin app at the backend API.`;
    }
    return payload;
  }

  if (payload && typeof payload === "object") {
    if (typeof payload.error === "string" && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  }

  return fallback || `Request failed with status ${status}`;
}

async function request(path, options = {}) {
  const apiBase = resolveApiBase();

  if (!apiBase) {
    throw new Error("Admin API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL to the backend origin.");
  }

  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    cache: "no-store",
    next: { revalidate: 0 },
    headers: buildHeaders(options),
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      clearAdminSession();
    }

    throw new Error(extractErrorMessage(payload, null, res.status, path));
  }

  return payload;
}

async function requestFormData(path, formData, options = {}) {
  const apiBase = resolveApiBase();

  if (!apiBase) {
    throw new Error("Admin API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL to the backend origin.");
  }

  const headers = {
    ...(getAdminToken() ? { Authorization: `Bearer ${getAdminToken()}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${apiBase}${path}`, {
    cache: "no-store",
    next: { revalidate: 0 },
    method: options.method || "POST",
    headers,
    body: formData,
  });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) {
      clearAdminSession();
    }

    throw new Error(extractErrorMessage(payload, null, res.status, path));
  }

  return payload;
}

export async function loginAdmin(email, password) {
  const payload = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!payload?.token || !payload?.user) {
    throw new Error("Invalid login response");
  }

  if (payload.user.role !== "admin") {
    clearAdminSession();
    throw new Error("Admin access required");
  }

  setAdminSession(payload.token, payload.user);
  return payload.user;
}

export async function getCurrentAdmin() {
  const payload = await request("/auth/me");
  if (!payload?.user) {
    throw new Error("Could not load admin profile");
  }
  if (payload.user.role !== "admin") {
    clearAdminSession();
    throw new Error("Admin access required");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(payload.user));
  }

  return payload.user;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path, body) => request(path, { method: "DELETE", ...(body ? { body: JSON.stringify(body) } : {}) }),
  upload: (path, formData, method = "POST") => requestFormData(path, formData, { method }),
};
