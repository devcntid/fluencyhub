import Link from "next/link";
import { PROGRAM_GOALS } from "@/lib/programs/catalog";

export function ProgramGoalGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {PROGRAM_GOALS.map((track) => (
        <Link
          key={track.slug}
          href={`/programs/${track.slug}`}
          className={`group flex h-full flex-col gap-3 rounded-[20px] border-2 p-5 text-left text-[#0B2559] no-underline transition hover:-translate-y-0.5 hover:shadow-md xl:p-6 ${
            track.featured
              ? "border-[#0B2559] bg-[#FBF6F1] shadow-[0_8px_24px_rgba(11,37,89,0.06)]"
              : "border-[#E6DED4] bg-[#FBF6F1] hover:border-[#0B2559]/50"
          }`}
        >
          <div className="flex min-h-[22px] items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.1em] text-[#C2530A]">
              {track.eyebrow}
            </span>
            {track.featured && (
              <span className="rounded-full bg-[#0B2559] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Populer
              </span>
            )}
          </div>

          <div className="text-[20px] font-extrabold leading-snug tracking-[-0.01em] text-[#0B2559] xl:text-[21px]">
            {track.title}
          </div>

          <p className="m-0 text-[14.5px] leading-[1.6] text-[#3D4760]">
            {track.cardDescription}
          </p>

          <div className="mt-auto flex flex-col gap-1.5 border-t border-[#E6DED4] pt-3.5">
            <span className="text-[12px] font-semibold text-[#4A5468]">
              {track.startFrom}
            </span>
            <span className="inline-flex items-center justify-between whitespace-nowrap text-[13px] font-bold text-[#C2530A] transition-colors group-hover:text-[#0B2559]">
              <span>Lihat detail program</span>
              <span
                aria-hidden="true"
                className="transition-transform group-hover:translate-x-1"
              >
                →
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function ProgramAndCatalogSection() {
  return (
    <div id="program" className="scroll-mt-20">
      {/* Program sesuai tujuanmu (Goal Selector Cards -> dedicated Screen 05 pages) */}
      <section className="border-y border-[#E6DED4] bg-white">
        <div
          id="harga"
          className="mx-auto flex max-w-[1200px] scroll-mt-24 flex-col gap-8 px-4 py-14 sm:px-6 sm:py-[72px]"
        >
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div className="max-w-xl">
              <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[38px]">
                Program sesuai tujuanmu
              </h2>
              <p className="mt-2 mb-0 text-[15px] leading-relaxed text-[#4A5468]">
                Pilih tujuan belajarmu untuk membuka halaman program lengkap beserta paket kelas yang sesuai.
              </p>
            </div>
            <Link
              href="/programs"
              className="w-fit shrink-0 whitespace-nowrap text-[15px] font-bold text-[#C2530A] no-underline transition-colors hover:text-[#0B2559] sm:text-[16px]"
            >
              Lihat semua program →
            </Link>
          </div>

          <ProgramGoalGrid />
        </div>
      </section>
    </div>
  );
}
