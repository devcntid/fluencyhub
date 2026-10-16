import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getLessonCourseOwner,
  softDeleteLesson,
  updateLessonForSection,
  checkLiveClassDuplicateOrOverlap,
  checkInstructorSlotConflict,
} from "@/lib/db/lessons.queries";
import { getSectionById } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  sectionId: z.number().int().positive().optional(),
  title: z.string().trim().min(1, "Lesson title cannot be empty").optional(),
  contentType: z.enum(["youtube_video", "live_class", "document", "text", "exam"]).optional(),
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
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message || "Validation failed";
    return NextResponse.json({ error: firstIssue }, { status: 422 });
  }

  if (parsed.data.title !== undefined && !parsed.data.title.trim()) {
    return NextResponse.json({ error: "Lesson title cannot be empty." }, { status: 422 });
  }

  if (parsed.data.contentType === "youtube_video" && parsed.data.youtubeUrl !== undefined && (!parsed.data.youtubeUrl || !parsed.data.youtubeUrl.trim())) {
    return NextResponse.json({ error: "YouTube video URL cannot be empty." }, { status: 422 });
  }

  if (parsed.data.contentType === "live_class" && parsed.data.liveClassUrl !== undefined && (!parsed.data.liveClassUrl || !parsed.data.liveClassUrl.trim())) {
    return NextResponse.json({ error: "Meeting room URL cannot be empty." }, { status: 422 });
  }

  if (parsed.data.contentType === "document" && parsed.data.documentUrl !== undefined && (!parsed.data.documentUrl || !parsed.data.documentUrl.trim())) {
    return NextResponse.json({ error: "Document URL cannot be empty." }, { status: 422 });
  }

  if (parsed.data.contentType === "text" && parsed.data.textContent !== undefined && (!parsed.data.textContent || !parsed.data.textContent.trim())) {
    return NextResponse.json({ error: "Text content cannot be empty." }, { status: 422 });
  }

  if (parsed.data.durationMinutes !== undefined && parsed.data.contentType !== "live_class" && parsed.data.durationMinutes <= 0) {
    return NextResponse.json({ error: "Lesson duration cannot be 0. Please specify estimated minutes (minimum 1 minute)." }, { status: 422 });
  }

  if (parsed.data.sectionId) {
    const section = await getSectionById(parsed.data.sectionId);
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 });
    const access = await assertCourseAccess(section.courseId, gate.userId, gate.isAdmin);
    if (access.error) return access.error;
  }

  const currentLessonRows = await sql`
    SELECT section_id, content_type, live_class_datetime, duration_minutes, live_class_duration_min
    FROM lessons WHERE id = ${Number(id)} AND deleted_at IS NULL
  `;
  if (currentLessonRows.length === 0) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }
  const curr = currentLessonRows[0] as Record<string, unknown>;

  // Duplicate check
  if (parsed.data.title) {
    const currentSectionId = curr.section_id ? Number(curr.section_id) : 0;
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
    const currentSectionId = curr.section_id ? Number(curr.section_id) : 0;
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

  // Validasi bentrok / tumpang tindih jadwal kelas live
  const effectiveType = parsed.data.contentType ?? String(curr.content_type);
  if (effectiveType === "live_class") {
    const hasDatetimeUpdate = parsed.data.liveClassDatetime !== undefined;
    const datetimeStr = hasDatetimeUpdate
      ? parsed.data.liveClassDatetime
      : curr.live_class_datetime
        ? new Date(String(curr.live_class_datetime)).toISOString()
        : null;

    if (hasDatetimeUpdate && !datetimeStr) {
      return NextResponse.json({ error: "Session date and time are required for live classes." }, { status: 422 });
    }

    if (datetimeStr) {
      const startAt = new Date(datetimeStr);
      if (Number.isNaN(startAt.getTime())) {
        return NextResponse.json({ error: "Format tanggal atau waktu kelas live tidak valid." }, { status: 422 });
      }

      const durationMinutes =
        parsed.data.durationMinutes ??
        Number(curr.duration_minutes ?? curr.live_class_duration_min ?? 60);

      const conflict = await checkLiveClassDuplicateOrOverlap({
        instructorId: owner.instructorId,
        courseId: owner.courseId,
        startAt,
        durationMinutes,
        excludeLessonId: Number(id),
      });

      if (conflict) {
        if (conflict.isDuplicate) {
          return NextResponse.json(
            {
              error: `Jadwal kelas live bentrok! Sudah ada sesi live dengan waktu yang sama (${conflict.conflictingLesson.title} pada ${conflict.conflictingLesson.formattedTime}). Silakan tentukan waktu lain.`,
            },
            { status: 400 }
          );
        } else {
          return NextResponse.json(
            {
              error: `Jadwal kelas live bentrok dengan sesi lain (${conflict.conflictingLesson.title} pada ${conflict.conflictingLesson.formattedTime}). Silakan tentukan waktu lain.`,
            },
            { status: 400 }
          );
        }
      }

      const slotConflict = await checkInstructorSlotConflict({
        instructorId: owner.instructorId,
        startAt,
        durationMinutes,
      });
      if (slotConflict) {
        return NextResponse.json(
          {
            error: `Jadwal kelas live bentrok dengan slot sesi privat Anda (${slotConflict.formattedTime}). Silakan tentukan waktu lain.`,
          },
          { status: 400 }
        );
      }
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
