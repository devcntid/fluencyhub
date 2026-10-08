import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db/client";
import { getEnrollment } from "@/lib/db/enrollments.queries";
import { auth } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = Number(session.user.id);

    const body = await req.json();
    const { courseId, lessonId, isCompleted } = body;

    if (!courseId || !lessonId || typeof isCompleted !== "boolean") {
      return NextResponse.json({ error: "Bad Request: Missing fields" }, { status: 400 });
    }

    // Check enrollment
    const enrollment = await getEnrollment(userId, courseId);
    if (!enrollment) {
      return NextResponse.json({ error: "Forbidden: Not enrolled" }, { status: 403 });
    }

    // Check if progress already exists
    const existing = await sql`
      SELECT id FROM lesson_progress 
      WHERE user_id = ${userId} AND lesson_id = ${lessonId} 
      LIMIT 1
    `;

    if (existing.length > 0) {
      await sql`
        UPDATE lesson_progress SET
          is_completed = ${isCompleted},
          completed_at = ${isCompleted ? new Date().toISOString() : null},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO lesson_progress (user_id, lesson_id, enrollment_id, is_completed, completed_at, updated_at)
        VALUES (${userId}, ${lessonId}, ${enrollment.id}, ${isCompleted}, ${isCompleted ? new Date().toISOString() : null}, NOW())
      `;
    }

    // Recalculate and update enrollment progress_pct
    const countRes = await sql`
      SELECT COUNT(*) as completed_count
      FROM lesson_progress
      WHERE enrollment_id = ${enrollment.id} AND is_completed = true
    `;
    const completedCount = Number(countRes[0].completed_count);

    const totalRes = await sql`
      SELECT COUNT(l.id) as total_count
      FROM lessons l
      JOIN sections s ON l.section_id = s.id
      WHERE s.course_id = ${courseId} AND l.content_type != 'live_class'
    `;
    const totalCount = Number(totalRes[0].total_count);
    
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    await sql`
      UPDATE enrollments
      SET progress_pct = ${progressPct}, updated_at = NOW()
      WHERE id = ${enrollment.id}
    `;

    revalidatePath("/dashboard", "layout");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Progress API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
