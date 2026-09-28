import { NextResponse } from "next/server";
import { z } from "zod";
import { getCouponByCode, incrementCouponUse } from "@/lib/db/coupons.queries";
import { getCourseById } from "@/lib/db/courses.queries";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { cancelOrder, createOrder, getActiveOrderForUserCourse } from "@/lib/db/orders.queries";
import { getPaymentMethodById } from "@/lib/db/payment-methods.queries";
import { createPaymentLog } from "@/lib/db/payment-logs.queries";
import { createNotificationLog } from "@/lib/db/notification-logs.queries";
import { getActiveTemplate } from "@/lib/db/notification-templates.queries";
import { getUserById } from "@/lib/db/users.queries";
import { generateOrderNumber } from "@/lib/orders";
import { paymentRatelimit } from "@/lib/redis";
import { auth } from "@/lib/session";

const Schema = z.object({
  courseId: z.number(),
  paymentMethodId: z.number(),
  couponCode: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);
  const { success } = await paymentRatelimit.limit(`create_order:${userId}`);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { courseId, paymentMethodId, couponCode } = parsed.data;
  const [course, method, enrolled, existing] = await Promise.all([
    getCourseById(courseId),
    getPaymentMethodById(paymentMethodId),
    checkEnrollment(userId, courseId),
    getActiveOrderForUserCourse(userId, courseId),
  ]);
  if (!course || course.status !== "published") {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (!method || !method.isActive) {
    return NextResponse.json({ error: "Payment method unavailable" }, { status: 400 });
  }
  if (enrolled) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }
  if (existing) {
    if (existing.status === "paid") {
      return NextResponse.json({ error: "You already have a paid order for this course" }, { status: 409 });
    }
    if (existing.paymentMethodId === paymentMethodId) {
      return NextResponse.json({ data: existing }, { status: 200 });
    }
    await cancelOrder(existing.id);
  }

  const subtotal = Number(course.price);
  let discount = 0;
  if (couponCode) {
    const coupon = await getCouponByCode(couponCode);
    if (coupon) {
      if (coupon.discountType === "percentage") {
        discount = Math.round((subtotal * Number(coupon.discountValue)) / 100);
      } else {
        discount = Number(coupon.discountValue);
      }
      await incrementCouponUse(coupon.id);
    }
  }
  const adminFee = method.adminFeeFlat + (subtotal * Number(method.adminFeePct)) / 100;
  const total = Math.max(0, subtotal - discount + adminFee);

  const order = await createOrder({
    userId,
    courseId,
    paymentMethodId,
    orderNumber: generateOrderNumber(),
    subtotal: subtotal.toFixed(2),
    adminFee: adminFee.toFixed(2),
    discountAmount: discount.toFixed(2),
    totalAmount: total.toFixed(2),
    couponCode: couponCode ?? null,
  });
  await createPaymentLog({
    orderNumber: order.orderNumber,
    endpoint: "/api/orders",
    logType: "payment_request",
    requestPayload: JSON.stringify(parsed.data),
    httpStatus: 201,
  });

  const user = await getUserById(userId);
  if (user) {
    const template = await getActiveTemplate("MANUAL_TRANSFER_PENDING", "WHATSAPP");

    await createNotificationLog({
      templateId: template?.id ?? null,
      orderNumber: order.orderNumber,
      userId: userId,
      recipient: user.email,
      channel: "WHATSAPP",
      requestPayload: JSON.stringify({
        event: "checkout",
        orderNumber: order.orderNumber,
        courseId: courseId,
        totalAmount: total.toFixed(2)
      }),
      responsePayload: JSON.stringify({
        message: "Notification successfully queued for delivery",
        queuedAt: new Date().toISOString()
      }),
      status: "QUEUED"
    });
  }

  return NextResponse.json({ data: order }, { status: 201 });
}
