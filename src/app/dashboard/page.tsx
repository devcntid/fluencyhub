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
import { formatTimeWIB, formatDateDayWIB, formatDateMonthWIB } from "@/lib/utils/date";

export default async function DashboardHomePage() {
  const session = await auth();
  const enrollments = session?.user.id
    ? await listEnrollmentsForUser(Number(session.user.id))
    : [];

  const allCourses = await listPublishedCoursesWithInstructor();
  
  const userId = session?.user.id ? Number(session.user.id) : null;
  const [statsData, activeEnrollment, upcomingLive, certificates] = await Promise.all([
    userId ? getUserDashboardStats(userId) : Promise.resolve({ totalCompletedLessons: 0, totalLessons: 0, totalLiveClasses: 0, totalResources: 0 }),
    userId ? getActiveEnrollment(userId) : Promise.resolve(null),
    userId ? getUpcomingLiveClass(userId) : Promise.resolve(null),
    userId ? listUserCertificates(userId) : Promise.resolve([]),
  ]);

  const stats = [
    { icon: "CheckCircle", bg: "bg-green-50", c: "#16a34a", lbl: "Lesson Selesai", val: `${statsData.totalCompletedLessons}/${statsData.totalLessons}` },
    { icon: "Video", bg: "bg-blue-50", c: "#2563eb", lbl: "Sesi Live", val: `${statsData.totalLiveClasses}` },
    { icon: "FileText", bg: "bg-purple-50", c: "#7c3aed", lbl: "Resources", val: `${statsData.totalResources}` },
  ];

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId));
  const otherCourses = allCourses.filter((c) => !enrolledCourseIds.has(c.id));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 flex flex-col gap-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-700)] p-6 text-white md:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative z-10">
          <h2 className="mb-1 font-[family-name:var(--font-heading)] text-2xl font-extrabold md:text-3xl">
            Welcome back, {session?.user.name}! 👋
          </h2>
          {activeEnrollment ? (
            <>
              <p className="mb-6 text-sm text-white/80">
                Anda di <strong className="text-yellow-200">{activeEnrollment.course.title}</strong>. Terus semangat!
              </p>
              <div className="inline-block rounded-xl bg-black/20 p-4">
                <div className="mb-2 flex justify-between text-xs font-semibold text-white/90 gap-8">
                  <span>Progress Belajar</span>
                  <span>{activeEnrollment.progressPct}%</span>
                </div>
                <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20 md:w-64">
                  <div className="h-full bg-yellow-200" style={{ width: `${activeEnrollment.progressPct}%` }} />
                </div>
              </div>
            </>
          ) : (
            <p className="mt-4 text-sm text-white/80">
              Belum ada kelas aktif. Yuk cari kelas baru!
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s, idx) => (
          <div key={idx} className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${s.bg}`}>
              <LandingIcon name={s.icon} color={s.c} />
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-900">{s.val}</div>
              <div className="text-xs font-medium text-zinc-500">{s.lbl}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* Lanjutkan Belajar */}
        <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">Lanjutkan Belajar</h3>
            {activeEnrollment && (
              <Link href={`/dashboard/classroom?c=${activeEnrollment.course.id}`} className="flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-[var(--brand)]">
                Lihat Semua <LandingIcon name="ArrowRight" color="currentColor" />
              </Link>
            )}
          </div>
          
          {activeEnrollment && activeEnrollment.nextLesson ? (
            <Link 
              href={
                activeEnrollment.nextLesson.contentType === "live_class" 
                  ? `/dashboard/live#live-${activeEnrollment.nextLesson.id}` 
                  : (activeEnrollment.nextLesson.contentType === "document" || activeEnrollment.nextLesson.contentType === "text")
                  ? `/dashboard/resources/${activeEnrollment.nextLesson.id}`
                  : `/dashboard/courses/${activeEnrollment.course.id}/${activeEnrollment.nextLesson.id}`
              } 
              className="group block"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-xl bg-zinc-100">
                  {activeEnrollment.course.thumbnailUrl ? (
                    <img src={activeEnrollment.course.thumbnailUrl} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" alt="Thumbnail" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <LandingIcon name="Play" color="#9ca3af" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/40">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-md">
                      <LandingIcon name="Play" color="#fff" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="mb-2 inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                    {activeEnrollment.nextSection?.title}
                  </span>
                  <h4 className="mb-1 font-[family-name:var(--font-heading)] text-base font-bold text-zinc-900 group-hover:text-[var(--brand)] transition-colors">
                    {activeEnrollment.nextLesson.title}
                  </h4>
                  <p className="text-sm text-zinc-500 line-clamp-1">{activeEnrollment.course.title}</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="text-sm text-zinc-500">
              Belum ada materi yang bisa dilanjutkan.
            </div>
          )}
        </div>

        {/* Live Mendatang */}
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Live Mendatang</span>
          </div>
          
          {upcomingLive && upcomingLive.datetime ? (() => {
            const startDate = new Date(upcomingLive.datetime);
            const durationMin = upcomingLive.durationMinutes || 60;
            const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);
            const now = new Date();
            const isLiveNow = now >= startDate && now < endDate;

            return (
              <>
                <div className={`mb-4 flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border transition-all ${
                  isLiveNow ? "border-red-300 ring-2 ring-red-100 shadow-red-50" : "border-zinc-100"
                }`}>
                  <div className="text-center px-2">
                    <div className="text-sm font-bold text-zinc-900">
                      {formatDateDayWIB(startDate)}
                    </div>
                    <div className="text-xs font-semibold text-zinc-500 uppercase">
                      {formatDateMonthWIB(startDate)}
                    </div>
                  </div>
                  <div className="h-8 w-px bg-zinc-100" />
                  <div className="flex-1 px-3 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className={`text-xs font-bold ${isLiveNow ? "text-red-600" : "text-blue-600"}`}>
                        {formatTimeWIB(startDate)} - {formatTimeWIB(endDate)} WIB
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                        {durationMin} mnt
                      </span>
                      {isLiveNow && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5 animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping inline-block" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm font-bold text-zinc-900" title={upcomingLive.title}>
                      {upcomingLive.title}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/dashboard/classroom?tab=live&c=all#live-${upcomingLive.lessonId}`}
                  className={`block w-full text-center rounded-xl py-3 text-sm font-bold text-white transition shadow-sm ${
                    isLiveNow
                      ? "bg-red-600 hover:bg-red-700 shadow-red-200 animate-pulse"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  }`}
                >
                  {isLiveNow ? "Join Live Room Sekarang" : "Lihat Jadwal Live"}
                </Link>
              </>
            );
          })() : (
            <div className="flex h-20 items-center justify-center text-sm text-zinc-500">
              Tidak ada jadwal live terdekat.
            </div>
          )}
        </div>
      </div>

      {/* Kelas Saya */}
      {enrollments.length > 0 && (
        <>
          <hr className="border-zinc-100 my-4" />
          <div>
            <h2 className="mb-4 text-xl font-extrabold text-zinc-900">Kelas Saya</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {enrollments.map((e) => (
                <Link key={e.id} href={`/dashboard/classroom?c=${e.courseId}`} className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md">
                  <div className="relative h-32 w-full bg-zinc-100">
                    {e.course.thumbnailUrl ? (
                      <img src={e.course.thumbnailUrl} alt={e.course.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-zinc-200">
                        <LandingIcon name="Video" color="#9ca3af" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur-md">
                      {e.progressPct}% Selesai
                    </div>
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-zinc-900 line-clamp-2">{e.course.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sertifikat Kelulusan Saya */}
          {certificates.length > 0 && (
            <>
              <hr className="border-zinc-100 my-4" />
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
                    Sertifikat Kelulusan Saya 🎓
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Sertifikat resmi dan rapor nilai kompetensi yang berhasil Anda raih.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {certificates.map((cert) => (
                    <div
                      key={cert.id}
                      className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Terverifikasi &bull; Grade {cert.grade}
                          </span>
                          <h4 className="font-bold text-zinc-900 text-base">{cert.courseTitle}</h4>
                          <p className="text-xs font-mono text-zinc-500">{cert.certificateCode}</p>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white font-extrabold text-sm shadow-sm shrink-0">
                          {cert.grade}
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-emerald-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-zinc-400 font-medium">
                          Nilai Akhir: <strong className="text-zinc-700">{cert.finalScore}/100</strong>
                        </span>
                        <div className="flex gap-2">
                          <Link
                            href={`/certificates/${cert.certificateCode}`}
                            target="_blank"
                            className="btn btn-primary btn-sm text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                          >
                            Sertifikat
                          </Link>
                          <Link
                            href={`/certificates/${cert.certificateCode}?view=report`}
                            target="_blank"
                            className="btn btn-secondary btn-sm text-xs"
                          >
                            Rapor Nilai
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Semua Kelas */}
      {otherCourses.length > 0 && (
        <>
          <hr className="border-zinc-100 my-4" />
          <div>
            <h2 className="mb-4 text-xl font-extrabold text-zinc-900">Jelajahi Kelas Lainnya</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {otherCourses.map((c) => (
                <Link key={c.id} href={`/courses/${c.slug}`} className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm transition hover:shadow-md">
                  <div className="relative h-32 w-full bg-zinc-100">
                    {c.thumbnailUrl ? (
                      <img src={c.thumbnailUrl} alt={c.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center bg-zinc-200">
                        <LandingIcon name="BookOpen" color="#9ca3af" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h4 className="mb-1 font-bold text-zinc-900 line-clamp-2">{c.title}</h4>
                      <p className="mb-3 text-xs text-zinc-500 line-clamp-2">{c.shortDescription}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-600">{c.instructorName}</span>
                      <span className="text-sm font-bold text-[var(--brand)]">
                        {c.isFree ? "Gratis" : `Rp ${Number(c.price).toLocaleString("id-ID")}`}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <hr className="border-zinc-100 my-4" />

    </main>
  );
}
