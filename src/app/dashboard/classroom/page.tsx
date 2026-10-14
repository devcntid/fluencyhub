import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/session";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { listCoursePlayerCurriculum, listUpcomingLiveClasses } from "@/lib/db/lessons.queries";
import { listUserResources } from "@/lib/db/resources.queries";
import { getExamForCourse, getExamSubmission, getExamSubmissionByCourse } from "@/lib/db/exams.queries";
import { getUserCertificateForCourse } from "@/lib/db/certificates.queries";
import { CourseVideoPlayer } from "@/components/dashboard/CourseVideoPlayer";
import { LiveClassList } from "@/app/dashboard/live/LiveClassList";
import { ResourceList } from "@/app/dashboard/resources/ResourceList";
import { ExamPortal } from "@/components/classroom/ExamPortal";
import { ClassroomClientTabs } from "./ClassroomClientTabs";
import { CourseSwitcher } from "./CourseSwitcher";
import { LandingIcon } from "@/components/landing/LandingIcon";

export default async function ClassroomPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = Number(session.user.id);
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "videos";

  const [enrollments, upcomingLive, userResources] = await Promise.all([
    listEnrollmentsForUser(userId),
    listUpcomingLiveClasses(userId),
    listUserResources(userId),
  ]);

  if (enrollments.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] w-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 shadow-sm">
          <LandingIcon name="GraduationCap" size={48} color="currentColor" />
        </div>
        <h1 className="mb-3 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-zinc-900 md:text-3xl">
          Ruang Kelas Belum Tersedia
        </h1>
        <p className="max-w-md text-zinc-500 mb-6">
          Anda belum terdaftar dalam kelas apapun. Silakan pilih kelas di beranda untuk memulai pembelajaran.
        </p>
        <Link href="/" className="btn btn-primary btn-default">
          Jelajahi Kelas
        </Link>
      </main>
    );
  }

  // Handle course selection
  let selectedEnrollment = enrollments[0];
  if (resolvedParams.c) {
    const cid = Number(resolvedParams.c);
    const found = enrollments.find((e) => e.courseId === cid);
    if (found) selectedEnrollment = found;
  }
  const course = selectedEnrollment.course;

  // Parallel fetch course-specific data: curriculum, exam, submission, certificate
  const [curriculum, exam, certificate] = await Promise.all([
    listCoursePlayerCurriculum(course.id, userId),
    getExamForCourse(course.id),
    getUserCertificateForCourse(userId, course.id),
  ]);

  const submission = exam
    ? await getExamSubmission(exam.id, userId)
    : await getExamSubmissionByCourse(course.id, userId);

  // Check course completion progress (must be 100% or certified to unlock exam)
  const allLessons = curriculum.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const isExamUnlocked = (totalLessons > 0 && completedLessons >= totalLessons) || Boolean(certificate);

  // Filter Live Classes and Resources specifically for the selected course
  const courseUpcomingLive = upcomingLive.filter((l) => l.courseId === course.id);
  const courseResources = userResources.filter((r) => r.courseId === course.id);

  return (
    <main className="min-h-[calc(100vh-72px)] w-full bg-[#fafafa]">
      {/* Top Header & Course Filter Buttons */}
      <div className="border-b border-zinc-200 bg-white px-4 py-5 md:px-8 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[var(--brand)] border border-blue-100">
                <LandingIcon name="GraduationCap" size={13} color="currentColor" /> Ruang Kelas Terpadu
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-500 font-medium">FluencyHub LMS</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)] tracking-tight">
              {course.title}
            </h1>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200/80 rounded-xl px-3.5 py-2 self-start md:self-auto shrink-0 shadow-2xs">
            <div className="min-w-[110px]">
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="font-semibold text-zinc-500">Progres Materi</span>
                <span className="font-extrabold text-zinc-900">{progressPct}%</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isExamUnlocked ? "bg-emerald-500" : "bg-[var(--brand)]"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <div className="w-px h-7 bg-zinc-200" />
            <div className="text-[11px] leading-tight">
              {isExamUnlocked ? (
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                  <LandingIcon name="CheckCircle" size={13} color="currentColor" />
                  <span>Ujian Terbuka</span>
                </div>
              ) : (
                <div className="text-zinc-500">
                  <span className="font-bold text-zinc-800">{completedLessons}/{totalLessons}</span> materi
                  <p className="text-[10px] text-zinc-400">100% untuk Ujian</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {enrollments.length > 1 && (
          <CourseSwitcher
            courses={enrollments.map((e) => ({ id: e.courseId, title: e.course.title }))}
            currentCourseId={course.id}
            currentTab={currentTab}
          />
        )}
      </div>

      {/* Classroom Navigation */}
      <ClassroomClientTabs
        currentTab={currentTab}
        courseId={course.id}
        hasExam={Boolean(exam && exam.content?.questionFileUrl)}
        isCertified={Boolean(certificate)}
        isExamUnlocked={isExamUnlocked}
      />

      {/* Content Area Based on Active Tab */}
      <div className="p-4 sm:p-6 md:p-8">
        {currentTab === "videos" && (
          <div className="w-full">
            <CourseVideoPlayer course={course} curriculum={curriculum} />
          </div>
        )}

        {currentTab === "live" && (
          <div className="w-full space-y-5">
            <div className="border-b border-zinc-200/80 pb-4">
              <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-zinc-900 tracking-tight">
                Jadwal Live Mentoring Zoom
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Ikuti sesi praktik interaktif langsung dengan instruktur untuk kelas <strong className="text-zinc-800">{course.title}</strong>.
              </p>
            </div>
            <Suspense fallback={<div className="p-8 text-center text-zinc-400">Memuat jadwal live...</div>}>
              <LiveClassList liveClasses={courseUpcomingLive} />
            </Suspense>
          </div>
        )}

        {currentTab === "resources" && (
          <div className="w-full space-y-5">
            <div className="border-b border-zinc-200/80 pb-4">
              <h2 className="text-xl sm:text-2xl font-black font-[family-name:var(--font-heading)] text-zinc-900 tracking-tight">
                Dokumen & Materi Pembelajaran
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Unduh materi referensi, silabus, dan rangkuman penting untuk kelas <strong className="text-zinc-800">{course.title}</strong>.
              </p>
            </div>
            <Suspense fallback={<div className="p-8 text-center text-zinc-400">Memuat materi dokumen...</div>}>
              <ResourceList resources={courseResources} />
            </Suspense>
          </div>
        )}

        {currentTab === "exam" && (
          <div className="w-full">
            {isExamUnlocked ? (
              <ExamPortal
                courseId={course.id}
                courseTitle={course.title}
                exam={exam}
                submission={submission}
                certificate={certificate}
                user={{
                  id: userId,
                  name: session.user.name || "Siswa FluencyHub",
                  email: session.user.email || "",
                }}
              />
            ) : (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-8 sm:p-12 text-center shadow-xs">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
                  <LandingIcon name="Lock" size={32} color="currentColor" />
                </div>
                <h3 className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl font-extrabold text-zinc-900 mb-2">
                  Fitur Ujian Akhir Belum Terbuka
                </h3>
                <p className="mx-auto max-w-md text-sm text-zinc-600 mb-5 leading-relaxed">
                  Fitur Ujian Akhir hanya akan muncul setelah Anda menyelesaikan <strong className="text-zinc-900">100% seluruh materi pembelajaran</strong> pada kelas ini.
                </p>
                <div className="mx-auto max-w-xs bg-white rounded-xl border border-amber-200/80 p-3.5 mb-6 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-1.5">
                    <span>Progres Belajar</span>
                    <span className="text-amber-700">{progressPct}% ({completedLessons}/{totalLessons} Materi Selesai)</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/dashboard/classroom?tab=videos&c=${course.id}`}
                  className="btn btn-primary btn-default inline-flex items-center gap-2"
                >
                  <LandingIcon name="PlayCircle" size={16} color="currentColor" />
                  Lanjutkan Mempelajari Materi
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
