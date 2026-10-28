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

  const isExpired =
    order.status === "expired" ||
    (Boolean(order.expiresAt) &&
      new Date(order.expiresAt!).getTime() <= Date.now() &&
      order.status !== "paid" &&
      order.status !== "pending_verification");

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className={`card text-center ${isExpired ? "border-rose-200 bg-rose-50/40" : ""}`}>
        {isExpired && (
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
        )}
        <h1 className={`mb-2 text-2xl font-extrabold ${isExpired ? "text-rose-700" : "text-[var(--brand)]"}`}>
          {order.status === "paid"
            ? "Pembayaran Berhasil"
            : isExpired
              ? "Pembayaran Kedaluwarsa"
              : order.status === "pending_verification"
                ? "Bukti Diterima"
                : "Menunggu Pembayaran"}
        </h1>
        <p className="mb-4 text-sm text-[var(--text-3)]">
          Order {order.orderNumber} · {course?.title}
        </p>
        <p className="mb-6 text-lg font-extrabold">{formatIdr(order.totalAmount)}</p>
        {order.status !== "paid" && !isExpired ? (
          <OrderStatusPoller orderId={order.id} initialStatus={order.status} />
        ) : null}
        <p className="mb-6 text-sm text-[var(--text-3)]">
          {order.status === "paid"
            ? "Akses kelas sudah aktif."
            : isExpired
              ? "Batas waktu pembayaran untuk transaksi ini telah habis. Silakan pesan ulang untuk mendapatkan kode pembayaran yang baru."
              : order.status === "pending_verification"
                ? "Tim akan verifikasi bukti transfer. Setelah disetujui, kelas terbuka di dashboard."
                : "Selesaikan pembayaran di Snap / VA / e-wallet. Halaman ini akan terbarui setelah webhook terkonfirmasi."}
        </p>
        <div className="flex flex-col gap-3">
          {isExpired ? (
            <>
              <Link href={`/checkout?courseId=${order.courseId}`} className="btn btn-primary btn-lg">
                Pesan Ulang Kelas
              </Link>
              <Link href="/dashboard" className="btn btn-ghost btn-lg">
                Ke Dashboard
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </main>
  );
}
