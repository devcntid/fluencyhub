import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { sql } from "@/lib/db/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await sql`
      SELECT 
        c.id,
        c.title,
        c.instructor_id as "instructorId",
        c.tier,
        c.speaking_partner_type as "speakingPartnerType",
        c.tier_badge as "tierBadge",
        COALESCE(NULLIF(c.offline_sessions_count, 0), 4)::int as "offlineSessionsCount",
        COALESCE((
          SELECT COUNT(*)::int
          FROM private_sessions ps
          WHERE ps.learner_id = ${Number(session.user.id)}
            AND ps.course_id = c.id
            AND ps.status IN ('pending', 'confirmed', 'completed')
        ), 0)::int as "usedSessions"
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ${Number(session.user.id)} AND e.status = 'active'
      ORDER BY c.id ASC
    `;
    
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
