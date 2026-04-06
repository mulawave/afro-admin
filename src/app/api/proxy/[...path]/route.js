import { NextResponse } from "next/server";

function getBackendBase() {
  return (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "https://afrovision-backend-134538542038.us-central1.run.app").replace(/\/$/, "");
}

function buildTargetUrl(pathSegments, requestUrl) {
  const backendBase = getBackendBase();
  if (!backendBase) {
    throw new Error("Admin API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL or API_BASE_URL.");
  }

  const upstream = new URL(`${backendBase}/${pathSegments.join("/")}`);
  const incoming = new URL(requestUrl);
  upstream.search = incoming.search;
  return upstream;
}

function buildUpstreamHeaders(request) {
  const headers = new Headers();

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("content-type", contentType);
  }

  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("authorization", authorization);
  }

  const accept = request.headers.get("accept");
  if (accept) {
    headers.set("accept", accept);
  }

  return headers;
}

async function proxyRequest(request, context) {
  try {
    const targetUrl = buildTargetUrl((await context.params).path, request.url);
    const headers = buildUpstreamHeaders(request);
    const method = request.method.toUpperCase();
    const body = method === "GET" || method === "HEAD" ? undefined : Buffer.from(await request.arrayBuffer());

    const upstream = await fetch(targetUrl, {
      method,
      headers,
      body,
      redirect: "follow",
    });

    const responseHeaders = new Headers();
    const contentType = upstream.headers.get("content-type");
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
      { status: 502 },
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