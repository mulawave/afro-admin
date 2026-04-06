"use client";

import { useEffect } from "react";
import { useBranding } from "@/lib/branding";

export default function BrandingHead() {
  const { favicon_url } = useBranding();

  useEffect(() => {
    if (!favicon_url) return;

    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favicon_url;
  }, [favicon_url]);

  return null;
}
