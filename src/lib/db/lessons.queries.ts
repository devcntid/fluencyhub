import type { Lesson, Section } from "@/types/db";
import { sql } from "./client";
import { mapLesson, mapSection } from "./mappers";

export type InstructorCurriculumSection = Section & { lessons: Lesson[] };

export type PlayerLesson = {
  id: number;
  sectionId: number;
  title: string;
  contentType: Lesson["contentType"];
  youtubeVideoId: string | null;
  liveClassUrl: string | null;
  liveClassDatetime: Date | null;
  documentUrl: string | null;
  textContent: string | null;
  description: string | null;
  durationMinutes: number;
  isFreePreview: boolean;
  isCompleted: boolean;
};

export type PlayerSection = { id: number; title: string; lessons: PlayerLesson[] };

export async function listCoursePlayerCurriculum(courseId: number, userId: number | null): Promise<PlayerSection[]> {
  const tree = await listInstructorCurriculum(courseId);
  
  let progressMap = new Map<number, boolean>();
  if (userId) {
    const rows = await sql`
      SELECT lp.lesson_id, lp.is_completed
      FROM lesson_progress lp
      JOIN enrollments e ON e.id = lp.enrollment_id
      WHERE lp.user_id = ${userId} AND e.course_id = ${courseId}
    `;
    for (const r of rows) {
      progressMap.set(Number(r.lesson_id), Boolean(r.is_completed));
    }
  }

  return tree
    .map((s) => ({
      id: s.id,
      title: s.title,
      lessons: s.lessons
        .filter((l) => l.contentType !== "live_class")
        .map((l) => ({
          id: l.id,
          sectionId: l.sectionId,
          title: l.title,
          contentType: l.contentType,
          youtubeVideoId: l.youtubeVideoId,
          liveClassUrl: l.liveClassUrl,
          liveClassDatetime: l.liveClassDatetime,
          documentUrl: l.documentUrl,
          textContent: l.textContent,
          description: l.description,
          durationMinutes: l.durationMinutes ?? 0,
          isFreePreview: l.isFreePreview,
          isCompleted: progressMap.get(l.id) ?? false,
        })),
    }))
    .filter((s) => s.lessons.length > 0);
}

export async function getFirstLessonIdForCourse(courseId: number): Promise<number | null> {
  const rows = await sql`
    SELECT l.id FROM lessons l
    JOIN sections s ON s.id = l.section_id
    WHERE s.course_id = ${courseId} AND l.deleted_at IS NULL AND l.content_type != 'live_class'
    ORDER BY s.sort_order ASC, l.sort_order ASC, l.id ASC
    LIMIT 1
  `;
  return rows[0] ? Number((rows[0] as { id: unknown }).id) : null;
}

export async function listInstructorCurriculum(courseId: number): Promise<InstructorCurriculumSection[]> {
  const sections = await sql`
    SELECT * FROM sections WHERE course_id = ${courseId} ORDER BY sort_order ASC
  `;
  const lessons = await sql`
    SELECT l.* FROM lessons l
    JOIN sections s ON s.id = l.section_id
    WHERE s.course_id = ${courseId} AND l.deleted_at IS NULL
    ORDER BY l.sort_order ASC, l.id ASC
  `;
  const bySection = new Map<number, Lesson[]>();
  for (const raw of lessons) {
    const lesson = mapLesson(raw as Record<string, unknown>);
    const list = bySection.get(lesson.sectionId) ?? [];
    list.push(lesson);
    bySection.set(lesson.sectionId, list);
  }
  return sections.map((raw) => {
    const section = mapSection(raw as Record<string, unknown>);
    return { ...section, lessons: bySection.get(section.id) ?? [] };
  });
}

export async function getLessonCourseOwner(lessonId: number): Promise<{ courseId: number; instructorId: number } | null> {
  const rows = await sql`
    SELECT c.id AS course_id, c.instructor_id
    FROM lessons l
    JOIN sections s ON s.id = l.section_id
    JOIN courses c ON c.id = s.course_id
    WHERE l.id = ${lessonId} AND l.deleted_at IS NULL
  `;
  const row = rows[0] as { course_id: unknown; instructor_id: unknown } | undefined;
  if (!row) return null;
  return { courseId: Number(row.course_id), instructorId: Number(row.instructor_id) };
}

export function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] ?? null;
}

export async function createLessonForSection(data: {
  sectionId: number;
  title: string;
  contentType: Lesson["contentType"];
  youtubeUrl?: string | null;
  liveClassUrl?: string | null;
  liveClassDatetime?: Date | null;
  liveClassPlatform?: Lesson["liveClassPlatform"];
  documentUrl?: string | null;
  textContent?: string | null;
  durationMinutes?: number | null;
  isFreePreview: boolean;
}): Promise<Lesson> {
  const youtubeId = data.youtubeUrl ? extractYoutubeId(data.youtubeUrl) : null;
  const rows = await sql`
    INSERT INTO lessons (
      section_id, title, content_type, youtube_url, youtube_video_id,
      live_class_url, live_class_datetime, live_class_platform,
      document_url, text_content, duration_minutes, is_free_preview, sort_order
    ) VALUES (
      ${data.sectionId}, ${data.title}, ${data.contentType},
      ${data.youtubeUrl ?? null}, ${youtubeId},
      ${data.liveClassUrl ?? null}, ${data.liveClassDatetime ?? null}, ${data.liveClassPlatform ?? null},
      ${data.documentUrl ?? null}, ${data.textContent ?? null},
      ${data.durationMinutes ?? 0}, ${data.isFreePreview},
      COALESCE((SELECT MAX(sort_order) + 1 FROM lessons WHERE section_id = ${data.sectionId} AND deleted_at IS NULL), 1)
    )
    RETURNING *
  `;
  return mapLesson(rows[0] as Record<string, unknown>);
}

export async function updateLessonForSection(
  id: number,
  data: {
    sectionId?: number;
    title?: string;
    contentType?: Lesson["contentType"];
    youtubeUrl?: string | null;
    liveClassUrl?: string | null;
    liveClassDatetime?: Date | null;
    liveClassPlatform?: Lesson["liveClassPlatform"];
    documentUrl?: string | null;
    textContent?: string | null;
    durationMinutes?: number | null;
    isFreePreview?: boolean;
  },
): Promise<Lesson> {
  const youtubeId = data.youtubeUrl ? extractYoutubeId(data.youtubeUrl) : null;
  const rows = await sql`
    UPDATE lessons SET
      section_id = COALESCE(${data.sectionId ?? null}, section_id),
      title = COALESCE(${data.title ?? null}, title),
      content_type = COALESCE(${data.contentType ?? null}, content_type),
      youtube_url = CASE WHEN ${data.youtubeUrl !== undefined} THEN ${data.youtubeUrl ?? null} ELSE youtube_url END,
      youtube_video_id = CASE WHEN ${data.youtubeUrl !== undefined} THEN ${youtubeId} ELSE youtube_video_id END,
      live_class_url = CASE WHEN ${data.liveClassUrl !== undefined} THEN ${data.liveClassUrl ?? null} ELSE live_class_url END,
      live_class_datetime = CASE WHEN ${data.liveClassDatetime !== undefined} THEN ${data.liveClassDatetime ?? null} ELSE live_class_datetime END,
      live_class_platform = CASE WHEN ${data.liveClassPlatform !== undefined} THEN ${data.liveClassPlatform ?? null} ELSE live_class_platform END,
      document_url = CASE WHEN ${data.documentUrl !== undefined} THEN ${data.documentUrl ?? null} ELSE document_url END,
      text_content = CASE WHEN ${data.textContent !== undefined} THEN ${data.textContent ?? null} ELSE text_content END,
      duration_minutes = COALESCE(${data.durationMinutes ?? null}, duration_minutes),
      is_free_preview = COALESCE(${data.isFreePreview ?? null}, is_free_preview),
      updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `;
  return mapLesson(rows[0] as Record<string, unknown>);
}

export async function softDeleteLesson(id: number): Promise<void> {
  await sql`UPDATE lessons SET deleted_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
}

export async function listLessonsBySection(sectionId: number): Promise<Lesson[]> {
  const rows = await sql`
    SELECT * FROM lessons
    WHERE section_id = ${sectionId} AND deleted_at IS NULL
    ORDER BY sort_order ASC
  `;
  return rows.map((r) => mapLesson(r as Record<string, unknown>));
}

export async function getLessonById(id: number): Promise<Lesson | null> {
  const rows = await sql`
    SELECT * FROM lessons WHERE id = ${id} AND deleted_at IS NULL
  `;
  return rows[0] ? mapLesson(rows[0] as Record<string, unknown>) : null;
}

export type UpcomingLiveClass = {
  id: number;
  title: string;
  liveClassDatetime: Date | null;
  liveClassUrl: string | null;
  moduleName: string;
  courseTitle: string;
  coachName: string;
  coachAvatar: string;
};

export async function listUpcomingLiveClasses(userId: number): Promise<UpcomingLiveClass[]> {
  const rows = await sql`
    SELECT
      l.id,
      l.title,
      l.live_class_datetime,
      l.live_class_url,
      s.title as module_name,
      c.title as course_title,
      u.name as coach_name,
      u.avatar_url as coach_avatar
    FROM lessons l
    JOIN sections s ON s.id = l.section_id
    JOIN courses c ON c.id = s.course_id
    JOIN users u ON u.id = c.instructor_id
    JOIN enrollments e ON e.course_id = c.id
    WHERE l.content_type = 'live_class'
      AND l.deleted_at IS NULL
      AND e.user_id = ${userId}
    ORDER BY l.live_class_datetime ASC
  `;
  return rows.map((r) => {
    const raw = r as Record<string, unknown>;
    return {
      id: Number(raw.id),
      title: String(raw.title),
      liveClassDatetime: raw.live_class_datetime ? new Date(String(raw.live_class_datetime)) : null,
      liveClassUrl: raw.live_class_url ? String(raw.live_class_url) : null,
      moduleName: String(raw.module_name),
      courseTitle: String(raw.course_title),
      coachName: String(raw.coach_name),
      coachAvatar: raw.coach_avatar ? String(raw.coach_avatar) : "https://i.pravatar.cc/150?u=" + String(raw.coach_name),
    };
  });
}

