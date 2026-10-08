import { NextResponse } from "next/server";
import { z } from "zod";
import { deleteSection, getSectionById, updateSection } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  title: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const { id } = await params;
  const section = await getSectionById(Number(id));
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = await assertCourseAccess(section.courseId, gate.userId, gate.isAdmin);
  if (access.error) return access.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.title) {
    const existing = await sql`
      SELECT id FROM sections 
      WHERE course_id = ${section.courseId} 
        AND title = ${parsed.data.title}
        AND id != ${Number(id)}
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: "Duplikat nama tidak diizinkan." }, { status: 400 });
    }
  }

  if (parsed.data.sortOrder !== undefined) {
    const existingSort = await sql`
      SELECT id FROM sections 
      WHERE course_id = ${section.courseId} 
        AND sort_order = ${parsed.data.sortOrder}
        AND id != ${Number(id)}
    `;
    if (existingSort.length > 0) {
      return NextResponse.json({ error: "Duplikat nomor urut (sort order) tidak diizinkan." }, { status: 400 });
    }
  }

  const row = await updateSection(section.id, parsed.data);
  return NextResponse.json({ data: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const { id } = await params;
  const section = await getSectionById(Number(id));
  if (!section) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = await assertCourseAccess(section.courseId, gate.userId, gate.isAdmin);
  if (access.error) return access.error;
  await deleteSection(section.id);
  return NextResponse.json({ data: true });
}
