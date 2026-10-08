import { NextResponse } from "next/server";
import { z } from "zod";
import { createSectionForCourse } from "@/lib/db/sections.queries";
import { assertCourseAccess, requireInstructor } from "@/lib/instructor";

import { sql } from "@/lib/db/client";

const Schema = z.object({
  courseId: z.number().int().positive(),
  title: z.string().min(1),
});

export async function POST(req: Request) {
  const gate = await requireInstructor();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const access = await assertCourseAccess(parsed.data.courseId, gate.userId, gate.isAdmin);
  if (access.error) return access.error;

  const existing = await sql`
    SELECT id FROM sections 
    WHERE course_id = ${parsed.data.courseId} 
      AND title = ${parsed.data.title}
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Duplikat nama tidak diizinkan." }, { status: 400 });
  }

  const section = await createSectionForCourse(parsed.data.courseId, parsed.data.title);
  return NextResponse.json({ data: section }, { status: 201 });
}
