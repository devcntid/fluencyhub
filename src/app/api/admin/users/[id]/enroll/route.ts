import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { createEnrollment } from "@/lib/db/enrollments.queries";

const enrollSchema = z.object({
  courseId: z.coerce.number().positive(),
});

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await props.params;
    const userId = Number(id);
    if (!userId) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = enrollSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    
    const courseId = parsed.data.courseId;

    const { sql } = await import("@/lib/db/client");
    
    // Check if already enrolled
    const checkEnroll = await sql`
      SELECT 1 FROM enrollments 
      WHERE user_id = ${userId} AND course_id = ${courseId} AND status = 'active'
      LIMIT 1
    `;
    if (checkEnroll.length > 0) {
      return NextResponse.json({ error: "User is already enrolled in this course" }, { status: 400 });
    }

    // See if they have an active order we can hijack, or create a dummy one
    let orderId: number;
    const existingOrders = await sql`
      SELECT id FROM orders 
      WHERE user_id = ${userId} AND course_id = ${courseId} AND status IN ('pending', 'awaiting_payment', 'pending_verification', 'paid')
      LIMIT 1
    `;
    
    if (existingOrders.length > 0) {
      orderId = Number(existingOrders[0].id);
      // Ensure the hijacked order is marked as paid
      await sql`UPDATE orders SET status = 'paid', paid_at = NOW() WHERE id = ${orderId}`;
    } else {
      const orderNumber = `MANUAL-${Date.now()}`;
      const orderRows = await sql`
        INSERT INTO orders (
          user_id, course_id, order_number, status, subtotal, admin_fee, discount_amount, total_amount, paid_at, payment_method_id
        ) VALUES (
          ${userId}, ${courseId}, ${orderNumber}, 'paid', 0, 0, 0, 0, NOW(), (SELECT id FROM payment_methods LIMIT 1)
        )
        RETURNING id
      `;
      orderId = Number(orderRows[0].id);
    }

    // Since this is manual admin enrollment, order_id is the dummy order we just created
    const enrollment = await createEnrollment({
      userId,
      courseId,
      orderId,
    });

    const { createAuditLog } = await import("@/lib/db/audit-logs.queries");
    await createAuditLog({
      adminId: Number(session.user.id),
      action: "manual_enroll_user",
      entityType: "enrollments",
      entityId: enrollment.id,
      newValueJson: enrollment,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ data: enrollment });
  } catch (error: unknown) {
    console.error("Failed to enroll user:", error);
    return NextResponse.json({ error: (error instanceof Error ? error.message : String(error)) || "Failed to enroll user" }, { status: 500 });
  }
}
