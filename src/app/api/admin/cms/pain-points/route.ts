import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createPainPoint } from "@/lib/db/landing.queries";
import { revalidateLanding } from "@/lib/landing";

const Schema = z.object({
  icon: z.string().min(1),
  iconBg: z.string().min(1),
  iconColor: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  sortOrder: z.number().int().min(1),
  isActive: z.boolean(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await createPainPoint(parsed.data);
  await revalidateLanding();
  return NextResponse.json({ data: row }, { status: 201 });
}
