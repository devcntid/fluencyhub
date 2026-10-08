import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/session";
import { getLessonById, getLessonCourseOwner } from "@/lib/db/lessons.queries";
import { sql } from "@/lib/db/client";

import { LandingIcon } from "@/components/landing/LandingIcon";
import { ResourceCompleteButton } from "./ResourceCompleteButton";

export default async function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = Number(session.user.id);
  const { id } = await params;
  const lessonId = parseInt(id, 10);
  
  if (isNaN(lessonId)) {
    return notFound();
  }

  const lesson = await getLessonById(lessonId);
  const ownerInfo = await getLessonCourseOwner(lessonId);
  
  if (!lesson || !lesson.textContent || !ownerInfo) {
    return notFound();
  }

  const progress = await sql`
    SELECT is_completed FROM lesson_progress
    WHERE user_id = ${userId} AND lesson_id = ${lessonId}
    LIMIT 1
  `;
  const isCompleted = progress.length > 0 ? Boolean(progress[0].is_completed) : false;

  return (
    <main className="w-full px-4 py-8 md:py-12">
      <div className="mb-6">
        <Link 
          href="/dashboard/resources" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition"
        >
          <LandingIcon name="ArrowLeft" size={16} />
          Kembali ke Resource Library
        </Link>
      </div>

      <article className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden mb-8 w-full">
        <div className="border-b border-zinc-100 bg-zinc-50/50 p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <LandingIcon name="BookOpen" size={20} color="currentColor" />
            </div>
            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 border border-blue-100">
              Teks Materi
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-2xl md:text-3xl font-extrabold text-zinc-900 leading-tight">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="mt-3 text-zinc-500 text-sm">
              {lesson.description}
            </p>
          )}
        </div>
        
        <div className="p-6 md:p-8">
          <div className="prose prose-zinc max-w-none text-zinc-700 whitespace-pre-wrap">
            {lesson.textContent}
          </div>
        </div>
      </article>

      <div className="flex justify-end">
        <ResourceCompleteButton 
          courseId={ownerInfo.courseId} 
          lessonId={lessonId} 
          initialCompleted={isCompleted} 
        />
      </div>
    </main>
  );
}
