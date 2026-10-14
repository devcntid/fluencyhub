import { notFound } from "next/navigation";
import { CurriculumManager } from "@/components/course/CurriculumManager";
import { getAdminPath } from "@/lib/auth";
import { getCourseById, listAllCoursesAdmin } from "@/lib/db/courses.queries";
import { listInstructorCurriculum } from "@/lib/db/lessons.queries";

export default async function AdminCourseCurriculumPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const id = Number(courseId);
  const course = await getCourseById(id);
  if (!course) notFound();
  const [all, curriculum] = await Promise.all([
    listAllCoursesAdmin(),
    listInstructorCurriculum(id),
  ]);
  const base = `/${getAdminPath()}/courses`;

  return (
    <CurriculumManager
      courses={all.map((c) => ({ id: c.id, title: c.title }))}
      selectedId={id}
      allowed
      curriculum={curriculum}
      hrefTemplate={`${base}/{id}`}
    />
  );
}
