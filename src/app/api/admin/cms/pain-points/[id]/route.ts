import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { deletePainPoint, updatePainPoint } from "@/lib/db/landing.queries";
import { revalidateLanding } from "@/lib/landing";

const Schema = z.object({
  icon: z.string().optional(),
  iconBg: z.string().optional(),
  iconColor: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  sortOrder: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const row = await updatePainPoint(Number(id), parsed.data);
  await revalidateLanding();
  return NextResponse.json({ data: row });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  await deletePainPoint(Number(id));
  await revalidateLanding();
  return NextResponse.json({ data: true });
}
