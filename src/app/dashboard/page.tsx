/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { listPublishedCoursesWithInstructor } from "@/lib/db/courses.queries";
import { auth } from "@/lib/session";
import { LandingIcon } from "@/components/landing/LandingIcon";
import {
  getUserDashboardStats,
  getActiveEnrollment,
  getUpcomingLiveClass,
} from "@/lib/db/dashboard.queries";
import { listUserCertificates } from "@/lib/db/certificates.queries";
import {
  getLatestReadyCheckSummaryForUser,
  getStudentProgressSummary,
} from "@/lib/db/speaking.queries";
import { formatTimeWIB, formatDateDayWIB, formatDateMonthWIB } from "@/lib/utils/date";

function tierBadgeMeta(tier?: string) {
  if (tier === "tier_bawah") {
    return { label: "Mandiri · AI 24/7", cls: "bg-blue-50 text-[#0062D1] border-blue-200/70" };
  }
  if (tier === "tier_tinggi") {
    return { label: "Eksekutif / 1-on-1", cls: "bg-[#FFF4EC] text-[#C2530A] border-[#F26A12]/30" };
  }
  return { label: "Live Cohort", cls: "bg-emerald-50 text-emerald-700 border-emerald-200/70" };
}

function isDummyQaCourse(title: string, slug: string) {
  return /^(test\s*\d*|coba[\s-]*aja)$/i.test(title.trim()) || /qa-instructor-crud|coba-aja/i.test(slug);
}

export default async function DashboardHomePage() {
  const session = await auth();
  const userId = session?.user.id ? Number(session.user.id) : null;

  const [
    enrollments,
    allCourses,
    statsData,
    activeEnrollment,
    upcomingLive,
    certificates,
    speakingSummary,
    latestReadyCheck,
  ] = await Promise.all([
    userId ? listEnrollmentsForUser(userId) : Promise.resolve([]),
    listPublishedCoursesWithInstructor(),
    userId
      ? getUserDashboardStats(userId)
      : Promise.resolve({
          totalCompletedLessons: 0,
          totalLessons: 0,
          totalLiveClasses: 0,
          totalResources: 0,
        }),
    userId ? getActiveEnrollment(userId) : Promise.resolve(null),
    userId ? getUpcomingLiveClass(userId) : Promise.resolve(null),
    userId ? listUserCertificates(userId) : Promise.resolve([]),
    userId
      ? getStudentProgressSummary(userId)
      : Promise.resolve({
          readyScore: 0,
          totalPoints: 0,
          streakDays: 0,
          sessionsCount: 0,
          fluencyAvg: 0,
          pronunciationAvg: 0,
          grammarAvg: 0,
          vocabularyAvg: 0,
          weeklyTrend: [],
          recentSessions: [],
        }),
    userId ? getLatestReadyCheckSummaryForUser(userId) : Promise.resolve(null),
  ]);

  const fullName = session?.user.name || "Sobat Ready";
  const firstName = fullName.trim().split(" ")[0];

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const otherCourses = allCourses
    .filter((c) => !enrolledCourseIds.has(c.id) && !isDummyQaCourse(c.title, c.slug))
    .slice(0, 6);

  const overallLessonPct =
    statsData.totalLessons > 0
      ? Math.round((statsData.totalCompletedLessons / statsData.totalLessons) * 100)
      : 0;

  // Ready Score display (prefer speakingSummary.readyScore if > 0, else latestReadyCheck)
  const displayReadyScore =
    speakingSummary.readyScore > 0
      ? speakingSummary.readyScore
      : latestReadyCheck?.overallScore ?? 0;

  const displayReadyLevel =
    latestReadyCheck?.levelTitle ||
    (displayReadyScore >= 81
      ? "Ready to Contribute"
      : displayReadyScore >= 61
      ? "Ready to Connect"
      : displayReadyScore >= 41
      ? "Ready to Speak"
      : displayReadyScore >= 21
      ? "Warming Up"
      : displayReadyScore > 0
      ? "Starter"
      : "Belum Ada Skor");

  const nextLessonHref =
    activeEnrollment && activeEnrollment.nextLesson
      ? activeEnrollment.nextLesson.contentType === "live_class"
        ? `/dashboard/classroom?tab=live&c=${activeEnrollment.course.id}`
        : activeEnrollment.nextLesson.contentType === "document" ||
          activeEnrollment.nextLesson.contentType === "text"
        ? `/dashboard/classroom?tab=resources&c=${activeEnrollment.course.id}`
        : `/dashboard/classroom?tab=videos&c=${activeEnrollment.course.id}&lesson=${activeEnrollment.nextLesson.id}`
      : activeEnrollment
      ? `/dashboard/classroom?c=${activeEnrollment.course.id}`
      : "/programs";

  const scoreGaugeRadius = 26;
  const scoreGaugeCircumference = 2 * Math.PI * scoreGaugeRadius;
  const scoreGaugeDash =
    displayReadyScore > 0
      ? (Math.min(100, Math.max(6, displayReadyScore)) / 100) * scoreGaugeCircumference
      : 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:gap-7 sm:px-6 sm:py-7">
      {/* ==================== 1. SMART LEARNER HERO BANNER ==================== */}
      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#0B2559] via-[#0F3174] to-[#0B2559] p-6 text-white shadow-[0_12px_34px_rgba(11,37,89,0.14)] sm:p-8">
        {/* Subtle Architectural Glows */}
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[#0073F5]/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[#F26A12]/18 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative z-10 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Left: Personalized Greeting + Direct Action Buttons */}
          <div className="space-y-4 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#AFC4EA] backdrop-blur-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>English Ready · Learning Dashboard</span>
            </div>

            <div className="space-y-1.5">
              <h1 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-black tracking-[-0.02em] text-white sm:text-3xl">
                Selamat datang kembali, {firstName}!
              </h1>
              {activeEnrollment ? (
                <p className="m-0 max-w-xl text-sm leading-relaxed text-blue-100/85">
                  Kamu sedang aktif di{" "}
                  <strong className="font-extrabold text-white">
                    {activeEnrollment.course.title}
                  </strong>
                  . Yuk lanjutkan 15 menit latihan hari ini supaya progresmu terus naik!
                </p>
              ) : (
                <p className="m-0 max-w-xl text-sm leading-relaxed text-blue-100/85">
                  Belum ada kelas yang sedang diikuti. Mulai dari tes Ready Check gratis atau pilih program yang paling cocok dengan targetmu!
                </p>
              )}
            </div>

            {/* Direct 1-Click Primary Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <Link
                href={nextLessonHref}
                className="inline-flex items-center gap-2 rounded-xl bg-[#F26A12] px-5 py-3 text-xs font-extrabold text-white no-underline shadow-sm transition hover:bg-[#C2530A] sm:text-sm"
              >
                <span>{activeEnrollment ? "Lanjutkan Belajar" : "Jelajahi Program"}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <Link
                href="/dashboard/speaking"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs font-bold text-white no-underline backdrop-blur-xs transition hover:bg-white/20 sm:text-sm"
              >
                <LandingIcon name="Mic" size={15} color="#FFFFFF" />
                <span>Latihan AI Speaking</span>
              </Link>
            </div>
          </div>

          {/* Right: Ready Score + Streak Snapshot Glass Widget */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
              <div className="flex items-center gap-4">
                {/* Circular Mini Score Ring */}
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={scoreGaugeRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="6"
                    />
                    {displayReadyScore > 0 && (
                      <circle
                        cx="32"
                        cy="32"
                        r={scoreGaugeRadius}
                        fill="none"
                        stroke="#F26A12"
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${scoreGaugeDash} ${scoreGaugeCircumference}`}
                      />
                    )}
                  </svg>
                  <span className="absolute text-base font-black tabular-nums text-white">
                    {displayReadyScore > 0 ? displayReadyScore : "—"}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200/80">
                    Ready Score Kamu
                  </div>
                  <div className="truncate text-base font-extrabold text-white">
                    {displayReadyLevel}
                  </div>
                  {displayReadyScore > 0 ? (
                    <Link
                      href="/dashboard/progress"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-[#FFB07A] no-underline hover:underline"
                    >
                      <span>Lihat grafik perkembangan</span>
                      <span>&rarr;</span>
                    </Link>
                  ) : (
                    <Link
                      href="/ready-check"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs font-bold text-[#FFB07A] no-underline hover:underline"
                    >
                      <span>Cek Ready Score gratis (10 mnt)</span>
                      <span>&rarr;</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* Streak & Points Strip */}
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/12 pt-3">
                <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
                  <span className="text-sm" aria-hidden="true">🔥</span>
                  <div className="min-w-0">
                    <div className="text-sm font-black leading-none tabular-nums text-white">
                      {speakingSummary.streakDays} Hari
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-blue-200/75">
                      Streak Belajar
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
                  <span className="text-sm" aria-hidden="true">⭐</span>
                  <div className="min-w-0">
                    <div className="text-sm font-black leading-none tabular-nums text-[#FFB07A]">
                      {speakingSummary.totalPoints.toLocaleString("id-ID")}
                    </div>
                    <div className="mt-0.5 text-[10px] font-medium text-blue-200/75">
                      Ready Points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 2. FOUR CRISP KPI METRIC CARDS ==================== */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* KPI 1: Lessons Completed */}
        <Link
          href="/dashboard/classroom?c=all"
          className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-[#E6DED4] bg-white p-4 no-underline shadow-[0_1px_4px_rgba(11,37,89,0.03)] transition hover:border-[#0073F5]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Materi Selesai
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <LandingIcon name="CheckCircle" color="currentColor" size={17} />
            </span>
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black tabular-nums text-[#0B2559]">
                {statsData.totalCompletedLessons}
                <span className="text-sm font-bold text-[#94A3B8]">
                  /{statsData.totalLessons}
                </span>
              </span>
              <span className="text-[11px] font-extrabold text-emerald-600">
                {overallLessonPct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFE7DD]">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${overallLessonPct}%` }}
              />
            </div>
          </div>
        </Link>

        {/* KPI 2: Active Courses */}
        <a
          href="#kelas-saya"
          className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-[#E6DED4] bg-white p-4 no-underline shadow-[0_1px_4px_rgba(11,37,89,0.03)] transition hover:border-[#0073F5]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Kelas Aktif
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0073F5]">
              <LandingIcon name="GraduationCap" color="currentColor" size={17} />
            </span>
          </div>
          <div>
            <div className="text-xl font-black tabular-nums text-[#0B2559]">
              {enrollments.length}{" "}
              <span className="text-xs font-bold text-[#64748B]">Program</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-[#64748B]">
              {statsData.totalResources} modul &amp; dokumen belajar
            </div>
          </div>
        </a>

        {/* KPI 3: Live Zoom Sessions */}
        <Link
          href="/dashboard/classroom?tab=live&c=all"
          className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-[#E6DED4] bg-white p-4 no-underline shadow-[0_1px_4px_rgba(11,37,89,0.03)] transition hover:border-[#0073F5]/40 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Sesi Live Zoom
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <LandingIcon name="Video" color="currentColor" size={17} />
            </span>
          </div>
          <div>
            <div className="text-xl font-black tabular-nums text-[#0B2559]">
              {statsData.totalLiveClasses}{" "}
              <span className="text-xs font-bold text-[#64748B]">Sesi</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-[#64748B]">
              Jadwal kelas &amp; roleplay live
            </div>
          </div>
        </Link>

        {/* KPI 4: AI Speaking Practice */}
        <Link
          href="/dashboard/speaking"
          className="group flex flex-col justify-between gap-2.5 rounded-2xl border border-[#E6DED4] bg-white p-4 no-underline shadow-[0_1px_4px_rgba(11,37,89,0.03)] transition hover:border-[#F26A12]/50 hover:shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              Latihan AI Speaking
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#C2530A]">
              <LandingIcon name="Mic" color="currentColor" size={17} />
            </span>
          </div>
          <div>
            <div className="text-xl font-black tabular-nums text-[#0B2559]">
              {speakingSummary.sessionsCount}{" "}
              <span className="text-xs font-bold text-[#64748B]">Sesi</span>
            </div>
            <div className="mt-1 text-[11px] font-bold text-[#C2530A] group-hover:underline">
              Buka AI Studio &rarr;
            </div>
          </div>
        </Link>
      </section>

      {/* ==================== 3. MAIN FOCUS ROW: CONTINUE LEARNING + UPCOMING LIVE ==================== */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left (7 cols): Lanjutkan Belajar */}
        <div className="flex flex-col justify-between rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-6 lg:col-span-7">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h2 className="m-0 font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559] sm:text-lg">
                Lanjutkan Belajar
              </h2>
              <p className="m-0 mt-0.5 text-xs text-[#64748B]">
                Materi berikutnya yang siap kamu selesaikan
              </p>
            </div>
            {activeEnrollment && (
              <Link
                href={`/dashboard/classroom?tab=videos&c=${activeEnrollment.course.id}`}
                className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-[#0062D1] no-underline transition hover:bg-blue-50"
              >
                <span>Semua Materi</span>
                <LandingIcon name="ArrowRight" size={13} color="currentColor" />
              </Link>
            )}
          </div>

          {activeEnrollment && activeEnrollment.nextLesson ? (
            <div className="flex flex-col gap-4 rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/70 p-4 sm:flex-row sm:items-center">
              <Link
                href={nextLessonHref}
                className="group relative aspect-video w-full shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:h-28 sm:w-44"
              >
                {activeEnrollment.course.thumbnailUrl ? (
                  <img
                    src={activeEnrollment.course.thumbnailUrl}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    alt={activeEnrollment.course.title}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#0B2559]/10">
                    <LandingIcon name="Play" color="#0B2559" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-[#0B2559]/25 transition group-hover:bg-[#0B2559]/40">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0B2559] shadow-md transition group-hover:scale-105">
                    <LandingIcon name="Play" size={16} color="#0B2559" />
                  </div>
                </div>
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {activeEnrollment.nextSection?.title && (
                  <span className="inline-block w-fit max-w-full truncate rounded-full border border-blue-200/70 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#0062D1]">
                    {activeEnrollment.nextSection.title}
                  </span>
                )}
                <h3 className="m-0 font-[family-name:var(--font-heading)] text-base font-extrabold leading-snug text-[#0B2559] line-clamp-2">
                  {activeEnrollment.nextLesson.title}
                </h3>
                <p className="m-0 text-xs font-medium text-[#64748B] line-clamp-1">
                  {activeEnrollment.course.title}
                </p>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex min-w-[120px] flex-1 items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#E6DED4]">
                      <div
                        className="h-full rounded-full bg-[#F26A12]"
                        style={{ width: `${activeEnrollment.progressPct}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold tabular-nums text-[#0B2559]">
                      {activeEnrollment.progressPct}%
                    </span>
                  </div>

                  <Link
                    href={nextLessonHref}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#0B2559] px-4 py-2 text-xs font-extrabold text-white no-underline transition hover:bg-[#0073F5]"
                  >
                    <span>Mulai Materi</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D8CBB8] bg-[#FBF6F1]/70 px-5 py-8 text-center">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0073F5] shadow-2xs">
                <LandingIcon name="BookOpen" size={20} color="currentColor" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-extrabold text-[#0B2559]">
                  Belum ada materi yang sedang diputar
                </div>
                <p className="m-0 max-w-sm text-xs text-[#64748B]">
                  Pilih salah satu kelasmu di bawah atau mulai latihan percakapan langsung bersama AI Coach.
                </p>
              </div>
              <Link
                href="/programs"
                className="rounded-xl bg-[#0B2559] px-4 py-2 text-xs font-extrabold text-white no-underline transition hover:bg-[#0073F5]"
              >
                Lihat Katalog Kelas &rarr;
              </Link>
            </div>
          )}
        </div>

        {/* Right (5 cols): Jadwal Live Berikutnya */}
        <div className="flex flex-col justify-between rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-6 lg:col-span-5">
          <div>
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0073F5]" />
                <h2 className="m-0 font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559] sm:text-lg">
                  Jadwal Live Berikutnya
                </h2>
              </div>
              <Link
                href="/dashboard/classroom?tab=live&c=all"
                className="text-xs font-bold text-[#0062D1] no-underline hover:underline"
              >
                Semua &rarr;
              </Link>
            </div>

            {upcomingLive && upcomingLive.datetime ? (
              (() => {
                const startDate = new Date(upcomingLive.datetime);
                const durationMin = upcomingLive.durationMinutes || 60;
                const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
                const now = new Date();
                const isLiveNow = now >= startDate && now < endDate;

                return (
                  <div className="space-y-4">
                    <div
                      className={`flex items-center gap-3.5 rounded-2xl border p-3.5 transition ${
                        isLiveNow
                          ? "border-rose-300 bg-rose-50/40 ring-2 ring-rose-100"
                          : "border-[#EFE7DD] bg-[#FBF6F1]/70"
                      }`}
                    >
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-[#E6DED4] bg-white text-center shadow-2xs">
                        <span className="text-base font-black leading-none text-[#0B2559]">
                          {formatDateDayWIB(startDate)}
                        </span>
                        <span className="mt-0.5 text-[10px] font-extrabold uppercase text-[#C2530A]">
                          {formatDateMonthWIB(startDate)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-xs font-extrabold ${
                              isLiveNow ? "text-rose-600" : "text-[#0062D1]"
                            }`}
                          >
                            {formatTimeWIB(startDate)} – {formatTimeWIB(endDate)} WIB
                          </span>
                          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#64748B] border border-[#EFE7DD]">
                            {durationMin} mnt
                          </span>
                          {isLiveNow && (
                            <span className="inline-flex items-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                              ● LIVE
                            </span>
                          )}
                        </div>
                        <div
                          className="truncate text-sm font-extrabold text-[#0B2559]"
                          title={upcomingLive.title}
                        >
                          {upcomingLive.title}
                        </div>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/classroom?tab=live&c=all#live-${upcomingLive.lessonId}`}
                      className={`block w-full rounded-xl py-3 text-center text-xs font-extrabold text-white no-underline shadow-xs transition sm:text-sm ${
                        isLiveNow
                          ? "bg-rose-600 hover:bg-rose-700"
                          : "bg-[#F26A12] hover:bg-[#C2530A]"
                      }`}
                    >
                      {isLiveNow ? "Masuk Ruang Live Sekarang →" : "Lihat Detail Jadwal Live →"}
                    </Link>
                  </div>
                );
              })()
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/70 px-4 py-6 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#0073F5] shadow-2xs">
                  <LandingIcon name="Calendar" size={18} color="currentColor" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-extrabold text-[#0B2559]">
                    Belum ada sesi live terdekat
                  </div>
                  <p className="m-0 text-xs leading-relaxed text-[#64748B]">
                    Sambil menunggu sesi berikutnya, kamu bisa tetap melatih kelancaran bicara 24/7 bersama AI Coach!
                  </p>
                </div>
                <Link
                  href="/dashboard/speaking"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2559] px-4 py-2 text-xs font-extrabold text-white no-underline transition hover:bg-[#0073F5]"
                >
                  <LandingIcon name="Mic" size={13} color="#FFFFFF" />
                  <span>Mulai Latihan AI Speaking</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== 4. MY COURSES (KELAS SAYA) ==================== */}
      {enrollments.length > 0 && (
        <section id="kelas-saya" className="scroll-mt-24 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <h2 className="m-0 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#0B2559] sm:text-xl">
                Kelas Saya
              </h2>
              <span className="rounded-full border border-blue-200/80 bg-blue-50 px-2.5 py-0.5 text-xs font-extrabold text-[#0062D1]">
                {enrollments.length} Aktif
              </span>
            </div>
            <Link
              href="/dashboard/classroom?c=all"
              className="text-xs font-bold text-[#0062D1] no-underline hover:underline sm:text-sm"
            >
              Buka Semua di Classroom &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => {
              const pct = Math.min(100, Math.max(0, Math.round(Number(e.progressPct) || 0)));
              const badge = tierBadgeMeta(e.course.tier);
              const isCompleted = pct >= 100;

              return (
                <Link
                  key={e.id}
                  href={`/dashboard/classroom?c=${e.courseId}`}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-[#E6DED4] bg-white no-underline shadow-[0_1px_4px_rgba(11,37,89,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0073F5]/45 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    {e.course.thumbnailUrl ? (
                      <img
                        src={e.course.thumbnailUrl}
                        alt={e.course.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#0B2559]/10">
                        <LandingIcon name="Video" color="#0B2559" size={24} />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold backdrop-blur-md ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                    {isCompleted && (
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10.5px] font-extrabold text-white shadow-xs">
                        ✓ Selesai
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-3.5 p-4">
                    <h3 className="m-0 font-[family-name:var(--font-heading)] text-[15px] font-extrabold leading-snug text-[#0B2559] line-clamp-2 group-hover:text-[#0062D1] transition-colors">
                      {e.course.title}
                    </h3>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-[#64748B]">Progres Belajar</span>
                          <span
                            className={`tabular-nums ${
                              isCompleted ? "text-emerald-600" : "text-[#0B2559]"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#EFE7DD]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isCompleted ? "bg-emerald-500" : "bg-[#0073F5]"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-[#F3ECE3] pt-2.5 text-xs font-extrabold text-[#0B2559] group-hover:text-[#0073F5]">
                        <span>{pct > 0 ? "Lanjutkan Kelas" : "Mulai Belajar"}</span>
                        <span aria-hidden="true">&rarr;</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ==================== 5. MY GRADUATION CERTIFICATES ==================== */}
      {certificates.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#0B2559] sm:text-xl">
              Sertifikat Kelulusan &amp; Rapor Kompetensi
            </h2>
            <p className="m-0 mt-0.5 text-xs text-[#64748B]">
              Sertifikat resmi English Ready yang sudah berhasil kamu raih
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="flex flex-col justify-between rounded-[20px] border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-[#FBF6F1] p-5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10.5px] font-extrabold text-emerald-800">
                      ✓ Terverifikasi · Grade {cert.grade}
                    </span>
                    <h3 className="m-0 text-base font-extrabold text-[#0B2559]">
                      {cert.courseTitle}
                    </h3>
                    <p className="m-0 font-mono text-xs text-[#64748B]">{cert.certificateCode}</p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0B2559] text-sm font-black text-white shadow-xs">
                    {cert.grade}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-100 pt-3.5">
                  <span className="text-xs font-semibold text-[#64748B]">
                    Skor Akhir: <strong className="text-[#0B2559]">{cert.finalScore}/100</strong>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/certificates/${cert.certificateCode}?view=certificate`}
                      target="_blank"
                      className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white no-underline transition hover:bg-emerald-700"
                    >
                      Unduh Sertifikat
                    </Link>
                    <Link
                      href={`/certificates/${cert.certificateCode}?view=report`}
                      target="_blank"
                      className="rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2 text-xs font-bold text-[#0B2559] no-underline transition hover:bg-[#FBF6F1]"
                    >
                      Rapor Nilai
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== 6. EXPLORE MORE PROGRAMS ==================== */}
      {otherCourses.length > 0 && (
        <section className="space-y-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="m-0 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#0B2559] sm:text-xl">
                Rekomendasi Program Lainnya
              </h2>
              <p className="m-0 mt-0.5 text-xs text-[#64748B]">
                Tingkatkan kesiapan bahasa Inggrismu ke level berikutnya
              </p>
            </div>
            <Link
              href="/programs"
              className="text-xs font-bold text-[#0062D1] no-underline hover:underline sm:text-sm"
            >
              Lihat Semua Program &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherCourses.map((c) => {
              const badge = tierBadgeMeta(c.tier);
              const priceNum = Number(c.price);
              const origNum = c.originalPrice ? Number(c.originalPrice) : 0;

              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[20px] border border-[#E6DED4] bg-white no-underline shadow-[0_1px_4px_rgba(11,37,89,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0073F5]/45 hover:shadow-md"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
                    {c.thumbnailUrl ? (
                      <img
                        src={c.thumbnailUrl}
                        alt={c.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-[#0B2559]/10">
                        <LandingIcon name="BookOpen" color="#0B2559" size={24} />
                      </div>
                    )}
                    <span
                      className={`absolute left-3 top-3 rounded-full border px-2.5 py-0.5 text-[10.5px] font-extrabold backdrop-blur-md ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                    <div className="space-y-1.5">
                      <h3 className="m-0 font-[family-name:var(--font-heading)] text-[15px] font-extrabold leading-snug text-[#0B2559] line-clamp-2 group-hover:text-[#0062D1] transition-colors">
                        {c.title}
                      </h3>
                      {c.shortDescription && (
                        <p className="m-0 text-xs leading-relaxed text-[#64748B] line-clamp-2">
                          {c.shortDescription}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-between gap-2 border-t border-[#F3ECE3] pt-3">
                      <span className="truncate text-xs font-semibold text-[#64748B]">
                        {c.instructorName}
                      </span>
                      <div className="shrink-0 text-right">
                        {origNum > priceNum && (
                          <span className="block text-[10.5px] font-medium text-[#94A3B8] line-through">
                            Rp {origNum.toLocaleString("id-ID")}
                          </span>
                        )}
                        <span className="text-sm font-black text-[#C2530A]">
                          {c.isFree ? "Gratis" : `Rp ${priceNum.toLocaleString("id-ID")}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
