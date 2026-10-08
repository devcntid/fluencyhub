import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { updateCourseAdmin, getCourseById } from "@/lib/db/courses.queries";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  shortDescription: z.string().nullable().optional(),
  price: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const courseId = Number(id);

  // Validate ownership
  const course = await getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "instructor" && course.instructorId !== Number(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  if (parsed.data.title || parsed.data.slug) {
    const existing = await sql`
      SELECT id FROM courses 
      WHERE (slug = ${parsed.data.slug || course.slug} OR title = ${parsed.data.title || course.title}) 
        AND id != ${courseId}
        AND deleted_at IS NULL
    `;
    if (existing.length > 0) {
      return NextResponse.json({ error: "Duplikat nama atau slug tidak diizinkan." }, { status: 400 });
    }
  }

  // Only allow updating these specific fields
  const updated = await updateCourseAdmin(courseId, {
    title: parsed.data.title,
    slug: parsed.data.slug,
    shortDescription: parsed.data.shortDescription,
    price: parsed.data.price,
    thumbnailUrl: parsed.data.thumbnailUrl,
  });

  return NextResponse.json({ data: updated });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const courseId = Number(id);

  // Validate ownership
  const course = await getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "instructor" && course.instructorId !== Number(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Soft delete course
  await sql`UPDATE courses SET deleted_at = CURRENT_TIMESTAMP WHERE id = ${courseId}`;

  return NextResponse.json({ success: true });
}
