import { redirect } from "next/navigation";

export default async function InstructorExamsPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string }>;
}) {
  const params = await searchParams;
  const courseQuery = params?.courseId ? `&courseId=${params.courseId}` : "";
  redirect(`/instructor/curriculum?tab=exams${courseQuery}`);
}
