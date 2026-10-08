import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { updateSessionStatus } from "@/lib/db/private-sessions.queries";
import { getUserById } from "@/lib/db/users.queries";
import { notifyZoomSessionStatus } from "@/lib/notifications";
import { sql } from "@/lib/db/client";
// We should ideally send emails/whatsapp here upon approval/rejection

export async function PATCH(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, notesOrReason, overrideLink } = body;

    const validStatuses = ['confirmed', 'rejected', 'completed', 'no_show', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    await updateSessionStatus(Number(id), Number(session.user.id), status, notesOrReason, overrideLink);

    if (status === 'confirmed' || status === 'rejected') {
      const rows = await sql`
        SELECT learner_id, s.start_at 
        FROM private_sessions ps 
        JOIN instructor_slots s ON ps.slot_id = s.id 
        WHERE ps.id = ${Number(id)}
      `;
      if (rows.length > 0) {
        const { learner_id, start_at } = rows[0] as Record<string, any>;
        const [learner, instructor] = await Promise.all([
          getUserById(Number(learner_id)),
          getUserById(Number(session.user.id))
        ]);
        if (learner && instructor) {
          await notifyZoomSessionStatus(learner, instructor, start_at, status, notesOrReason || overrideLink || null);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
