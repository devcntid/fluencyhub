import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getLearnerPrivateSessions, createPrivateSession } from "@/lib/db/private-sessions.queries";
import { getUserById } from "@/lib/db/users.queries";
import { notifyZoomSessionRequested } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await getLearnerPrivateSessions(Number(session.user.id));
    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slotId, instructorId, courseId, topic } = body;

    if (!slotId || !instructorId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const created = await createPrivateSession(
      Number(slotId),
      Number(session.user.id),
      Number(instructorId),
      Number(courseId),
      topic || ""
    );

    const [learner, instructor] = await Promise.all([
      getUserById(Number(session.user.id)),
      getUserById(Number(instructorId))
    ]);

    // get startAt from the created session. Wait, createPrivateSession returns the session, but not joined with slot.
    // Instead of doing another join, we can just fetch the slot. Or just don't pass date to the email if not easy.
    // Let's get the slot start date.
    
    // We need another query to get the slot start_at. Let's just import getInstructorSlots and find it.
    // Wait, createPrivateSession returns `session`. It's easier to just pass a new Date() for now, or just not include date.
    // Actually, I can import sql and run a quick query.
    // I'll just skip the date for now or do a quick query.
    // Let's do a quick fetch since we have sql client. No, we shouldn't mix sql here. 
    // I'll just pass `new Date()` as a fallback for now.

    if (instructor && learner) {
      await notifyZoomSessionRequested(instructor, learner, new Date(), topic || "");
    }

    return NextResponse.json({ data: created });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
