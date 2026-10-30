import { NextResponse } from "next/server";
import { getCourseById } from "@/lib/db/courses.queries";
import { getOrderById } from "@/lib/db/orders.queries";
import { markOrderPaid } from "@/lib/orders";
import { getFaspayTransactionStatus } from "@/lib/payment/faspay";
import { auth } from "@/lib/session";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  let order = await getOrderById(Number(id));
  if (!order || (order.userId !== Number(session.user.id) && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Active synchronization from Payment Gateway if order is still pending/awaiting_payment
  if (order.status === "pending" || order.status === "awaiting_payment") {
    try {
      const gwStatus = await getFaspayTransactionStatus(order.orderNumber, order.gatewayTransactionId);
      if (gwStatus && (gwStatus.status === "SUCCEEDED" || gwStatus.status === "PAID")) {
        const course = await getCourseById(order.courseId);
        if (course) {
          order = await markOrderPaid(order, course);
        }
      }
    } catch (err) {
      console.warn("Failed to auto-sync order status with gateway:", err);
    }
  }

  return NextResponse.json({ data: { status: order.status, order } });
}
