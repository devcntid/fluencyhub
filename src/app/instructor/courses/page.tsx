import Link from "next/link";
import { listInstructorCoursesWithRevenue } from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";
import { InstructorCourseCreateButton } from "@/components/instructor/InstructorCourseCreateButton";

export default async function InstructorCoursesPage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const courses = await listInstructorCoursesWithRevenue(scope);

  return (
    <div className="mx-auto max-w-[800px]">
      <div className="mb-4 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-extrabold">My Courses</h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">Classes you teach. You can create new ones or edit curriculum.</p>
        </div>
        <InstructorCourseCreateButton />
      </div>
      <div className="flex flex-col gap-3">
        {courses.length === 0 ? <p className="text-sm text-[var(--text-3)]">No courses yet.</p> : null}
        {courses.map((c) => (
          <div key={c.id} className="card flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex flex-1 items-center gap-3.5 min-w-0">
              {c.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnailUrl} alt="" className="h-14 w-[84px] shrink-0 rounded-[var(--r)] object-cover" />
              ) : (
                <div className="flex h-14 w-[84px] shrink-0 items-center justify-center rounded-[var(--r)] bg-[var(--surface-2)] text-xs text-[var(--text-4)]">
                  Course
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="mb-1.5 truncate font-[family-name:var(--font-heading)] text-sm font-bold leading-tight">{c.title}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"}`}>{c.status}</span>
                  <span className="text-xs text-[var(--text-4)]">{c.enrollmentCount} enrolled</span>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 flex-wrap md:flex-nowrap">
              <Link href={`/instructor/curriculum?courseId=${c.id}`} className="btn btn-secondary btn-sm flex-1 md:flex-none justify-center">
                Edit
              </Link>
              <Link href={`/instructor/students`} className="btn btn-secondary btn-sm flex-1 md:flex-none justify-center">
                Students
              </Link>
              <Link href={`/dashboard/courses/${c.id}`} className="btn btn-secondary btn-sm flex-1 md:flex-none justify-center">
                Preview
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
