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
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  let targetSlug = parsed.data.slug.trim().toLowerCase();
  if (!targetSlug) {
    targetSlug = parsed.data.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  const existing = await sql`
    SELECT id, slug, title FROM courses 
    WHERE (slug = ${targetSlug} OR title = ${parsed.data.title}) 
      AND deleted_at IS NULL
  `;
  if (existing.length > 0) {
    const isSlugMatch = existing.some((e: any) => e.slug === targetSlug);
    const msg = isSlugMatch
      ? `Slug "${targetSlug}" sudah digunakan oleh kelas lain. Silakan ubah slug.`
      : `Judul "${parsed.data.title}" sudah digunakan oleh kelas lain. Silakan ubah judul.`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Check if any row (including deleted ones) has this exact slug
  const anySlugConflict = await sql`SELECT id FROM courses WHERE slug = ${targetSlug}`;
  if (anySlugConflict.length > 0) {
    targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
  }

  try {
    const course = await createCourseAdmin({
      ...parsed.data,
      slug: targetSlug,
      instructorId: Number(session.user.id),
      status: "draft",
      isFeatured: false,
      marketingTag: null,
      level: parsed.data.level ?? "beginner",
    });

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating course:", err);
    if (err?.code === "23505") {
      return NextResponse.json(
        { error: "Slug atau judul kursus sudah terdaftar. Silakan ganti slug atau judul kursus Anda." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal membuat kursus baru. Silakan coba lagi." }, { status: 500 });
  }
}
