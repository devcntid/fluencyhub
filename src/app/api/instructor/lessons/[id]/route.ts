import { NextResponse } from "next/server";
import { z } from "zod";
import { getLessonCourseOwner, softDeleteLesson, updateLessonForSection } from "@/lib/db/lessons.queries";
import { getSectionById } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  sectionId: z.number().int().positive().optional(),
  title: z.string().min(1).optional(),
  contentType: z.enum(["youtube_video", "live_class", "document", "text"]).optional(),
  youtubeUrl: z.string().nullable().optional(),
  liveClassUrl: z.string().nullable().optional(),
  liveClassDatetime: z.string().nullable().optional(),
  liveClassPlatform: z.enum(["zoom", "gmeet"]).nullable().optional(),
  documentUrl: z.string().nullable().optional(),
  textContent: z.string().nullable().optional(),
  durationMinutes: z.number().int().nonnegative().optional(),
  isFreePreview: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const { id } = await params;
  const owner = await getLessonCourseOwner(Number(id));
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!gate.isAdmin && owner.instructorId !== gate.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  if (parsed.data.sectionId) {
    const section = await getSectionById(parsed.data.sectionId);
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    const access = await assertCourseAccess(section.courseId, gate.userId, gate.isAdmin);
    if (access.error) return access.error;
  }

  // Duplicate check
  if (parsed.data.title) {
    const lessonData = await sql`SELECT section_id FROM lessons WHERE id = ${Number(id)}`;
    const currentSectionId = lessonData[0] ? Number(lessonData[0].section_id) : 0;
    const targetSectionId = parsed.data.sectionId || currentSectionId;
    
    const existing = await sql`
      SELECT id FROM lessons 
      WHERE section_id = ${targetSectionId} 
        AND title = ${parsed.data.title}
        AND id != ${Number(id)}
        AND deleted_at IS NULL
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: "Duplikat nama tidak diizinkan." }, { status: 400 });
    }
  }

  if (parsed.data.sortOrder !== undefined) {
    const lessonData = await sql`SELECT section_id FROM lessons WHERE id = ${Number(id)}`;
    const currentSectionId = lessonData[0] ? Number(lessonData[0].section_id) : 0;
    const targetSectionId = parsed.data.sectionId || currentSectionId;

    const existingSort = await sql`
      SELECT id FROM lessons 
      WHERE section_id = ${targetSectionId} 
        AND sort_order = ${parsed.data.sortOrder}
        AND id != ${Number(id)}
        AND deleted_at IS NULL
    `;
    if (existingSort.length > 0) {
      return NextResponse.json({ error: "Duplikat nomor urut (sort order) tidak diizinkan." }, { status: 400 });
    }
  }

  const lesson = await updateLessonForSection(Number(id), {
    ...parsed.data,
    youtubeUrl: parsed.data.youtubeUrl,
    liveClassUrl: parsed.data.liveClassUrl,
    liveClassDatetime: parsed.data.liveClassDatetime ? new Date(parsed.data.liveClassDatetime) : parsed.data.liveClassDatetime === null ? null : undefined,
    documentUrl: parsed.data.documentUrl,
    textContent: parsed.data.textContent,
  });
  return NextResponse.json({ data: lesson });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const { id } = await params;
  const owner = await getLessonCourseOwner(Number(id));
  if (!owner) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!gate.isAdmin && owner.instructorId !== gate.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await softDeleteLesson(Number(id));
  return NextResponse.json({ data: true });
}
