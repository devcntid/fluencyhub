import { NextResponse } from "next/server";
import { createCouponAdmin } from "@/lib/db/coupons.queries";
import { auth } from "@/lib/session";
import { createAuditLog } from "@/lib/db/audit-logs.queries";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (session?.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { code, description, discountType, discountValue, maxUses } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await createCouponAdmin({
      code,
      description: description || null,
      discountType,
      discountValue,
      maxUses: maxUses ? Number(maxUses) : null,
    });

    await createAuditLog({
      adminId: Number(session.user.id),
      action: "CREATE_COUPON",
      entityType: "coupon",
      newValueJson: { code, description, discountType, discountValue, maxUses },
      ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
    }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("POST /api/admin/coupons error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
