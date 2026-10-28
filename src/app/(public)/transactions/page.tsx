import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listOrdersWithDetailsForUser } from "@/lib/db/orders.queries";
import Link from "next/link";
import { formatIdr } from "@/lib/utils/cn";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { PaymentMethodLogo } from "@/components/checkout/PaymentMethodLogo";
import { CancelButton } from "./CancelButton";

function badgeClass(status: string) {
  if (status === "paid" || status === "processed") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  }
  if (
    status === "pending_verification" ||
    status === "awaiting_payment" ||
    status === "received" ||
    status === "pending"
  ) {
    return "bg-amber-50 text-amber-700 border-amber-200/80";
  }
  if (status === "failed" || status === "expired" || status === "cancelled") {
    return "bg-rose-50 text-rose-700 border-rose-200/80";
  }
  return "bg-blue-50 text-blue-700 border-blue-200/80";
}

function badgeDotClass(status: string) {
  if (status === "paid" || status === "processed") {
    return "bg-emerald-500";
  }
  if (
    status === "pending_verification" ||
    status === "awaiting_payment" ||
    status === "received" ||
    status === "pending"
  ) {
    return "bg-amber-500 animate-pulse";
  }
  if (status === "failed" || status === "expired" || status === "cancelled") {
    return "bg-rose-500";
  }
  return "bg-blue-500";
}

function translateStatus(status: string) {
  switch (status) {
    case "pending":
      return "Menunggu";
    case "awaiting_payment":
      return "Menunggu Pembayaran";
    case "pending_verification":
      return "Verifikasi Bukti";
    case "paid":
      return "Berhasil";
    case "failed":
      return "Gagal";
    case "expired":
      return "Kedaluwarsa";
    case "cancelled":
      return "Dibatalkan";
    default:
      return status;
  }
}

function getPaginationRange(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, "...", total];
  }
  if (current >= total - 2) {
    return [1, "...", total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const resolvedParams = (await searchParams) ?? {};
  const currentStatus = resolvedParams.status || "all";
  const requestedPage = parseInt(resolvedParams.page || "1", 10) || 1;
  const itemsPerPage = 5;

  const allOrders = await listOrdersWithDetailsForUser(Number(session.user.id));

  const isOrderExpired = (o: { status: string; expiresAt: Date | string | null }) =>
    o.status === "expired" ||
    ((o.status === "pending" || o.status === "awaiting_payment") &&
      Boolean(o.expiresAt) &&
      new Date(o.expiresAt!).getTime() <= Date.now());

  const isPendingOrder = (o: { status: string; expiresAt: Date | string | null }) =>
    !isOrderExpired(o) &&
    (o.status === "pending" || o.status === "awaiting_payment" || o.status === "pending_verification");

  const isPaidOrder = (o: { status: string }) => o.status === "paid" || o.status === "processed";

  const isFailedOrder = (o: { status: string; expiresAt: Date | string | null }) =>
    o.status === "cancelled" || o.status === "failed" || isOrderExpired(o);

  const counts = {
    all: allOrders.length,
    pending: allOrders.filter(isPendingOrder).length,
    paid: allOrders.filter(isPaidOrder).length,
    failed: allOrders.filter(isFailedOrder).length,
  };

  let filteredOrders = allOrders;
  if (currentStatus === "pending") {
    filteredOrders = allOrders.filter(isPendingOrder);
  } else if (currentStatus === "paid") {
    filteredOrders = allOrders.filter(isPaidOrder);
  } else if (currentStatus === "failed") {
    filteredOrders = allOrders.filter(isFailedOrder);
  }

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const getUrl = (page: number, status = currentStatus) => {
    const p = new URLSearchParams();
    if (status !== "all") p.set("status", status);
    if (page > 1) p.set("page", page.toString());
    const qs = p.toString();
    return qs ? `/transactions?${qs}` : "/transactions";
  };

  const tabs = [
    { id: "all", label: "Semua", count: counts.all },
    { id: "pending", label: "Menunggu", count: counts.pending },
    { id: "paid", label: "Berhasil", count: counts.paid },
    { id: "failed", label: "Dibatalkan / Kedaluwarsa", count: counts.failed },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/50 w-full py-6 sm:py-10">
      <main className="mx-auto w-full max-w-4xl px-4 flex flex-col gap-6 sm:gap-7">
        {/* Header */}
        <div className="w-full flex flex-col gap-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-heading">
            Riwayat Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Pantau status tagihan dan pembayaran kelas kamu
          </p>
        </div>

        {allOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-8 sm:p-12 text-center shadow-xs">
            <div className="mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
              <LandingIcon name="FileText" size={28} />
            </div>
            <h2 className="mb-2 text-base sm:text-lg font-bold text-zinc-900">
              Belum ada transaksi
            </h2>
            <p className="mb-6 text-xs sm:text-sm text-zinc-500 max-w-md">
              Kamu belum pernah melakukan pembelian kelas apapun. Yuk mulai eksplorasi kelas dan tingkatkan keahlianmu!
            </p>
            <Link
              href="/#harga"
              className="btn btn-primary rounded-xl font-semibold px-6 py-2.5 text-xs sm:text-sm shadow-xs"
            >
              Lihat Kelas Tersedia
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4 sm:gap-5">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-zinc-200/80 -mx-1 px-1 scrollbar-none">
              {tabs.map((tab) => {
                const isActive = currentStatus === tab.id;
                return (
                  <Link
                    key={tab.id}
                    href={getUrl(1, tab.id)}
                    className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[var(--brand)] text-white shadow-xs font-bold"
                        : "bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 border border-zinc-200/70"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Orders List or Filter Empty State */}
            {paginatedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200/80 bg-white p-8 sm:p-10 text-center shadow-xs">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <LandingIcon name="FileText" size={24} />
                </div>
                <h3 className="mb-1 text-sm sm:text-base font-bold text-zinc-900">
                  Tidak ada transaksi
                </h3>
                <p className="mb-4 text-xs sm:text-sm text-zinc-500 max-w-sm">
                  Tidak ditemukan transaksi dengan status ini. Kamu bisa melihat seluruh riwayat transaksi kamu.
                </p>
                <Link
                  href="/transactions"
                  className="btn btn-secondary rounded-xl font-semibold px-4 py-2 text-xs sm:text-sm border-zinc-200"
                >
                  Lihat Semua Transaksi
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 sm:gap-4">
                {paginatedOrders.map((o) => {
                  const isOrderExpired =
                    o.status === "expired" ||
                    ((o.status === "pending" || o.status === "awaiting_payment") &&
                      Boolean(o.expiresAt) &&
                      new Date(o.expiresAt!).getTime() <= Date.now());

                  const isPending =
                    (o.status === "pending" || o.status === "awaiting_payment") &&
                    !isOrderExpired;

                  const isCancelledOrExpired =
                    o.status === "cancelled" ||
                    o.status === "failed" ||
                    isOrderExpired;

                  const displayStatus = isOrderExpired ? "expired" : o.status;

                  return (
                    <div
                      key={o.id}
                      className="flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-2xl border border-zinc-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:shadow-md"
                    >
                      <div className="flex-1 flex flex-col gap-2.5 min-w-0">
                        {/* Header Bar: Order # & Status Badge */}
                        <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-2.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-mono text-xs font-bold text-zinc-500 truncate select-all">
                              #{o.orderNumber}
                            </span>
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold tracking-wide ${badgeClass(
                              displayStatus
                            )}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${badgeDotClass(
                                displayStatus
                              )}`}
                            />
                            {displayStatus === "pending" &&
                            o.proofStatus === "rejected"
                              ? "Unggah Ulang Bukti"
                              : translateStatus(displayStatus)}
                          </span>
                        </div>

                        {/* Course Title */}
                        <h3 className="font-bold text-zinc-900 line-clamp-2 text-sm sm:text-base leading-snug">
                          {o.courseTitle}
                        </h3>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr] gap-2.5 sm:gap-3 rounded-xl bg-zinc-50/70 p-3 sm:p-3.5 border border-zinc-100/90">
                          <div className="col-span-2 sm:col-span-1 flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              Metode Pembayaran
                            </span>
                            <div className="flex items-center gap-2 mt-1 min-w-0">
                              {o.methodCode ? (
                                <PaymentMethodLogo
                                  src={o.logoUrl ?? null}
                                  name={o.methodName || "Pembayaran"}
                                  code={o.methodCode}
                                  size="sm"
                                />
                              ) : null}
                              <span
                                className="text-xs sm:text-sm font-semibold text-zinc-800 truncate"
                                title={o.methodName || ""}
                              >
                                {o.methodName || "—"}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              Total Tagihan
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold text-[var(--brand)] font-heading mt-0.5">
                              {formatIdr(o.totalAmount)}
                            </span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              Tanggal Dibuat
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-zinc-600 mt-0.5">
                              {new Date(o.createdAt).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions Area */}
                      {isPending && (
                        <div className="flex flex-col sm:flex-col items-stretch justify-center gap-2 pt-1 sm:pt-0 sm:pl-4 sm:border-l border-zinc-100 shrink-0 sm:w-48">
                          <Link
                            href={`/checkout?courseId=${o.courseId}&orderNumber=${o.orderNumber}`}
                            className="btn btn-primary w-full text-xs sm:text-sm font-bold py-2.5 px-4 shadow-sm hover:shadow text-center inline-flex items-center justify-center gap-1.5"
                          >
                            <span>Selesaikan Bayar</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </Link>
                          <CancelButton orderId={o.id} />
                        </div>
                      )}

                      {o.status === "paid" && (
                        <div className="flex items-center justify-center pt-1 sm:pt-0 sm:pl-4 sm:border-l border-zinc-100 shrink-0 sm:w-44">
                          <Link
                            href="/profile/elearning"
                            className="btn btn-primary w-full text-xs sm:text-sm font-bold py-2.5 px-4 shadow-sm hover:shadow text-center inline-flex items-center justify-center gap-1.5"
                          >
                            <span>Mulai Belajar</span>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </Link>
                        </div>
                      )}

                      {isCancelledOrExpired && (
                        <div className="flex items-center justify-center pt-1 sm:pt-0 sm:pl-4 sm:border-l border-zinc-100 shrink-0 sm:w-44">
                          <Link
                            href={`/checkout?courseId=${o.courseId}`}
                            className="btn btn-secondary w-full text-xs sm:text-sm font-semibold py-2.5 px-4 border-zinc-200 text-zinc-600 hover:text-[var(--brand)] hover:border-[var(--brand)] text-center inline-flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span>Beli Ulang</span>
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="9 18 15 12 9 6" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-200/80 pt-5">
                <div className="text-xs sm:text-sm text-zinc-500 order-2 sm:order-1 text-center sm:text-left">
                  Menampilkan{" "}
                  <span className="font-bold text-zinc-800">
                    {startIndex + 1}
                  </span>
                  –
                  <span className="font-bold text-zinc-800">{endIndex}</span>{" "}
                  dari{" "}
                  <span className="font-bold text-zinc-800">{totalItems}</span>{" "}
                  transaksi
                </div>

                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  {/* Prev Button */}
                  {hasPrev ? (
                    <Link
                      href={getUrl(currentPage - 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 transition"
                      aria-label="Halaman sebelumnya"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span className="hidden xs:inline">Sebelumnya</span>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-400 cursor-not-allowed opacity-60"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span className="hidden xs:inline">Sebelumnya</span>
                    </button>
                  )}

                  {/* Numbered Buttons (Tablet/Desktop) */}
                  <div className="hidden sm:flex items-center gap-1">
                    {getPaginationRange(currentPage, totalPages).map(
                      (p, idx) => {
                        if (p === "...") {
                          return (
                            <span
                              key={`dots-${idx}`}
                              className="px-2 text-xs font-bold text-zinc-400 select-none"
                            >
                              …
                            </span>
                          );
                        }
                        const pageNum = Number(p);
                        const isCurrent = pageNum === currentPage;
                        return isCurrent ? (
                          <span
                            key={pageNum}
                            aria-current="page"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-xs font-bold text-white shadow-xs"
                          >
                            {pageNum}
                          </span>
                        ) : (
                          <Link
                            key={pageNum}
                            href={getUrl(pageNum)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-transparent hover:border-zinc-200 hover:bg-zinc-100/80 text-xs font-semibold text-zinc-700 transition"
                          >
                            {pageNum}
                          </Link>
                        );
                      }
                    )}
                  </div>

                  {/* Mobile Page Indicator */}
                  <span className="sm:hidden text-xs font-bold text-zinc-700 px-2">
                    {currentPage} / {totalPages}
                  </span>

                  {/* Next Button */}
                  {hasNext ? (
                    <Link
                      href={getUrl(currentPage + 1)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-700 shadow-2xs hover:bg-zinc-50 hover:border-zinc-300 transition"
                      aria-label="Halaman selanjutnya"
                    >
                      <span className="hidden xs:inline">Selanjutnya</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  ) : (
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold text-zinc-400 cursor-not-allowed opacity-60"
                    >
                      <span className="hidden xs:inline">Selanjutnya</span>
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
