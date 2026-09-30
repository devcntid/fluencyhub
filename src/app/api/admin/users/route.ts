import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { createUserAdmin, getUserByEmail } from "@/lib/db/users.queries";
import { createAuditLog } from "@/lib/db/audit-logs.queries";

const Schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  whatsappNumber: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(["user", "instructor", "admin"]),
  isActive: z.boolean(),
  revenueSharePct: z.string().optional(),
});

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const existing = await getUserByEmail(parsed.data.email);
  if (existing) return NextResponse.json({ error: "Email already exists" }, { status: 409 });
  const user = await createUserAdmin({
    ...parsed.data,
    whatsappNumber: parsed.data.whatsappNumber || null,
    avatarUrl: parsed.data.avatarUrl || null,
  });

  await createAuditLog({
    adminId: Number(gate.session.user.id),
    action: "create_user",
    entityType: "users",
    entityId: user.id,
    newValueJson: user,
    ipAddress: req.headers.get("x-forwarded-for") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  });

  return NextResponse.json({ data: user }, { status: 201 });
}
