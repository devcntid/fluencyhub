/* eslint-disable @next/next/no-img-element */
import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";

export default async function ElearningPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const enrollments = await listEnrollmentsForUser(Number(session.user.id));

  return (
    <main className="w-full flex flex-col gap-10">
      {/* Header */}
      <div className="w-full flex flex-col gap-1">
        <h1 className="text-2xl font-extrabold text-zinc-900">E-learning</h1>
        <p className="text-sm text-zinc-500">
          Lanjutkan kelas yang sudah kamu ikuti
        </p>
      </div>

      {enrollments.length === 0 && (
        <>
          <div className="flex flex-col items-start text-left">
            <h2 className="mb-2 text-2xl font-bold text-zinc-900">Ups, Sepertinya Kamu Tidak Memiliki Langganan Aktif</h2>
            <p className="mb-6 text-base text-zinc-700">
              Ayo berlangganan sekarang untuk akses ratusan materi e-learning FluencyHub!
            </p>
            <Link href="/#harga" className="flex w-max items-center justify-center rounded bg-[var(--brand)] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-600)]">
              Mulai Berlangganan
            </Link>
          </div>
          <hr className="border-zinc-200" />
        </>
      )}

      <div className="flex flex-col gap-6">
        <h3 className="text-xl font-bold text-zinc-900">Aktivitas E-learning Kamu</h3>
        
        {/* Tabs */}
        <div className="flex w-full items-center gap-2 rounded-lg bg-zinc-100 p-1 md:w-max">
          <button className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand)] shadow-sm">
            Terakhir Dipelajari
          </button>
          <button className="rounded-md px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition">
            Materi Tersimpan
          </button>
          <button className="rounded-md px-5 py-2.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition">
            Materi Selesai
          </button>
        </div>

        {enrollments.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => (
              <Link 
                key={e.id} 
                href={`/dashboard/videos?c=${e.courseId}`} 
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md hover:border-[var(--brand-200)]"
              >
                <div className="relative h-40 w-full bg-zinc-100">
                  {e.course.thumbnailUrl ? (
                    <img src={e.course.thumbnailUrl} alt={e.course.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-200">
                      <LandingIcon name="Video" color="#9ca3af" />
                    </div>
                  )}
                  
                  {/* Overlay Play Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition group-hover:opacity-100 backdrop-blur-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--brand)] shadow-lg">
                      <LandingIcon name="Play" color="currentColor" />
                    </div>
                  </div>

                  <div className="absolute bottom-2 right-2 rounded bg-black/70 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md">
                    {e.progressPct}% Selesai
                  </div>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h4 className="font-bold text-zinc-900 line-clamp-2 mb-2 group-hover:text-[var(--brand)] transition">
                      {e.course.title}
                    </h4>
                    <p className="text-xs text-zinc-500 line-clamp-2">
                      {e.course.shortDescription}
                    </p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-500">Lanjutkan Belajar</span>
                    <LandingIcon name="ArrowRight" color="var(--brand)" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[15px] italic text-zinc-500">
            Belum ada materi untuk ditampilkan.
          </p>
        )}

        {/* Pagination Placeholder */}
        <div className="mt-16 flex items-center justify-between border-t border-zinc-100 pt-6">
          <button className="flex items-center gap-2 rounded-lg border border-[var(--brand-200)] px-4 py-2 text-sm font-bold text-[var(--brand-300)] cursor-not-allowed">
            <LandingIcon name="ChevronLeft" size={16} color="currentColor" />
            Sebelumnya
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-[var(--brand-200)] px-4 py-2 text-sm font-bold text-[var(--brand-300)] cursor-not-allowed">
            Selanjutnya
            <LandingIcon name="ChevronRight" size={16} color="currentColor" />
          </button>
        </div>
      </div>
    </main>
  );
}
