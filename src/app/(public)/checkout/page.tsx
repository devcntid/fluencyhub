import { notFound, redirect } from "next/navigation";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { getCourseById } from "@/lib/db/courses.queries";
import { getActiveOrderForUserCourse, getOrderByNumber } from "@/lib/db/orders.queries";
import { getActivePaymentMethods } from "@/lib/db/payment-methods.queries";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/payment/midtrans-public";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; editMethod?: string; orderNumber?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  let existingOrder = null;
  if (params.orderNumber && session?.user?.id) {
    const found = await getOrderByNumber(params.orderNumber);
    if (found && found.userId === Number(session.user.id)) {
      existingOrder = found;
    }
  }

  const courseId = Number(params.courseId) || (existingOrder ? existingOrder.courseId : 0);
  if (!courseId) notFound();

  const [course, methods] = await Promise.all([
    getCourseById(courseId),
    getActivePaymentMethods(),
  ]);
  if (!course || course.status !== "published") notFound();

  if (!session?.user.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/checkout?courseId=${courseId}${params.orderNumber ? `&orderNumber=${params.orderNumber}` : ""}`)}`);
  }

  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await getUserById(Number(session.user.id));
    if (!existingOrder) {
      existingOrder = await getActiveOrderForUserCourse(Number(session.user.id), courseId);
    }

    // Jika order baru saja lunas, arahkan ke halaman status sukses dulu agar user melihat bukti bayar!
    if (existingOrder && existingOrder.status === "paid") {
      const paidTime = existingOrder.paidAt
        ? new Date(existingOrder.paidAt).getTime()
        : new Date(existingOrder.updatedAt).getTime();
      const isRecent = Date.now() - paidTime < 60 * 60 * 1000; // 1 jam terakhir
      if (isRecent) {
        redirect(`/checkout/success?orderNumber=${existingOrder.orderNumber}`);
      }
    }

    const enrolled = await checkEnrollment(Number(session.user.id), courseId);
    if (enrolled) redirect(`/dashboard/classroom?tab=videos&c=${courseId}`);
  }

  return (
    <CheckoutStepper
      course={course}
      methods={methods}
      user={
        session?.user
          ? {
              name: session.user.name ?? "",
              email: session.user.email ?? "",
              whatsappNumber: dbUser?.whatsappNumber ?? null,
            }
          : null
      }
      midtransClientKey={midtransClientKey()}
      midtransSnapScriptUrl={midtransSnapScriptUrl()}
      initialOrder={existingOrder}
      initialStep={params.editMethod === '1' ? 3 : undefined}
    />
  );
}
