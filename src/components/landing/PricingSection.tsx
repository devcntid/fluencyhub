"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { formatIdr } from "@/lib/utils/cn";
import type { PublishedCourseCard } from "@/types/db";

type TierFilter = "all" | "tier_bawah" | "tier_menengah" | "tier_tinggi";

export function PricingSection({
  courses,
  enrolledCourseIds = [],
}: {
  courses: PublishedCourseCard[];
  enrolledCourseIds?: number[];
}) {
  const [selectedTier, setSelectedTier] = useState<TierFilter>("all");

  // Find official 3-tier flagship packages
  const bawahCourse = courses.find((c) => c.tier === "tier_bawah" || c.slug === "ready-daily");
  const menengahCourse =
    courses.find((c) => c.tier === "tier_menengah" && (c.slug === "cohort-ready-for-work" || c.isFeatured)) ||
    courses.find((c) => c.tier === "tier_menengah");
  const tinggiCourse = courses.find((c) => c.tier === "tier_tinggi" || c.slug === "ready-path-executive");

  // Fallback defaults if specific tier courses are not in the database yet
  const tierPackages = [
    {
      tierKey: "tier_bawah" as const,
      name: "Ready Daily",
      tagline: "Latihan Mandiri & AI Speaking Partner",
      badgeText: "Paket Bawah",
      subBadge: "Self-Paced AI",
      price: bawahCourse ? Number(bawahCourse.price) : 99000,
      originalPrice: bawahCourse ? Number(bawahCourse.originalPrice || 199000) : 199000,
      period: "/ bulan",
      slug: bawahCourse ? bawahCourse.slug : "ready-daily",
      courseId: bawahCourse?.id,
      isFeatured: false,
      partnerIcon: "Bot",
      partnerBadge: "AI Speaking Partner 24/7",
      partnerDesc: "Latihan bicara interaktif 24/7 dengan auto-scoring poin & feedback instan per sesi percakapan.",
      partnerBg: "bg-[#FBF6F1] border-[#E6DED4] text-[#0B2559]",
      features: [
        "Akses penuh materi video modul pembelajaran 24/7",
        "AI Speaking Partner 24/7 (latihan bicara kapan saja)",
        "Auto-scoring poin & evaluasi kemampuan instan",
        "Daily speaking challenge harian di platform",
        "Grup komunitas diskusi WhatsApp aktif",
        "Pelacakan grafik Ready Points di dashboard progres",
      ],
    },
    {
      tierKey: "tier_menengah" as const,
      name: "Cohort Ready for Work",
      tagline: "6-Week Live Online Mentoring",
      badgeText: "Paket Menengah",
      subBadge: "Paling Diminati",
      price: menengahCourse ? Number(menengahCourse.price) : 1490000,
      originalPrice: menengahCourse ? Number(menengahCourse.originalPrice || 1990000) : 1990000,
      period: "/ program (6 minggu)",
      slug: menengahCourse ? menengahCourse.slug : "cohort-ready-for-work",
      courseId: menengahCourse?.id,
      isFeatured: true,
      partnerIcon: "Video",
      partnerBadge: "Live Trainer Online (Zoom)",
      partnerDesc: "Sesi intensif kelas kelompok online (maks. 12 orang) dengan interaksi dan koreksi langsung dari instruktur.",
      partnerBg: "bg-orange-50/90 border-[#F26A12]/40 text-[#C2530A]",
      features: [
        "Semua fasilitas Paket Bawah (Materi Video + AI Partner)",
        "6 sesi live online mentoring (90 menit) via Zoom",
        "Kelas kecil interaktif (maksimal 12 orang per kelompok)",
        "Live feedback & koreksi aksen/grammar langsung dari trainer",
        "Tes Baseline & Exit untuk mengukur kenaikan Ready Score",
        "Ready Certificate resmi berbasis skor untuk profil LinkedIn",
        "Opsi cicilan 3x Rp 497.000 / bulan",
      ],
    },
    {
      tierKey: "tier_tinggi" as const,
      name: "Ready Path Executive",
      tagline: "Executive 1-on-1 Offline Mentoring",
      badgeText: "Paket Tinggi",
      subBadge: "Executive 1-on-1",
      price: tinggiCourse ? Number(tinggiCourse.price) : 2690000,
      originalPrice: tinggiCourse ? Number(tinggiCourse.originalPrice || 3490000) : 3490000,
      period: "/ program privat",
      slug: tinggiCourse ? tinggiCourse.slug : "ready-path-executive",
      courseId: tinggiCourse?.id,
      isFeatured: false,
      partnerIcon: "MapPin",
      partnerBadge: "Trainer Tatap Muka (Offline)",
      partnerDesc: "Sesi privat 1-on-1 tatap muka langsung bersama trainer, dilengkapi fitur bebas menentukan titik lokasi pertemuan.",
      partnerBg: "bg-amber-50/80 border-amber-200/80 text-amber-800",
      features: [
        "Semua fasilitas Paket Menengah (Cohort + AI Speaking Partner)",
        "4 sesi privat 1-on-1 (Online Zoom / Offline Tatap Muka) bersama Ready Coach",
        "Fitur Atur Lokasi Temu (Coworking Space, Kafe, atau Kantor)",
        "Simulasi intensif wawancara kerja & pitch presentation personal",
        "Review eksklusif dokumen (CV, resume, slide deck presentasi)",
        "Akses konsultasi prioritas personal langsung dengan coach",
        "Pendampingan intensif berorientasi target karier spesifik",
      ],
    },
  ];

  // Helper counts per tier
  const countBawah = courses.filter((c) => c.tier === "tier_bawah").length;
  const countMenengah = courses.filter((c) => c.tier === "tier_menengah").length;
  const countTinggi = courses.filter((c) => c.tier === "tier_tinggi").length;

  // Filtered courses based on selected tab
  const filteredCourses = courses.filter((c) => {
    if (selectedTier === "all") return true;
    return c.tier === selectedTier;
  });

  function handleFilterTier(tier: TierFilter) {
    setSelectedTier(tier);
    const catalogEl = document.getElementById("katalog-kelas");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <section id="harga" className="border-b border-[#E6DED4] bg-[#FBF6F1] px-4 py-16 scroll-mt-20 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-[1200px]">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <div className="mb-3 text-[13px] font-bold uppercase tracking-[0.12em] text-[#C2530A]">
            Pilihan Paket Program
          </div>
          <h2 className="mb-3.5 text-3xl font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[38px]">
            Investasi Terbaik untuk Kesiapan Bahasa Inggris Anda
          </h2>
          <p className="text-sm leading-relaxed text-[#3D4760] sm:text-base">
            Pilih metode pendampingan yang paling tepat: mulai dari latihan mandiri bersama AI 24/7 hingga bimbingan tatap muka (offline) langsung bersama trainer.
          </p>
        </div>

        {/* 3-Tier Pricing Grid */}
        <div className="mb-20 grid grid-cols-1 items-stretch gap-7 lg:grid-cols-3">
          {tierPackages.map((pkg) => {
            const isEnrolled = pkg.courseId ? enrolledCourseIds.includes(pkg.courseId) : false;
            const isFeatured = pkg.isFeatured;
            const classCountInTier =
              pkg.tierKey === "tier_bawah"
                ? countBawah
                : pkg.tierKey === "tier_menengah"
                ? countMenengah
                : countTinggi;

            return (
              <div
                key={pkg.tierKey}
                className={`relative flex flex-col rounded-[24px] transition-all duration-200 ${
                  isFeatured
                    ? "z-10 border-2 border-[#0B2559] bg-white shadow-[0_12px_32px_rgba(11,37,89,0.1)] lg:-translate-y-2"
                    : "border border-[#E6DED4] bg-white shadow-[0_1px_0_#E6DED4] hover:shadow-md"
                }`}
              >
                {/* Popular Badge on Top */}
                {isFeatured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#0B2559] px-4 py-1 text-[11px] font-extrabold tracking-wide text-white shadow-sm">
                      <LandingIcon name="Sparkles" size={13} color="#F26A12" />
                      PALING DIMINATI · REKOMENDASI UTAMA
                    </span>
                  </div>
                )}

                <div className="p-7 sm:p-8 flex flex-col flex-1">
                  {/* Tier Badges */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="rounded-lg border border-[#E6DED4] bg-[#FBF6F1] px-3 py-1 text-xs font-bold text-[#0B2559]">
                      {pkg.badgeText}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isFeatured
                          ? "border border-[#F26A12]/40 bg-[#FFF4EC] text-[#C2530A]"
                          : "border border-[#E6DED4] bg-[#FBF6F1] text-[#4A5468]"
                      }`}
                    >
                      {pkg.subBadge}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="text-xl font-extrabold text-[#0B2559] mb-1">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-6 font-medium">
                    {pkg.tagline}
                  </p>

                  {/* Pricing Box */}
                  <div className="mb-6 pb-6 border-b border-zinc-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-extrabold text-[#0B2559]">
                        {formatIdr(pkg.price)}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium">
                        {pkg.period}
                      </span>
                    </div>
                    {pkg.originalPrice > pkg.price && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-zinc-400 line-through">
                          {formatIdr(pkg.originalPrice)}
                        </span>
                        <span className="text-[10px] font-bold text-[#F26A12] bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                          Hemat {formatIdr(pkg.originalPrice - pkg.price)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Speaking Partner Highlight Card */}
                  <div className={`rounded-2xl p-4 mb-6 border ${pkg.partnerBg}`}>
                    <div className="flex items-center gap-2 mb-1.5 font-bold text-xs">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white shadow-2xs">
                        <LandingIcon name={pkg.partnerIcon as any} size={13} color="currentColor" />
                      </span>
                      <span>Partner Bicara:</span>
                    </div>
                    <div className="font-extrabold text-sm mb-1 text-[#0B2559]">
                      {pkg.partnerBadge}
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                      {pkg.partnerDesc}
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-6 flex-1">
                    <p className="text-xs font-bold text-[#0B2559] uppercase tracking-wider">
                      Fasilitas yang Didapat:
                    </p>
                    {pkg.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-700">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mt-0.5">
                          <svg className="w-2.5 h-2.5 stroke-current stroke-[3]" viewBox="0 0 24 24" fill="none">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-2 mt-auto">
                    {isEnrolled ? (
                      <Link
                        href={`/dashboard/classroom?c=${pkg.courseId}`}
                        className="w-full py-3.5 px-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs text-center border border-emerald-200 shadow-2xs hover:bg-emerald-100 transition flex items-center justify-center gap-2"
                      >
                        <span>Sudah Terdaftar · Buka Kelas</span>
                        <LandingIcon name="ArrowRight" size={14} color="currentColor" />
                      </Link>
                    ) : (
                      <Link
                        href={`/courses/${pkg.slug}`}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-center text-xs font-bold shadow-xs transition active:scale-98 ${
                          isFeatured
                            ? "bg-[#C2530A] text-white hover:bg-[#a84507]"
                            : "bg-[#0B2559] text-white hover:bg-[#133882]"
                        }`}
                      >
                        <span>Pilih {pkg.badgeText}</span>
                        <LandingIcon name="ArrowRight" size={14} color="#fff" />
                      </Link>
                    )}

                    {/* Secondary button to filter classes below */}
                    <button
                      type="button"
                      onClick={() => handleFilterTier(pkg.tierKey)}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#E6DED4] px-4 py-2.5 text-xs font-semibold text-[#3D4760] transition hover:border-[#0B2559]/40 hover:bg-[#FBF6F1] hover:text-[#0B2559]"
                    >
                      <span>Lihat {classCountInTier} Kelas di {pkg.badgeText}</span>
                      <LandingIcon name="ChevronDown" size={14} color="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------------------------------------------------- */}
        {/* Course Catalog Filter Section */}
        {/* ---------------------------------------------------- */}
        <div id="katalog-kelas" className="pt-10 border-t border-[#E6DED4] scroll-mt-24">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F7FF] text-[#0062D1] text-xs font-bold border border-[#B9DDFE] mb-2">
              <LandingIcon name="BookOpen" size={13} color="currentColor" />
              <span>Katalog Kelas & Spesialisasi</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B2559] mb-2">
              Pilihan Kelas Sesuai Tingkatan Paket
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500">
              Tekan tombol paket di bawah untuk menyaring kelas yang ingin kamu ikuti berdasarkan format bimbingan yang diinginkan.
            </p>
          </div>

          {/* Interactive Tier Filter Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
            {/* Filter All */}
            <button
              type="button"
              onClick={() => setSelectedTier("all")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-2xs ${
                selectedTier === "all"
                  ? "bg-[#0B2559] text-white shadow-md scale-102"
                  : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <span>🌐 Semua Kelas</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  selectedTier === "all"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {courses.length}
              </span>
            </button>

            {/* Filter Paket Bawah */}
            <button
              type="button"
              onClick={() => setSelectedTier("tier_bawah")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-2xs ${
                selectedTier === "tier_bawah"
                  ? "bg-amber-600 text-white shadow-md scale-102 ring-2 ring-amber-400/40"
                  : "bg-white text-zinc-700 hover:bg-amber-50 hover:text-amber-800 border border-zinc-200"
              }`}
            >
              <span>🥉 Paket Bawah</span>
              <span className="hidden sm:inline text-xs font-normal opacity-80">(AI Partner)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  selectedTier === "tier_bawah"
                    ? "bg-white/20 text-white"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {countBawah}
              </span>
            </button>

            {/* Filter Paket Menengah */}
            <button
              type="button"
              onClick={() => setSelectedTier("tier_menengah")}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 shadow-2xs ${
                selectedTier === "tier_menengah"
                  ? "bg-[#0073F5] text-white shadow-md scale-102 ring-2 ring-[#0073F5]/35"
                  : "bg-white text-zinc-700 hover:bg-[#F0F7FF] hover:text-[#0062D1] border border-zinc-200"
              }`}
            >
              <span>🥈 Paket Menengah</span>
              <span className="hidden sm:inline text-xs font-normal opacity-80">(Cohort Zoom)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  selectedTier === "tier_menengah"
                    ? "bg-white/20 text-white"
                    : "bg-[#F0F7FF] text-[#0062D1] border border-[#B9DDFE]"
                }`}
              >
                {countMenengah}
              </span>
            </button>

            {/* Filter Paket Tinggi */}
            <button
              type="button"
              onClick={() => setSelectedTier("tier_tinggi")}
              className={`flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-2xs transition-all sm:text-sm ${
                selectedTier === "tier_tinggi"
                  ? "scale-102 bg-[#C2530A] text-white shadow-md ring-2 ring-[#F26A12]/40"
                  : "border border-[#E6DED4] bg-white text-[#0B2559] hover:border-[#C2530A]/40 hover:bg-[#FFF4EC]"
              }`}
            >
              <span>🥇 Paket Tinggi</span>
              <span className="hidden sm:inline text-xs font-normal opacity-80">(Executive Offline)</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${
                  selectedTier === "tier_tinggi"
                    ? "bg-white/20 text-white"
                    : "border border-[#F26A12]/30 bg-[#FFF4EC] text-[#C2530A]"
                }`}
              >
                {countTinggi}
              </span>
            </button>
          </div>

          {/* Active Filter Explanatory Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-white border border-[#E6DED4] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0F7FF] text-[#0073F5]">
                <LandingIcon name="Sparkles" size={18} color="currentColor" />
              </span>
              <div>
                <p className="text-xs font-extrabold text-[#0B2559]">
                  {selectedTier === "all" && "Menampilkan Semua Kelas di Platform English Ready"}
                  {selectedTier === "tier_bawah" && "Fasilitas Paket Bawah: Akses Video Mandiri 24/7 + AI Speaking Partner Interaktif"}
                  {selectedTier === "tier_menengah" && "Fasilitas Paket Menengah: Live Mentoring Zoom Interaktif 6 Minggu (Maks. 12 Murid)"}
                  {selectedTier === "tier_tinggi" && "Fasilitas Paket Tinggi: Executive 1-on-1 Privat Offline Tatap Muka + Bebas Pilih Lokasi"}
                </p>
                <p className="text-[11px] text-zinc-500">
                  {selectedTier === "all"
                    ? "Kamu bisa memilih paket di tombol atas untuk menyaring kelas sesuai format bimbingan."
                    : selectedTier === "tier_bawah"
                    ? "Cocok bagi yang ingin fleksibilitas belajar kapan saja dengan evaluasi skor berbicara otomatis."
                    : selectedTier === "tier_menengah"
                    ? "Rekomendasi terbaik bagi pencari kerja & profesional yang ingin bimbingan langsung dari instruktur."
                    : "Eksklusif bagi eksekutif/leader yang membutuhkan bimbingan intensif tatap muka di kafe atau kantor."}
                </p>
              </div>
            </div>
            <div className="text-xs font-bold text-zinc-600 shrink-0 self-end sm:self-auto">
              Total: <span className="text-[#0062D1] font-extrabold">{filteredCourses.length}</span> kelas
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
              <p className="text-sm font-bold text-zinc-700">Belum ada kelas yang terdaftar pada paket ini.</p>
              <p className="text-xs text-zinc-500 mt-1">Silakan pilih paket lain atau hubungi admin kami.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((c) => {
                const isEnrolled = enrolledCourseIds.includes(c.id);
                const isBawah = c.tier === "tier_bawah";
                const isMenengah = c.tier === "tier_menengah";
                const isTinggi = c.tier === "tier_tinggi";

                return (
                  <article
                    key={c.id}
                    className="group flex flex-col bg-white rounded-3xl border border-[#E6DED4] overflow-hidden shadow-2xs hover:shadow-lg hover:border-zinc-300 transition-all duration-300"
                  >
                    {/* Thumbnail Section */}
                    <div className="relative aspect-video w-full bg-zinc-100 overflow-hidden">
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#FBF6F1] text-[#0B2559]">
                          <LandingIcon name="BookOpen" size={28} color="currentColor" />
                        </div>
                      )}

                      {/* Top Badges (Tier & Level) */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5 pointer-events-none">
                        {/* Tier Badge */}
                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                            isBawah
                              ? "bg-[#0B2559]/90 text-white"
                              : isTinggi
                              ? "bg-[#C2530A]/95 text-white"
                              : "bg-[#0073F5]/95 text-white"
                          }`}
                        >
                          {isBawah
                            ? "🥉 Paket Bawah"
                            : isTinggi
                            ? "🥇 Paket Tinggi"
                            : "🥈 Paket Menengah"}
                        </span>

                        {/* Level Badge */}
                        {c.level && (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/90 text-zinc-800 capitalize backdrop-blur-md shadow-xs border border-white/60">
                            {c.level.replace("_", " ")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      {/* Speaking Partner Indicator Pill */}
                      <div className="mb-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                            isBawah
                              ? "bg-[#FBF6F1] text-[#0B2559] border-[#E6DED4]"
                              : isTinggi
                              ? "bg-[#FFF4EC] text-[#C2530A] border-[#F26A12]/40"
                              : "bg-[#F0F7FF] text-[#0062D1] border-[#B9DDFE]"
                          }`}
                        >
                          <LandingIcon
                            name={isBawah ? "Bot" : isTinggi ? "MapPin" : "Video"}
                            size={12}
                            color="currentColor"
                          />
                          <span>
                            {isBawah
                              ? "🤖 AI Speaking Partner 24/7"
                              : isTinggi
                              ? "📍 Offline Tatap Muka 1-on-1"
                              : "💻 Live Zoom Cohort"}
                          </span>
                        </span>
                      </div>

                      {/* Course Title */}
                      <h4 className="font-extrabold text-base text-[#0B2559] mb-2 line-clamp-2 leading-snug group-hover:text-[#0062D1] transition-colors">
                        {c.title}
                      </h4>

                      {/* Short Description */}
                      {c.shortDescription && (
                        <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
                          {c.shortDescription}
                        </p>
                      )}

                      <p className="text-xs text-zinc-400 mb-4 mt-auto">
                        Instruktur: <span className="font-semibold text-zinc-600">{c.instructorName || "English Ready Trainer"}</span>
                      </p>

                      {/* Footer: Price & CTA Link */}
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                        <div>
                          <div className="text-[10px] uppercase font-bold text-zinc-400">Investasi</div>
                          <div className="font-extrabold text-lg text-[#0B2559]">
                            {c.isFree ? "Gratis" : formatIdr(c.price)}
                          </div>
                        </div>

                        <Link
                          href={isEnrolled ? `/dashboard/classroom?c=${c.id}` : `/courses/${c.slug}`}
                          className={`py-2 px-3.5 rounded-xl font-bold text-xs shadow-2xs transition flex items-center gap-1.5 active:scale-98 ${
                            isEnrolled
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-[#0B2559] text-white hover:bg-[#F26A12]"
                          }`}
                        >
                          <span>{isEnrolled ? "Buka Materi" : "Lihat Detail"}</span>
                          <LandingIcon name="ArrowRight" size={13} color="currentColor" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PricingSection;
