import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { updatePaymentMethod } from "@/lib/db/payment-methods.queries";
import type { PaymentMethodType, PaymentProvider } from "@/types/db";
import { createAuditLog } from "@/lib/db/audit-logs.queries";

const Schema = z.object({
  name: z.string().optional(),
  code: z.string().optional(),
  type: z.enum(["e_wallet", "va", "qr_code", "credit_card", "retail_outlet", "manual_transfer"]).optional(),
  provider: z.enum(["midtrans", "xendit", "manual"]).optional(),
  adminFeeFlat: z.number().optional(),
  adminFeePct: z.string().optional(),
  accountNumber: z.string().nullable().optional(),
  accountName: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  isRedirect: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireAdmin();
  if (gate.error) return gate.error;
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  const method = await updatePaymentMethod(Number(id), parsed.data);

  await createAuditLog({
    adminId: Number(gate.session!.user.id),
    action: "UPDATE_PAYMENT_METHOD",
    entityType: "payment_method",
    entityId: method.id,
    newValueJson: parsed.data,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  }).catch(console.error);

  return NextResponse.json({ data: method });
}
