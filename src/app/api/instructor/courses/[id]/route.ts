import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import {
  updateCourseAdmin,
  getCourseById,
  checkCoursePublishEligibility,
} from "@/lib/db/courses.queries";
import { sql } from "@/lib/db/client";

const Schema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  shortDescription: z.string().nullable().optional(),
  price: z.string().min(1).optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const courseId = Number(id);

  const course = await getCourseById(courseId);
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (session.user.role === "instructor" && course.instructorId !== Number(session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eligibility = await checkCoursePublishEligibility(courseId);
  return NextResponse.json({ course, eligibility });
}

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

  // If requesting to publish, check eligibility (must have at least 1 module with both video and document)
  if (parsed.data.status === "published") {
    const eligibility = await checkCoursePublishEligibility(courseId);
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          error: eligibility.message,
          eligibility,
        },
        { status: 400 }
      );
    }
  }

  if (parsed.data.title || parsed.data.slug) {
    const targetSlug = parsed.data.slug || course.slug;
    const targetTitle = parsed.data.title || course.title;
    const existing = await sql`
      SELECT id, slug, title FROM courses 
      WHERE (slug = ${targetSlug} OR title = ${targetTitle}) 
        AND id != ${courseId}
        AND deleted_at IS NULL
    `;
    if (existing.length > 0) {
      const isSlugMatch = existing.some((e: any) => e.slug === targetSlug);
      const msg = isSlugMatch
        ? `Slug "${targetSlug}" sudah digunakan oleh kelas lain.`
        : `Judul "${targetTitle}" sudah digunakan oleh kelas lain.`;
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  try {
    // Update course fields including status and level
    const updated = await updateCourseAdmin(courseId, {
      title: parsed.data.title,
      slug: parsed.data.slug,
      shortDescription: parsed.data.shortDescription,
      price: parsed.data.price,
      thumbnailUrl: parsed.data.thumbnailUrl,
      status: parsed.data.status,
      level: parsed.data.level,
    });

    return NextResponse.json({ data: updated });
  } catch (err: any) {
    console.error("Error updating course:", err);
    if (err?.code === "23505") {
      return NextResponse.json({ error: "Slug atau judul kursus sudah digunakan oleh kursus lain." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal memperbarui kursus." }, { status: 500 });
  }
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

  // Soft delete course and release its slug
  await sql`UPDATE courses SET deleted_at = CURRENT_TIMESTAMP, slug = slug || '-deleted-' || id WHERE id = ${courseId}`;

  return NextResponse.json({ success: true });
}
