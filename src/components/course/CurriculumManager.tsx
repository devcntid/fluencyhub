import Link from "next/link";
import { CoursePicker } from "@/components/instructor/CoursePicker";
import { LessonDeleteButton } from "@/components/instructor/LessonDeleteButton";
import { LessonFormDialog } from "@/components/instructor/LessonFormDialog";
import { SectionDeleteButton } from "@/components/instructor/SectionDeleteButton";
import { SectionFormDialog } from "@/components/instructor/SectionFormDialog";
import { InstructorExamsManager } from "@/components/instructor/InstructorExamsManager";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { InstructorSubmissionRow } from "@/components/instructor/InstructorExamReviewWorkbench";
import type { InstructorCurriculumSection } from "@/lib/db/lessons.queries";
import type { Exam } from "@/types/db";

function typeBadge(type: string) {
  if (type === "live_class") return { cls: "badge-success", lbl: "Live Zoom" };
  if (type === "document") return { cls: "badge-warning", lbl: "Document" };
  if (type === "text") return { cls: "badge-primary", lbl: "Text" };
  if (type === "exam") return { cls: "badge-danger", lbl: "Ujian / Exam" };
  return { cls: "badge-primary", lbl: "YouTube" };
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
  courses: Array<{ id: number; title: string }>;
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
  const totalLessons = curriculum.reduce((acc, s) => acc + s.lessons.length, 0);

  return (
    <div className="mx-auto max-w-[1020px] w-full space-y-6 pb-6">
      {/* Top Header & Course Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[var(--brand)] border border-blue-100">
              <LandingIcon name="BookOpen" size={13} color="currentColor" /> Manajemen Kelas
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs text-zinc-500 font-medium">Instructor Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
            Kurikulum
          </h1>
          <p className="mt-1 text-xs text-zinc-500">
            Kelola materi pelajaran (video, zoom, dokumen) dan lembar ujian akhir untuk kelas Anda.
          </p>
        </div>

        {courses.length > 0 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <CoursePicker
              selectedId={allowed ? selectedId : (courses[0]?.id || 0)}
              courses={courses}
              hrefTemplate={hrefTemplate}
            />
          </div>
        )}
      </div>

      {courses.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center">
          <p className="text-sm font-semibold text-zinc-600">Anda belum memiliki kelas.</p>
          <Link href="/instructor/courses" className="btn btn-primary btn-sm mt-3 inline-block">
            + Buat Kelas Baru
          </Link>
        </div>
      )}

      {!allowed && courses.length > 0 && (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-2xl border border-red-200">
          <h2 className="text-lg font-bold mb-1">Akses Ditolak / Kelas Tidak Ditemukan</h2>
          <p className="text-xs text-red-500">Anda tidak memiliki hak akses untuk mengedit kurikulum kelas ini.</p>
        </div>
      )}

      {allowed && (
        <>
          {/* Main 2 Tabs Switcher */}
          <div className="flex border-b border-zinc-200 gap-8">
            <Link
              href={`/instructor/curriculum?courseId=${selectedId}&tab=curriculum`}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === "curriculum"
                  ? "border-[var(--brand,#2563eb)] text-[var(--brand,#2563eb)]"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <LandingIcon
                name="BookOpen"
                size={16}
                color={activeTab === "curriculum" ? "var(--brand,#2563eb)" : "currentColor"}
              />
              <span>1. Materi Pembelajaran (Silabus)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700 font-bold">
                {totalLessons} Materi
              </span>
            </Link>

            <Link
              href={`/instructor/curriculum?courseId=${selectedId}&tab=exams`}
              className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === "exams"
                  ? "border-[var(--brand,#2563eb)] text-[var(--brand,#2563eb)]"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              <LandingIcon
                name="Award"
                size={16}
                color={activeTab === "exams" ? "var(--brand,#2563eb)" : "currentColor"}
              />
              <span>2. Ujian Akhir & Penilaian</span>
              {pendingCount > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500 text-white font-extrabold animate-pulse">
                  {pendingCount} Perlu Dinilai
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 font-semibold">
                  {submissions.length} Pengumpulan
                </span>
              )}
            </Link>
          </div>

          {/* TAB 1: CURRICULUM SECTIONS & LESSONS */}
          {activeTab === "curriculum" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800">
                    Struktur Modul & Materi — {selectedCourse?.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Tambahkan bab materi dan pelajaran interaktif (Video YouTube, Live Zoom, atau Dokumen PDF).
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href={`/dashboard/classroom?c=${selectedId}`}
                    target="_blank"
                    className="btn btn-secondary h-9 px-3.5 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    <span>Preview Siswa</span>
                    <LandingIcon name="ExternalLink" size={13} color="currentColor" />
                  </Link>
                  <SectionFormDialog
                    courseId={selectedId}
                    triggerLabel="+ Tambah Section"
                    triggerClassName="btn btn-secondary h-9 px-3.5 text-xs font-bold rounded-xl shadow-xs"
                  />
                  <LessonFormDialog
                    sections={sectionOptions}
                    triggerLabel="+ Tambah Materi"
                    triggerClassName="btn btn-primary h-9 px-3.5 text-xs font-bold rounded-xl shadow-xs"
                  />
                </div>
              </div>

              {curriculum.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-400">
                  <LandingIcon name="Layers" size={36} color="currentColor" className="mx-auto mb-2 opacity-50" />
                  <p className="font-semibold text-zinc-700">Belum ada modul materi pada kelas ini.</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Gunakan tombol <strong>+ Tambah Section</strong> di atas untuk membuat bab pertama.
                  </p>
                </div>
              ) : (
                curriculum.map((sec) => (
                  <div key={sec.id} className="section-block mb-3 bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
                    <div className="section-head bg-zinc-900 text-white p-3.5 flex items-center gap-3">
                      <span className="flex-1 font-[family-name:var(--font-heading)] text-xs sm:text-sm font-bold">
                        {sec.title}
                      </span>
                      <span className="badge" style={{ background: "rgba(255,255,255,.15)", color: "white", border: "none", fontSize: 10 }}>
                        {sec.lessons.length} pelajaran
                      </span>
                      <SectionFormDialog
                        courseId={selectedId}
                        section={{ id: sec.id, title: sec.title, sortOrder: sec.sortOrder }}
                        triggerLabel="Edit"
                        triggerClassName="btn btn-ghost btn-sm text-white text-xs"
                      />
                      <SectionDeleteButton id={sec.id} />
                    </div>

                    <div className="divide-y divide-zinc-100 p-2">
                      {sec.lessons.length === 0 ? (
                        <p className="text-xs text-zinc-400 p-4 text-center italic">
                          Belum ada pelajaran di bab ini. Klik Tambah Materi di atas.
                        </p>
                      ) : (
                        sec.lessons.map((l) => {
                          const badge = typeBadge(l.contentType);
                          return (
                            <div key={l.id} className="lesson-row flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="mb-1 truncate font-[family-name:var(--font-heading)] text-xs font-bold text-zinc-900">
                                  {l.title}
                                </p>
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`badge ${badge.cls}`} style={{ fontSize: 10 }}>
                                    {badge.lbl}
                                  </span>
                                  <span className="text-[10px] text-zinc-400 font-medium">
                                    {l.durationMinutes ?? 0} menit
                                  </span>
                                  {l.isFreePreview && (
                                    <span className="badge badge-warning" style={{ fontSize: 10 }}>
                                      Gratis
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-1.5">
                                <LessonFormDialog
                                  sections={sectionOptions}
                                  triggerLabel="Edit"
                                  triggerClassName="btn btn-secondary btn-sm text-xs font-semibold"
                                  initial={{
                                    id: l.id,
                                    sectionId: l.sectionId,
                                    title: l.title,
                                    contentType: l.contentType,
                                    youtubeUrl: l.youtubeUrl,
                                    liveClassUrl: l.liveClassUrl,
                                    liveClassDatetime: l.liveClassDatetime ? new Date(l.liveClassDatetime).toISOString() : null,
                                    documentUrl: l.documentUrl,
                                    textContent: l.textContent,
                                    durationMinutes: l.durationMinutes ?? 0,
                                    isFreePreview: l.isFreePreview,
                                    sortOrder: l.sortOrder,
                                  }}
                                />
                                <LessonDeleteButton id={l.id} />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: EXAMS & SPEEDGRADER MANAGEMENT */}
          {activeTab === "exams" && (
            <div className="animate-in fade-in duration-150">
              <InstructorExamsManager
                courseId={selectedId}
                courseTitle={selectedCourse?.title || "Kelas"}
                exam={exam ?? null}
                submissions={submissions}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
