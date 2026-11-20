"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";
import type { ReadyCheckResult } from "@/lib/ready-check/types";
import { ReadyCheckRadarSvg } from "./ReadyCheckRadarSvg";

const LEVEL_LADDER = [
  { key: "Starter", range: "0–20", cefr: "A1", min: 0, max: 20 },
  { key: "Warming Up", range: "21–40", cefr: "A2", min: 21, max: 40 },
  { key: "Ready to Speak", range: "41–60", cefr: "B1", min: 41, max: 60 },
  { key: "Ready to Connect", range: "61–80", cefr: "B2", min: 61, max: 80 },
  { key: "Ready to Contribute", range: "81–100", cefr: "C1+", min: 81, max: 100 },
];

export function ReadyCheckResultView({
  result,
  userName,
  isLoggedIn,
  isSaving,
  onSaveBaseline,
  onRetake,
}: {
  result: ReadyCheckResult;
  userName?: string | null;
  isLoggedIn: boolean;
  isSaving: boolean;
  onSaveBaseline: () => Promise<void>;
  onRetake: () => void;
}) {
  const [shareNote, setShareNote] = useState<string | null>(null);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(5, Math.min(100, result.overallScore));
  const dashLength = (clampedScore / 100) * circumference;

  const displayName = userName?.trim() ? userName.split(" ")[0] : "Sobat Ready";

  const hardestFormatted =
    result.hardestSituations.length > 0
      ? result.hardestSituations.join(" dan ")
      : "wawancara dan rapat";

  const dimensionRows = [
    { label: "Kelancaran & keberanian", val: result.dimensions.kelancaran },
    { label: "Pelafalan & kejelasan", val: result.dimensions.pelafalan },
    { label: "Pemahaman mendengar", val: result.dimensions.mendengar },
    { label: "Ketepatan bahasa", val: result.dimensions.ketepatan },
    { label: "Komunikasi lintas budaya", val: result.dimensions.lintasBudaya },
  ];

  const confidencePct = Math.max(10, Math.min(100, (result.confidenceIndex / 5) * 100));

  const whatsappText = encodeURIComponent(
    `Halo English Ready! Saya baru saja menyelesaikan Ready Check dan mendapat skor ${result.overallScore}/100 (${result.levelTitle} · CEFR ${result.cefrEstimate}). Rekomendasi program saya: ${result.recommendedGoalTitle}.`
  );

  async function handleCopyShare(channel: "Instagram Story" | "LinkedIn") {
    const shareText = `Saya baru saja menyelesaikan Ready Check di English Ready dan meraih level ${result.levelTitle}! Cek kesiapan bahasa Inggrismu gratis di #EnglishReady`;
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(shareText);
      }
      setShareNote(`Teks badge untuk ${channel} berhasil disalin! Tempelkan di post/story kamu.`);
      setTimeout(() => setShareNote(null), 4000);
    } catch {
      setShareNote(`Bagikan level "${result.levelTitle} #EnglishReady" di ${channel} kamu!`);
    }
  }

  return (
    <div className="min-h-screen bg-[#FBF6F1] font-sans text-[#0B2559]">
      {/* Sticky Frosted Header */}
      <header className="sticky top-0 z-30 border-b border-[#E6DED4] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5 min-w-0">
            <EnglishReadyLogo variant="icon" height={30} />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[17px]">
                  Laporan Ready Check
                </span>
                {result.saved && (
                  <span className="hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 sm:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Tersimpan
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetake}
              className="hidden cursor-pointer rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2 text-xs font-bold text-[#0B2559] transition hover:border-[#0B2559]/40 hover:bg-[#FBF6F1] sm:inline-flex"
            >
              Ulangi Tes
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2559] px-3.5 py-2 text-xs font-bold text-white no-underline transition hover:bg-[#0073F5]"
            >
              <span>Beranda</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* 1. Hero Score Summary Banner */}
        <section className="relative overflow-hidden rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_12px_rgba(11,37,89,0.05)] sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#0073F5]/6 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#F26A12]/8 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative grid grid-cols-1 items-center gap-6 md:grid-cols-12">
            {/* Circular Gauge */}
            <div className="flex flex-col items-center justify-center md:col-span-4">
              <div className="relative flex items-center justify-center">
                <svg
                  width="176"
                  height="176"
                  viewBox="0 0 128 128"
                  role="img"
                  aria-label={`Ready Score ${result.overallScore} dari 100`}
                  className="h-40 w-40 sm:h-44 sm:w-44"
                >
                  <defs>
                    <linearGradient id="rcGaugeGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#F26A12" />
                      <stop offset="100%" stopColor="#0073F5" />
                    </linearGradient>
                  </defs>
                  <circle cx="64" cy="64" r={radius} fill="none" stroke="#F3ECE3" strokeWidth="11" />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    fill="none"
                    stroke="url(#rcGaugeGrad)"
                    strokeWidth="11"
                    strokeLinecap="round"
                    strokeDasharray={`${dashLength} ${circumference}`}
                    transform="rotate(-90 64 64)"
                  />
                  <text
                    x="64"
                    y="66"
                    textAnchor="middle"
                    fontSize="36"
                    fontWeight="800"
                    fill="#0B2559"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {result.overallScore}
                  </text>
                  <text
                    x="64"
                    y="84"
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="700"
                    fill="#64748B"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    ± {result.uncertaintyMargin} · DARI 100
                  </text>
                </svg>
              </div>
            </div>

            {/* Level Headline + 5-Tier Ladder */}
            <div className="flex flex-col gap-3 text-center md:col-span-8 md:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-xs font-extrabold text-[#C2530A]">
                  Halo {displayName}, ini titik awalmu
                </span>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0062D1]">
                  Setara CEFR {result.cefrEstimate}
                </span>
              </div>

              <h1 className="m-0 text-3xl font-black tracking-[-0.03em] text-[#0B2559] sm:text-4xl">
                {result.levelTitle}
              </h1>

              <p className="m-0 text-sm leading-relaxed text-[#4A5468] sm:text-[15px]">
                {result.nextLevelTitle ? (
                  <>
                    Kamu hanya butuh{" "}
                    <strong className="font-extrabold text-[#C2530A]">
                      +{result.pointsToNextLevel} poin lagi
                    </strong>{" "}
                    untuk naik ke level{" "}
                    <strong className="font-extrabold text-[#0B2559]">
                      {result.nextLevelTitle}
                    </strong>
                    .
                  </>
                ) : (
                  <>Luar biasa! Kamu sudah berada di tingkat kesiapan komunikasi global tertinggi.</>
                )}
              </p>

              {/* 5-Level Readiness Ladder */}
              <div className="mt-2 grid grid-cols-5 gap-1.5 sm:gap-2">
                {LEVEL_LADDER.map((tier) => {
                  const isCurrent =
                    result.overallScore >= tier.min && result.overallScore <= tier.max;
                  const isPassed = result.overallScore > tier.max;
                  return (
                    <div
                      key={tier.key}
                      className={`flex flex-col rounded-xl border px-2 py-2 text-left transition ${
                        isCurrent
                          ? "border-[#F26A12] bg-[#FFF4EC] shadow-2xs ring-1 ring-[#F26A12]/30"
                          : isPassed
                          ? "border-[#0B2559]/15 bg-[#0B2559] text-white"
                          : "border-[#E6DED4] bg-[#FBF6F1]/80 text-[#64748B]"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold ${
                          isCurrent
                            ? "text-[#C2530A]"
                            : isPassed
                            ? "text-[#AFC4EA]"
                            : "text-[#64748B]"
                        }`}
                      >
                        {tier.cefr}
                      </span>
                      <span
                        className={`truncate text-[10.5px] font-extrabold sm:text-[11.5px] ${
                          isCurrent
                            ? "text-[#0B2559]"
                            : isPassed
                            ? "text-white"
                            : "text-[#4A5468]"
                        }`}
                      >
                        {tier.key}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Two-Column Executive Bento Layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Detailed Diagnostics (7 cols) */}
          <div className="space-y-5 lg:col-span-7">
            {/* 5 Dimensions Radar + Progress Bars */}
            <section className="rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)] sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="m-0 text-lg font-extrabold text-[#0B2559]">
                    Lima Dimensi Kesiapanmu
                  </h2>
                  <p className="m-0 mt-0.5 text-xs text-[#4A5468]">
                    Pemetaan kemampuan komunikasi berdasarkan tes mendengar, konteks kerja, dan bicara
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <ReadyCheckRadarSvg dimensions={result.dimensions} />
                </div>
                <div className="space-y-3.5 sm:col-span-6">
                  {dimensionRows.map((d) => {
                    const barColor =
                      d.val >= 70
                        ? "bg-emerald-500"
                        : d.val >= 50
                        ? "bg-[#0073F5]"
                        : "bg-[#F26A12]";
                    const badgeColor =
                      d.val >= 70
                        ? "bg-emerald-50 text-emerald-700"
                        : d.val >= 50
                        ? "bg-blue-50 text-[#0062D1]"
                        : "bg-[#FFF4EC] text-[#C2530A]";
                    return (
                      <div key={d.label} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#0B2559]">{d.label}</span>
                          <span className={`rounded-md px-2 py-0.5 font-extrabold tabular-nums ${badgeColor}`}>
                            {d.val}/100
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[#EFE7DD]">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.max(8, Math.min(100, d.val))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Strength & Focus Cards */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2 rounded-[20px] border border-emerald-200/80 bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-emerald-700">
                    Kekuatan Utamamu
                  </span>
                </div>
                <div className="text-[15.5px] font-extrabold leading-snug text-[#0B2559]">
                  {result.strengthTitle}
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-[20px] border-2 border-[#F26A12]/70 bg-[#FFFBF7] p-5 shadow-[0_1px_4px_rgba(242,106,18,0.06)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#C2530A]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#C2530A]">
                    Fokus Latihan Berikutnya
                  </span>
                </div>
                <div className="text-[15.5px] font-extrabold leading-snug text-[#0B2559]">
                  {result.focusTitle}
                </div>
              </div>
            </section>

            {/* Confidence Index Card */}
            <section className="rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#0073F5]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-4" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="m-0 text-base font-extrabold text-[#0B2559]">
                      Confidence Index
                    </h2>
                    <span className="text-xs text-[#4A5468]">Rasa percaya diri saat un-mute</span>
                  </div>
                </div>
                <span className="rounded-xl bg-[#0B2559] px-3 py-1.5 text-sm font-black tabular-nums text-white">
                  {String(result.confidenceIndex).replace(".", ",")} / 5
                </span>
              </div>

              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[#EFE7DD]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#F26A12] to-[#0073F5]"
                  style={{ width: `${confidencePct}%` }}
                />
              </div>

              <p className="m-0 mt-3.5 text-sm leading-relaxed text-[#3D4760]">
                Kamu paling ragu saat <strong className="text-[#0B2559]">{hardestFormatted}</strong>.
                Kemampuanmu sebenarnya{" "}
                <strong className="text-[#0062D1]">
                  {result.overallScore >= 50 ? "lebih siap" : "bisa tumbuh sangat cepat"}
                </strong>{" "}
                dengan latihan roleplay terarah dibandingkan yang kamu rasakan saat grogi.
              </p>
            </section>

            {/* AI Evaluator & Phrase Corrections */}
            {result.feedbackText && (
              <section className="space-y-4 rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)] sm:p-6">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0B2559] text-white">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <div>
                    <h2 className="m-0 text-base font-extrabold text-[#0B2559]">
                      Catatan AI Speech Evaluator
                    </h2>
                    <span className="text-xs text-[#4A5468]">Umpan balik instan dari tugas bicaramu</span>
                  </div>
                </div>

                <p className="m-0 rounded-2xl border border-[#E6DED4]/80 bg-[#FBF6F1] p-4 text-sm leading-relaxed text-[#3D4760]">
                  {result.feedbackText}
                </p>

                {result.corrections.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#4A5468]">
                      Saran Frasa Lebih Natural
                    </div>
                    {result.corrections.slice(0, 3).map((corr, i) => (
                      <div
                        key={i}
                        className="space-y-2 rounded-2xl border border-[#E6DED4] bg-white p-4 text-xs sm:text-[13px]"
                      >
                        {corr.original && (
                          <div className="flex items-start gap-2 text-rose-700">
                            <span className="mt-0.5 shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                              Awal
                            </span>
                            <span className="line-through opacity-85">&ldquo;{corr.original}&rdquo;</span>
                          </div>
                        )}
                        {corr.improved && (
                          <div className="flex items-start gap-2 font-bold text-emerald-800">
                            <span className="mt-0.5 shrink-0 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                              Lebih Baik
                            </span>
                            <span>&ldquo;{corr.improved}&rdquo;</span>
                          </div>
                        )}
                        <div className="border-t border-[#F0EAE2] pt-2 text-xs leading-relaxed text-[#4A5468]">
                          {corr.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR: Save, Recommendation & Share (5 cols) */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-5">
            {/* Baseline Save / Account Card */}
            <section
              className={`rounded-[22px] border p-5 shadow-xs ${
                result.saved
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-[#F26A12]/40 bg-[#FFF8F2]"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                    result.saved ? "bg-emerald-600" : "bg-[#F26A12]"
                  }`}
                >
                  {result.saved ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div className="text-[15px] font-extrabold text-[#0B2559]">
                    {result.saved
                      ? "Tersimpan sebagai Baseline ✓"
                      : "Simpan Hasil sebagai Baseline"}
                  </div>

                  {result.saved ? (
                    <>
                      <p className="m-0 text-xs leading-relaxed text-emerald-900/80">
                        Skor Ready Check kamu sudah tersimpan di profil akunmu dan bisa dilihat kapan saja di halaman depan.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href="/#skor-kamu"
                          className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white no-underline transition hover:bg-emerald-800"
                        >
                          Lihat Skor di Beranda
                        </Link>
                        <button
                          type="button"
                          onClick={onRetake}
                          className="cursor-pointer rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-50"
                        >
                          Tes Ulang
                        </button>
                      </div>
                    </>
                  ) : isLoggedIn ? (
                    <>
                      <p className="m-0 text-xs leading-relaxed text-[#3D4760]">
                        Simpan skor ini ke akunmu agar progres belajar & rekomendasi program selalu terukur dari titik awal.
                      </p>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={onSaveBaseline}
                        className="mt-1 w-full cursor-pointer rounded-xl bg-[#F26A12] px-4 py-2.5 text-sm font-bold text-white shadow-xs transition hover:bg-[#C2530A] disabled:opacity-60"
                      >
                        {isSaving ? "Menyimpan ke Profil..." : "Simpan Skor ke Profil Sekarang"}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="m-0 text-xs leading-relaxed text-[#3D4760]">
                        Masuk dengan Google supaya skormu tersimpan otomatis dan jadi titik awal saat memilih program.
                      </p>
                      <button
                        type="button"
                        onClick={() => signIn("google", { callbackUrl: "/ready-check?save=1" })}
                        className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#D8CBB8] bg-white px-4 py-2.5 text-sm font-bold text-[#0B2559] shadow-2xs transition hover:bg-slate-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
                          <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z" />
                          <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z" />
                          <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
                        </svg>
                        <span>Masuk dengan Google &amp; Simpan</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Navy Program Recommendation Card */}
            <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-[#0B2559] via-[#0E3175] to-[#0B2559] p-6 text-white shadow-lg">
              <div
                className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#0073F5]/30 blur-2xl"
                aria-hidden="true"
              />
              <div className="relative flex flex-col gap-3">
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[#AFC4EA]">
                  ✨ Rekomendasi Program Untukmu
                </div>
                <h2 className="m-0 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-white">
                  {result.recommendedGoalTitle}
                </h2>
                <p className="m-0 text-sm leading-relaxed text-[#D5DDEE]">
                  {result.recommendedDescription}
                </p>
                <Link
                  href={`/programs/${result.recommendedGoalSlug}`}
                  className="mt-2 flex items-center justify-center gap-2 rounded-[14px] bg-[#F26A12] px-4 py-3.5 text-center text-sm font-extrabold text-white no-underline shadow-sm transition hover:bg-[#C2530A]"
                >
                  <span>Lihat Program yang Cocok</span>
                  <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </section>

            {/* Share Badge & WhatsApp Card */}
            <section className="space-y-4 rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)]">
              <div>
                <h3 className="m-0 text-base font-extrabold text-[#0B2559]">
                  Bagikan Pencapaianmu
                </h3>
                <p className="m-0 mt-0.5 text-xs text-[#4A5468]">
                  Badge sosial hanya menampilkan level, tanpa angka skor.
                </p>
              </div>

              {/* Badge Preview */}
              <div className="flex items-center gap-3.5 rounded-[16px] border border-[#E6DED4] bg-gradient-to-r from-[#FBF6F1] to-white p-4">
                <EnglishReadyLogo variant="icon" height={48} />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A5468]">
                    Saya sudah mencapai
                  </div>
                  <div className="truncate text-lg font-black text-[#0B2559]">
                    {result.levelTitle}
                  </div>
                  <div className="text-xs font-extrabold text-[#F26A12]">#EnglishReady</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <a
                  href={`https://wa.me/?text=${whatsappText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white no-underline transition hover:bg-emerald-700"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.5A8.4 8.4 0 1 1 21 11.5z" />
                  </svg>
                  Kirim Hasil Lengkap ke WhatsApp
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyShare("Instagram Story")}
                    className="cursor-pointer rounded-xl border border-[#E6DED4] bg-white px-3 py-2.5 text-xs font-bold text-[#0B2559] transition hover:border-[#0B2559] hover:bg-[#FBF6F1]"
                  >
                    Salin · IG Story
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyShare("LinkedIn")}
                    className="cursor-pointer rounded-xl border border-[#E6DED4] bg-white px-3 py-2.5 text-xs font-bold text-[#0B2559] transition hover:border-[#0B2559] hover:bg-[#FBF6F1]"
                  >
                    Salin · LinkedIn
                  </button>
                </div>
              </div>

              {shareNote && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                  ✓ {shareNote}
                </div>
              )}
            </section>
          </aside>
        </div>

        <p className="m-0 pb-6 text-center text-xs leading-relaxed text-[#64748B]">
          Skor speaking dinilai oleh AI Evaluator dan dapat ditinjau oleh coach. Setara CEFR bersifat indikatif dan dikalibrasi berkala.
        </p>
      </main>
    </div>
  );
}
