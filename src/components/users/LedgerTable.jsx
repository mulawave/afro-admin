"use client";

import { useState } from "react";

const TYPE_COLORS = {
  credit: "text-green-700 bg-green-50",
  debit: "text-red-700 bg-red-50",
  gift: "text-purple-700 bg-purple-50",
  swap: "text-blue-700 bg-blue-50",
  adjustment: "text-amber-700 bg-amber-50",
};

export default function LedgerTable({ data, showUser = false }) {
  const [filter, setFilter] = useState("all");

  const types = ["all", ...new Set(data.map((l) => l.type).filter(Boolean))];

  const filtered = filter === "all" ? data : data.filter((l) => l.type === filter);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          Ledger {data.length > 0 && `(${filtered.length})`}
        </h3>

        {types.length > 2 && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <p className="text-sm text-gray-400 py-4 text-center">No ledger entries</p>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {showUser && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                )}
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Currency</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  {showUser && (
                    <td className="px-3 py-2 text-gray-700 font-mono text-xs">{l.uid}</td>
                  )}
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        TYPE_COLORS[l.type] || "text-gray-700 bg-gray-50"
                      }`}
                    >
                      {l.type}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-900">
                    {formatAmount(l)}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs uppercase">
                    {l.currency}
                  </td>
                  <td className="px-3 py-2 text-gray-500 text-xs">
                    {l.created_at ? new Date(l.created_at).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
