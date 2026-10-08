import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listOrdersWithDetailsForUser } from "@/lib/db/orders.queries";
import Link from "next/link";
import { formatIdr } from "@/lib/utils/cn";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { CancelButton } from "./CancelButton";

function badgeClass(status: string) {
  if (status === "paid" || status === "processed") return "bg-green-100 text-green-700 border-green-200";
  if (status === "pending_verification" || status === "awaiting_payment" || status === "received" || status === "pending") return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (status === "failed" || status === "expired" || status === "cancelled") return "bg-red-100 text-red-700 border-red-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

function translateStatus(status: string) {
  switch (status) {
    case "pending": return "Menunggu";
    case "awaiting_payment": return "Menunggu Pembayaran";
    case "pending_verification": return "Menunggu Verifikasi";
    case "paid": return "Berhasil";
    case "failed": return "Gagal";
    case "expired": return "Kedaluwarsa";
    case "cancelled": return "Dibatalkan";
    default: return status;
  }
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const orders = await listOrdersWithDetailsForUser(Number(session.user.id));

  return (
    <div className="min-h-screen bg-zinc-50/30 w-full py-8 md:py-12">
      <main className="mx-auto w-full max-w-4xl px-4 flex flex-col gap-10">
      {/* Header */}
      <div className="w-full flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-zinc-900">Riwayat Transaksi</h1>
        <p className="text-sm text-zinc-500">
          Pantau status tagihan dan pembayaran kamu
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <LandingIcon name="FileText" size={32} />
          </div>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">Belum ada transaksi</h2>
          <p className="mb-6 text-sm text-zinc-500 max-w-md">
            Kamu belum pernah melakukan pembelian kelas apapun. Yuk mulai eksplorasi kelas dan tingkatkan keahlianmu!
          </p>
          <Link href="/#harga" className="btn btn-primary rounded-lg font-semibold px-6 py-2.5">
            Lihat Kelas Tersedia
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            const isPending = o.status === "pending" || o.status === "awaiting_payment";
            return (
              <div key={o.id} className="flex flex-col sm:flex-row gap-5 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-zinc-400">#{o.orderNumber}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${badgeClass(o.status)}`}>
                      {translateStatus(o.status)}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-zinc-900 line-clamp-2">
                    {o.courseTitle}
                  </h3>
                  
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Metode Pembayaran</span>
                      <span className="font-semibold text-zinc-700">{o.methodName || "—"}</span>
                    </div>
                    <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Total Pembayaran</span>
                      <span className="font-bold text-[var(--brand)]">{formatIdr(o.totalAmount)}</span>
                    </div>
                    <div className="h-8 w-px bg-zinc-200 hidden sm:block" />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Tanggal Dibuat</span>
                      <span className="font-medium text-zinc-600">
                        {new Date(o.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>

                {isPending && (
                  <div className="flex flex-col gap-2 sm:pl-4 sm:border-l border-zinc-100 justify-center">
                    <Link 
                      href={o.methodType === 'manual_transfer' ? `/checkout?courseId=${o.courseId}` : `/checkout/success?orderNumber=${o.orderNumber}`} 
                      className="btn btn-primary w-full sm:w-auto text-sm py-2 px-6"
                    >
                      Selesaikan Pembayaran
                    </Link>
                    <CancelButton orderId={o.id} />
                  </div>
                )}
                
                {o.status === "paid" && (
                  <div className="flex items-center sm:pl-4 sm:border-l border-zinc-100">
                    <Link href={`/profile/elearning`} className="btn btn-secondary w-full sm:w-auto text-sm py-2 px-6 border-zinc-200 text-zinc-700 bg-zinc-50 hover:bg-zinc-100">
                      Mulai Belajar
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
    </div>
  );
}
