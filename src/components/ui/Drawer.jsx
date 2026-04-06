"use client";

import { useEffect, useRef } from "react";

export default function Drawer({ open, onClose, title, children, width = "max-w-lg" }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[rgba(2,6,23,0.72)] backdrop-blur-sm"
        onClick={onClose}
      />

      <div className={`relative ${width} h-full w-full border-l border-white/10 bg-[var(--admin-surface-strong)] shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl flex flex-col`}>
        <div className="flex items-center justify-between border-b border-white/8 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-white/8 bg-white/5 p-2 text-white/55 transition-colors hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
