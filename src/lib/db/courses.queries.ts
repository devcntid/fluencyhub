import type { Course, PublishedCourseCard } from "@/types/db";
import { sql } from "./client";
import { mapCourse } from "./mappers";

export async function listPublishedCourses(): Promise<Course[]> {
  const rows = await sql`
    SELECT * FROM courses
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY is_featured DESC, published_at DESC NULLS LAST
  `;
  return rows.map((r) => mapCourse(r as Record<string, unknown>));
}

export async function getCourseById(id: number): Promise<Course | null> {
  const rows = await sql`
    SELECT * FROM courses WHERE id = ${id} AND deleted_at IS NULL
  `;
  return rows[0] ? mapCourse(rows[0] as Record<string, unknown>) : null;
}

export async function listPublishedCoursesWithInstructor(): Promise<PublishedCourseCard[]> {
  const rows = await sql`
    SELECT c.*, u.name AS instructor_name
    FROM courses c
    JOIN users u ON u.id = c.instructor_id
    WHERE c.status = 'published' AND c.deleted_at IS NULL
    ORDER BY c.is_featured DESC, c.published_at DESC NULLS LAST
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return { ...mapCourse(row), instructorName: String(row.instructor_name ?? "") };
  });
}

export type InstructorCourseRow = Course & { revenue: string };

export async function listInstructorCoursesWithRevenue(instructorId: number | null): Promise<InstructorCourseRow[]> {
  const rows = await sql`
    SELECT c.*,
      COALESCE((
        SELECT SUM(COALESCE(o.instructor_revenue, o.total_amount * u.revenue_share_pct / 100))
        FROM orders o
        JOIN users u ON u.id = c.instructor_id
        WHERE o.course_id = c.id AND o.status = 'paid'
      ), 0) AS revenue
    FROM courses c
    WHERE c.deleted_at IS NULL
      AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    ORDER BY c.updated_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return { ...mapCourse(row), revenue: String(row.revenue ?? "0") };
  });
}

export async function getInstructorOverview(instructorId: number | null): Promise<{
  instructorRevenue: string;
  enrolledTotal: number;
  publishedCount: number;
  sharePct: string;
  avgCompletion: string;
}> {
  const [rev, enrolled, published, share, completion] = await Promise.all([
    sql`
      SELECT COALESCE(SUM(COALESCE(o.instructor_revenue, o.total_amount * u.revenue_share_pct / 100)), 0) AS total
      FROM orders o
      JOIN courses c ON c.id = o.course_id
      JOIN users u ON u.id = c.instructor_id
      WHERE o.status = 'paid'
        AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    `,
    sql`
      SELECT COALESCE(SUM(c.enrollment_count), 0) AS n
      FROM courses c
      WHERE c.deleted_at IS NULL
        AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    `,
    sql`
      SELECT COUNT(*) AS n FROM courses c
      WHERE c.status = 'published' AND c.deleted_at IS NULL
        AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    `,
    sql`
      SELECT COALESCE(AVG(u.revenue_share_pct), 70) AS pct
      FROM users u
      WHERE (${instructorId}::bigint IS NULL AND u.role = 'instructor' AND u.deleted_at IS NULL)
         OR u.id = ${instructorId}
    `,
    sql`
      SELECT COALESCE(AVG(e.progress_pct), 0) AS pct
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    `,
  ]);
  return {
    instructorRevenue: String((rev[0] as { total: unknown }).total ?? "0"),
    enrolledTotal: Number((enrolled[0] as { n: unknown }).n ?? 0),
    publishedCount: Number((published[0] as { n: unknown }).n ?? 0),
    sharePct: String((share[0] as { pct: unknown }).pct ?? "70"),
    avgCompletion: String((completion[0] as { pct: unknown }).pct ?? "0"),
  };
}

export async function listInstructorEnrollmentByMonth(
  instructorId: number | null,
  months = 6,
): Promise<Array<{ month: string; count: number }>> {
  const rows = await sql`
    SELECT to_char(date_trunc('month', e.enrolled_at), 'Mon') AS month,
           date_trunc('month', e.enrolled_at) AS bucket,
           COUNT(*) AS n
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    WHERE e.enrolled_at >= date_trunc('month', NOW()) - (${months}::int - 1) * interval '1 month'
      AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    GROUP BY 1, 2
    ORDER BY bucket ASC
  `;
  return rows.map((r) => {
    const row = r as { month: string; n: unknown };
    return { month: row.month, count: Number(row.n ?? 0) };
  });
}

export async function listCoursesByInstructor(instructorId: number): Promise<Course[]> {
  const rows = await sql`
    SELECT * FROM courses
    WHERE instructor_id = ${instructorId} AND deleted_at IS NULL
    ORDER BY updated_at DESC
  `;
  return rows.map((r) => mapCourse(r as Record<string, unknown>));
}

export type AdminCourseRow = Course & { instructorName: string };

export async function listAllCoursesAdmin(): Promise<AdminCourseRow[]> {
  const rows = await sql`
    SELECT c.*, u.name AS instructor_name
    FROM courses c
    JOIN users u ON u.id = c.instructor_id
    WHERE c.deleted_at IS NULL
    ORDER BY c.updated_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return { ...mapCourse(row), instructorName: String(row.instructor_name ?? "") };
  });
}

export type CourseAdminInput = {
  instructorId?: number;
  title?: string;
  slug?: string;
  shortDescription?: string | null;
  price?: string;
  originalPrice?: string | null;
  status?: Course["status"];
  isFeatured?: boolean;
  marketingTag?: string | null;
  thumbnailUrl?: string | null;
};

export async function createCourseAdmin(data: {
  instructorId: number;
  title: string;
  slug: string;
  shortDescription?: string | null;
  price: string;
  originalPrice?: string | null;
  status: Course["status"];
  isFeatured: boolean;
  marketingTag?: string | null;
  thumbnailUrl?: string | null;
}): Promise<Course> {
  const rows = await sql`
    INSERT INTO courses (
      instructor_id, title, slug, short_description, price, original_price,
      status, is_featured, marketing_tag, thumbnail_url, published_at
    ) VALUES (
      ${data.instructorId}, ${data.title}, ${data.slug}, ${data.shortDescription ?? null},
      ${data.price}, ${data.originalPrice ?? null}, ${data.status}, ${data.isFeatured},
      ${data.marketingTag ?? null}, ${data.thumbnailUrl ?? null},
      ${data.status === "published" ? new Date() : null}
    )
    RETURNING *
  `;
  return mapCourse(rows[0] as Record<string, unknown>);
}

export async function updateCourseAdmin(id: number, data: CourseAdminInput): Promise<Course> {
  const rows = await sql`
    UPDATE courses SET
      instructor_id = COALESCE(${data.instructorId ?? null}, instructor_id),
      title = COALESCE(${data.title ?? null}, title),
      slug = COALESCE(${data.slug ?? null}, slug),
      short_description = COALESCE(${data.shortDescription ?? null}, short_description),
      price = COALESCE(${data.price ?? null}, price),
      original_price = COALESCE(${data.originalPrice ?? null}, original_price),
      is_featured = COALESCE(${data.isFeatured ?? null}, is_featured),
      marketing_tag = COALESCE(${data.marketingTag ?? null}, marketing_tag),
      thumbnail_url = CASE
        WHEN ${typeof data.thumbnailUrl !== "undefined"} THEN ${data.thumbnailUrl ?? null}
        ELSE thumbnail_url
      END,
      status = COALESCE(${data.status ?? null}, status),
      published_at = CASE
        WHEN ${data.status ?? null} = 'published' THEN COALESCE(published_at, NOW())
        ELSE published_at
      END,
      updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `;
  return mapCourse(rows[0] as Record<string, unknown>);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const rows = await sql`
    SELECT * FROM courses WHERE slug = ${slug} AND deleted_at IS NULL
  `;
  return rows[0] ? mapCourse(rows[0] as Record<string, unknown>) : null;
}

export async function getInstructorUpcomingLiveClasses(instructorId: number | null) {
  const rows = await sql`
    SELECT l.id, l.title, l.live_class_datetime as datetime, c.title as course_title, c.id as course_id
    FROM lessons l
    JOIN sections s ON s.id = l.section_id
    JOIN courses c ON c.id = s.course_id
    WHERE l.content_type = 'live_class'
      AND l.live_class_datetime > NOW()
      AND c.deleted_at IS NULL
      AND (${instructorId}::bigint IS NULL OR c.instructor_id = ${instructorId})
    ORDER BY l.live_class_datetime ASC
    LIMIT 5
  `;
  return rows.map(r => ({
    id: r.id as number,
    title: r.title as string,
    datetime: (r.datetime as Date).toISOString(),
    courseTitle: r.course_title as string,
    courseId: r.course_id as number,
  }));
}
