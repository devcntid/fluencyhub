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

    // Upsert lesson progress
    await sql`
      INSERT INTO lesson_progress (user_id, lesson_id, enrollment_id, is_completed, completed_at, updated_at)
      VALUES (${userId}, ${lessonId}, ${enrollment.id}, ${isCompleted}, ${isCompleted ? new Date() : null}, NOW())
      ON CONFLICT (user_id, lesson_id)
      DO UPDATE SET
        is_completed = EXCLUDED.is_completed,
        completed_at = EXCLUDED.completed_at,
        updated_at = EXCLUDED.updated_at
    `;

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
      WHERE s.course_id = ${courseId}
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
