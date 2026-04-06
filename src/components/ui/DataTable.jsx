"use client";

import TablePagination from "@/components/ui/TablePagination";
import useTablePagination from "@/hooks/useTablePagination";

export default function DataTable({
  columns,
  rows,
  emptyMessage = "No data",
  pageSizeOptions,
  defaultPageSize = 10,
}) {
  const pagination = useTablePagination(rows, { pageSizeOptions, defaultPageSize });

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/88">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-white/42"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-white/6">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-white/40"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagination.pagedRows.map((row, i) => (
                <tr key={row.id ?? row.uid ?? i} className="transition-colors hover:bg-white/[0.04]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-white/82">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
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
  );
}
