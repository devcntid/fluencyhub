import { NextResponse } from "next/server";
import { z } from "zod";
import { createLessonForSection } from "@/lib/db/lessons.queries";
import { getSectionById } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  sectionId: z.number().int().positive(),
  title: z.string().min(1),
  contentType: z.enum(["youtube_video", "live_class", "document", "text"]),
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
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
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
    title: parsed.data.title,
    contentType: parsed.data.contentType,
    youtubeUrl: parsed.data.youtubeUrl || null,
    liveClassUrl: parsed.data.liveClassUrl || null,
    liveClassDatetime: parsed.data.liveClassDatetime ? new Date(parsed.data.liveClassDatetime) : null,
    liveClassPlatform: parsed.data.liveClassPlatform ?? null,
    documentUrl: parsed.data.documentUrl || null,
    textContent: parsed.data.textContent || null,
    durationMinutes: parsed.data.durationMinutes ?? 0,
    isFreePreview: parsed.data.isFreePreview,
  });
  return NextResponse.json({ data: lesson }, { status: 201 });
}
