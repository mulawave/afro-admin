import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Relay for the ODS (Obroh Download Suite) admin API. The AfroVision admin
 * session is the single admin login for every app: the caller's AfroVision
 * bearer token is forwarded as-is and ods-api verifies it against the
 * AfroVision backend. Only /admin/v1/* is reachable through this relay.
 */
function getOdsBase() {
  return (process.env.ODS_API_BASE_URL || "").replace(/\/$/, "");
}

async function relay(request, context) {
  const base = getOdsBase();
  if (!base) {
    return NextResponse.json(
      { error: { code: "not_configured", message: "ODS API isn't connected yet. Set ODS_API_BASE_URL on the admin service." } },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ") || authorization.length <= 7) {
    return NextResponse.json({ error: { code: "unauthenticated", message: "Please sign in again." } }, { status: 401 });
  }

  const { path } = await context.params;
  const segments = (path || []).map((s) => encodeURIComponent(s));
  const target = new URL(`${base}/admin/v1/${segments.join("/")}`);
  target.search = new URL(request.url).search;

  const headers = new Headers({ authorization, accept: request.headers.get("accept") || "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const method = request.method.toUpperCase();
  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : Buffer.from(await request.arrayBuffer()),
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
    const out = new Headers();
    for (const h of ["content-type", "content-disposition"]) {
      const v = upstream.headers.get(h);
      if (v) out.set(h, v);
    }
    return new NextResponse(await upstream.arrayBuffer(), { status: upstream.status, headers: out });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "upstream_unreachable", message: `ODS API unreachable: ${error.message || "request failed"}` } },
      { status: 502 },
    );
  }
}

export const GET = relay;
export const POST = relay;
export const PUT = relay;
export const PATCH = relay;
export const DELETE = relay;
