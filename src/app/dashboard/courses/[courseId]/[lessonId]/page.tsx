import { redirect } from "next/navigation";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  redirect(`/dashboard/classroom?tab=videos&c=${courseId}&lesson=${lessonId}`);
}
