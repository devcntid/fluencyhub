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

function formatStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "processed") {
    return {
      label: "Berhasil",
      dotClass: "bg-emerald-500",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    };
  }
  if (s === "pending" || s === "pending_verification" || s === "awaiting_payment" || s === "received") {
    return {
      label: "Pending",
      dotClass: "bg-amber-500 animate-pulse",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200/90",
    };
  }
  if (s === "failed" || s === "expired" || s === "cancelled") {
    return {
      label: s === "expired" ? "Expired" : s === "cancelled" ? "Batal" : "Gagal",
      dotClass: "bg-rose-500",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200/90",
    };
  }
  return {
    label: status,
    dotClass: "bg-slate-400",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-200",
  };
}

export function AdminRecentTransactionsTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="w-full overflow-hidden">
      <AdminDataGrid columns={["Order ID", "Pembeli", "Metode Pembayaran", "Total Nominal", "Status"]} rowCount={orders.length} pageSize={10}>
        {({ start, end }) =>
          orders.slice(start, end).map((o, i) => {
            const statusInfo = formatStatus(o.status);
            const initial = (o.buyerName || "U").trim().charAt(0).toUpperCase();

            return (
              <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="text-center font-medium text-slate-400 text-xs w-12 py-3">
                  {start + i + 1}
                </td>
                <td className="py-3 whitespace-nowrap">
                  <span className="font-mono text-xs font-bold text-[#0062D1] bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60 inline-flex items-center gap-1">
                    <span className="opacity-50">#</span>{o.orderNumber}
                  </span>
                </td>
                <td className="py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0B2559] to-[#0073F5] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {initial}
                    </div>
                    <span className="font-semibold text-slate-800 text-xs truncate max-w-[150px] sm:max-w-none">
                      {o.buyerName || "Anonim"}
                    </span>
                  </div>
                </td>
                <td className="py-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    {o.methodName ?? "Direct Transfer"}
                  </span>
                </td>
                <td className="py-3 whitespace-nowrap font-mono font-bold text-xs text-slate-900">
                  {formatIdr(o.totalAmount)}
                </td>
                <td className="py-3 whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusInfo.badgeClass}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dotClass}`} />
                    {statusInfo.label}
                  </span>
                </td>
              </tr>
            );
          })
        }
      </AdminDataGrid>
    </div>
  );
}
