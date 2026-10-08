import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { cancelSessionByLearner } from "@/lib/db/private-sessions.queries";
import { getUserById } from "@/lib/db/users.queries";
import { notifyZoomSessionCancelled } from "@/lib/notifications";
import { sql } from "@/lib/db/client";

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch info before cancelling to ensure we can notify
    const rows = await sql`
      SELECT instructor_id, s.start_at 
      FROM private_sessions ps 
      JOIN instructor_slots s ON ps.slot_id = s.id 
      WHERE ps.id = ${Number(id)}
    `;

    await cancelSessionByLearner(Number(id), Number(session.user.id));
    
    if (rows.length > 0) {
      const { instructor_id, start_at } = rows[0] as Record<string, any>;
      const [learner, instructor] = await Promise.all([
        getUserById(Number(session.user.id)),
        getUserById(Number(instructor_id))
      ]);
      if (learner && instructor) {
        await notifyZoomSessionCancelled(instructor, learner, start_at, "learner");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
