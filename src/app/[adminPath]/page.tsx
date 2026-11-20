import { getAdminOverviewStats, listOrdersForAdmin } from "@/lib/db/orders.queries";
import { listWebhookLogsRecent } from "@/lib/db/webhook-logs.queries";
import { formatIdr } from "@/lib/utils/cn";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { formatDistanceToNow } from "date-fns";
import { AdminRecentTransactionsTable } from "@/components/admin/AdminRecentTransactionsTable";
import { getAdminPath } from "@/lib/auth";
import Link from "next/link";

export default async function AdminOverviewPage() {
  const [stats, orders, webhooks] = await Promise.all([
    getAdminOverviewStats(),
    listOrdersForAdmin(50),
    listWebhookLogsRecent(50),
  ]);

  const adminPath = getAdminPath();
  const base = `/${adminPath}`;

  const cards = [
    {
      label: "Revenue Hari Ini",
      value: formatIdr(stats.todayRevenue),
      icon: "DollarSign",
      iconColor: "#059669",
      iconBg: "bg-emerald-50 border-emerald-200/70",
      sub: "Transaksi sukses",
      tag: "Hari ini",
      tagClass: "bg-emerald-100/70 text-emerald-800",
      alert: false,
    },
    {
      label: "Revenue Bulan Ini",
      value: formatIdr(stats.monthRevenue),
      icon: "TrendingUp",
      iconColor: "#0073F5",
      iconBg: "bg-blue-50 border-blue-200/70",
      sub: "Akumulasi bulanan",
      tag: "Bulan ini",
      tagClass: "bg-blue-100/70 text-[#0062D1]",
      alert: false,
    },
    {
      label: "Active Learners",
      value: String(stats.learnerCount),
      icon: "Users",
      iconColor: "#7c3aed",
      iconBg: "bg-purple-50 border-purple-200/70",
      sub: "Total siswa aktif",
      tag: "Aktif",
      tagClass: "bg-purple-100/70 text-purple-800",
      alert: false,
    },
    {
      label: "Pending Verify",
      value: String(stats.pendingProofs),
      icon: "Clock",
      iconColor: stats.pendingProofs > 0 ? "#d97706" : "#71717a",
      iconBg: stats.pendingProofs > 0 ? "bg-amber-50 border-amber-200/70" : "bg-zinc-50 border-zinc-200/70",
      sub: "Transfer manual",
      tag: stats.pendingProofs > 0 ? "Perlu Cek" : "Bersih",
      tagClass: stats.pendingProofs > 0 ? "bg-amber-100 text-amber-800" : "bg-zinc-100 text-zinc-600",
      alert: stats.pendingProofs > 0,
    },
    {
      label: "Published Courses",
      value: String(stats.publishedCourses),
      icon: "BookOpen",
      iconColor: "#0284c7",
      iconBg: "bg-sky-50 border-sky-200/70",
      sub: "Program aktif",
      tag: "Katalog",
      tagClass: "bg-sky-100/70 text-sky-800",
      alert: false,
    },
    {
      label: "Live Class Hari Ini",
      value: String(stats.liveClassesToday),
      icon: "Video",
      iconColor: "#e11d48",
      iconBg: "bg-rose-50 border-rose-200/70",
      sub: "Sesi Zoom / Tatap Muka",
      tag: stats.liveClassesToday > 0 ? "Ada Sesi" : "Kosong",
      tagClass: stats.liveClassesToday > 0 ? "bg-rose-100 text-rose-800" : "bg-zinc-100 text-zinc-600",
      alert: false,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
            Admin Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan performa finansial, status transaksi siswa, dan pemantauan sistem English Ready.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`${base}/payments`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-[#0073F5] hover:bg-[#0062D1] shadow-xs hover:shadow transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Kelola Transaksi
          </Link>
          <Link
            href={`${base}/courses`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/80 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Katalog Kelas
          </Link>
        </div>
      </div>

      {/* 6 KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {cards.map((c) => (
          <div
            key={c.label}
            className={`bg-white rounded-xl border p-3.5 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between ${
              c.alert ? "border-amber-300 ring-1 ring-amber-200" : "border-slate-200/80"
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                {c.label}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${c.iconBg}`}>
                <AdminIcon name={c.icon} size={15} color={c.iconColor} />
              </div>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900 tracking-tight font-heading">
                {c.value}
              </p>
              <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                <span className="text-slate-400 truncate text-[10px]">{c.sub}</span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${c.tagClass}`}>
                  {c.tag}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Transactions Table (8 cols) + Webhook Activity Feed (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Recent Transactions Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Recent Transactions
                </h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0062D1] border border-blue-100">
                  {orders.length} Transaksi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar transaksi masuk dan status pembayaran terkini
              </p>
            </div>
            <Link
              href={`${base}/payments`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0073F5] hover:text-[#0062D1] transition-colors"
            >
              Lihat Semua Transaksi
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <AdminRecentTransactionsTable
            orders={orders.map((o) => ({
              id: o.id,
              orderNumber: o.orderNumber,
              buyerName: o.buyerName,
              methodName: o.methodName,
              totalAmount: o.totalAmount,
              status: o.status,
            }))}
          />
        </div>

        {/* Right Column: Webhook Status & Real-time Integrations Feed */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading flex items-center gap-2">
                Webhook Status
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Log event & notifikasi payment gateway
              </p>
            </div>
            <Link
              href={`${base}/audit`}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Semua Log &rarr;
            </Link>
          </div>

          {/* Webhook Events List */}
          <div className="divide-y divide-slate-100">
            {webhooks.slice(0, 10).map((w) => {
              const isOk =
                w.processingStatus === "processed" ||
                w.processingStatus === "received";

              return (
                <div
                  key={w.id}
                  className="py-2.5 flex items-start gap-2.5 hover:bg-slate-50/70 px-1 rounded-lg transition-colors"
                >
                  <div
                    className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${
                      isOk
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                        : "bg-rose-50 border-rose-200 text-rose-600"
                    }`}
                  >
                    {isOk ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-slate-800 truncate font-mono">
                        {w.eventType || "webhook.received"}
                      </p>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          isOk
                            ? "bg-emerald-100/70 text-emerald-800"
                            : "bg-rose-100/70 text-rose-800"
                        }`}
                      >
                        {w.processingStatus}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                        {w.provider}
                      </span>
                      <span>&bull;</span>
                      <span>
                        {formatDistanceToNow(new Date(w.receivedAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* System Health / Integration Status at Bottom */}
          <div className="pt-3 border-t border-slate-100">
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Faspay Payment Gateway
                </span>
                <span className="font-semibold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded text-[10px]">
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  PostgreSQL Neon DB
                </span>
                <span className="font-semibold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded text-[10px]">
                  Connected
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
