import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendBase() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://afrovision-backend-zoeqld5lsa-uc.a.run.app"
  ).replace(/\/$/, "");
}

function buildTargetUrl(pathSegments, requestUrl) {
  const backendBase = getBackendBase();

  if (!backendBase) {
    throw new Error(
      "Admin API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL or API_BASE_URL."
    );
  }

  const upstream = new URL(`${backendBase}/${pathSegments.join("/")}`);
  const incoming = new URL(requestUrl);
  upstream.search = incoming.search;

  return upstream;
}

function buildUpstreamHeaders(request) {
  const headers = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const authorization = request.headers.get("authorization");
  if (authorization) headers.set("authorization", authorization);

  const accept = request.headers.get("accept");
  if (accept) headers.set("accept", accept);

  return headers;
}

// Routes the admin app must be able to reach before a session exists
// (login itself, and public branding shown on the login screen).
const PUBLIC_PATH_PREFIXES = ["auth/login", "home/content"];

function isPublicPath(pathSegments) {
  const joined = pathSegments.join("/");
  return PUBLIC_PATH_PREFIXES.some((prefix) => joined === prefix || joined.startsWith(`${prefix}/`));
}

function isAuthorized(request) {
  // This relay forwards to the real backend with no CORS exposure of its
  // own, but without this check it was reachable by anyone as an anonymous
  // relay onto the backend. Require the caller to already hold a bearer
  // token — the backend still independently authorizes the actual route.
  const authorization = request.headers.get("authorization");
  return Boolean(authorization && authorization.startsWith("Bearer ") && authorization.length > "Bearer ".length);
}

async function proxyRequest(request, context) {
  try {
    const { path } = await context.params;

    if (!isPublicPath(path) && !isAuthorized(request)) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const targetUrl = buildTargetUrl(path, request.url);
    const headers = buildUpstreamHeaders(request);
    const method = request.method.toUpperCase();

    const body =
      method === "GET" || method === "HEAD"
        ? undefined
        : Buffer.from(await request.arrayBuffer());

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "follow",
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type") || "";
    if (contentType) {
      responseHeaders.set("content-type", contentType);
    }

    const payload = await upstream.text();

    return new NextResponse(payload, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error.message || "Admin proxy request failed",
        cause: error.cause?.message || null,
      },
      { status: 502 }
    );
  }
}

export async function GET(request, context) {
  return proxyRequest(request, context);
}

export async function POST(request, context) {
  return proxyRequest(request, context);
}

export async function PATCH(request, context) {
  return proxyRequest(request, context);
}

export async function DELETE(request, context) {
  return proxyRequest(request, context);
}

export async function PUT(request, context) {
  return proxyRequest(request, context);
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}