"use client";

import { useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
import useTablePagination from "@/hooks/useTablePagination";

const TYPE_COLORS = {
  credit: "text-emerald-200 bg-emerald-500/10",
  debit: "text-red-200 bg-red-500/10",
  gift: "text-indigo-200 bg-indigo-500/10",
  swap: "text-sky-200 bg-sky-500/10",
  adjustment: "text-amber-200 bg-amber-500/10",
};

export default function LedgerTable({ data, showUser = false }) {
  const [filter, setFilter] = useState("all");

  const rows = Array.isArray(data) ? data : [];
  const types = ["all", ...new Set(rows.map((l) => l.type).filter(Boolean))];

  const filtered = filter === "all" ? rows : rows.filter((l) => l.type === filter);
  const pagination = useTablePagination(filtered, { defaultPageSize: 10 });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/78">
          Ledger {rows.length > 0 && `(${filtered.length})`}
        </h3>

        {types.length > 2 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/6 px-2 py-1 text-xs text-white outline-none"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t === "all" ? "All types" : t}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/40">No ledger entries</p>
      ) : (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 bg-white/[0.03]">
                  {showUser && (
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">User</th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Type</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-white/42">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Currency</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {pagination.pagedRows.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.04]">
                    {showUser && (
                      <td className="px-3 py-2 font-mono text-xs text-white/72">{l.uid}</td>
                    )}
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                          TYPE_COLORS[l.type] || "bg-white/8 text-white/72"
                        }`}
                      >
                        {l.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-white">
                      {formatAmount(l)}
                    </td>
                    <td className="px-3 py-2 text-xs uppercase text-white/55">
                      {l.currency}
                    </td>
                    <td className="px-3 py-2 text-xs text-white/55">
                      {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            pageSizeOptions={pagination.pageSizeOptions}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            fromItem={pagination.fromItem}
            toItem={pagination.toItem}
            canGoBack={pagination.canGoBack}
            canGoForward={pagination.canGoForward}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      )}
    </div>
  );
}

function formatAmount(entry) {
  const val = entry.amount_ngn ?? entry.amount_vpt_units ?? entry.amount ?? 0;
  const num = Number(val);
  if (entry.currency === "ngn") {
    return `₦${num.toLocaleString("en-NG")}`;
  }
  return num.toLocaleString("en-NG");
}
