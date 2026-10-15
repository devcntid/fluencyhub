import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { deleteInstructorSlot } from "@/lib/db/private-sessions.queries";
import { getUserById } from "@/lib/db/users.queries";
import { notifyZoomSessionCancelled } from "@/lib/notifications";

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let reason: string | undefined;
    try {
      const body = await request.json();
      if (body?.reason) reason = body.reason;
    } catch {
      // Body is optional
    }

    const result = await deleteInstructorSlot(Number(id), Number(session.user.id), reason);
    if (!result?.slot) {
      return NextResponse.json({ error: "Slot tidak ditemukan" }, { status: 404 });
    }

    if (result.cancelledSessions && result.cancelledSessions.length > 0) {
      const instructor = await getUserById(Number(session.user.id));
      for (const sess of result.cancelledSessions) {
        const learner = await getUserById(Number(sess.learner_id));
        if (learner && instructor) {
          await notifyZoomSessionCancelled(
            learner,
            instructor,
            new Date(sess.start_at),
            "instructor",
            result.cancellationReason
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
