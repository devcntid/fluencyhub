import { CourseAdminTable } from "@/components/admin/CourseAdminTable";
import { getAdminPath } from "@/lib/auth";
import { listAllCoursesAdmin } from "@/lib/db/courses.queries";
import { listInstructorsAdmin } from "@/lib/db/users.queries";

export default async function AdminCoursesPage() {
  const [courses, instructors] = await Promise.all([listAllCoursesAdmin(), listInstructorsAdmin()]);
  return (
    <CourseAdminTable
      curriculumHrefPrefix={`/${getAdminPath()}/courses`}
      courses={courses.map((c) => ({
        id: c.id,
        instructorId: c.instructorId,
        instructorName: c.instructorName,
        title: c.title,
        slug: c.slug,
        shortDescription: c.shortDescription,
        price: c.price,
        originalPrice: c.originalPrice,
        status: c.status,
        isFeatured: c.isFeatured,
        marketingTag: c.marketingTag,
        thumbnailUrl: c.thumbnailUrl,
        level: c.level,
      }))}
      instructors={instructors}
    />
  );
}
