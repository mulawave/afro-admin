"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const ACTIONABLE_SELECTOR = [
  "button",
  "a[href]",
  "input[type='submit']",
  "input[type='button']",
  "[role='button']",
].join(",");

const MIN_SPINNER_MS = 350;
const BUTTON_FALLBACK_MS = 1800;
const LINK_FALLBACK_MS = 8000;

function isDisabled(element) {
  return (
    element.hasAttribute("disabled")
    || element.getAttribute("aria-disabled") === "true"
    || element.dataset.noPending === "true"
  );
}

function isModifiedClick(event) {
  return event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
}

export default function InteractionFeedbackProvider() {
  const pathname = usePathname();
  const activeElementRef = useRef(null);
  const requestCountRef = useRef(0);
  const startedAtRef = useRef(0);
  const fallbackTimerRef = useRef(null);

  function clearFallbackTimer() {
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }

  function releasePendingElement() {
    clearFallbackTimer();
    const activeElement = activeElementRef.current;
    if (!activeElement) return;

    activeElement.classList.remove("admin-pending-click");
    activeElement.removeAttribute("aria-busy");
    activeElementRef.current = null;
    startedAtRef.current = 0;
  }

  function scheduleRelease(delay) {
    clearFallbackTimer();
    fallbackTimerRef.current = window.setTimeout(() => {
      if (requestCountRef.current === 0) {
        releasePendingElement();
      }
    }, delay);
  }

  function releaseWhenSettled() {
    const elapsed = Date.now() - startedAtRef.current;
    const delay = Math.max(0, MIN_SPINNER_MS - elapsed);
    scheduleRelease(delay);
  }

  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (...args) => {
      requestCountRef.current += 1;

      try {
        return await originalFetch(...args);
      } finally {
        requestCountRef.current = Math.max(0, requestCountRef.current - 1);
        if (requestCountRef.current === 0 && activeElementRef.current) {
          releaseWhenSettled();
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    function handleClick(event) {
      const target = event.target instanceof Element ? event.target.closest(ACTIONABLE_SELECTOR) : null;
      if (!target) return;
      if (isModifiedClick(event)) return;
      if (isDisabled(target)) return;

      if (activeElementRef.current && activeElementRef.current !== target) {
        releasePendingElement();
      }

      activeElementRef.current = target;
      startedAtRef.current = Date.now();
      target.classList.add("admin-pending-click");
      target.setAttribute("aria-busy", "true");

      const isLink = target.tagName === "A";
      scheduleRelease(isLink ? LINK_FALLBACK_MS : BUTTON_FALLBACK_MS);
    }

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  useEffect(() => {
    if (!activeElementRef.current) return;
    releaseWhenSettled();
  }, [pathname]);

  useEffect(() => () => releasePendingElement(), []);

  return null;
}