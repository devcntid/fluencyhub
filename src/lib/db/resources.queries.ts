import { sql } from "./client";

export type UserResource = {
  id: number;
  title: string;
  description: string | null;
  documentUrl: string | null;
  contentType: string;
  courseTitle: string;
};

export async function listUserResources(userId: number): Promise<UserResource[]> {
  const rows = await sql`
    SELECT 
      l.id, 
      l.title, 
      l.description, 
      l.document_url, 
      l.content_type, 
      c.title as course_title
    FROM lessons l
    JOIN sections s ON l.section_id = s.id
    JOIN courses c ON s.course_id = c.id
    JOIN enrollments e ON c.id = e.course_id
    WHERE e.user_id = ${userId}
      AND l.content_type IN ('document', 'text')
      AND e.status IN ('active', 'completed')
    ORDER BY l.created_at DESC
  `;

  return rows.map((r: Record<string, unknown>) => ({
    id: Number(r.id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    documentUrl: r.document_url ? String(r.document_url) : null,
    contentType: String(r.content_type),
    courseTitle: String(r.course_title),
  }));
}
