import type { Course, Enrollment } from "@/types/db";
import { sql } from "./client";
import { mapCourse, mapEnrollment } from "./mappers";

export async function canAccessCoursePlayer(
  userId: number,
  role: string | undefined,
  courseId: number,
): Promise<{ allowed: boolean; preview: boolean }> {
  if (role === "admin") return { allowed: true, preview: true };
  if (role === "instructor") {
    const rows = await sql`
      SELECT 1 FROM courses
      WHERE id = ${courseId} AND instructor_id = ${userId} AND deleted_at IS NULL
      LIMIT 1
    `;
    if (rows.length > 0) return { allowed: true, preview: true };
  }
  const enrolled = await checkEnrollment(userId, courseId);
  return { allowed: enrolled, preview: false };
}

export async function checkEnrollment(userId: number, courseId: number): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM enrollments
    WHERE user_id = ${userId} AND course_id = ${courseId} AND status = 'active'
    LIMIT 1
  `;
  return rows.length > 0;
}

export async function createEnrollment(data: {
  userId: number;
  courseId: number;
  orderId: number;
}): Promise<Enrollment> {
  const rows = await sql`
    INSERT INTO enrollments (user_id, course_id, order_id, status)
    VALUES (${data.userId}, ${data.courseId}, ${data.orderId}, 'active')
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      status = 'active',
      order_id = EXCLUDED.order_id,
      updated_at = NOW()
    RETURNING *
  `;
  await sql`
    UPDATE courses SET enrollment_count = enrollment_count + 1, updated_at = NOW()
    WHERE id = ${data.courseId}
  `;
  return mapEnrollment(rows[0] as Record<string, unknown>);
}

export async function listEnrollmentsForUser(
  userId: number,
): Promise<Array<Enrollment & { course: Course }>> {
  const rows = await sql`
    SELECT e.*,
      c.id AS c_id, c.instructor_id, c.category_id, c.title, c.slug,
      c.short_description, c.description, c.thumbnail_url, c.promo_video_url,
      c.price, c.original_price, c.status AS c_status, c.is_featured, c.is_free,
      c.total_duration_min, c.enrollment_count, c.max_students, c.language,
      c.level, c.tier, c.speaking_partner_type, c.tier_badge, c.offline_sessions_count,
      c.features_json, c.platform_fee_pct, c.created_at AS c_created_at,
      c.updated_at AS c_updated_at, c.published_at, c.deleted_at
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.user_id = ${userId} AND e.status = 'active' AND c.deleted_at IS NULL
    ORDER BY e.enrolled_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapEnrollment(row),
      course: mapCourse({
        ...row,
        id: row.c_id,
        status: row.c_status,
        created_at: row.c_created_at,
        updated_at: row.c_updated_at,
      }),
    };
  });
}

export type InstructorStudentRow = {
  enrollmentId: number;
  userId: number;
  name: string;
  email: string;
  whatsappNumber: string | null;
  progressPct: string;
  status: string;
  enrolledAt: Date;
};

export async function listStudentsForCourse(courseId: number): Promise<InstructorStudentRow[]> {
  const rows = await sql`
    SELECT e.id, e.user_id, e.status, e.progress_pct, e.enrolled_at,
           u.name, u.email, u.whatsapp_number
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    WHERE e.course_id = ${courseId}
    ORDER BY e.enrolled_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      enrollmentId: Number(row.id),
      userId: Number(row.user_id),
      name: String(row.name),
      email: String(row.email),
      whatsappNumber: row.whatsapp_number == null ? null : String(row.whatsapp_number),
      progressPct: String(row.progress_pct ?? "0"),
      status: String(row.status),
      enrolledAt: row.enrolled_at instanceof Date ? row.enrolled_at : new Date(String(row.enrolled_at)),
    };
  });
}

export async function listStudentsForInstructor(instructorId: number | null): Promise<
  Array<InstructorStudentRow & { courseId: number; courseTitle: string }>
> {
  const rows = await sql`
    SELECT e.id, e.user_id, e.status, e.progress_pct, e.enrolled_at, e.course_id,
           u.name, u.email, u.whatsapp_number, c.title AS course_title
    FROM enrollments e
    JOIN users u ON u.id = e.user_id
    JOIN courses c ON c.id = e.course_id
    WHERE c.deleted_at IS NULL
      AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    ORDER BY e.enrolled_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      enrollmentId: Number(row.id),
      userId: Number(row.user_id),
      name: String(row.name),
      email: String(row.email),
      whatsappNumber: row.whatsapp_number == null ? null : String(row.whatsapp_number),
      progressPct: String(row.progress_pct ?? "0"),
      status: String(row.status),
      enrolledAt: row.enrolled_at instanceof Date ? row.enrolled_at : new Date(String(row.enrolled_at)),
      courseId: Number(row.course_id),
      courseTitle: String(row.course_title),
    };
  });
}

export async function getEnrollment(userId: number, courseId: number): Promise<Enrollment | null> {
  const rows = await sql`
    SELECT * FROM enrollments
    WHERE user_id = ${userId} AND course_id = ${courseId} AND status = 'active'
  `;
  return rows[0] ? mapEnrollment(rows[0] as Record<string, unknown>) : null;
}
