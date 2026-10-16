import Link from "next/link";
import { auth } from "@/lib/session";
import { instructorScopeId } from "@/lib/instructor-scope";
import { listInstructorCoursesWithRevenue } from "@/lib/db/courses.queries";
import { listExamSubmissionsForCourse, getExamForCourse } from "@/lib/db/exams.queries";
import { getUserById } from "@/lib/db/users.queries";
import { InstructorExamReviewWorkbench } from "@/components/instructor/InstructorExamReviewWorkbench";

export default async function InstructorExamReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; submissionId?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const courses = await listInstructorCoursesWithRevenue(scope);

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-[800px] p-8 text-center space-y-4">
        <h1 className="text-xl font-black text-zinc-900">Exam Review & Grading</h1>
        <p className="text-sm text-zinc-500">
          You do not have any active courses yet. Please create a course and set up its curriculum first.
        </p>
        <Link href="/instructor/courses" className="btn btn-primary btn-sm inline-block">
          Manage Class &rarr;
        </Link>
      </div>
    );
  }

  const requestedId = Number(params.courseId || 0);
  const selectedCourse = courses.find((c) => c.id === requestedId) || courses[0];
  const selectedId = selectedCourse.id;

  const [submissions, exam, dbUser] = await Promise.all([
    listExamSubmissionsForCourse(selectedId),
    getExamForCourse(selectedId),
    session?.user?.id ? getUserById(Number(session.user.id)) : Promise.resolve(null),
  ]);

  const instructorHasSignature = Boolean(dbUser?.signatureUrl);
  const initialSubmissionId = params.submissionId ? Number(params.submissionId) : undefined;

  return (
    <InstructorExamReviewWorkbench
      key={`review-wb-${selectedId}-${initialSubmissionId ?? "none"}`}
      course={{ id: selectedCourse.id, title: selectedCourse.title }}
      courses={courses.map((c) => ({ id: c.id, title: c.title }))}
      submissions={submissions}
      exam={exam}
      initialSubmissionId={initialSubmissionId}
      instructorHasSignature={instructorHasSignature}
    />
  );
}
