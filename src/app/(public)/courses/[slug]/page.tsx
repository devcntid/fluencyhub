import Link from "next/link";
import { notFound } from "next/navigation";
import { countLessonsForCourse, listPublicCurriculum } from "@/lib/db/curriculum.queries";
import { getCourseBySlug } from "@/lib/db/courses.queries";
import { getInstructorPublic } from "@/lib/db/users.queries";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { auth } from "@/lib/session";
import { formatIdr } from "@/lib/utils/cn";

export default async function PublicCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const course = await getCourseBySlug(decodedSlug);
  if (!course || course.status !== "published") notFound();

  const [curriculum, lessonCount, instructor, session] = await Promise.all([
    listPublicCurriculum(course.id),
    countLessonsForCourse(course.id),
    getInstructorPublic(course.instructorId),
    auth(),
  ]);

  const isEnrolled = session?.user?.id ? await checkEnrollment(Number(session.user.id), course.id) : false;

  const preview = curriculum.flatMap((s) => s.lessons).find((l) => l.previewVideoId);
  const checkoutPath = `/checkout?courseId=${course.id}`;
  let buyHref = `/auth/signin?callbackUrl=${encodeURIComponent(checkoutPath)}`;
  if (session?.user) {
    buyHref = isEnrolled ? `/dashboard/videos?c=${course.id}` : checkoutPath;
  }

  return (
    <main className="pb-32">
      {/* Sticky Back Bar */}
      <div className="sticky top-[62px] z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-3 md:py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-[var(--brand)] transition-colors group">
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            Kembali
          </Link>
        </div>
      </div>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-12 md:pt-8 md:pb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">
            {course.level.replace("_", " ")} · {course.language.toUpperCase()}
          </p>
          <h1 className="heading-xl max-w-4xl">{course.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[var(--text-3)]">{course.shortDescription}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            {[
              `${lessonCount} lessons`,
              `${course.enrollmentCount} members`,
              `${course.totalDurationMin || curriculum.reduce((a, s) => a + s.lessons.reduce((b, l) => b + l.durationMinutes, 0), 0)} min`,
              course.level,
            ].map((chip) => (
              <span key={chip} className="badge badge-primary px-3 py-1 text-xs">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        {preview?.previewVideoId ? (
          <div className="overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-black">
            <iframe
              className="aspect-video w-full"
              src={`https://www.youtube-nocookie.com/embed/${preview.previewVideoId}`}
              title={preview.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : course.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={course.thumbnailUrl}
            alt=""
            className="aspect-video w-full rounded-[var(--r-lg)] object-cover"
          />
        ) : null}
        <p className="mt-3 text-sm text-[var(--text-4)]">Free preview · full videos unlock after purchase</p>
      </section>

      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="heading-md mb-4 text-2xl font-extrabold">About</h2>
          <p className="max-w-3xl text-[var(--text-2)]">{course.description ?? course.shortDescription}</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="heading-md mb-6 text-2xl font-extrabold">Curriculum</h2>
        <div className="space-y-4">
          {curriculum.map((section) => (
            <div key={section.id} className="card">
              <h3 className="mb-3 font-bold">{section.title}</h3>
              <ul className="space-y-2">
                {section.lessons.map((lesson) => (
                  <li key={lesson.id} className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-2)]">{lesson.title}</span>
                    <span className="flex items-center gap-2 text-[var(--text-4)]">
                      {lesson.isFreePreview ? <span className="badge badge-success">Preview</span> : null}
                      {lesson.durationMinutes ? `${lesson.durationMinutes} min` : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {instructor ? (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="heading-md mb-6 text-2xl font-extrabold">Instructor</h2>
            <div className="card flex max-w-md items-center gap-4">
              {instructor.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={instructor.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-50)] font-bold text-[var(--brand)]">
                  {instructor.name.slice(0, 1)}
                </div>
              )}
              <div>
                <p className="font-bold">{instructor.name}</p>
                <p className="text-sm text-[var(--text-3)]">FluencyHub instructor</p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="fixed bottom-0 left-0 right-0 w-full z-50 bg-white/95 backdrop-blur-md border-t border-zinc-200 py-4 shadow-[0_-15px_30px_-15px_rgba(0,0,0,0.1)]">
        <div className="mx-auto max-w-6xl px-4 flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            {isEnrolled ? (
              <>
                <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm font-bold text-blue-600 border border-blue-100">
                  Sudah Terdaftar
                </span>
                <p className="hidden md:block mt-1 text-sm text-[var(--text-3)]">Anda sudah memiliki akses ke kelas ini</p>
              </>
            ) : (
              <>
                {course.originalPrice ? (
                  <p className="text-xs text-[var(--text-4)] line-through">{formatIdr(course.originalPrice)}</p>
                ) : null}
                <p className="text-xl md:text-3xl font-extrabold text-[var(--brand)]">{formatIdr(course.price)}</p>
                <p className="hidden md:block mt-1 text-xs text-[var(--text-3)]">Lifetime access after payment is confirmed</p>
              </>
            )}
          </div>
          <Link href={buyHref} className="btn btn-primary whitespace-nowrap px-6 py-3">
            {!session?.user 
              ? "Daftar & Beli" 
              : isEnrolled 
                ? "Lanjut Belajar" 
                : "Beli sekarang"}
          </Link>
        </div>
      </section>
    </main>
  );
}
