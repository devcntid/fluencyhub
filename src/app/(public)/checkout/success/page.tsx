import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderStatusPoller } from "@/components/checkout/OrderStatusPoller";
import { getCourseById } from "@/lib/db/courses.queries";
import { getOrderByNumber } from "@/lib/db/orders.queries";
import { formatIdr } from "@/lib/utils/cn";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderNumber?: string }>;
}) {
  const { orderNumber } = await searchParams;
  if (!orderNumber) notFound();
  const order = await getOrderByNumber(orderNumber);
  if (!order) notFound();
  const course = await getCourseById(order.courseId);

  if (order.status === "pending" || order.status === "awaiting_payment") {
    if (order.paymentMethodId) {
      const method = await import("@/lib/db/payment-methods.queries").then(m => m.getPaymentMethodById(order.paymentMethodId!));
      if (method?.type === "manual_transfer") {
        redirect(`/checkout?courseId=${order.courseId}`);
      }
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="card text-center">
        <h1 className="mb-2 text-2xl font-extrabold text-[var(--brand)]">
          {order.status === "paid"
            ? "Pembayaran Berhasil"
            : order.status === "pending_verification"
              ? "Bukti Diterima"
              : "Menunggu Pembayaran"}
        </h1>
        <p className="mb-4 text-sm text-[var(--text-3)]">
          Order {order.orderNumber} · {course?.title}
        </p>
        <p className="mb-6 text-lg font-extrabold">{formatIdr(order.totalAmount)}</p>
        {order.status !== "paid" ? (
          <OrderStatusPoller orderId={order.id} initialStatus={order.status} />
        ) : null}
        <p className="mb-6 text-sm text-[var(--text-3)]">
          {order.status === "paid"
            ? "Akses kelas sudah aktif."
            : order.status === "pending_verification"
              ? "Tim akan verifikasi bukti transfer. Setelah disetujui, kelas terbuka di dashboard."
              : "Selesaikan pembayaran di Snap / VA / e-wallet. Halaman ini akan terbarui setelah webhook terkonfirmasi."}
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/dashboard" className="btn btn-primary btn-lg">
            Ke Dashboard
          </Link>
          {order.status === "pending_verification" && (
            <Link href={`/checkout?courseId=${order.courseId}`} className="btn btn-secondary btn-lg">
              Unggah Ulang Bukti
            </Link>
          )}
          {(order.status === "pending" || order.status === "awaiting_payment") && (
            <Link href={`/checkout?courseId=${order.courseId}&editMethod=1`} className="btn btn-ghost btn-lg">
              Ubah Metode Pembayaran
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
