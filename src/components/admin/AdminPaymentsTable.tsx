"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { formatIdr } from "@/lib/utils/cn";

type Row = {
  id: number;
  orderNumber: string;
  buyerName: string;
  buyerEmail: string;
  courseTitle: string;
  methodName: string | null;
  totalAmount: string;
  status: string;
  createdAt: string;
};

function tone(status: string) {
  if (status === "paid") return "badge badge-success";
  if (status === "pending_verification" || status === "awaiting_payment") return "badge badge-warning";
  if (status === "failed" || status === "expired" || status === "cancelled") return "badge badge-danger";
  return "badge badge-primary";
}

export function AdminPaymentsTable({ orders }: { orders: Row[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(q) ||
      o.buyerName.toLowerCase().includes(q) ||
      o.buyerEmail.toLowerCase().includes(q) ||
      o.courseTitle.toLowerCase().includes(q) ||
      (o.methodName && o.methodName.toLowerCase().includes(q)) ||
      o.status.toLowerCase().includes(q)
    );
  });

  async function approve(id: number) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/orders/${id}/approve`, { method: "POST" });
    setBusyId(null);
    if (!res.ok) {
      setError("Approve failed. Check the order and try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-[var(--red)]">{error}</p> : null}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">Transaksi</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="input !pl-9 text-sm py-1.5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      <AdminDataGrid columns={["Order", "Buyer", "Course", "Method", "Amount", "Status", "Date", "Actions"]} rowCount={filteredOrders.length}>
        {({ start, end }) =>
          filteredOrders.slice(start, end).map((o, i) => {
            const canApprove = !["paid", "cancelled", "refunded", "failed", "expired"].includes(o.status);
            return (
              <tr key={o.id}>
                <td className="text-[var(--text-3)]">{start + i + 1}</td>
                <td className="font-semibold">{o.orderNumber}</td>
                <td>
                  {o.buyerName}
                  <p className="text-xs text-[var(--text-4)]">{o.buyerEmail}</p>
                </td>
                <td>{o.courseTitle}</td>
                <td>{o.methodName ?? "—"}</td>
                <td>{formatIdr(o.totalAmount)}</td>
                <td>
                  <span className={tone(o.status)}>{o.status}</span>
                </td>
                <td>{new Date(o.createdAt).toLocaleString("id-ID")}</td>
                <td>
                  {canApprove ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      disabled={busyId === o.id}
                      onClick={() => approve(o.id)}
                    >
                      Approve & enroll
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })
        }
      </AdminDataGrid>
    </div>
  );
}
