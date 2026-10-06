import { AdminPaymentsTable } from "@/components/admin/AdminPaymentsTable";
import { listOrdersForAdmin } from "@/lib/db/orders.queries";

export default async function AdminPaymentsPage() {
  const orders = await listOrdersForAdmin(200);
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Transaksi</h1>
        { }
        <a href="/api/admin/export-orders" className="btn btn-secondary btn-sm" target="_blank" download>
          Export CSV
        </a>
      </div>
      <p className="mb-4 text-sm text-[var(--text-3)]">
        Approve a manual transfer to mark it paid and enroll the buyer in the course.
      </p>
      <AdminPaymentsTable
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          buyerName: o.buyerName,
          buyerEmail: o.buyerEmail,
          courseTitle: o.courseTitle,
          methodName: o.methodName,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
        }))}
      />
    </div>
  );
}
