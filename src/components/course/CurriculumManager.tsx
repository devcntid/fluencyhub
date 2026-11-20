import Link from "next/link";
import { CoursePicker } from "@/components/instructor/CoursePicker";
import { LessonDeleteButton } from "@/components/instructor/LessonDeleteButton";
import { LessonFormDialog } from "@/components/instructor/LessonFormDialog";
import { SectionDeleteButton } from "@/components/instructor/SectionDeleteButton";
import { SectionFormDialog } from "@/components/instructor/SectionFormDialog";
import { InstructorExamsManager } from "@/components/instructor/InstructorExamsManager";
import { InstructorCoursePublishButton } from "@/components/instructor/InstructorCoursePublishButton";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { InstructorSubmissionRow } from "@/components/instructor/InstructorExamReviewWorkbench";
import type { InstructorCurriculumSection } from "@/lib/db/lessons.queries";
import type { Exam } from "@/types/db";

function getLessonTypeStyle(type: string) {
  if (type === "live_class") {
    return {
      lbl: "Live Zoom",
      icon: "Video",
      pill: "bg-rose-50 text-rose-700 border-rose-200",
      iconBg: "bg-rose-50 text-rose-600 border-rose-200/70",
    };
  }
  if (type === "document") {
    return {
      lbl: "Dokumen PDF",
      icon: "FileText",
      pill: "bg-amber-50 text-amber-800 border-amber-200",
      iconBg: "bg-amber-50 text-amber-700 border-amber-200/70",
    };
  }
  if (type === "text") {
    return {
      lbl: "Bacaan",
      icon: "BookOpen",
      pill: "bg-[#FBF6F1] text-[#0B2559] border-[#E6DED4]",
      iconBg: "bg-[#FBF6F1] text-[#0B2559] border-[#E6DED4]",
    };
  }
  if (type === "exam") {
    return {
      lbl: "Final Exam",
      icon: "Award",
      pill: "bg-purple-50 text-purple-700 border-purple-200",
      iconBg: "bg-purple-50 text-purple-700 border-purple-200/70",
    };
  }
  return {
    lbl: "Video YouTube",
    icon: "PlayCircle",
    pill: "bg-blue-50 text-[#0062D1] border-blue-200",
    iconBg: "bg-blue-50 text-[#0073F5] border-blue-200/70",
  };
}

export function CurriculumManager({
  courses,
  selectedId,
  allowed,
  curriculum,
  exam,
  submissions = [],
  activeTab = "curriculum",
  hrefTemplate,
}: {
  courses: Array<{ id: number; title: string; status?: string }>;
  selectedId: number;
  allowed: boolean;
  curriculum: InstructorCurriculumSection[];
  exam?: Exam | null;
  submissions?: InstructorSubmissionRow[];
  students?: unknown;
  activeTab?: "curriculum" | "exams";
  hrefTemplate: string;
}) {
  const sectionOptions = curriculum.map((s) => ({ id: s.id, title: s.title }));
  const selectedCourse = courses.find((c) => c.id === selectedId) || courses[0];
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const allLessons = curriculum.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;
  const videoCount = allLessons.filter(
    (l) => l.contentType === "youtube_video"
  ).length;
  const liveCount = allLessons.filter((l) => l.contentType === "live_class").length;
  const docCount = allLessons.filter((l) => l.contentType === "document" || l.contentType === "text").length;

  const isPublished = selectedCourse?.status === "published";

  return (
    <div className="anim w-full max-w-6xl mx-auto space-y-5 pb-8">
      {/* 1. NAVY HERO HEADER + INTEGRATED COURSE PICKER */}
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
          {/* Left: Course Identity & Content Summary */}
          <div className="min-w-0 space-y-2.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/15 px-3 py-1 text-[11px] font-bold text-blue-100 backdrop-blur-xs">
                <LandingIcon name="BookOpen" size={12} color="#fff" />
                <span>Manajemen Kurikulum</span>
              </span>
              {selectedCourse?.status && (
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${
                    isPublished
                      ? "bg-emerald-500/25 text-emerald-100 border-emerald-300/35"
                      : "bg-amber-400/25 text-amber-100 border-amber-300/35"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isPublished ? "bg-emerald-300" : "bg-amber-300"
                    }`}
                  />
                  <span>{isPublished ? "Tayang" : "Draf"}</span>
                </span>
              )}
            </div>

            <h1 className="m-0 font-[family-name:var(--font-heading)] text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-snug break-words">
              {selectedCourse?.title || "Kurikulum Kelas"}
            </h1>

            <p className="m-0 text-xs sm:text-sm text-blue-100/85 leading-relaxed">
              Susun modul pembelajaran, video materi, jadwal Live Zoom, dokumen belajar, dan bank
              soal Final Exam CBT untuk kelas ini.
            </p>

            {/* Quick Summary Chips */}
            {allowed && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <span>{curriculum.length} Modul</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <LandingIcon name="PlayCircle" size={12} color="#60A5FA" />
                  <span>{videoCount} Video</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <LandingIcon name="Video" size={12} color="#FDBA74" />
                  <span>{liveCount} Live Zoom</span>
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                  <LandingIcon name="FileText" size={12} color="#93C5FD" />
                  <span>{docCount} Dokumen</span>
                </span>
              </div>
            )}
          </div>

          {/* Right: Course Picker & Quick Course Controls */}
          {courses.length > 0 && (
            <div className="w-full lg:w-[340px] shrink-0 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md p-4 space-y-3">
              <div className="space-y-1.5">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-200">
                  Pilih Kelas yang Dikelola ({courses.length})
                </span>
                <CoursePicker
                  selectedId={allowed ? selectedId : courses[0]?.id || 0}
                  courses={courses}
                  hrefTemplate={hrefTemplate}
                  variant="glass"
                />
              </div>

              {allowed && (
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/10">
                  <Link
                    href={`/dashboard/classroom?c=${selectedId}`}
                    target="_blank"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-2 text-xs font-bold text-white transition whitespace-nowrap"
                  >
                    <span>Pratinjau Siswa</span>
                    <LandingIcon name="ExternalLink" size={12} color="#fff" />
                  </Link>

                  {selectedCourse?.status && (
                    <div className="shrink-0">
                      <InstructorCoursePublishButton
                        courseId={selectedId}
                        courseTitle={selectedCourse.title}
                        status={selectedCourse.status}
                        compact
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {courses.length === 0 && (
        <div className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-10 sm:p-14 text-center shadow-xs space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-[#0B2559]">
            <LandingIcon name="BookOpen" size={26} color="currentColor" />
          </div>
          <p className="text-base font-extrabold text-[#0B2559]">Belum ada kelas yang dibuat</p>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Buat kelas pertamamu terlebih dahulu sebelum menyusun modul, video materi, dan ujian.
          </p>
          <Link
            href="/instructor/courses"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-5 py-2.5 text-xs font-extrabold text-white shadow-xs transition"
          >
            <span>+ Buat Kelas Baru</span>
          </Link>
        </div>
      )}

      {!allowed && courses.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center space-y-1.5">
          <h2 className="text-base font-extrabold text-rose-800">
            Akses Ditolak / Kelas Tidak Ditemukan
          </h2>
          <p className="text-xs text-rose-600">
            Kamu tidak memiliki izin untuk mengelola kurikulum pada kelas ini.
          </p>
        </div>
      )}

      {allowed && (
        <>
          {/* 2. CLEAN SEGMENTED 2-TAB NAVIGATION */}
          <nav
            aria-label="Tab Kurikulum"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border border-[#E6DED4] bg-white p-1.5 shadow-xs"
          >
            <Link
              href={`/instructor/curriculum?courseId=${selectedId}&tab=curriculum`}
              className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                activeTab === "curriculum"
                  ? "bg-[#0B2559] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-[#FBF6F1] hover:text-[#0B2559]"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <LandingIcon name="BookOpen" size={16} color="currentColor" />
                <span className="truncate">1. Silabus &amp; Modul Belajar</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                  activeTab === "curriculum"
                    ? "bg-white/15 text-white"
                    : "bg-[#FBF6F1] text-[#0B2559] border border-[#E6DED4]"
                }`}
              >
                {totalLessons} Materi
              </span>
            </Link>

            <Link
              href={`/instructor/curriculum?courseId=${selectedId}&tab=exams`}
              className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-xs sm:text-sm font-extrabold transition ${
                activeTab === "exams"
                  ? "bg-[#0B2559] text-white shadow-sm"
                  : "text-zinc-600 hover:bg-[#FBF6F1] hover:text-[#0B2559]"
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <LandingIcon name="Award" size={16} color="currentColor" />
                <span className="truncate">2. Final Exam &amp; Penilaian</span>
              </span>
              {pendingCount > 0 ? (
                <span className="shrink-0 rounded-full bg-[#F26A12] px-2.5 py-0.5 text-[11px] font-extrabold text-white">
                  {pendingCount} Perlu Dinilai
                </span>
              ) : (
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                    activeTab === "exams"
                      ? "bg-white/15 text-white"
                      : "bg-[#FBF6F1] text-zinc-600 border border-[#E6DED4]"
                  }`}
                >
                  {submissions.length} Pengumpulan
                </span>
              )}
            </Link>
          </nav>

          {/* 3. TAB 1: MODULES & LESSONS */}
          {activeTab === "curriculum" && (
            <div className="space-y-4">
              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs">
                <div className="min-w-0">
                  <h2 className="m-0 font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559]">
                    Daftar Modul &amp; Materi
                  </h2>
                  <p className="m-0 mt-0.5 text-xs text-zinc-500">
                    Tambahkan modul terlebih dahulu, lalu isi dengan Video YouTube, Live Zoom, PDF,
                    atau bacaan.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <SectionFormDialog
                    courseId={selectedId}
                    triggerLabel="+ Tambah Modul"
                    triggerClassName="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] hover:bg-[#F3ECE4] px-3.5 py-2 text-xs font-extrabold text-[#0B2559] transition cursor-pointer"
                  />
                  <LessonFormDialog
                    sections={sectionOptions}
                    triggerLabel="+ Tambah Materi"
                    triggerClassName="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition cursor-pointer"
                  />
                </div>
              </div>

              {curriculum.length === 0 ? (
                <div className="rounded-2xl sm:rounded-3xl border border-dashed border-[#DFD5C8] bg-white p-10 sm:p-14 text-center space-y-3">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-[#0B2559]">
                    <LandingIcon name="Layers" size={24} color="currentColor" />
                  </div>
                  <p className="text-sm sm:text-base font-extrabold text-[#0B2559]">
                    Belum ada modul pada kelas ini
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    Klik <strong>+ Tambah Modul</strong> di atas untuk membuat modul pertama dan
                    mulai mengisi materi pembelajaran.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {curriculum.map((sec, secIdx) => (
                    <section
                      key={sec.id}
                      className="rounded-2xl border border-[#E6DED4] bg-white shadow-xs overflow-hidden"
                    >
                      {/* Clean Light-Sand Module Header */}
                      <div className="bg-[#FBF6F1]/90 border-b border-[#EFE7DC] px-4 py-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B2559] text-xs font-extrabold text-white">
                            {String(secIdx + 1).padStart(2, "0")}
                          </span>
                          <div className="min-w-0">
                            <h3 className="m-0 font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559] truncate">
                              {sec.title}
                            </h3>
                          </div>
                          <span className="hidden sm:inline-flex rounded-full bg-white border border-[#E6DED4] px-2.5 py-0.5 text-[11px] font-bold text-zinc-600 shrink-0">
                            {sec.lessons.length} materi
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <SectionFormDialog
                            courseId={selectedId}
                            section={{ id: sec.id, title: sec.title, sortOrder: sec.sortOrder }}
                            triggerLabel="Edit Modul"
                            triggerClassName="px-3 py-1.5 text-xs font-bold rounded-xl text-[#0B2559] bg-white hover:bg-zinc-50 border border-[#E6DED4] transition cursor-pointer"
                          />
                          <SectionDeleteButton id={sec.id} title={sec.title} />
                        </div>
                      </div>

                      {/* Lessons List */}
                      <div className="divide-y divide-[#F3ECE4]">
                        {sec.lessons.length === 0 ? (
                          <div className="px-5 py-7 text-center text-xs text-zinc-500">
                            Belum ada materi di modul ini. Klik{" "}
                            <strong className="text-[#0B2559]">+ Tambah Materi</strong> di atas
                            untuk mengisinya.
                          </div>
                        ) : (
                          sec.lessons.map((l, lIdx) => {
                            const style = getLessonTypeStyle(l.contentType);
                            return (
                              <div
                                key={l.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5 sm:px-5 hover:bg-[#FBF6F1]/45 transition"
                              >
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                  <span
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${style.iconBg}`}
                                  >
                                    <LandingIcon name={style.icon} size={16} color="currentColor" />
                                  </span>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <p className="m-0 font-[family-name:var(--font-heading)] text-xs sm:text-sm font-bold text-[#0B2559] leading-snug break-words">
                                      <span className="text-zinc-400 font-semibold mr-1.5">
                                        {secIdx + 1}.{lIdx + 1}
                                      </span>
                                      {l.title}
                                    </p>

                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2 py-0.2 text-[10px] font-bold ${style.pill}`}
                                      >
                                        {style.lbl}
                                      </span>
                                      <span className="text-[11px] font-medium text-zinc-500">
                                        {l.durationMinutes ?? 0} mnt
                                      </span>
                                      {l.isFreePreview && (
                                        <span className="inline-flex items-center rounded-full bg-[#FFF4EC] border border-[#F26A12]/30 px-2 py-0.2 text-[10px] font-extrabold text-[#C2530A]">
                                          Preview Gratis
                                        </span>
                                      )}
                                      {l.contentType === "live_class" && l.liveClassDatetime && (
                                        <span className="text-[11px] font-semibold text-[#0062D1]">
                                          •{" "}
                                          {new Date(l.liveClassDatetime).toLocaleString("id-ID", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                          })}{" "}
                                          WIB
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                                  <LessonFormDialog
                                    sections={sectionOptions}
                                    triggerLabel="Edit"
                                    triggerClassName="px-3 py-1.5 rounded-xl border border-[#E6DED4] bg-white hover:bg-[#FBF6F1] text-xs font-bold text-[#0B2559] transition cursor-pointer"
                                    initial={{
                                      id: l.id,
                                      sectionId: l.sectionId,
                                      title: l.title,
                                      contentType: l.contentType,
                                      youtubeUrl: l.youtubeUrl,
                                      liveClassUrl: l.liveClassUrl,
                                      liveClassDatetime: l.liveClassDatetime
                                        ? new Date(l.liveClassDatetime).toISOString()
                                        : null,
                                      documentUrl: l.documentUrl,
                                      textContent: l.textContent,
                                      durationMinutes: l.durationMinutes ?? 0,
                                      isFreePreview: l.isFreePreview,
                                      sortOrder: l.sortOrder,
                                    }}
                                  />
                                  <LessonDeleteButton id={l.id} title={l.title} />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. TAB 2: FINAL EXAM & GRADING */}
          {activeTab === "exams" && (
            <InstructorExamsManager
              courseId={selectedId}
              courseTitle={selectedCourse?.title || "Kelas"}
              exam={exam ?? null}
              submissions={submissions}
            />
          )}
        </>
      )}
    </div>
  );
}
