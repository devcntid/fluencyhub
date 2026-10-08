import type { Order, OrderStatus } from "@/types/db";
import { sql } from "./client";
import { mapOrder } from "./mappers";

export async function getOrderById(id: number): Promise<Order | null> {
  const rows = await sql`SELECT * FROM orders WHERE id = ${id}`;
  return rows[0] ? mapOrder(rows[0] as Record<string, unknown>) : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const rows = await sql`SELECT * FROM orders WHERE order_number = ${orderNumber}`;
  return rows[0] ? mapOrder(rows[0] as Record<string, unknown>) : null;
}

export async function getActiveOrderForUserCourse(
  userId: number,
  courseId: number,
): Promise<Order | null> {
  const rows = await sql`
    SELECT * FROM orders
    WHERE user_id = ${userId}
      AND course_id = ${courseId}
      AND status IN ('pending', 'awaiting_payment', 'pending_verification', 'paid')
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] ? mapOrder(rows[0] as Record<string, unknown>) : null;
}

export async function cancelOrder(id: number): Promise<Order> {
  const rows = await sql`
    UPDATE orders SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapOrder(rows[0] as Record<string, unknown>);
}

export async function createOrder(data: {
  userId: number;
  courseId: number;
  paymentMethodId: number;
  orderNumber: string;
  subtotal: string;
  adminFee: string;
  discountAmount: string;
  totalAmount: string;
  couponCode?: string | null;
}): Promise<Order> {
  const rows = await sql`
    INSERT INTO orders (
      user_id, course_id, payment_method_id, order_number,
      status, subtotal, admin_fee, discount_amount, total_amount, coupon_code
    ) VALUES (
      ${data.userId}, ${data.courseId}, ${data.paymentMethodId}, ${data.orderNumber},
      'pending', ${data.subtotal}, ${data.adminFee}, ${data.discountAmount},
      ${data.totalAmount}, ${data.couponCode ?? null}
    )
    RETURNING *
  `;
  return mapOrder(rows[0] as Record<string, unknown>);
}

export async function updateOrderStatus(
  id: number,
  status: OrderStatus,
  extra?: {
    vaNumber?: string | null;
    gatewayTransactionId?: string | null;
    gatewayPaymentUrl?: string | null;
    paidAt?: Date | null;
    instructorRevenue?: string | null;
    platformRevenue?: string | null;
    expiresAt?: Date | null;
    notes?: string | null;
  },
): Promise<Order> {
  const rows = await sql`
    UPDATE orders SET
      status = ${status},
      va_number = COALESCE(${extra?.vaNumber ?? null}, va_number),
      gateway_transaction_id = COALESCE(${extra?.gatewayTransactionId ?? null}, gateway_transaction_id),
      gateway_payment_url = COALESCE(${extra?.gatewayPaymentUrl ?? null}, gateway_payment_url),
      paid_at = COALESCE(${extra?.paidAt ?? null}, paid_at),
      instructor_revenue = COALESCE(${extra?.instructorRevenue ?? null}, instructor_revenue),
      platform_revenue = COALESCE(${extra?.platformRevenue ?? null}, platform_revenue),
      expires_at = COALESCE(${extra?.expiresAt ?? null}, expires_at),
      notes = COALESCE(${extra?.notes ?? null}, notes),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapOrder(rows[0] as Record<string, unknown>);
}

export type AdminOverviewStats = {
  todayRevenue: string;
  monthRevenue: string;
  learnerCount: number;
  pendingProofs: number;
  publishedCourses: number;
  liveClassesToday: number;
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const [today, month, learners, proofs, courses, live] = await Promise.all([
    sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE status = 'paid' AND paid_at >= date_trunc('day', NOW())
    `,
    sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE status = 'paid' AND paid_at >= date_trunc('month', NOW())
    `,
    sql`SELECT COUNT(*) AS n FROM users WHERE role = 'user' AND deleted_at IS NULL AND is_active = TRUE`,
    sql`SELECT COUNT(*) AS n FROM payment_proofs WHERE status = 'pending'`,
    sql`SELECT COUNT(*) AS n FROM courses WHERE status = 'published' AND deleted_at IS NULL`,
    sql`
      SELECT COUNT(*) AS n FROM lessons
      WHERE deleted_at IS NULL
        AND content_type = 'live_class'
        AND live_class_datetime IS NOT NULL
        AND live_class_datetime >= date_trunc('day', NOW())
        AND live_class_datetime < date_trunc('day', NOW()) + interval '1 day'
    `,
  ]);
  return {
    todayRevenue: String((today[0] as { total: unknown }).total ?? "0"),
    monthRevenue: String((month[0] as { total: unknown }).total ?? "0"),
    learnerCount: Number((learners[0] as { n: unknown }).n ?? 0),
    pendingProofs: Number((proofs[0] as { n: unknown }).n ?? 0),
    publishedCourses: Number((courses[0] as { n: unknown }).n ?? 0),
    liveClassesToday: Number((live[0] as { n: unknown }).n ?? 0),
  };
}

export type AdminOrderRow = Order & {
  buyerName: string;
  buyerEmail: string;
  methodName: string | null;
  courseTitle: string;
};

export async function listOrdersForAdmin(limit = 50): Promise<AdminOrderRow[]> {
  const rows = await sql`
    SELECT o.*, u.name AS buyer_name, u.email AS buyer_email,
           pm.name AS method_name, c.title AS course_title
    FROM orders o
    JOIN users u ON u.id = o.user_id
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    JOIN courses c ON c.id = o.course_id
    ORDER BY o.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapOrder(row),
      buyerName: String(row.buyer_name ?? ""),
      buyerEmail: String(row.buyer_email ?? ""),
      methodName: row.method_name == null ? null : String(row.method_name),
      courseTitle: String(row.course_title ?? ""),
    };
  });
}

export async function listOrdersWithDetailsForUser(userId: number): Promise<(Order & { courseTitle: string; methodName: string | null; methodType: string | null; proofStatus: string | null })[]> {
  const rows = await sql`
    SELECT o.*, 
           c.title AS course_title, 
           pm.name AS method_name, 
           pm.type AS method_type,
           (SELECT status FROM payment_proofs WHERE order_id = o.id ORDER BY payment_proofs.uploaded_at DESC LIMIT 1) AS proof_status
    FROM orders o
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    WHERE o.user_id = ${userId}
    ORDER BY o.created_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapOrder(row),
      courseTitle: String(row.course_title ?? ""),
      methodName: row.method_name == null ? null : String(row.method_name),
      methodType: row.method_type == null ? null : String(row.method_type),
      proofStatus: row.proof_status == null ? null : String(row.proof_status),
    };
  });
}
