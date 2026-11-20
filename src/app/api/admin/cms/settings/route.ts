import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { upsertSiteSettings } from "@/lib/db/landing.queries";
import { revalidateLanding } from "@/lib/landing";

const Schema = z.record(z.string(), z.string());

export async function PUT(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  await upsertSiteSettings(parsed.data);
  await revalidateLanding();
  return NextResponse.json({ data: true });
}
