"use client";

import { useState } from "react";
import TablePagination from "@/components/ui/TablePagination";
import useTablePagination from "@/hooks/useTablePagination";

export default function ActivityTab({ subcollections }) {
  const [section, setSection] = useState("transactions");

  const transactions = subcollections?.transactions?.items || [];
  const notifications = subcollections?.notifications?.items || [];
  const walletLedger = subcollections?.wallet_ledger?.items || [];

  return (
    <div className="space-y-4">
      {/* Section Switcher */}
      <div className="flex gap-1.5 rounded-2xl border border-white/8 bg-white/[0.03] p-1">
        <SectionBtn active={section === "transactions"} onClick={() => setSection("transactions")} label={`Transactions (${transactions.length})`} />
        <SectionBtn active={section === "wallet_ledger"} onClick={() => setSection("wallet_ledger")} label={`Wallet Ledger (${walletLedger.length})`} />
        <SectionBtn active={section === "notifications"} onClick={() => setSection("notifications")} label={`Notifications (${notifications.length})`} />
      </div>

      {section === "transactions" && <TransactionsTable data={transactions} />}
      {section === "wallet_ledger" && <WalletLedgerTable data={walletLedger} />}
      {section === "notifications" && <NotificationsTable data={notifications} />}
    </div>
  );
}

function SectionBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-xl px-2 py-2 text-xs font-semibold transition-all ${
        active
          ? "bg-white/10 text-white shadow"
          : "text-white/45 hover:bg-white/[0.05] hover:text-white/65"
      }`}
    >
      {label}
    </button>
  );
}

function TransactionsTable({ data }) {
  const pagination = useTablePagination(data, { defaultPageSize: 10 });

  if (!data.length) return <EmptyState label="No transactions" />;

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Type</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-white/42">Amount</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Description</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {pagination.pagedRows.map((t, i) => (
              <tr key={t._id || i} className="hover:bg-white/[0.04]">
                <td className="px-3 py-2">
                  <TypeBadge type={t.type} isCredit={t.isCredit} />
                </td>
                <td className="px-3 py-2 text-right font-mono text-white">
                  {t.isCredit ? "+" : "-"}{Number(t.amount || 0).toLocaleString("en-NG")}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-xs text-white/60">{t.description || "—"}</td>
                <td className="px-3 py-2 text-xs text-white/55">{fmtDate(t.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

function WalletLedgerTable({ data }) {
  const pagination = useTablePagination(data, { defaultPageSize: 10 });

  if (!data.length) return <EmptyState label="No wallet ledger entries" />;

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Type</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Direction</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-white/42">Amount</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Currency</th>
              <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-white/42">Balance After</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {pagination.pagedRows.map((l, i) => (
              <tr key={l._id || i} className="hover:bg-white/[0.04]">
                <td className="px-3 py-2 text-xs text-white/70">{l.type || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`text-xs font-medium ${l.direction === "credit" ? "text-emerald-300" : "text-red-300"}`}>
                    {l.direction || "—"}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-white">{Number(l.amount || l.delta || 0).toLocaleString("en-NG")}</td>
                <td className="px-3 py-2 text-xs uppercase text-white/55">{l.currency || "—"}</td>
                <td className="px-3 py-2 text-right font-mono text-white/70">{l.balanceAfter != null ? Number(l.balanceAfter).toLocaleString("en-NG") : "—"}</td>
                <td className="px-3 py-2 text-xs text-white/55">{fmtDate(l.createdAt || l.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

function NotificationsTable({ data }) {
  const pagination = useTablePagination(data, { defaultPageSize: 10 });

  if (!data.length) return <EmptyState label="No notifications" />;

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Channel</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Title</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Body</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Read</th>
              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-white/42">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {pagination.pagedRows.map((n, i) => (
              <tr key={n._id || i} className="hover:bg-white/[0.04]">
                <td className="px-3 py-2 text-xs text-white/70">{n.channel || "—"}</td>
                <td className="px-3 py-2 text-xs font-medium text-white/80">{n.title || "—"}</td>
                <td className="max-w-[180px] truncate px-3 py-2 text-xs text-white/55">{n.body || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-block h-2 w-2 rounded-full ${n.read ? "bg-white/30" : "bg-emerald-400"}`} />
                </td>
                <td className="px-3 py-2 text-xs text-white/55">{fmtDate(n.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination {...pagination} onPageChange={pagination.setPage} onPageSizeChange={pagination.setPageSize} />
    </div>
  );
}

function TypeBadge({ type, isCredit }) {
  const color = isCredit
    ? "text-emerald-200 bg-emerald-500/10"
    : "text-red-200 bg-red-500/10";
  return (
    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${color}`}>
      {type || (isCredit ? "credit" : "debit")}
    </span>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] py-8 text-center text-sm text-white/40">
      {label}
    </div>
  );
}

function fmtDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "—" : d.toLocaleString();
  } catch {
    return "—";
  }
}
