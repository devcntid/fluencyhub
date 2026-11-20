import { auth } from "@/lib/session";
import { listPublishedCoursesWithInstructor } from "@/lib/db/courses.queries";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { getLatestReadyCheckSummaryForUser } from "@/lib/db/speaking.queries";
import { isPublicCatalogCourse } from "@/lib/programs/catalog";

/** Loads public catalog courses along with the current user's enrollments and baseline Ready Check. */
export async function getProgramPageData() {
  const [courses, session] = await Promise.all([
    listPublishedCoursesWithInstructor(),
    auth(),
  ]);

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const [enrollments, latestReadyCheck] = userId
    ? await Promise.all([
        listEnrollmentsForUser(userId),
        getLatestReadyCheckSummaryForUser(userId),
      ])
    : [[], null];

  return {
    publicCourses: courses.filter(isPublicCatalogCourse),
    enrolledCourseIds: enrollments.map((e) => e.courseId),
    latestReadyCheck,
  };
}

