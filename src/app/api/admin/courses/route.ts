import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createCourseAdmin } from "@/lib/db/courses.queries";
import { createAuditLog } from "@/lib/db/audit-logs.queries";

const Schema = z.object({
  instructorId: z.number().int().positive(),
  title: z.string().min(1),
  slug: z.string().min(1),
  shortDescription: z.string().nullable().optional(),
  price: z.string().min(1),
  originalPrice: z.string().nullable().optional(),
  status: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean(),
  marketingTag: z.string().nullable().optional(),
  thumbnailUrl: z.string().url().nullable().optional(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const course = await createCourseAdmin(parsed.data);

  await createAuditLog({
    adminId: Number(gate.session!.user.id),
    action: "CREATE_COURSE",
    entityType: "course",
    entityId: course.id,
    newValueJson: parsed.data,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  }).catch(console.error);

  return NextResponse.json({ data: course }, { status: 201 });
}
