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
      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 pb-12 sm:pb-16">
        <span className="font-medium self-start sm:self-auto">
          {rowCount === 0 ? "0 rows" : `${start + 1}–${end} of ${rowCount}`}
        </span>
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          <select
            aria-label="Rows per page"
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2.5 pr-7 text-xs font-semibold text-zinc-700 shadow-2xs hover:border-zinc-300 focus:border-[var(--brand,#2563eb)] focus:ring-1 focus:ring-[var(--brand,#2563eb)] outline-none cursor-pointer transition"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 8px center",
              backgroundSize: "13px",
              appearance: "none",
            }}
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n} className="text-zinc-800 text-xs py-1">
                {n} / page
              </option>
            ))}
          </select>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-not-allowed" 
            disabled={safePage <= 1} 
            onClick={() => setPage(safePage - 1)}
          >
            Prev
          </button>
          <span className="whitespace-nowrap px-1 font-semibold text-zinc-700 text-xs">
            Page {safePage} / {totalPages}
          </span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm h-8 px-3 rounded-lg text-xs font-semibold cursor-pointer disabled:cursor-not-allowed" 
            disabled={safePage >= totalPages} 
            onClick={() => setPage(safePage + 1)}
          >
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
