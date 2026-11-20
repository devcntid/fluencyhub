import { redirect } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { auth } from "@/lib/session";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { getCourseById } from "@/lib/db/courses.queries";
import {
  listCoursePlayerCurriculum,
  listUpcomingLiveClasses,
  listUpcomingLiveClassesForCourse,
} from "@/lib/db/lessons.queries";
import { listUserResources, listCourseResources } from "@/lib/db/resources.queries";
import {
  getExamForCourse,
  getExamSubmission,
  getExamSubmissionByCourse,
} from "@/lib/db/exams.queries";
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
  searchParams: Promise<{ c?: string; tab?: string; lesson?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = Number(session.user.id);
  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab || "videos";
  const requestedCourseId =
    resolvedParams.c && resolvedParams.c !== "all" ? Number(resolvedParams.c) : null;

  const [enrollments, upcomingLive, userResources] = await Promise.all([
    listEnrollmentsForUser(userId),
    listUpcomingLiveClasses(userId),
    listUserResources(userId),
  ]);

  // Check if this is an instructor preview of a course (e.g. draft course or instructor not enrolled)
  let isInstructorPreview = false;
  let previewCourse: import("@/types/db").Course | null = null;

  if (requestedCourseId) {
    const isEnrolled = enrollments.some((e) => e.courseId === requestedCourseId);
    if (!isEnrolled) {
      const courseObj = await getCourseById(requestedCourseId);
      if (courseObj && (session.user.role === "admin" || courseObj.instructorId === userId)) {
        isInstructorPreview = true;
        previewCourse = courseObj;
      }
    }
  }

  if (enrollments.length === 0 && !isInstructorPreview) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] w-full flex-col items-center justify-center bg-[#FBF6F1] p-6 text-center">
        <div className="max-w-md rounded-3xl border border-[#E6DED4] bg-white p-8 shadow-xs space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0B2559]/8 text-[#0B2559]">
            <LandingIcon name="GraduationCap" size={32} color="currentColor" />
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-xl sm:text-2xl font-extrabold text-[#0B2559]">
            Ruang Kelas Belum Aktif
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            Kamu belum terdaftar di kelas mana pun. Yuk pilih program yang sesuai targetmu di
            halaman utama!
          </p>
          <div className="pt-1">
            <Link
              href="/#program"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition"
            >
              <span>Jelajahi Program</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Handle course selection
  const isAll = (resolvedParams.c === "all" || !resolvedParams.c) && !isInstructorPreview;

  let selectedEnrollment = enrollments[0];
  if (requestedCourseId && !isAll && !isInstructorPreview) {
    const found = enrollments.find((e) => e.courseId === requestedCourseId);
    if (found) selectedEnrollment = found;
  }

  const course =
    isInstructorPreview && previewCourse
      ? {
          id: previewCourse.id,
          title: previewCourse.title,
          thumbnailUrl: previewCourse.thumbnailUrl,
        }
      : isAll
      ? {
          id: 0,
          title: "Semua Kelas",
          thumbnailUrl: null,
        }
      : selectedEnrollment.course;

  // Data fetching based on preview mode, "all", or specific enrolled course
  let curriculum: import("@/lib/db/lessons.queries").PlayerSection[] = [];
  let exam: Awaited<ReturnType<typeof getExamForCourse>> = null;
  let certificate: Awaited<ReturnType<typeof getUserCertificateForCourse>> = null;
  let submission: Awaited<ReturnType<typeof getExamSubmission>> = null;

  type CourseExamStatus = {
    courseId: number;
    courseTitle: string;
    thumbnailUrl: string | null;
    totalLessons: number;
    completedLessons: number;
    progressPct: number;
    isUnlocked: boolean;
    isCertified: boolean;
    hasExam: boolean;
  };
  let courseExamStatuses: CourseExamStatus[] = [];
  let hasAnyUnlocked = false;
  let hasAnyCert = false;
  let hasAnyExam = false;

  let courseUpcomingLive = upcomingLive;
  let courseResources = userResources;

  if (isInstructorPreview && previewCourse) {
    const [cCurriculum, cExam, cLive, cRes] = await Promise.all([
      listCoursePlayerCurriculum(previewCourse.id, null),
      getExamForCourse(previewCourse.id),
      listUpcomingLiveClassesForCourse(previewCourse.id),
      listCourseResources(previewCourse.id),
    ]);
    curriculum = cCurriculum;
    exam = cExam;
    certificate = null;
    submission = null;
    courseUpcomingLive = cLive;
    courseResources = cRes;
  } else if (isAll) {
    const allCurriculums = await Promise.all(
      enrollments.map(async (e) => {
        const cur = await listCoursePlayerCurriculum(e.courseId, userId);
        return cur.map((sec) => ({
          ...sec,
          courseId: e.courseId,
          courseTitle: e.course.title,
          courseThumbnail: e.course.thumbnailUrl,
          lessons: sec.lessons.map((l) => ({
            ...l,
            courseId: e.courseId,
            courseTitle: e.course.title,
            courseThumbnail: e.course.thumbnailUrl,
          })),
        }));
      })
    );
    curriculum = allCurriculums.flat();

    const allExamsAndCerts = await Promise.all(
      enrollments.map(async (e) => {
        const [cExam, cCert] = await Promise.all([
          getExamForCourse(e.courseId),
          getUserCertificateForCourse(userId, e.courseId),
        ]);
        return { courseId: e.courseId, exam: cExam, certificate: cCert };
      })
    );

    courseExamStatuses = enrollments.map((e, idx) => {
      const vLessons = allCurriculums[idx].flatMap((s) => s.lessons);
      const cLive = upcomingLive.filter((l) => l.courseId === e.courseId);
      const cRes = userResources.filter((r) => r.courseId === e.courseId);

      const total = vLessons.length + cLive.length + cRes.length;
      const done =
        vLessons.filter((l) => l.isCompleted).length +
        cLive.filter((l) => l.isCompleted).length +
        cRes.filter((r) => r.isCompleted).length;
      const isUnlocked =
        session.user.role === "admin" ||
        (total > 0 && done >= total) ||
        total === 0 ||
        Boolean(allExamsAndCerts[idx]?.certificate);
      const hasExam = true;
      const isCertified = Boolean(allExamsAndCerts[idx]?.certificate);

      return {
        courseId: e.courseId,
        courseTitle: e.course.title,
        thumbnailUrl: e.course.thumbnailUrl,
        totalLessons: total,
        completedLessons: done,
        progressPct: total > 0 ? Math.round((done / total) * 100) : 0,
        isUnlocked,
        isCertified,
        hasExam,
      };
    });

    hasAnyUnlocked = courseExamStatuses.some((s) => s.isUnlocked);
    hasAnyCert = courseExamStatuses.some((s) => s.isCertified);
    hasAnyExam = courseExamStatuses.some((s) => s.hasExam);

    courseUpcomingLive = upcomingLive;
    courseResources = userResources;
  } else {
    const [cCurriculum, cExam, cCert] = await Promise.all([
      listCoursePlayerCurriculum(course.id, userId),
      getExamForCourse(course.id),
      getUserCertificateForCourse(userId, course.id),
    ]);
    curriculum = cCurriculum;
    exam = cExam;
    certificate = cCert;
    submission = exam
      ? await getExamSubmission(exam.id, userId)
      : await getExamSubmissionByCourse(course.id, userId);

    courseUpcomingLive = upcomingLive.filter((l) => l.courseId === course.id);
    courseResources = userResources.filter((r) => r.courseId === course.id);
  }

  // Tier-based Live Zoom Entitlement
  const hasLiveZoomAccess =
    isInstructorPreview && previewCourse
      ? previewCourse.tier !== "tier_bawah" || courseUpcomingLive.length > 0
      : isAll
      ? enrollments.some((e) => e.course.tier !== "tier_bawah")
      : selectedEnrollment.course.tier !== "tier_bawah";

  // Progress computation
  const effectiveLiveForCourse = hasLiveZoomAccess ? courseUpcomingLive : [];
  const videoLessons = curriculum.flatMap((s) => s.lessons);
  const totalLessons = isAll
    ? courseExamStatuses.reduce((acc, s) => acc + s.totalLessons, 0)
    : videoLessons.length + effectiveLiveForCourse.length + courseResources.length;
  const completedLessons = isAll
    ? courseExamStatuses.reduce((acc, s) => acc + s.completedLessons, 0)
    : videoLessons.filter((l) => l.isCompleted).length +
      effectiveLiveForCourse.filter((l) => l.isCompleted).length +
      courseResources.filter((r) => r.isCompleted).length;
  const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const remainingItems = Math.max(0, totalLessons - completedLessons);

  const isExamUnlocked =
    isInstructorPreview || session.user.role === "admin"
      ? true
      : isAll
      ? hasAnyUnlocked
      : totalLessons === 0 || completedLessons >= totalLessons || Boolean(certificate);

  const isFullyCompleted = totalLessons > 0 && completedLessons >= totalLessons;
  const isCertifiedDisplay = isAll ? hasAnyCert : Boolean(certificate);

  const switcherCourses =
    isInstructorPreview &&
    previewCourse &&
    !enrollments.some((e) => e.courseId === previewCourse!.id)
      ? [
          { id: previewCourse.id, title: `${previewCourse.title} (Preview)` },
          ...enrollments.map((e) => e.course),
        ]
      : enrollments.map((e) => e.course);

  return (
    <main className="min-h-[calc(100vh-72px)] w-full bg-[#FBF6F1]">
      {/* Instructor Preview Mode Banner */}
      {isInstructorPreview && (
        <div className="bg-gradient-to-r from-[#C2530A] via-[#F26A12] to-[#D65507] text-white px-4 py-3 sm:px-6 shadow-xs">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white shrink-0">
                <LandingIcon name="Eye" size={16} color="#fff" />
              </span>
              <div>
                <p className="font-extrabold text-white text-sm flex flex-wrap items-center gap-2">
                  <span>Instructor Preview Mode</span>
                  {previewCourse?.status === "draft" && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/25 text-white border border-white/20">
                      Draft Course
                    </span>
                  )}
                </p>
                <p className="text-orange-100 text-[11px] font-medium mt-0.5">
                  Tampilan pratinjau persis seperti yang dilihat peserta di Ruang Kelas.
                </p>
              </div>
            </div>
            <Link
              href={`/instructor/curriculum?courseId=${course.id}&tab=curriculum`}
              className="px-3.5 py-2 rounded-xl bg-white text-[#0B2559] font-bold hover:bg-zinc-100 transition shadow-2xs inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0"
            >
              <span>&larr; Kembali ke Curriculum Editor</span>
            </Link>
          </div>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        {/* 1. NAVY HERO HEADER BANNER */}
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
            {/* Left Info */}
            <div className="space-y-2.5 min-w-0 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 py-1 text-[11px] font-bold text-blue-100 backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F26A12]" />
                <span>Ruang Kelas • English Ready LMS</span>
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-[family-name:var(--font-heading)] tracking-tight leading-tight break-words">
                {course.title}
              </h1>

              <p className="text-xs sm:text-sm text-blue-100/85 leading-relaxed">
                {isAll ? (
                  <>
                    Semua materi video, jadwal Live Zoom, dan dokumen belajar dari{" "}
                    <strong className="text-white">{enrollments.length} kelas aktifmu</strong>{" "}
                    tersedia dalam satu ruang kelas.
                  </>
                ) : (
                  <>
                    Pelajari video materi, ikuti sesi Live Zoom, dan unduh dokumen belajar untuk
                    menuntaskan program ini.
                  </>
                )}
              </p>

              {/* Quick Content Summary Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <LandingIcon name="PlayCircle" size={13} color="#60A5FA" />
                  {videoLessons.length} Video
                </span>
                {hasLiveZoomAccess && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                    <LandingIcon name="Video" size={13} color="#FDBA74" />
                    {effectiveLiveForCourse.length} Live Zoom
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <LandingIcon name="BookOpen" size={13} color="#93C5FD" />
                  {courseResources.length} Materi
                </span>
              </div>
            </div>

            {/* Right: Clean Glass Progress Card */}
            <div className="w-full lg:w-[300px] shrink-0 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                  {isAll ? "Progres Keseluruhan" : "Progres Kelas"}
                </span>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isCertifiedDisplay || isFullyCompleted
                      ? "bg-emerald-500/25 text-emerald-100 border border-emerald-300/30"
                      : "bg-white/15 text-blue-100 border border-white/15"
                  }`}
                >
                  {isCertifiedDisplay
                    ? "Tersertifikasi"
                    : isFullyCompleted
                    ? "Selesai 100%"
                    : "Berlangsung"}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-3">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  {progressPct}%
                </span>
                <span className="text-xs font-semibold text-blue-200">
                  {completedLessons} / {totalLessons} materi
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFullyCompleted ? "bg-emerald-400" : "bg-[#F26A12]"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-[11px] text-blue-100/80 leading-snug">
                {isFullyCompleted
                  ? "Semua materi tuntas! Lanjutkan ke Final Exam untuk sertifikat."
                  : remainingItems > 0
                  ? `Tersisa ${remainingItems} materi lagi menuju sertifikasi kelas.`
                  : "Mulai tonton materi video pertama untuk mencatat progresmu."}
              </p>
            </div>
          </div>
        </section>

        {/* 2. UNIFIED FILTER KELAS + TAB NAVIGATION CARD */}
        <section className="rounded-2xl border border-[#E6DED4] bg-white p-3.5 sm:p-5 shadow-xs space-y-4">
          {switcherCourses.length > 0 && (
            <CourseSwitcher
              courses={switcherCourses}
              currentCourseId={isAll ? "all" : course.id}
              currentTab={currentTab}
            />
          )}

          <div className={switcherCourses.length > 0 ? "pt-3 border-t border-[#F0EAE2]" : ""}>
            <ClassroomClientTabs
              currentTab={currentTab}
              courseId={isAll ? "all" : course.id}
              hasExam={isAll ? hasAnyExam : Boolean(exam && exam.content?.questionFileUrl)}
              isCertified={isAll ? hasAnyCert : Boolean(certificate)}
              isExamUnlocked={isExamUnlocked}
              hasLiveZoom={hasLiveZoomAccess}
              videosCount={videoLessons.length}
              liveCount={effectiveLiveForCourse.length}
              resourcesCount={courseResources.length}
            />
          </div>
        </section>

        {/* 3. TAB CONTENT AREA */}
        <div>
          {currentTab === "videos" && (
            <div className="w-full">
              {curriculum.length === 0 ? (
                <div className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-8 sm:p-12 text-center shadow-xs space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-[#0B2559]">
                    <LandingIcon name="BookOpen" size={26} color="currentColor" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#0B2559]">
                    Belum Ada Materi Video
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
                    {isInstructorPreview
                      ? "Kamu belum menambahkan materi pada kelas ini. Buka Curriculum Editor untuk menyusun modul & pelajaran."
                      : "Instruktur sedang menyiapkan materi video untuk kelas ini. Sambil menunggu, cek tab Live Zoom atau Resources."}
                  </p>
                  {isInstructorPreview && (
                    <div className="pt-1">
                      <Link
                        href={`/instructor/curriculum?courseId=${course.id}&tab=curriculum`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition"
                      >
                        <span>+ Tambah Materi di Curriculum &rarr;</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <CourseVideoPlayer
                  course={course}
                  curriculum={curriculum}
                  overallProgress={{ total: totalLessons, completed: completedLessons }}
                  initialLessonId={resolvedParams.lesson ? Number(resolvedParams.lesson) : undefined}
                />
              )}
            </div>
          )}

          {currentTab === "live" && (
            <div className="w-full space-y-5">
              {!hasLiveZoomAccess ? (
                <div className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-xs space-y-4">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4EC] border border-[#F26A12]/25 text-[#C2530A]">
                    <LandingIcon name="Lock" size={26} color="currentColor" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-[#FFF4EC] border border-[#F26A12]/25 text-[#C2530A] text-[10px] font-extrabold uppercase tracking-wider">
                    Khusus Paket Menengah &amp; Tinggi
                  </span>
                  <h2 className="text-lg sm:text-xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)]">
                    Live Zoom Mentoring Tidak Termasuk di Paket Bawah
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                    Kelas <strong className="text-[#0B2559]">{course.title}</strong> berfokus pada
                    pembelajaran mandiri via Video Materi dan latihan bicara 24/7 bersama{" "}
                    <strong className="text-[#0B2559]">AI Speaking Partner</strong>. Pilih kelas
                    Paket Menengah/Tinggi atau upgrade untuk ikut Live Zoom interaktif.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                    <Link
                      href="/dashboard/speaking"
                      className="px-4 py-2.5 rounded-xl bg-[#0B2559] text-white text-xs font-extrabold hover:bg-[#133882] transition shadow-xs"
                    >
                      Buka AI Speaking Partner &rarr;
                    </Link>
                    <Link
                      href="/#harga"
                      className="px-4 py-2.5 rounded-xl bg-[#F26A12] text-white text-xs font-extrabold hover:bg-[#D65507] transition shadow-xs"
                    >
                      Upgrade ke Paket Menengah
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold font-[family-name:var(--font-heading)] text-[#0B2559] tracking-tight">
                        Jadwal Live Zoom Mentoring
                      </h2>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {isAll ? (
                          <>Sesi praktik bicara interaktif langsung bersama trainer di seluruh kelasmu.</>
                        ) : (
                          <>
                            Sesi praktik bicara interaktif langsung bersama trainer untuk{" "}
                            <strong className="text-[#0B2559]">{course.title}</strong>.
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Suspense
                    fallback={
                      <div className="rounded-2xl border border-[#E6DED4] bg-white p-10 text-center text-xs font-semibold text-zinc-400">
                        Memuat jadwal Live Zoom...
                      </div>
                    }
                  >
                    <LiveClassList liveClasses={courseUpcomingLive} />
                  </Suspense>
                </div>
              )}
            </div>
          )}

          {currentTab === "resources" && (
            <div className="w-full space-y-4">
              <div>
                <h2 className="text-lg sm:text-xl font-extrabold font-[family-name:var(--font-heading)] text-[#0B2559] tracking-tight">
                  Dokumen &amp; Materi Pendukung
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {isAll ? (
                    <>Unduh silabus, modul PDF, dan ringkasan belajar dari seluruh kelas aktifmu.</>
                  ) : (
                    <>
                      Unduh silabus, modul PDF, dan ringkasan belajar untuk{" "}
                      <strong className="text-[#0B2559]">{course.title}</strong>.
                    </>
                  )}
                </p>
              </div>
              <Suspense
                fallback={
                  <div className="rounded-2xl border border-[#E6DED4] bg-white p-10 text-center text-xs font-semibold text-zinc-400">
                    Memuat dokumen belajar...
                  </div>
                }
              >
                <ResourceList resources={courseResources} />
              </Suspense>
            </div>
          )}

          {currentTab === "exam" && (
            <div className="w-full">
              {isAll ? (
                <div className="w-full space-y-5">
                  <div>
                    <h2 className="text-lg sm:text-xl font-extrabold font-[family-name:var(--font-heading)] text-[#0B2559] tracking-tight">
                      Portal Final Exam &amp; Sertifikasi
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Pilih kelas untuk mengerjakan ujian sertifikasi atau mengunduh sertifikatmu.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {courseExamStatuses.map((st) => (
                      <div
                        key={st.courseId}
                        className="rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-4 transition hover:shadow-md hover:border-[#0B2559]/25"
                      >
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#0B2559]/8 text-[#0B2559]">
                              <LandingIcon name="GraduationCap" size={12} color="currentColor" />
                              Program Kelas
                            </span>
                            {st.isCertified ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <LandingIcon name="Award" size={12} color="currentColor" />
                                Tersertifikasi
                              </span>
                            ) : st.isUnlocked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-[#0062D1] border border-blue-200">
                                <LandingIcon name="CheckCircle" size={12} color="currentColor" />
                                Siap Ujian
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF6F1] text-zinc-600 border border-[#E6DED4]">
                                <LandingIcon name="Lock" size={12} color="currentColor" />
                                Dalam Progres
                              </span>
                            )}
                          </div>

                          <h3 className="font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559] leading-snug line-clamp-2">
                            {st.courseTitle}
                          </h3>

                          <div className="rounded-xl bg-[#FBF6F1]/80 p-3 border border-[#EFE7DC]">
                            <div className="flex items-center justify-between text-xs font-semibold text-zinc-600 mb-1.5">
                              <span>Progres Belajar</span>
                              <span className="font-extrabold text-[#0B2559]">
                                {st.completedLessons}/{st.totalLessons} ({st.progressPct}%)
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#E6DED4]">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  st.isCertified || st.progressPct >= 100
                                    ? "bg-emerald-500"
                                    : "bg-[#F26A12]"
                                }`}
                                style={{ width: `${st.progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#F0EAE2] flex items-center justify-end">
                          {st.isCertified ? (
                            <Link
                              href={`/dashboard/classroom?tab=exam&c=${st.courseId}`}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition"
                            >
                              <LandingIcon name="Award" size={14} color="#fff" />
                              <span>Lihat Sertifikat &amp; Hasil &rarr;</span>
                            </Link>
                          ) : st.isUnlocked ? (
                            <Link
                              href={`/dashboard/classroom?tab=exam&c=${st.courseId}`}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition"
                            >
                              <LandingIcon name="FileText" size={14} color="#fff" />
                              <span>Buka Lembar Ujian &rarr;</span>
                            </Link>
                          ) : (
                            <Link
                              href={`/dashboard/classroom?tab=videos&c=${st.courseId}`}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#FBF6F1] border border-[#E6DED4] hover:border-[#0B2559]/35 px-4 py-2.5 text-xs font-bold text-[#0B2559] transition"
                            >
                              <LandingIcon name="PlayCircle" size={14} color="currentColor" />
                              <span>Lanjutkan Materi &rarr;</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : isExamUnlocked ? (
                <ExamPortal
                  courseId={course.id}
                  courseTitle={course.title}
                  exam={exam}
                  submission={submission}
                  certificate={certificate}
                  user={{
                    id: userId,
                    name: session.user.name || "English Ready Student",
                    email: session.user.email || "",
                  }}
                />
              ) : (
                <div className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-6 sm:p-10 text-center shadow-xs max-w-xl mx-auto space-y-5">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF4EC] border border-[#F26A12]/25 text-[#C2530A]">
                    <LandingIcon name="Lock" size={28} color="currentColor" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-extrabold text-[#0B2559]">
                      Final Exam Belum Terbuka
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                      Selesaikan <strong className="text-[#0B2559]">100% seluruh materi</strong>{" "}
                      (video, live zoom, dan dokumen) di kelas ini untuk membuka Final Exam &amp;
                      Sertifikat.
                    </p>
                  </div>
                  <div className="mx-auto max-w-sm rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-[#0B2559]">
                      <span>Progres Saat Ini</span>
                      <span className="text-[#C2530A]">
                        {progressPct}% ({completedLessons}/{totalLessons})
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#E6DED4]">
                      <div
                        className="h-full bg-[#F26A12] rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/classroom?tab=videos&c=${course.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition"
                  >
                    <LandingIcon name="PlayCircle" size={16} color="#fff" />
                    <span>Lanjutkan Belajar &rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
