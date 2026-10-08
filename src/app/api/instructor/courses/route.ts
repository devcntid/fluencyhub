import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { createCourseAdmin } from "@/lib/db/courses.queries";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().nullable().optional(),
  price: z.string().min(1),
  originalPrice: z.string().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const existing = await sql`
    SELECT id FROM courses 
    WHERE (slug = ${parsed.data.slug} OR title = ${parsed.data.title}) 
      AND deleted_at IS NULL
  `;
  if (existing.length > 0) {
    return NextResponse.json({ error: "Duplikat nama atau slug tidak diizinkan." }, { status: 400 });
  }

  // Instructor default settings for new course:
  // - status is "draft"
  // - isFeatured is false
  const course = await createCourseAdmin({
    ...parsed.data,
    instructorId: Number(session.user.id),
    status: "draft",
    isFeatured: false,
    marketingTag: null,
  });

  return NextResponse.json({ data: course }, { status: 201 });
}
