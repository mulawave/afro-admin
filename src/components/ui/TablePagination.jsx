"use client";

import { useId } from "react";

export default function TablePagination({
  page,
  pageSize,
  pageSizeOptions,
  totalItems,
  totalPages,
  fromItem,
  toItem,
  canGoBack,
  canGoForward,
  onPageChange,
  onPageSizeChange,
}) {
  const pageSizeId = useId();

  return (
    <div className="flex flex-col gap-3 border-t border-white/8 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs uppercase tracking-[0.2em] text-white/42">
        Showing {fromItem}-{toItem} of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <label className="text-[11px] uppercase tracking-[0.22em] text-white/38" htmlFor={pageSizeId}>
          Rows
        </label>
        <select
          id={pageSizeId}
          value={pageSize}
          onChange={(event) => onPageSizeChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-white outline-none transition focus:border-[var(--av-light-orange)]"
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option} / page
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={!canGoBack}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Previous
        </button>

        <span className="min-w-[6.5rem] text-center text-xs font-medium uppercase tracking-[0.2em] text-white/48">
          Page {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={!canGoForward}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-35"
        >
          Next
        </button>
      </div>
    </div>
  );
}