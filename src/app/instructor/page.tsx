import Link from "next/link";
import { EnrollmentBars } from "@/components/instructor/EnrollmentBars";
import {
  getInstructorOverview,
  listInstructorCoursesWithRevenue,
  listInstructorEnrollmentByMonth,
  getInstructorUpcomingLiveClasses,
  getInstructorActionSummary,
} from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";
import { formatIdr } from "@/lib/utils/cn";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { formatTimeWIB, formatDateDayWIB, formatDateMonthWIB } from "@/lib/utils/date";

function getTierPill(tier?: string | null) {
  if (tier === "tier_tinggi") {
    return { label: "Executive 1-on-1", cls: "bg-[#FFF4EC] text-[#C2530A] border-[#F26A12]/25" };
  }
  if (tier === "tier_menengah") {
    return { label: "Cohort Zoom", cls: "bg-blue-50 text-[#0062D1] border-blue-200/80" };
  }
  if (tier === "tier_bawah") {
    return { label: "Mandiri AI", cls: "bg-[#FBF6F1] text-zinc-600 border-[#E6DED4]" };
  }
  return null;
}

export default async function InstructorHomePage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));

  const [stats, courses, months, upcomingLive, actionSummary] = await Promise.all([
    getInstructorOverview(scope),
    listInstructorCoursesWithRevenue(scope),
    listInstructorEnrollmentByMonth(scope, 6),
    getInstructorUpcomingLiveClasses(scope),
    getInstructorActionSummary(scope),
  ]);

  const sharePctNum = Number(stats.sharePct || 70);
  const share = sharePctNum.toFixed(0);
  const avgCompletionNum = Math.min(100, Math.max(0, Number(stats.avgCompletion || 0)));
  const firstName = (session?.user?.name || "Instruktur").trim().split(/\s+/)[0];
  const draftCount = courses.filter((c) => c.status !== "published").length;

  const topCourses = [...courses]
    .sort((a, b) => {
      if (b.enrollmentCount !== a.enrollmentCount) return b.enrollmentCount - a.enrollmentCount;
      return Number(b.revenue) - Number(a.revenue);
    })
    .slice(0, 3);

  const maxCourseEnroll = Math.max(1, ...courses.map((c) => c.enrollmentCount));
  const totalShareRevenue = courses.reduce((sum, c) => sum + Number(c.revenue || 0), 0);
  const totalGrossEstimate =
    sharePctNum > 0 ? totalShareRevenue / (sharePctNum / 100) : totalShareRevenue;
  const totalCourseEnrolled = courses.reduce((sum, c) => sum + Number(c.enrollmentCount || 0), 0);

  const now = new Date();
  const hasAnyLiveNow = upcomingLive.some((lc) => {
    const start = new Date(lc.datetime);
    const end = new Date(start.getTime() + (lc.durationMinutes || 60) * 60 * 1000);
    return now >= start && now < end;
  });

  const nextLive = upcomingLive[0] || null;
  const nextLiveDate = nextLive ? new Date(nextLive.datetime) : null;

  return (
    <div className="anim w-full max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6 pb-8">
      {/* 1. NAVY HERO BANNER + PRIORITY ACTION PANEL */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#0B2559] via-[#102F6E] to-[#163D8A] p-5 sm:p-7 text-white shadow-lg shadow-[#0B2559]/10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-[#0073F5]/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#F26A12]/15 blur-3xl"
        />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left Greeting & Quick Actions */}
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold text-blue-100 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Portal Instruktur • Bagi Hasil {share}%</span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-[family-name:var(--font-heading)] tracking-tight leading-tight">
                Halo, {firstName}!
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-blue-100/85 leading-relaxed">
                Pantau pendapatan, perkembangan siswa, jadwal Live Zoom, dan permintaan sesi
                privat 1-on-1 dalam satu layar.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href="/instructor/courses"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-3.5 py-2 text-xs font-extrabold text-white shadow-sm transition"
              >
                <span>Kelola Kelas</span>
                <span>&rarr;</span>
              </Link>
              <Link
                href="/instructor/curriculum"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition"
              >
                <span>Atur Kurikulum</span>
              </Link>
              <Link
                href="/instructor/private-sessions"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition"
              >
                <span>Sesi 1-on-1</span>
                {actionSummary.pendingPrivateSessions > 0 && (
                  <span className="rounded-full bg-[#F26A12] px-1.5 py-0.2 text-[10px] font-extrabold text-white">
                    {actionSummary.pendingPrivateSessions}
                  </span>
                )}
              </Link>
              <Link
                href="/instructor/students"
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition"
              >
                <span>Daftar Siswa</span>
              </Link>
            </div>
          </div>

          {/* Right: Action Center Glass Card */}
          <div className="w-full lg:w-[320px] shrink-0 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-200">
                Ringkasan Tugas
              </span>
              <span className="text-[10px] font-bold text-emerald-300">Real-time</span>
            </div>

            <Link
              href="/instructor/private-sessions"
              className="flex items-center justify-between gap-2 rounded-xl bg-white/8 hover:bg-white/15 px-3 py-2 transition"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Permintaan 1-on-1</p>
                <p className="text-[10px] text-blue-200/90">
                  {actionSummary.upcomingConfirmedPrivate} sesi terkonfirmasi
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  actionSummary.pendingPrivateSessions > 0
                    ? "bg-[#F26A12] text-white"
                    : "bg-emerald-500/25 text-emerald-100 border border-emerald-300/30"
                }`}
              >
                {actionSummary.pendingPrivateSessions > 0
                  ? `${actionSummary.pendingPrivateSessions} Pending`
                  : "Beres"}
              </span>
            </Link>

            <Link
              href="/instructor/exams"
              className="flex items-center justify-between gap-2 rounded-xl bg-white/8 hover:bg-white/15 px-3 py-2 transition"
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Review Final Exam</p>
                <p className="text-[10px] text-blue-200/90">Tugas ujian masuk siswa</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  actionSummary.pendingExamReviews > 0
                    ? "bg-amber-400 text-[#0B2559]"
                    : "bg-emerald-500/25 text-emerald-100 border border-emerald-300/30"
                }`}
              >
                {actionSummary.pendingExamReviews > 0
                  ? `${actionSummary.pendingExamReviews} Perlu Nilai`
                  : "Beres"}
              </span>
            </Link>

            <div className="flex items-center justify-between gap-2 rounded-xl bg-white/8 px-3 py-2">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">Live Zoom Terdekat</p>
                <p className="text-[10px] text-blue-200/90 truncate">
                  {nextLiveDate
                    ? `${formatDateDayWIB(nextLiveDate)} ${formatDateMonthWIB(nextLiveDate)} • ${formatTimeWIB(nextLiveDate)} WIB`
                    : "Belum ada jadwal"}
                </p>
              </div>
              <span className="shrink-0 text-[11px] font-extrabold text-blue-100">
                {upcomingLive.length} sesi
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FOUR CLEAR KPI STAT CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Revenue */}
        <a
          href="#course-analytics"
          className="group rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-emerald-300 transition flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/70">
              <AdminIcon name="DollarSign" size={20} color="#059669" />
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-extrabold">
              Share {share}%
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)] tracking-tight truncate">
              {formatIdr(stats.instructorRevenue)}
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-600">Pendapatan Saya</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Akumulasi penjualan kelas lunas</p>
          </div>
        </a>

        {/* KPI 2: Total Enrolled (FIXED BLUE ICON!) */}
        <Link
          href="/instructor/students"
          className="group rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#0073F5]/45 transition flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/70">
              <AdminIcon name="Users" size={20} color="#0073F5" />
            </div>
            <span className="text-[11px] font-bold text-[#0062D1] group-hover:translate-x-0.5 transition">
              Lihat &rarr;
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)] tracking-tight">
              {stats.enrolledTotal}
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-600">Total Siswa Terdaftar</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Peserta aktif di seluruh kelasmu</p>
          </div>
        </Link>

        {/* KPI 3: Active Courses */}
        <Link
          href="/instructor/courses"
          className="group rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#0B2559]/35 transition flex flex-col justify-between gap-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2559]/8 border border-[#0B2559]/15">
              <AdminIcon name="BookOpen" size={20} color="#0B2559" />
            </div>
            <span className="rounded-full bg-[#FBF6F1] text-zinc-600 border border-[#E6DED4] px-2 py-0.5 text-[10px] font-bold">
              {draftCount > 0 ? `${draftCount} draf` : "Semua tayang"}
            </span>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)] tracking-tight">
              {stats.publishedCount}{" "}
              <span className="text-xs font-semibold text-zinc-400">/ {courses.length}</span>
            </p>
            <p className="mt-0.5 text-xs font-bold text-zinc-600">Kelas Aktif Tayang</p>
            <p className="mt-0.5 text-[11px] text-zinc-400">Kelola materi &amp; status kelas</p>
          </div>
        </Link>

        {/* KPI 4: Avg Completion */}
        <div className="rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4EC] border border-[#F26A12]/25">
              <AdminIcon name="TrendingUp" size={20} color="#F26A12" />
            </div>
            <span className="rounded-full bg-[#FFF4EC] text-[#C2530A] border border-[#F26A12]/25 px-2 py-0.5 text-[10px] font-extrabold">
              Progres Siswa
            </span>
          </div>
          <div className="space-y-1.5">
            <p className="text-xl sm:text-2xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)] tracking-tight">
              {avgCompletionNum.toFixed(1)}%
            </p>
            <p className="text-xs font-bold text-zinc-600">Rata-rata Penyelesaian</p>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F0EAE2]">
              <div
                className="h-full rounded-full bg-[#F26A12]"
                style={{ width: `${avgCompletionNum}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. BALANCED 2-COLUMN ANALYTICS & UPCOMING SCHEDULE */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Monthly Growth Chart + Top 3 Courses (Zero empty void!) */}
        <div className="xl:col-span-6 rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-extrabold text-[#0B2559]">
                  Pertumbuhan Pendaftaran
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Tren jumlah siswa baru yang mendaftar setiap bulan.
                </p>
              </div>
              <span className="rounded-full bg-[#FBF6F1] border border-[#E6DED4] px-2.5 py-1 text-[11px] font-bold text-[#0B2559] shrink-0">
                6 Bulan Terakhir
              </span>
            </div>

            <EnrollmentBars points={months} />
          </div>

          {/* Top 3 Courses Mini Leaderboard */}
          {topCourses.length > 0 && (
            <div className="pt-4 border-t border-[#F0EAE2] space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
                  Kelas Paling Diminati
                </h3>
                <a
                  href="#course-analytics"
                  className="text-[11px] font-bold text-[#0062D1] hover:underline"
                >
                  Lihat semua &darr;
                </a>
              </div>
              <div className="space-y-2">
                {topCourses.map((c, idx) => (
                  <Link
                    key={c.id}
                    href={`/instructor/curriculum?courseId=${c.id}&tab=curriculum`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#FBF6F1]/75 hover:bg-[#FBF6F1] border border-[#EFE7DC] px-3 py-2.5 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold ${
                          idx === 0
                            ? "bg-[#F26A12] text-white"
                            : "bg-[#0B2559]/10 text-[#0B2559]"
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="truncate text-xs font-bold text-[#0B2559]">{c.title}</span>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 text-right">
                      <span className="rounded-md bg-white border border-[#E6DED4] px-2 py-0.5 text-[11px] font-extrabold text-[#0B2559]">
                        {c.enrollmentCount} siswa
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Upcoming Live Classes */}
        <div className="xl:col-span-6 rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-extrabold text-[#0B2559] flex items-center gap-2">
                  {hasAnyLiveNow ? (
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-600" />
                    </span>
                  ) : (
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F26A12] shrink-0" />
                  )}
                  <span>Jadwal Live Zoom Terdekat</span>
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Sesi mengajar interaktif yang akan segera berlangsung.
                </p>
              </div>
              <Link
                href="/instructor/curriculum"
                className="text-xs font-bold text-[#0062D1] hover:underline shrink-0"
              >
                Kelola Jadwal &rarr;
              </Link>
            </div>

            {upcomingLive.length > 0 ? (
              <div className="space-y-2.5">
                {upcomingLive.map((lc) => {
                  const startDate = new Date(lc.datetime);
                  const dur = lc.durationMinutes || 60;
                  const endDate = new Date(startDate.getTime() + dur * 60 * 1000);
                  const isLive = now >= startDate && now < endDate;

                  return (
                    <div
                      key={lc.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border p-3.5 transition ${
                        isLive
                          ? "border-rose-300 bg-rose-50/40 ring-1 ring-rose-200/70"
                          : "border-[#EFE7DC] bg-[#FBF6F1]/55 hover:bg-white hover:border-[#D5C9B8]"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Date Tile */}
                        <div
                          className={`flex flex-col items-center justify-center w-12 h-12 rounded-xl shrink-0 border ${
                            isLive
                              ? "bg-rose-600 text-white border-rose-600"
                              : "bg-white text-[#0B2559] border-[#E6DED4]"
                          }`}
                        >
                          <span className="text-sm font-extrabold leading-none">
                            {formatDateDayWIB(startDate)}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase mt-0.5 ${
                              isLive ? "text-rose-100" : "text-[#C2530A]"
                            }`}
                          >
                            {formatDateMonthWIB(startDate)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[11px] font-extrabold ${
                                isLive ? "text-rose-600" : "text-[#0062D1]"
                              }`}
                            >
                              {formatTimeWIB(startDate)} – {formatTimeWIB(endDate)} WIB
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-400">
                              • {dur} mnt
                            </span>
                            {isLive && (
                              <span className="rounded-full bg-rose-600 px-2 py-0.2 text-[9px] font-extrabold text-white uppercase tracking-wider">
                                LIVE
                              </span>
                            )}
                          </div>
                          <p
                            className="truncate text-xs sm:text-sm font-extrabold text-[#0B2559] mt-0.5"
                            title={lc.title}
                          >
                            {lc.title}
                          </p>
                          <p className="truncate text-[11px] text-zinc-500">{lc.courseTitle}</p>
                        </div>
                      </div>

                      {/* Quick Action */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {lc.liveClassUrl && (
                          <a
                            href={lc.liveClassUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition ${
                              isLive
                                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
                                : "bg-[#0B2559] hover:bg-[#133882] text-white"
                            }`}
                          >
                            Zoom ↗
                          </a>
                        )}
                        <Link
                          href={`/instructor/curriculum?courseId=${lc.courseId}&tab=curriculum`}
                          className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E6DED4] hover:border-[#0B2559]/35 text-[11px] font-bold text-[#0B2559] transition"
                        >
                          Detail
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DFD5C8] bg-[#FBF6F1]/60 py-10 px-4 text-center space-y-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white border border-[#E6DED4] text-[#0B2559]">
                  <AdminIcon name="Video" size={20} color="#0B2559" />
                </div>
                <div>
                  <p className="text-sm font-extrabold text-[#0B2559]">
                    Belum ada jadwal Live Zoom
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Tambahkan sesi Live Zoom di menu Kurikulum agar siswa bisa langsung bergabung.
                  </p>
                </div>
                <Link
                  href="/instructor/curriculum"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-4 py-2 text-xs font-bold text-white transition"
                >
                  <span>+ Atur Jadwal di Kurikulum</span>
                </Link>
              </div>
            )}
          </div>

          {/* Subtle Private 1-on-1 Footer Shortcut */}
          <div className="pt-3 border-t border-[#F0EAE2] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-zinc-500">
              Sesi privat 1-on-1 terkonfirmasi:{" "}
              <strong className="text-[#0B2559]">
                {actionSummary.upcomingConfirmedPrivate} jadwal
              </strong>
            </span>
            <Link
              href="/instructor/private-sessions"
              className="font-bold text-[#C2530A] hover:text-[#F26A12] hover:underline"
            >
              Atur Slot 1-on-1 &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* 4. COURSE PERFORMANCE & REVENUE ANALYTICS (Responsive Table + Mobile Cards) */}
      <section
        id="course-analytics"
        className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white shadow-xs overflow-hidden"
      >
        <div className="p-5 sm:p-6 border-b border-[#F0EAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-extrabold text-[#0B2559]">
              Performa &amp; Pendapatan Per Kelas
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Rincian siswa terdaftar, estimasi penjualan kotor, dan porsi pendapatanmu ({share}%).
            </p>
          </div>

          <Link
            href="/instructor/courses"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#FBF6F1] border border-[#E6DED4] hover:border-[#0B2559]/35 px-3.5 py-2 text-xs font-bold text-[#0B2559] transition self-start sm:self-auto shrink-0"
          >
            <span>Kelola Semua Kelas &rarr;</span>
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-bold text-[#0B2559]">Belum ada kelas yang dibuat</p>
            <p className="text-xs text-zinc-500">
              Mulai buat kelas pertamamu agar performa dan pendapatan tampil di sini.
            </p>
            <Link
              href="/instructor/courses"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-4 py-2 text-xs font-extrabold text-white transition"
            >
              <span>+ Buat Kelas Baru</span>
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop & iPad Landscape Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FBF6F1]/80 border-b border-[#F0EAE2] text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    <th className="py-3.5 pl-6 pr-3 w-12 text-center">#</th>
                    <th className="py-3.5 px-3">Nama Kelas</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Siswa</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-right">Kotor (Est.)</th>
                    <th className="py-3.5 px-3 whitespace-nowrap text-right">
                      Bagian ({share}%)
                    </th>
                    <th className="py-3.5 pl-3 pr-6 whitespace-nowrap text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3ECE4] text-sm">
                  {courses.map((c, i) => {
                    const shareAmt = Number(c.revenue || 0);
                    const shareRatio = sharePctNum / 100;
                    const gross = shareRatio > 0 ? shareAmt / shareRatio : shareAmt;
                    const enrollBarPct = Math.round((c.enrollmentCount / maxCourseEnroll) * 100);
                    const tierPill = getTierPill(c.tier);

                    return (
                      <tr key={c.id} className="hover:bg-[#FBF6F1]/50 transition-colors">
                        <td className="py-3.5 pl-6 pr-3 text-center text-xs font-bold text-zinc-400">
                          {i + 1}
                        </td>
                        <td className="py-3.5 px-3 min-w-[220px]">
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/instructor/curriculum?courseId=${c.id}&tab=curriculum`}
                              className="font-bold text-[#0B2559] hover:text-[#0062D1] transition leading-snug line-clamp-1"
                              title={c.title}
                            >
                              {c.title}
                            </Link>
                            {tierPill && (
                              <span
                                className={`inline-flex self-start items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${tierPill.cls}`}
                              >
                                {tierPill.label}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border ${
                              c.status === "published"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                c.status === "published" ? "bg-emerald-500" : "bg-amber-500"
                              }`}
                            />
                            {c.status === "published" ? "Tayang" : "Draf"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5 min-w-[95px]">
                            <span className="text-xs font-extrabold text-[#0B2559] w-6">
                              {c.enrollmentCount}
                            </span>
                            <div className="h-1.5 flex-1 max-w-[64px] rounded-full bg-[#F0EAE2] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#0073F5]"
                                style={{ width: `${c.enrollmentCount > 0 ? Math.max(12, enrollBarPct) : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-right text-xs font-semibold text-zinc-600 whitespace-nowrap">
                          {shareAmt > 0 ? formatIdr(gross) : "—"}
                        </td>
                        <td className="py-3.5 px-3 text-right text-xs font-extrabold text-emerald-700 whitespace-nowrap">
                          {shareAmt > 0 ? formatIdr(c.revenue) : "—"}
                        </td>
                        <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              href={`/instructor/curriculum?courseId=${c.id}&tab=curriculum`}
                              className="rounded-lg border border-[#E6DED4] bg-white hover:bg-[#FBF6F1] px-2.5 py-1.5 text-[11px] font-bold text-[#0B2559] transition"
                            >
                              Kurikulum
                            </Link>
                            <Link
                              href={`/dashboard/classroom?c=${c.id}`}
                              className="rounded-lg bg-[#0B2559]/8 hover:bg-[#0B2559]/15 px-2.5 py-1.5 text-[11px] font-bold text-[#0B2559] transition"
                            >
                              Pratinjau
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-[#FBF6F1]/90 border-t border-[#E6DED4] text-xs font-extrabold text-[#0B2559]">
                    <td colSpan={3} className="py-3.5 pl-6 pr-3">
                      Total ({courses.length} kelas)
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">{totalCourseEnrolled} siswa</td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap text-zinc-700">
                      {totalGrossEstimate > 0 ? formatIdr(totalGrossEstimate) : "—"}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap text-emerald-700">
                      {totalShareRevenue > 0 ? formatIdr(totalShareRevenue) : "—"}
                    </td>
                    <td className="py-3.5 pl-3 pr-6" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card List (< md) */}
            <div className="md:hidden divide-y divide-[#F0EAE2]">
              {courses.map((c) => {
                const shareAmt = Number(c.revenue || 0);
                const shareRatio = sharePctNum / 100;
                const gross = shareRatio > 0 ? shareAmt / shareRatio : shareAmt;
                const tierPill = getTierPill(c.tier);

                return (
                  <div key={c.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-sm font-extrabold text-[#0B2559] leading-snug">
                          {c.title}
                        </h3>
                        {tierPill && (
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${tierPill.cls}`}
                          >
                            {tierPill.label}
                          </span>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                          c.status === "published"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                      >
                        {c.status === "published" ? "Tayang" : "Draf"}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#FBF6F1] border border-[#EFE7DC] p-2.5 text-center">
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500">Siswa</p>
                        <p className="text-xs font-extrabold text-[#0B2559] mt-0.5">
                          {c.enrollmentCount}
                        </p>
                      </div>
                      <div className="border-x border-[#E6DED4]">
                        <p className="text-[10px] font-semibold text-zinc-500">Kotor</p>
                        <p className="text-[11px] font-bold text-zinc-700 mt-0.5 truncate px-1">
                          {shareAmt > 0 ? formatIdr(gross) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-zinc-500">Bagian {share}%</p>
                        <p className="text-[11px] font-extrabold text-emerald-700 mt-0.5 truncate px-1">
                          {shareAmt > 0 ? formatIdr(c.revenue) : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/instructor/curriculum?courseId=${c.id}&tab=curriculum`}
                        className="rounded-xl border border-[#E6DED4] bg-white py-2 text-center text-xs font-bold text-[#0B2559] hover:bg-[#FBF6F1] transition"
                      >
                        Kurikulum
                      </Link>
                      <Link
                        href={`/dashboard/classroom?c=${c.id}`}
                        className="rounded-xl bg-[#0B2559] py-2 text-center text-xs font-bold text-white hover:bg-[#133882] transition"
                      >
                        Pratinjau
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
