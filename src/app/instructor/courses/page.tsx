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
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold">My Courses</h1>
          <p className="mt-1 text-sm text-[var(--text-3)]">Classes you teach. You can create new ones or edit curriculum.</p>
        </div>
        <InstructorCourseCreateButton />
      </div>
      <div className="flex flex-col gap-2.5">
        {courses.length === 0 ? <p className="text-sm text-[var(--text-3)]">No courses yet.</p> : null}
        {courses.map((c) => (
          <div key={c.id} className="card flex items-center gap-3.5">
            {c.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.thumbnailUrl} alt="" className="h-12 w-[70px] shrink-0 rounded-[var(--r)] object-cover" />
            ) : (
              <div className="flex h-12 w-[70px] shrink-0 items-center justify-center rounded-[var(--r)] bg-[var(--surface-2)] text-xs text-[var(--text-4)]">
                Course
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 truncate font-[family-name:var(--font-heading)] text-[13px] font-bold">{c.title}</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"}`}>{c.status}</span>
                <span className="text-[11px] text-[var(--text-4)]">{c.enrollmentCount} enrolled</span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href={`/instructor/curriculum?courseId=${c.id}`} className="btn btn-secondary btn-sm">
                Edit
              </Link>
              <Link href={`/instructor/students`} className="btn btn-secondary btn-sm">
                Students
              </Link>
              <Link href={`/dashboard/courses/${c.id}`} className="btn btn-secondary btn-sm">
                Preview
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
