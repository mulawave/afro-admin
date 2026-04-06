"use client";

import { useEffect, useState } from "react";

const BRANDING_CACHE_KEY = "av_branding";
const BRANDING_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function resolveUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://afrovision-backend-134538542038.us-central1.run.app").replace(/\/$/, "");
  return `${base}${path}`;
}

function getCached() {
  try {
    const raw = sessionStorage.getItem(BRANDING_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > BRANDING_CACHE_TTL) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    sessionStorage.setItem(BRANDING_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // ignore
  }
}

export function useBranding() {
  const [branding, setBranding] = useState({ logo_url: null, favicon_url: null });

  useEffect(() => {
    const cached = getCached();
    if (cached) {
      setBranding(cached);
      return;
    }

    const controller = new AbortController();
    fetch("/api/proxy/home/content", { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        const b = payload?.homepage?.branding || { logo_url: null, favicon_url: null };
        const resolved = {
          logo_url: resolveUrl(b.logo_url),
          favicon_url: resolveUrl(b.favicon_url),
        };
        setBranding(resolved);
        setCache(resolved);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return branding;
}
