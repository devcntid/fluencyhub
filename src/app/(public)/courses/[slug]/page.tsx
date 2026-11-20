import Link from "next/link";
import { notFound } from "next/navigation";
import { countLessonsForCourse, listPublicCurriculum } from "@/lib/db/curriculum.queries";
import { getCourseBySlug } from "@/lib/db/courses.queries";
import { getInstructorPublic } from "@/lib/db/users.queries";
import { checkEnrollment } from "@/lib/db/enrollments.queries";
import { getLatestReadyCheckSummaryForUser } from "@/lib/db/speaking.queries";
import { auth } from "@/lib/session";
import { formatIdr } from "@/lib/utils/cn";
import { ProtectedVideoPlayer } from "@/components/video/ProtectedVideoPlayer";

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

  const userId = session?.user?.id ? Number(session.user.id) : null;
  const [isEnrolled, latestReadyCheck] = userId
    ? await Promise.all([
        checkEnrollment(userId, course.id),
        getLatestReadyCheckSummaryForUser(userId),
      ])
    : [false, null];

  const preview = curriculum.flatMap((s) => s.lessons).find((l) => l.previewVideoId);
  const checkoutPath = `/checkout?courseId=${course.id}`;
  let buyHref = `/auth/signin?callbackUrl=${encodeURIComponent(checkoutPath)}`;
  if (session?.user) {
    buyHref = isEnrolled ? `/dashboard/classroom?c=${course.id}` : checkoutPath;
  }

  const totalMinutes =
    course.totalDurationMin ||
    curriculum.reduce(
      (a, s) => a + s.lessons.reduce((b, l) => b + l.durationMinutes, 0),
      0
    );

  const tierLabel =
    course.tierBadge ??
    (course.tier === "tier_bawah"
      ? "Paket Bawah · AI Partner"
      : course.tier === "tier_tinggi"
      ? "Paket Tinggi · Executive 1-on-1"
      : "Paket Menengah · Cohort Zoom");

  const formatLabel =
    course.speakingPartnerType === "ai"
      ? "AI Partner 24/7"
      : course.speakingPartnerType === "trainer_offline"
      ? "Offline 1-on-1"
      : "Live Zoom";

  const priceNum = Number(course.price);
  const origNum = course.originalPrice ? Number(course.originalPrice) : null;

  return (
    <main className="bg-[#FBF6F1] pb-28 text-[#0B2559] md:pb-16">
      {/* Top Back Bar */}
      <div className="border-b border-[#E6DED4] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/programs"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#0B2559] no-underline transition hover:text-[#C2530A]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali ke Program
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C2530A]">
            {tierLabel}
          </span>
        </div>
      </div>

      {/* Screen 05 Navy Banner */}
      <div className="bg-[#0B2559] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-3 px-4 py-3.5 text-sm sm:px-6">
          {latestReadyCheck ? (
            <>
              <span className="font-bold">Ready Check-mu:</span>
              <span className="rounded-full bg-white px-3 py-1 font-extrabold text-[#0B2559]">
                {latestReadyCheck.levelTitle} · {latestReadyCheck.overallScore}
              </span>
              <span>→ kelas ini cocok untuk memperkuat kesiapanmu.</span>
            </>
          ) : (
            <>
              <span className="font-bold">Belum punya Ready Score?</span>
              <Link
                href="/ready-check"
                className="rounded-full bg-[#C2530A] px-3 py-1 text-xs font-extrabold text-white no-underline hover:bg-[#a84507]"
              >
                Ambil Ready Check gratis 10 menit →
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Hero + Sticky Sidebar Card (Screen 05 Layout) */}
      <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 lg:py-12">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="text-sm font-bold uppercase tracking-[0.12em] text-[#C2530A]">
            {course.level.replace("_", " ")} · {course.language.toUpperCase()}
          </div>
          <h1 className="m-0 text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] text-[#0B2559] sm:text-[48px]">
            {course.title}
          </h1>
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-[#3D4760] sm:text-[19px]">
            {course.shortDescription}
          </p>

          {/* 4 Stat Tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Format</div>
              <div className="mt-0.5 text-[16px] font-extrabold text-[#0B2559]">{formatLabel}</div>
            </div>
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Materi</div>
              <div className="mt-0.5 text-[16px] font-extrabold text-[#0B2559]">
                {lessonCount} modul
              </div>
            </div>
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Total durasi</div>
              <div className="mt-0.5 text-[16px] font-extrabold text-[#0B2559]">
                {totalMinutes} menit
              </div>
            </div>
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Peserta</div>
              <div className="mt-0.5 text-[16px] font-extrabold text-[#0B2559]">
                {course.maxStudents ? `Maks. ${course.maxStudents}` : `${course.enrollmentCount}+`}
              </div>
            </div>
          </div>

          {/* Preview Player / Thumbnail */}
          <div className="pt-2">
            {preview?.previewVideoId ? (
              <ProtectedVideoPlayer youtubeVideoId={preview.previewVideoId} title={preview.title} />
            ) : course.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="aspect-video w-full rounded-[20px] border border-[#E6DED4] object-cover shadow-sm"
              />
            ) : null}
            <p className="mt-2.5 text-xs font-medium text-[#4A5468]">
              Preview gratis tersedia · seluruh modul &amp; sesi terbuka penuh setelah terdaftar
            </p>
          </div>
        </div>

        {/* Right Sticky Pricing Card */}
        <aside className="flex w-full min-w-0 flex-col gap-4 rounded-[24px] border border-[#E6DED4]/80 bg-white p-6 shadow-[0_1px_0_#E6DED4,0_12px_32px_rgba(11,37,89,0.08)] sm:p-7 lg:sticky lg:top-24">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C2530A]">{tierLabel}</div>
          {isEnrolled ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700">
              Kamu sudah terdaftar di kelas ini
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="whitespace-nowrap text-[28px] font-extrabold leading-tight tracking-tight text-[#0B2559] sm:text-[32px] tabular-nums">
                  {course.isFree ? "Gratis" : formatIdr(priceNum)}
                </div>
                {origNum && origNum > priceNum && (
                  <div className="whitespace-nowrap text-sm font-medium text-[#4A5468] line-through sm:text-base tabular-nums">
                    {formatIdr(origNum)}
                  </div>
                )}
              </div>
              {origNum && origNum > priceNum && (
                <div className="text-sm font-bold text-[#C2530A]">
                  Hemat {formatIdr(origNum - priceNum)} · Akses Seumur Hidup
                </div>
              )}
            </>
          )}

          <Link
            href={buyHref}
            className={`rounded-[14px] px-4 py-4 text-center text-[17px] font-bold text-white no-underline transition ${
              isEnrolled
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-[#C2530A] hover:bg-[#a84507]"
            }`}
          >
            {!session?.user
              ? "Daftar & Beli Sekarang"
              : isEnrolled
              ? "Lanjut Belajar di Classroom →"
              : "Daftar Program Ini"}
          </Link>

          <div className="flex flex-col gap-2.5 pt-1 text-[14.5px] text-[#0B2559]">
            {(course.featuresJson && course.featuresJson.length > 0
              ? course.featuresJson.slice(0, 5)
              : [
                  "Akses penuh seluruh modul video & latihan",
                  "Tes Baseline & Exit untuk mengukur Ready Score",
                  "Sertifikat kelulusan resmi English Ready",
                ]
            ).map((feat) => (
              <div key={feat} className="flex items-start gap-2.5">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#0B2559"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0"
                >
                  <path d="M5 12l5 5L20 7" />
                </svg>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          <div className="text-[13px] text-[#4A5468]">
            Bayar dengan QRIS, transfer bank, atau e-wallet.
          </div>
        </aside>
      </section>

      {/* About Program Band (White) */}
      <section className="border-y border-[#E6DED4] bg-white py-12">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <h2 className="m-0 mb-4 text-[26px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[30px]">
            Tentang Program Ini
          </h2>
          <p className="max-w-3xl text-[16px] leading-[1.65] text-[#3D4760]">
            {course.description ?? course.shortDescription}
          </p>
        </div>
      </section>

      {/* Curriculum Band */}
      <section className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
        <h2 className="m-0 mb-6 text-[26px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[30px]">
          Kurikulum &amp; Alur Belajar
        </h2>
        <div className="space-y-4">
          {curriculum.map((section) => (
            <div
              key={section.id}
              className="rounded-[20px] border border-[#E6DED4] bg-white p-6"
            >
              <h3 className="m-0 mb-3.5 text-lg font-extrabold text-[#0B2559]">{section.title}</h3>
              <ul className="m-0 space-y-2.5 p-0 list-none">
                {section.lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center justify-between gap-3 border-t border-[#F1EAE1] pt-2.5 first:border-t-0 first:pt-0 text-sm"
                  >
                    <span className="font-medium text-[#3D4760]">{lesson.title}</span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-[#4A5468]">
                      {lesson.isFreePreview ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                          Preview Gratis
                        </span>
                      ) : null}
                      {lesson.durationMinutes ? `${lesson.durationMinutes} min` : null}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Instructor Band */}
      {instructor ? (
        <section className="mx-auto max-w-[1200px] px-4 pb-8 sm:px-6">
          <div className="flex max-w-md items-center gap-4 rounded-[20px] border border-[#E6DED4] bg-white p-6">
            {instructor.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={instructor.avatarUrl}
                alt={instructor.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EFE7DD] text-lg font-extrabold text-[#0B2559]">
                {instructor.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-xs font-bold text-[#4A5468]">Coach Pendamping</div>
              <p className="m-0 text-lg font-extrabold text-[#0B2559]">{instructor.name}</p>
              <p className="m-0 text-sm text-[#3D4760]">English Ready Instructor</p>
            </div>
          </div>
        </section>
      ) : null}

      {/* Mobile Fixed Sticky Bottom CTA */}
      <section className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E6DED4] bg-white/95 py-3.5 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4">
          <div className="flex-1">
            {isEnrolled ? (
              <span className="inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                Sudah Terdaftar
              </span>
            ) : (
              <>
                {origNum && origNum > priceNum ? (
                  <p className="m-0 text-[11px] text-[#4A5468] line-through">
                    {formatIdr(origNum)}
                  </p>
                ) : null}
                <p className="m-0 text-xl font-extrabold text-[#C2530A]">
                  {course.isFree ? "Gratis" : formatIdr(priceNum)}
                </p>
              </>
            )}
          </div>
          <Link
            href={buyHref}
            className="whitespace-nowrap rounded-[12px] bg-[#C2530A] px-5 py-3 text-sm font-bold text-white no-underline"
          >
            {!session?.user ? "Daftar & Beli" : isEnrolled ? "Lanjut Belajar" : "Daftar Sekarang"}
          </Link>
        </div>
      </section>
    </main>
  );
}
