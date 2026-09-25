"use client";

import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function normalizePageSizeOptions(pageSizeOptions) {
  const source = Array.isArray(pageSizeOptions) && pageSizeOptions.length > 0
    ? pageSizeOptions
    : DEFAULT_PAGE_SIZE_OPTIONS;

  return [...new Set(
    source
      .map((value) => Number(value))
      .filter((value) => Number.isInteger(value) && value > 0),
  )].sort((left, right) => left - right);
}

function getStorageKey(storageKey) {
  if (storageKey) return `av-pagination:${storageKey}`;
  if (typeof window !== "undefined") return `av-pagination:${window.location.pathname}`;
  return null;
}

function readStoredState(storageKey, fallbackPageSize) {
  if (!storageKey) return null;
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed;
  } catch {}
  return null;
}

export default function useTablePagination(rows, options = {}) {
  const { pageSizeOptions, defaultPageSize, storageKey } = options;

  const normalizedPageSizeOptions = useMemo(
    () => normalizePageSizeOptions(pageSizeOptions),
    [pageSizeOptions],
  );

  const resolvedDefaultPageSize = normalizedPageSizeOptions.includes(defaultPageSize)
    ? defaultPageSize
    : normalizedPageSizeOptions[0];

  const resolvedStorageKey = getStorageKey(storageKey);
  const stored = readStoredState(resolvedStorageKey, resolvedDefaultPageSize);

  const [page, setPage] = useState(stored?.page ?? 1);
  const [pageSize, setPageSize] = useState(
    normalizedPageSizeOptions.includes(stored?.pageSize) ? stored.pageSize : resolvedDefaultPageSize,
  );

  useEffect(() => {
    if (!resolvedStorageKey) return;
    try {
      sessionStorage.setItem(resolvedStorageKey, JSON.stringify({ page, pageSize }));
    } catch {}
  }, [resolvedStorageKey, page, pageSize]);

  useEffect(() => {
    if (!normalizedPageSizeOptions.includes(pageSize)) {
      setPageSize(resolvedDefaultPageSize);
    }
  }, [normalizedPageSizeOptions, pageSize, resolvedDefaultPageSize]);

  const totalItems = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const startIndex = (page - 1) * pageSize;
  const pagedRows = useMemo(
    () => rows.slice(startIndex, startIndex + pageSize),
    [pageSize, rows, startIndex],
  );

  return {
    page,
    pageSize,
    pageSizeOptions: normalizedPageSizeOptions,
    pagedRows,
    totalItems,
    totalPages,
    canGoBack: page > 1,
    canGoForward: page < totalPages,
    fromItem: totalItems === 0 ? 0 : startIndex + 1,
    toItem: totalItems === 0 ? 0 : Math.min(totalItems, startIndex + pageSize),
    setPage,
    setPageSize: (nextPageSize) => {
      const parsedPageSize = Number(nextPageSize);
      if (!normalizedPageSizeOptions.includes(parsedPageSize)) return;
      setPage(1);
      setPageSize(parsedPageSize);
    },
  };
}