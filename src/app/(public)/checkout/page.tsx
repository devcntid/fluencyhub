import { notFound, redirect } from "next/navigation";
import { CheckoutStepper } from "@/components/checkout/CheckoutStepper";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { getCourseById } from "@/lib/db/courses.queries";
import { getActiveOrderForUserCourse } from "@/lib/db/orders.queries";
import { getActivePaymentMethods } from "@/lib/db/payment-methods.queries";
import { midtransClientKey, midtransSnapScriptUrl } from "@/lib/payment/midtrans-public";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; editMethod?: string }>;
}) {
  const params = await searchParams;
  const courseId = Number(params.courseId);
  if (!courseId) notFound();

  const [course, methods, session] = await Promise.all([
    getCourseById(courseId),
    getActivePaymentMethods(),
    auth(),
  ]);
  if (!course || course.status !== "published") notFound();

  if (!session?.user.id) {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/checkout?courseId=${courseId}`)}`);
  }

  if (session?.user.id) {
    const enrolled = await checkEnrollment(Number(session.user.id), courseId);
    if (enrolled) redirect(`/dashboard/courses/${courseId}`);
  }

  let dbUser = null;
  let existingOrder = null;
  if (session?.user?.id) {
    dbUser = await getUserById(Number(session.user.id));
    existingOrder = await getActiveOrderForUserCourse(Number(session.user.id), courseId);
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
