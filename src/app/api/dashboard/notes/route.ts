import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getLessonNote, saveLessonNote, initializeNotesTable } from "@/lib/db/notes.queries";

// Make sure the table exists at startup
initializeNotesTable().catch(console.error);

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const lessonId = parseInt(searchParams.get("lessonId") || "0", 10);

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const note = await getLessonNote(Number(session.user.id), lessonId);
    return NextResponse.json({ note });
  } catch (err: any) {
    console.error("GET /api/dashboard/notes error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { lessonId, content } = await req.json();

    if (!lessonId) {
      return NextResponse.json({ error: "Missing lessonId" }, { status: 400 });
    }

    const note = await saveLessonNote(Number(session.user.id), lessonId, content || "");
    return NextResponse.json({ note });
  } catch (err: any) {
    console.error("POST /api/dashboard/notes error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
