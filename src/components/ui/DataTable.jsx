"use client";

import TablePagination from "@/components/ui/TablePagination";
import useTablePagination from "@/hooks/useTablePagination";

export default function DataTable({
  columns,
  rows,
  emptyMessage = "No data",
  pageSizeOptions,
  defaultPageSize = 10,
  storageKey,
  selectable = false,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  getRowId,
}) {
  const pagination = useTablePagination(rows, { pageSizeOptions, defaultPageSize, storageKey });

  const allPagedIds = pagination.pagedRows.map((row) => getRowId ? getRowId(row) : (row.id ?? row.uid));
  const allPagedSelected = selectable && allPagedIds.length > 0 && allPagedIds.every((id) => selectedIds?.has(id));

  return (
    <div className="rounded-[1.75rem] border border-white/8 bg-[var(--admin-surface)] shadow-[0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-white/88">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allPagedSelected}
                    onChange={() => onToggleSelectAll?.(allPagedIds, !allPagedSelected)}
                    className="h-4 w-4 rounded border-white/20 bg-white/6 accent-[var(--av-orange)]"
                  />
                </th>
              )}
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
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-10 text-center text-white/40"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagination.pagedRows.map((row, i) => {
                const rowId = getRowId ? getRowId(row) : (row.id ?? row.uid ?? i);
                const isSelected = selectable && selectedIds?.has(rowId);
                return (
                  <tr key={rowId ?? i} className={`transition-colors hover:bg-white/[0.04] ${isSelected ? "bg-[var(--av-orange)]/[0.06]" : ""}`}>
                    {selectable && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={!!isSelected}
                          onChange={() => onToggleSelect?.(rowId)}
                          className="h-4 w-4 rounded border-white/20 bg-white/6 accent-[var(--av-orange)]"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-white/82">
                        {col.render ? col.render(row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
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
