import { CurriculumManager } from "@/components/course/CurriculumManager";
import { listInstructorCoursesWithRevenue } from "@/lib/db/courses.queries";
import { listInstructorCurriculum } from "@/lib/db/lessons.queries";
import { listExamSubmissionsForCourse, getExamForCourse } from "@/lib/db/exams.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";

export default async function InstructorCurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; tab?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const courses = await listInstructorCoursesWithRevenue(scope);
  const selectedId = Number(params.courseId || courses[0]?.id || 0);
  const allowed = courses.some((c) => c.id === selectedId);
  const activeTab: "curriculum" | "exams" = params.tab === "exams" ? "exams" : "curriculum";

  const [curriculum, exam, submissions] = allowed
    ? await Promise.all([
        listInstructorCurriculum(selectedId),
        getExamForCourse(selectedId),
        listExamSubmissionsForCourse(selectedId),
      ])
    : [[], null, []];

  return (
    <CurriculumManager
      courses={courses.map((c) => ({ id: c.id, title: c.title, status: c.status }))}
      selectedId={selectedId}
      allowed={allowed}
      curriculum={curriculum}
      exam={exam}
      submissions={submissions}
      activeTab={activeTab}
      hrefTemplate={`/instructor/curriculum?courseId={id}&tab=${activeTab}`}
    />
  );
}
