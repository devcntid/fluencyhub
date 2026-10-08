import { sql, asNum } from "./client";
import { mapLesson, mapSection } from "./mappers";

export async function getUserDashboardStats(userId: number) {
  // Total completed lessons
  const completedRes = await sql`
    SELECT COUNT(*) as c FROM lesson_progress WHERE user_id = ${userId} AND is_completed = true
  `;
  const totalCompletedLessons = asNum(completedRes[0].c);

  // Total lessons in enrolled courses
  const lessonsRes = await sql`
    SELECT l.content_type
    FROM lessons l
    JOIN sections s ON l.section_id = s.id
    JOIN enrollments e ON s.course_id = e.course_id
    WHERE e.user_id = ${userId}
  `;
  
  const totalLessons = lessonsRes.length;
  const totalLiveClasses = lessonsRes.filter(r => r.content_type === 'live_class').length;
  const totalResources = lessonsRes.filter(r => r.content_type === 'document' || r.content_type === 'text').length;

  return {
    totalCompletedLessons,
    totalLessons,
    totalLiveClasses,
    totalResources,
  };
}

export async function getActiveEnrollment(userId: number) {
  const enrollmentsRes = await sql`
    SELECT e.*, 
      c.id as course_id, c.title as course_title, c.thumbnail_url as course_thumbnail_url
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ${userId}
    ORDER BY e.updated_at DESC
    LIMIT 1
  `;

  if (!enrollmentsRes[0]) return null;
  const row = enrollmentsRes[0] as Record<string, unknown>;
  const enrollment = { id: row.id as number, courseId: row.course_id as number, progressPct: Number(row.progress_pct || 0) };
  const course = { id: row.course_id as number, title: row.course_title as string, thumbnailUrl: row.course_thumbnail_url as string | null };

  const sectionsRes = await sql`
    SELECT * FROM sections WHERE course_id = ${course.id} ORDER BY sort_order ASC
  `;
  const lessonsRes = await sql`
    SELECT l.* FROM lessons l
    JOIN sections s ON l.section_id = s.id
    WHERE s.course_id = ${course.id}
    ORDER BY s.sort_order ASC, l.sort_order ASC
  `;
  const progressRes = await sql`
    SELECT lesson_id FROM lesson_progress WHERE user_id = ${userId} AND enrollment_id = ${enrollment.id} AND is_completed = true
  `;
  
  const completedIds = new Set(progressRes.map(r => r.lesson_id));
  
  let nextLesson = null;
  let nextSection = null;

  const completableLessons = lessonsRes.filter(l => (l as any).content_type !== 'live_class');

  for (const l of completableLessons) {
    if (!completedIds.has(l.id)) {
      nextLesson = mapLesson(l as Record<string, unknown>);
      nextSection = mapSection(sectionsRes.find(s => s.id === l.section_id) as Record<string, unknown>);
      break;
    }
  }

  if (!nextLesson && completableLessons.length > 0) {
    nextLesson = mapLesson(completableLessons[0] as Record<string, unknown>);
    nextSection = mapSection(sectionsRes.find(s => s.id === completableLessons[0].section_id) as Record<string, unknown>);
  }

  const progressPct = enrollment.progressPct;

  return {
    enrollment,
    course,
    nextLesson,
    nextSection,
    progressPct,
  };
}

export async function getUpcomingLiveClass(userId: number) {
  const upcomingRes = await sql`
    SELECT l.id as lesson_id, l.title, l.live_class_datetime as datetime
    FROM lessons l
    JOIN sections s ON l.section_id = s.id
    JOIN enrollments e ON s.course_id = e.course_id
    WHERE e.user_id = ${userId}
      AND l.content_type = 'live_class'
      AND l.live_class_datetime > NOW()
    ORDER BY l.live_class_datetime ASC
    LIMIT 1
  `;

  if (!upcomingRes[0]) return null;
  return {
    lessonId: upcomingRes[0].lesson_id,
    title: upcomingRes[0].title,
    datetime: upcomingRes[0].datetime,
  };
}
