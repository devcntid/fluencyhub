import Link from "next/link";
import { auth } from "@/lib/session";
import { instructorScopeId } from "@/lib/instructor-scope";
import { listInstructorCoursesWithRevenue } from "@/lib/db/courses.queries";
import { getExamForCourse } from "@/lib/db/exams.queries";
import { InstructorExamBuilder } from "@/components/instructor/InstructorExamBuilder";

export default async function InstructorExamBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ courseId?: string; tab?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const courses = await listInstructorCoursesWithRevenue(scope);

  if (courses.length === 0) {
    return (
      <div className="mx-auto max-w-[720px] p-8 text-center space-y-4">
        <h1 className="text-xl font-black text-zinc-900">CBT Exam Builder</h1>
        <p className="text-sm text-zinc-500">
          Belum ada kelas aktif. Silakan buat kelas terlebih dahulu sebelum menyusun soal ujian CBT.
        </p>
        <Link href="/instructor/courses" className="btn btn-primary btn-sm inline-block">
          Kelola Kelas &rarr;
        </Link>
      </div>
    );
  }

  const requestedId = Number(params.courseId || 0);
  const selectedCourse = courses.find((c) => c.id === requestedId) || courses[0];
  const exam = await getExamForCourse(selectedCourse.id);
  const initialTab = params.tab === "remedial" ? "remedial" : "main";

  return (
    <InstructorExamBuilder
      key={`exam-builder-${selectedCourse.id}-${initialTab}`}
      course={{ id: selectedCourse.id, title: selectedCourse.title }}
      initialExam={exam}
      initialTab={initialTab}
    />
  );
}
