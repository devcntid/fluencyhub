import { NextResponse } from "next/server";
import { z } from "zod";
import { createLessonForSection } from "@/lib/db/lessons.queries";
import { getSectionById } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  sectionId: z.number().int().positive(),
  title: z.string().trim().min(1, "Lesson title cannot be empty"),
  contentType: z.enum(["youtube_video", "live_class", "document", "text", "exam"]),
  youtubeUrl: z.string().nullable().optional(),
  liveClassUrl: z.string().nullable().optional(),
  liveClassDatetime: z.string().nullable().optional(),
  liveClassPlatform: z.enum(["zoom", "gmeet"]).nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  textContent: z.string().nullable().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  isFreePreview: z.boolean(),
});

export async function POST(req: Request) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: firstIssue }, { status: 422 });
  }

  const { contentType, youtubeUrl, liveClassUrl, liveClassDatetime, documentUrl, textContent } = parsed.data;

  if (contentType === "youtube_video") {
    if (!youtubeUrl || !youtubeUrl.trim()) {
      return NextResponse.json({ error: "YouTube video URL is required." }, { status: 422 });
    }
  } else if (contentType === "live_class") {
    if (!liveClassUrl || !liveClassUrl.trim()) {
      return NextResponse.json({ error: "Meeting room URL (Zoom / Google Meet) is required." }, { status: 422 });
    }
    if (!liveClassDatetime) {
      return NextResponse.json({ error: "Session date and time are required for live classes." }, { status: 422 });
    }
  } else if (contentType === "document") {
    if (!documentUrl || !documentUrl.trim()) {
      return NextResponse.json({ error: "Document file or URL is required." }, { status: 422 });
    }
  } else if (contentType === "text") {
    if (!textContent || !textContent.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty." }, { status: 422 });
    }
  }

  if (contentType !== "live_class") {
    if (!parsed.data.durationMinutes || parsed.data.durationMinutes <= 0) {
      return NextResponse.json({ error: "Lesson duration cannot be 0. Please specify estimated minutes (minimum 1 minute)." }, { status: 422 });
    }
  }

  const section = await getSectionById(parsed.data.sectionId);
  if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });
  const access = await assertCourseAccess(section.courseId, gate.userId, gate.isAdmin);
  if (access.error) return access.error;

  const existing = await sql`
    SELECT id FROM lessons 
    WHERE section_id = ${parsed.data.sectionId} 
      AND title = ${parsed.data.title}
      AND deleted_at IS NULL
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Duplikat nama tidak diizinkan." }, { status: 400 });
  }

  const lesson = await createLessonForSection({
    sectionId: parsed.data.sectionId,
    title: parsed.data.title.trim(),
    contentType: parsed.data.contentType,
    youtubeUrl: parsed.data.youtubeUrl ? parsed.data.youtubeUrl.trim() : null,
    liveClassUrl: parsed.data.liveClassUrl ? parsed.data.liveClassUrl.trim() : null,
    liveClassDatetime: parsed.data.liveClassDatetime ? new Date(parsed.data.liveClassDatetime) : null,
    liveClassPlatform: parsed.data.liveClassPlatform ?? null,
    documentUrl: parsed.data.documentUrl ? parsed.data.documentUrl.trim() : null,
    textContent: parsed.data.textContent ? parsed.data.textContent.trim() : null,
    durationMinutes: parsed.data.durationMinutes ?? 0,
    isFreePreview: parsed.data.isFreePreview,
  });
  return NextResponse.json({ data: lesson }, { status: 201 });
}
