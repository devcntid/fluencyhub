"use client";

import { useMemo, useState } from "react";

export function AdminDataGrid({
  columns,
  rowCount,
  pageSize = 10,
  children,
}: {
  columns: string[];
  rowCount: number;
  pageSize?: number;
  children: (ctx: { start: number; end: number; page: number }) => React.ReactNode;
}) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(pageSize);
  const totalPages = Math.max(1, Math.ceil(rowCount / size));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * size;
  const end = Math.min(start + size, rowCount);

  return (
    <div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 56 }}>No</th>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowCount === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-[var(--text-3)]">
                  No rows yet.
                </td>
              </tr>
            ) : (
              children({ start, end, page: safePage })
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-3)]">
        <span>
          {rowCount === 0 ? "0 rows" : `${start + 1}–${end} of ${rowCount}`}
        </span>
        <div className="flex items-center gap-2">
          <select
            className="input w-auto py-1"
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-secondary btn-sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>
            Prev
          </button>
          <span className="whitespace-nowrap">
            Page {safePage} / {totalPages}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePagedSlice<T>(rows: T[], start: number, end: number) {
  return useMemo(() => rows.slice(start, end), [rows, start, end]);
}
