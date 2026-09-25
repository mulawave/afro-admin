import { NextResponse } from "next/server";

export function getBackendBase() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://afrovision-backend-zoeqld5lsa-uc.a.run.app"
  ).replace(/\/$/, "");
}

/**
 * Verifies the caller is a signed-in admin by asking the backend, which is the
 * authority for sessions and roles. Use at the top of any Next.js API route
 * that does work locally instead of relaying through /api/proxy.
 *
 * Returns { user, authorization } on success, or { response } holding the
 * error NextResponse to return as-is.
 */
export async function requireAdmin(request) {
  const header = request.headers.get("authorization") || "";
  const cookieToken = request.cookies?.get("__session")?.value;
  const authorization = header.startsWith("Bearer ") && header.length > "Bearer ".length
    ? header
    : cookieToken
      ? `Bearer ${cookieToken}`
      : null;

  if (!authorization) {
    return { response: NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 }) };
  }

  let upstream;
  try {
    upstream = await fetch(`${getBackendBase()}/auth/me`, {
      headers: { Authorization: authorization },
      cache: "no-store",
    });
  } catch (err) {
    return { response: NextResponse.json({ error: `Auth check failed: ${err.message}` }, { status: 502 }) };
  }

  if (!upstream.ok) {
    const status = upstream.status === 401 || upstream.status === 403 ? upstream.status : 502;
    return { response: NextResponse.json({ error: "Admin session is invalid or expired" }, { status }) };
  }

  const payload = await upstream.json().catch(() => null);
  if (payload?.user?.role !== "admin") {
    return { response: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }

  return { user: payload.user, authorization };
}
