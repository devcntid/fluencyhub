import Link from "next/link";
import { ProgramGoalGrid } from "@/components/landing/ProgramAndCatalogSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { getProgramPageData } from "@/lib/programs/page-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Semua Program & Paket Kelas — English Ready",
  description:
    "Pilih jalur belajar bahasa Inggris sesuai tujuanmu: Ready to Speak, Ready for Work, Ready to Go, atau Ready for the World.",
};

export default async function AllProgramsPage() {
  const { publicCourses, enrolledCourseIds } = await getProgramPageData();

  return (
    <main className="bg-[#FBF6F1] text-[#0B2559]">
      {/* Breadcrumb Bar */}
      <div className="border-b border-[#E6DED4] bg-white">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6">
          <Link
            href="/#program"
            className="inline-flex items-center gap-1.5 font-bold text-[#0B2559] no-underline transition hover:text-[#C2530A]"
          >
            <span aria-hidden="true">←</span>
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-[#C2530A]">
            Semua Program &amp; Katalog Kelas
          </span>
        </div>
      </div>

      {/* 4 Goal Selector Cards (Each opens /programs/[slug] Screen 05 page) */}
      <section className="border-b border-[#E6DED4] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-14">
          <div className="max-w-2xl">
            <div className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-[#C2530A]">
              Speak · Connect · Contribute
            </div>
            <h1 className="m-0 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[42px]">
              Pilih Program Sesuai Tujuanmu
            </h1>
            <p className="mt-2.5 mb-0 text-[16px] leading-relaxed text-[#4A5468]">
              Tekan salah satu jalur di bawah untuk melihat alur cohort 6 minggu, silabus lengkap, dan paket kelas yang cocok, atau telusuri seluruh katalog kelas di bawah ini.
            </p>
          </div>

          <ProgramGoalGrid />
        </div>
      </section>

      {/* Complete Public Course Catalog */}
      <PricingSection
        courses={publicCourses}
        enrolledCourseIds={enrolledCourseIds}
      />
    </main>
  );
}

