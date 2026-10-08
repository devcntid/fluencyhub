import { redirect } from "next/navigation";
import { auth } from "@/lib/session";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { listCoursePlayerCurriculum } from "@/lib/db/lessons.queries";
import { CourseVideoPlayer } from "@/components/dashboard/CourseVideoPlayer";
import { LandingIcon } from "@/components/landing/LandingIcon";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = parseInt(session.user.id, 10);
  const enrollments = await listEnrollmentsForUser(userId);

  if (enrollments.length === 0) {
    return (
      <main className="flex min-h-[calc(100vh-72px)] w-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 shadow-sm">
          <LandingIcon name="Video" size={48} color="currentColor" />
        </div>
        <h1 className="mb-3 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-zinc-900 md:text-3xl">
          Belum Ada Kelas
        </h1>
        <p className="max-w-md text-zinc-500">
          Anda belum berlangganan kelas apapun. Silakan kunjungi halaman utama untuk melihat daftar kelas yang tersedia.
        </p>
      </main>
    );
  }

  // Handle course selection if multiple enrollments exist
  // By default we pick the first one unless `?c=id` is provided
  let selectedEnrollment = enrollments[0];
  if (resolvedSearchParams.c) {
    const cid = parseInt(resolvedSearchParams.c, 10);
    const found = enrollments.find((e) => e.courseId === cid);
    if (found) {
      selectedEnrollment = found;
    }
  }

  const course = selectedEnrollment.course;
  const curriculum = await listCoursePlayerCurriculum(course.id, userId);

  return (
    <main className="min-h-[calc(100vh-72px)] w-full p-6 pb-20 md:p-8">
      {enrollments.length > 1 && (
        <div className="mb-6 w-full">
          <label className="text-sm font-semibold text-zinc-500 mb-2 block">Pilih Kelas:</label>
          <div className="flex gap-2 overflow-x-auto pb-2">
             {enrollments.map((e) => (
               <a 
                 key={e.courseId} 
                 href={`/dashboard/videos?c=${e.courseId}`}
                 className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold border ${
                   e.courseId === course.id 
                     ? "bg-[var(--brand)] text-white border-[var(--brand)]" 
                     : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"
                 }`}
               >
                 {e.course.title}
               </a>
             ))}
          </div>
        </div>
      )}
      
      <CourseVideoPlayer course={course} curriculum={curriculum} />
    </main>
  );
}
