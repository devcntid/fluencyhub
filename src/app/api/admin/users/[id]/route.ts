import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { deleteUserAdmin, getUserByEmail, getUserById, updateUserAdmin } from "@/lib/db/users.queries";
import { createAuditLog } from "@/lib/db/audit-logs.queries";

const Schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  whatsappNumber: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(["user", "instructor", "admin"]).optional(),
  isActive: z.boolean().optional(),
  revenueSharePct: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const userId = Number(id);
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  if (parsed.data.email) {
    const existing = await getUserByEmail(parsed.data.email);
    if (existing && existing.id !== userId) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
  }

  const oldUser = await getUserById(userId);

  const user = await updateUserAdmin(userId, {
    ...parsed.data,
    email: parsed.data.email?.trim().toLowerCase(),
    whatsappNumber: parsed.data.whatsappNumber === "" ? null : parsed.data.whatsappNumber,
    avatarUrl: parsed.data.avatarUrl === "" ? null : parsed.data.avatarUrl,
  });

  await createAuditLog({
    adminId: Number(gate.session.user.id),
    action: "update_user",
    entityType: "users",
    entityId: user.id,
    oldValueJson: oldUser,
    newValueJson: user,
    ipAddress: req.headers.get("x-forwarded-for") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  });

  return NextResponse.json({ data: user });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const userId = Number(id);
  if (String(gate.session.user.id) === String(userId)) {
    return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
  }
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteUserAdmin(userId);

  await createAuditLog({
    adminId: Number(gate.session.user.id),
    action: "delete_user",
    entityType: "users",
    entityId: userId,
    oldValueJson: user,
    ipAddress: req.headers.get("x-forwarded-for") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
  });

  return NextResponse.json({ data: true });
}
