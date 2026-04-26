import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function getBackendBase() {
  const base = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("Admin API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL or API_BASE_URL.");
  }
  return base;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const backendBase = getBackendBase();

    const upstream = await fetch(`${backendBase}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json(
        typeof payload === "object" ? payload : { error: payload },
        { status: upstream.status },
      );
    }

    if (!payload?.token || !payload?.user) {
      return NextResponse.json({ error: "Invalid login response" }, { status: 502 });
    }

    if (payload.user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const response = NextResponse.json({ user: payload.user });

    response.cookies.set("__session", payload.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days — matches JWT expiry
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Login request failed" },
      { status: 502 },
    );
  }
}
