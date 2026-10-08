"use client";

import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { formatIdr } from "@/lib/utils/cn";

type OrderRow = {
  id: number;
  orderNumber: string;
  buyerName: string;
  methodName: string | null;
  totalAmount: string;
  status: string;
};

function badgeClass(status: string) {
  if (status === "paid" || status === "processed") return "badge-success";
  if (status === "pending_verification" || status === "awaiting_payment" || status === "received" || status === "pending") return "badge-warning";
  if (status === "failed" || status === "expired" || status === "cancelled") return "badge-danger";
  return "badge-primary";
}

export function AdminRecentTransactionsTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="tbl-wrap border-none md:border-solid">
      <AdminDataGrid columns={["Order", "Buyer", "Method", "Amount", "Status"]} rowCount={orders.length} pageSize={10}>
        {({ start, end }) =>
          orders.slice(start, end).map((o, i) => (
            <tr key={o.id}>
              <td style={{ fontWeight: 600, color: "var(--text-3)", width: 56 }}>{start + i + 1}</td>
              <td className="hidden md:table-cell" style={{ fontWeight: 700, fontSize: 12, color: "var(--brand)" }}>{o.orderNumber}</td>
              <td style={{ fontSize: 13 }}>{o.buyerName}</td>
              <td className="hidden sm:table-cell" style={{ fontSize: 12, color: "var(--text-3)" }}>{o.methodName ?? "Unknown"}</td>
              <td style={{ fontWeight: 700, fontSize: 13 }}>{formatIdr(o.totalAmount)}</td>
              <td>
                <span className={`badge ${badgeClass(o.status)}`}>{o.status}</span>
              </td>
            </tr>
          ))
        }
      </AdminDataGrid>
    </div>
  );
}
