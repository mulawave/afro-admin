import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

function getBackendBase() {
  const base = (process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    throw new Error("Admin API base URL is not configured. Set NEXT_PUBLIC_API_BASE_URL or API_BASE_URL.");
  }
  return base;
}

export async function GET(request) {
  try {
    const token = request.cookies.get("__session")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }

    const backendBase = getBackendBase();
    const upstream = await fetch(`${backendBase}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const contentType = upstream.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    if (!upstream.ok) {
      const res = NextResponse.json(
        typeof payload === "object" ? payload : { error: payload },
        { status: upstream.status },
      );

      if (upstream.status === 401) {
        res.cookies.set("__session", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });
      }

      return res;
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Auth check failed" },
      { status: 502 },
    );
  }
}
