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
        c.instructor_id as "instructorId"
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ${Number(session.user.id)} AND e.status = 'active'
    `;
    
    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
