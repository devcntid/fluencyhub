import Link from "next/link";
import { AdminSimpleGrid } from "@/components/admin/AdminSimpleGrid";
import { CoursePicker } from "@/components/instructor/CoursePicker";
import { LessonDeleteButton } from "@/components/instructor/LessonDeleteButton";
import { LessonFormDialog } from "@/components/instructor/LessonFormDialog";
import { SectionDeleteButton } from "@/components/instructor/SectionDeleteButton";
import { SectionFormDialog } from "@/components/instructor/SectionFormDialog";
import type { InstructorStudentRow } from "@/lib/db/enrollments.queries";
import type { InstructorCurriculumSection } from "@/lib/db/lessons.queries";

function typeBadge(type: string) {
  if (type === "live_class") return { cls: "badge-success", lbl: "Live Zoom" };
  if (type === "document") return { cls: "badge-warning", lbl: "Document" };
  if (type === "text") return { cls: "badge-primary", lbl: "Text" };
  return { cls: "badge-primary", lbl: "YouTube" };
}

export function CurriculumManager({
  courses,
  selectedId,
  allowed,
  curriculum,
  students,
  hrefTemplate,
}: {
  courses: Array<{ id: number; title: string }>;
  selectedId: number;
  allowed: boolean;
  curriculum: InstructorCurriculumSection[];
  students: InstructorStudentRow[];
  hrefTemplate: string;
}) {
  const sectionOptions = curriculum.map((s) => ({ id: s.id, title: s.title }));

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">Curriculum</h1>
          <p className="mt-1 text-xs text-[var(--text-3)]">Add, edit, and delete sections and lessons.</p>
        </div>
        {courses.length > 0 ? (
          <div className="flex flex-col items-end gap-2">
            <CoursePicker selectedId={allowed ? selectedId : (courses[0]?.id || 0)} courses={courses} hrefTemplate={hrefTemplate} />
            {allowed && (
              <div className="flex flex-wrap justify-end gap-2">
                <Link href={`/dashboard/courses/${selectedId}`} className="btn btn-secondary btn-sm">
                  View as student
                </Link>
                <SectionFormDialog courseId={selectedId} triggerLabel="Add section" />
                <LessonFormDialog sections={sectionOptions} triggerLabel="Add Lesson" />
              </div>
            )}
          </div>
        ) : null}
      </div>
      {courses.length === 0 ? <p className="text-sm text-[var(--text-3)]">Create a course first.</p> : null}
      {!allowed && courses.length > 0 ? (
        <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
          <h2 className="text-lg font-bold mb-1">Access Denied / Course Not Found</h2>
          <p className="text-sm">You do not have permission to view or edit this course's curriculum.</p>
        </div>
      ) : null}
      {allowed && curriculum.length === 0 ? (
        <p className="mb-4 text-sm text-[var(--text-3)]">No sections yet. Use Add section, then Add Lesson.</p>
      ) : null}
      {curriculum.map((sec) => (
        <div key={sec.id} className="section-block mb-3">
          <div className="section-head">
            <span className="flex-1 font-[family-name:var(--font-heading)] text-[13px] font-bold">{sec.title}</span>
            <span className="badge" style={{ background: "rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", border: "none", fontSize: 10 }}>
              {sec.lessons.length} lessons
            </span>
            <SectionFormDialog
              courseId={selectedId}
              section={{ id: sec.id, title: sec.title, sortOrder: sec.sortOrder }}
              triggerLabel="Edit"
              triggerClassName="btn btn-ghost btn-sm text-white"
            />
            <SectionDeleteButton id={sec.id} />
          </div>
          {sec.lessons.map((l) => {
            const badge = typeBadge(l.contentType);
            return (
              <div key={l.id} className="lesson-row">
                <div className="min-w-0 flex-1">
                  <p className="mb-1 truncate font-[family-name:var(--font-heading)] text-xs font-semibold">{l.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`badge ${badge.cls}`} style={{ fontSize: 10 }}>
                      {badge.lbl}
                    </span>
                    <span className="text-[10px] text-[var(--text-4)]">{l.durationMinutes ?? 0} min</span>
                    {l.isFreePreview ? (
                      <span className="badge badge-warning" style={{ fontSize: 10 }}>
                        Free
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <LessonFormDialog
                    sections={sectionOptions}
                    triggerLabel="Edit"
                    triggerClassName="btn btn-secondary btn-sm"
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
          })}
        </div>
      ))}

      {allowed ? (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-extrabold">Enrolled students</h2>
          <AdminSimpleGrid
            columns={["Name", "Email", "WhatsApp", "Progress", "Status", "Joined"]}
            rows={students.map((s) => ({
              key: String(s.enrollmentId),
              cells: [
                s.name,
                s.email,
                s.whatsappNumber ?? "—",
                `${Number(s.progressPct).toFixed(0)}%`,
                { badge: s.status, tone: s.status === "active" ? "success" : "warning" },
                new Date(s.enrolledAt).toLocaleDateString("id-ID"),
              ],
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}
