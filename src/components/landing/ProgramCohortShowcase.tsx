"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import {
  getCoursesForProgramGoal,
  type ProgramGoalSpec,
} from "@/lib/programs/catalog";
import {
  READY_CHECK_STORAGE_KEY,
  type ReadyCheckResult,
} from "@/lib/ready-check/types";
import { formatIdr } from "@/lib/utils/cn";
import type { PublishedCourseCard } from "@/types/db";

const emptySubscribe = () => () => {};
function getStoredReadyRaw(): string | null {
  try {
    return typeof window !== "undefined"
      ? window.localStorage.getItem(READY_CHECK_STORAGE_KEY)
      : null;
  } catch {
    return null;
  }
}

type TierFilter = "all" | "tier_bawah" | "tier_menengah" | "tier_tinggi";

export interface LatestReadyCheckProp {
  overallScore: number;
  levelTitle: string;
  targetProgramSlug: string;
}

export function ProgramCohortShowcase({
  goal,
  courses,
  enrolledCourseIds = [],
  latestReadyCheck = null,
  onClose,
  isStandalonePage = false,
}: {
  goal: ProgramGoalSpec;
  courses: PublishedCourseCard[];
  enrolledCourseIds?: number[];
  latestReadyCheck?: LatestReadyCheckProp | null;
  onClose?: () => void;
  isStandalonePage?: boolean;
}) {
  const [activeTrackId, setActiveTrackId] = useState<string>(goal.defaultTrackId);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const storedRaw = useSyncExternalStore(
    emptySubscribe,
    getStoredReadyRaw,
    () => null
  );

  const localReadySummary = useMemo<LatestReadyCheckProp | null>(() => {
    if (latestReadyCheck) return latestReadyCheck;
    if (!storedRaw) return null;
    try {
      const parsed = JSON.parse(storedRaw) as ReadyCheckResult;
      if (parsed && typeof parsed.overallScore === "number") {
        return {
          overallScore: parsed.overallScore,
          levelTitle: parsed.levelTitle,
          targetProgramSlug: parsed.recommendedGoalSlug,
        };
      }
    } catch {
      return null;
    }
    return null;
  }, [latestReadyCheck, storedRaw]);

  const activeTrack =
    goal.tracks.find((t) => t.id === activeTrackId) ?? goal.tracks[0];

  const matchedCourses = getCoursesForProgramGoal(
    courses,
    goal.slug,
    activeTrack?.id
  );
  const primaryCourse = matchedCourses[0] ?? courses[0];

  const filteredCourses =
    tierFilter === "all"
      ? matchedCourses
      : matchedCourses.filter((c) => c.tier === tierFilter);

  const countBawah = matchedCourses.filter((c) => c.tier === "tier_bawah").length;
  const countMenengah = matchedCourses.filter((c) => c.tier === "tier_menengah").length;
  const countTinggi = matchedCourses.filter((c) => c.tier === "tier_tinggi").length;

  const isPrimaryEnrolled = primaryCourse
    ? enrolledCourseIds.includes(primaryCourse.id)
    : false;

  const primaryPrice = primaryCourse ? Number(primaryCourse.price) : 1490000;
  const primaryOrig = primaryCourse?.originalPrice
    ? Number(primaryCourse.originalPrice)
    : null;
  const primaryDiscount =
    primaryOrig && primaryOrig > primaryPrice ? primaryOrig - primaryPrice : 0;

  return (
    <div
      id="program-detail-panel"
      className={`bg-[#FBF6F1] text-[#0B2559] scroll-mt-24 ${
        isStandalonePage ? "" : "border-t border-[#E6DED4]"
      }`}
    >
      {/* Top Navy Recommendation Bar (Exact Mockup Screen 05) */}
      <div className="bg-[#0B2559] text-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 text-[14px] sm:text-[15px]">
          <div className="flex flex-wrap items-center gap-2.5">
            {localReadySummary ? (
              <>
                <span className="font-bold">Berdasarkan Ready Check-mu:</span>
                <span className="rounded-full bg-white px-3 py-1 font-extrabold text-[#0B2559]">
                  {localReadySummary.levelTitle} · {localReadySummary.overallScore}
                </span>
                <span>→ target program ini:</span>
                <span className="rounded-full bg-[#C2530A] px-3 py-1 font-extrabold text-white">
                  {goal.targetLevelLabel}
                </span>
              </>
            ) : (
              <>
                <span className="font-bold">Jalur Pilihanmu:</span>
                <span className="rounded-full bg-white px-3 py-1 font-extrabold text-[#0B2559]">
                  {goal.title}
                </span>
                <span>→ target pencapaian:</span>
                <span className="rounded-full bg-[#C2530A] px-3 py-1 font-extrabold text-white">
                  {goal.targetLevelLabel}
                </span>
                <Link
                  href="/ready-check"
                  className="ml-1 text-xs font-bold text-[#F9D9C3] underline hover:text-white"
                >
                  Cek Ready Score gratis →
                </Link>
              </>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-white/25 bg-white/10 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/20"
            >
              Tutup Detail ×
            </button>
          )}
        </div>
      </div>

      {/* Hero Section + Sticky Right Cohort Card (Screen 05 Lines 213-246) */}
      <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10 lg:py-14">
        {/* Left Column */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="text-sm font-bold uppercase tracking-[0.12em] text-[#C2530A]">
            {goal.cohortEyebrow}
          </div>
          {isStandalonePage ? (
            <h1 className="m-0 text-4xl font-extrabold leading-[1.06] tracking-[-0.03em] text-[#0B2559] sm:text-[52px]">
              {goal.title}
            </h1>
          ) : (
            <h3 className="m-0 text-4xl font-extrabold leading-[1.06] tracking-[-0.03em] text-[#0B2559] sm:text-[50px]">
              {goal.title}
            </h3>
          )}
          <p className="m-0 max-w-[640px] text-[17px] leading-[1.6] text-[#3D4760] sm:text-[19px]">
            {goal.heroDescription}
          </p>

          {/* 4 Stat Tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Durasi</div>
              <div className="mt-0.5 text-[17px] font-extrabold text-[#0B2559]">
                {goal.stats.duration}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Format</div>
              <div className="mt-0.5 text-[17px] font-extrabold text-[#0B2559]">
                {goal.stats.format}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Live roleplay</div>
              <div className="mt-0.5 text-[17px] font-extrabold text-[#0B2559]">
                {goal.stats.liveRoleplay}
              </div>
            </div>
            <div className="rounded-[16px] border border-[#E6DED4]/70 bg-white p-4">
              <div className="text-[13px] text-[#4A5468]">Kuota</div>
              <div className="mt-0.5 text-[17px] font-extrabold text-[#0B2559]">
                {goal.stats.quota}
              </div>
            </div>
          </div>

          {/* Interactive Track Pills ("Pilih jalurmu") */}
          <div className="mt-2 flex flex-col gap-3">
            <div className="text-[22px] font-extrabold text-[#0B2559]">Pilih jalurmu</div>
            <div className="flex flex-wrap gap-2.5">
              {goal.tracks.map((track) => {
                const pressed = track.id === activeTrack.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    aria-pressed={pressed}
                    onClick={() => {
                      setActiveTrackId(track.id);
                      setTierFilter("all");
                    }}
                    className={`cursor-pointer rounded-full border-2 px-5 py-2.5 text-[15px] font-bold transition ${
                      pressed
                        ? "border-[#0B2559] bg-[#0B2559] text-white"
                        : "border-[#E6DED4] bg-white text-[#0B2559] hover:border-[#0B2559]/50"
                    }`}
                  >
                    {track.label}
                  </button>
                );
              })}
            </div>
            <p className="m-0 text-sm font-medium text-[#4A5468]">{activeTrack.shortDesc}</p>
          </div>
        </div>

        {/* Right Sidebar Pricing Card (Screen 05 Lines 233-245) */}
        {primaryCourse && (
          <aside className="flex w-full min-w-0 flex-col gap-4 rounded-[24px] border border-[#E6DED4]/80 bg-white p-6 shadow-[0_1px_0_#E6DED4,0_12px_32px_rgba(11,37,89,0.08)] sm:p-7">
            <div className="text-xs font-bold uppercase tracking-wider text-[#C2530A]">
              Rekomendasi Jalur {activeTrack.label}
            </div>
            <div className="text-lg font-extrabold leading-snug text-[#0B2559]">
              {primaryCourse.title}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="whitespace-nowrap text-[28px] font-extrabold leading-tight tracking-tight text-[#0B2559] sm:text-[32px] tabular-nums">
                {primaryCourse.isFree ? "Gratis" : formatIdr(primaryPrice)}
              </div>
              {primaryOrig && primaryOrig > primaryPrice && (
                <div className="whitespace-nowrap text-sm font-medium text-[#4A5468] line-through sm:text-base tabular-nums">
                  {formatIdr(primaryOrig)}
                </div>
              )}
            </div>

            {(primaryDiscount > 0 || primaryCourse.tierBadge) && (
              <div className="text-sm font-bold text-[#C2530A]">
                {primaryDiscount > 0
                  ? `Hemat ${formatIdr(primaryDiscount)} · ${primaryCourse.tierBadge || "Cohort Aktif"}`
                  : primaryCourse.tierBadge}
              </div>
            )}

            {isPrimaryEnrolled ? (
              <Link
                href={`/dashboard/classroom?c=${primaryCourse.id}`}
                className="rounded-[14px] bg-emerald-600 px-4 py-4 text-center text-[17px] font-bold text-white no-underline transition hover:bg-emerald-700"
              >
                Sudah Terdaftar · Buka Kelas →
              </Link>
            ) : (
              <Link
                href={`/checkout?courseId=${primaryCourse.id}`}
                className="rounded-[14px] bg-[#C2530A] px-4 py-4 text-center text-[17px] font-bold text-white no-underline transition hover:bg-[#a84507]"
              >
                {primaryCourse.tier === "tier_menengah"
                  ? "Daftar cohort ini"
                  : "Daftar paket ini"}
              </Link>
            )}

            <Link
              href={`/courses/${primaryCourse.slug}`}
              className="rounded-[12px] border border-[#E6DED4] bg-[#FBF6F1] px-4 py-2.5 text-center text-sm font-bold text-[#0B2559] no-underline transition hover:border-[#0B2559]"
            >
              Lihat detail silabus & preview video
            </Link>

            <div className="flex flex-col gap-2.5 pt-1 text-[14.5px] text-[#0B2559]">
              {goal.cohortChecklist.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0B2559"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="mt-0.5 shrink-0"
                  >
                    <path d="M5 12l5 5L20 7" />
                  </svg>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="text-[13px] text-[#4A5468]">{goal.pricingNote}</div>
          </aside>
        )}
      </section>

      {/* Outcomes & 5 Trained Dimensions Band (White background matching Screen 05 Lines 248-272) */}
      <section className="border-y border-[#E6DED4] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap gap-10 px-4 py-12 sm:px-6 lg:py-14">
          <div className="flex min-w-0 flex-[1_1_480px] flex-col gap-4">
            <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[30px]">
              {goal.outcomesTitle}
            </h3>
            <ol className="m-0 flex list-decimal flex-col gap-2.5 pl-5 text-[16px] leading-[1.55] text-[#3D4760] sm:text-[17px]">
              {goal.outcomes.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ol>
          </div>

          <div className="flex min-w-0 flex-[1_1_400px] flex-col gap-3.5">
            <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[30px]">
              Dimensi yang paling dilatih
            </h3>
            <div className="flex flex-col gap-3 text-[15px]">
              {goal.dimensions.map((d) => (
                <div
                  key={d.label}
                  className="grid grid-cols-[180px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[200px_minmax(0,1fr)]"
                >
                  <span className="font-medium text-[#0B2559]">{d.label}</span>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#EFE7DD]">
                    <div
                      className={`h-2.5 rounded-full ${
                        d.accent ? "bg-[#C2530A]" : "bg-[#0B2559]"
                      }`}
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[13px] text-[#4A5468]">
              Panjang batang = porsi latihan di program ini.
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Roadmap Table (Screen 05 Lines 274-290) */}
      <section className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-12 sm:px-6">
        <h3 className="m-0 text-[26px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[30px]">
          {goal.syllabusTitle}
        </h3>
        <div className="overflow-x-auto rounded-[20px] border border-[#E6DED4] bg-white">
          <table className="w-full min-w-[680px] border-collapse text-left text-[15px]">
            <thead>
              <tr className="bg-[#F6F0E8] text-[#0B2559]">
                <th className="px-4 py-3.5 font-extrabold">Minggu</th>
                <th className="px-4 py-3.5 font-extrabold">Fokus</th>
                <th className="px-4 py-3.5 font-extrabold">Live roleplay</th>
                <th className="px-4 py-3.5 font-extrabold">Ukur</th>
              </tr>
            </thead>
            <tbody>
              {goal.syllabus.map((row) => (
                <tr key={row.week} className="border-t border-[#E6DED4]">
                  <td className="px-4 py-3.5 font-bold text-[#0B2559]">{row.week}</td>
                  <td className="px-4 py-3.5 text-[#3D4760]">{row.focus}</td>
                  <td className="px-4 py-3.5 text-[#3D4760]">{row.liveRoleplay}</td>
                  <td
                    className={`px-4 py-3.5 ${
                      row.highlight ? "font-bold text-[#C2530A]" : "text-[#3D4760]"
                    }`}
                  >
                    {row.measure}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* MATCHING CLASS PACKAGES FOR THIS SELECTED GOAL ONLY */}
      <section
        id="paket-tujuan"
        className="mx-auto max-w-[1200px] px-4 pb-12 sm:px-6"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-1 text-xs font-bold uppercase tracking-[0.12em] text-[#C2530A]">
              Paket Kelas Sesuai Tujuanmu
            </div>
            <h3 className="m-0 text-2xl font-extrabold text-[#0B2559] sm:text-3xl">
              Pilihan Kelas untuk {goal.title} · Jalur {activeTrack.label}
            </h3>
            <p className="mt-1 text-sm text-[#4A5468]">
              Menampilkan {filteredCourses.length} paket kelas yang dirancang khusus untuk tujuan dan jalur yang kamu pilih.
            </p>
          </div>

          {/* Goal-scoped format filter pills */}
          {matchedCourses.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTierFilter("all")}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                  tierFilter === "all"
                    ? "bg-[#0B2559] text-white"
                    : "border border-[#E6DED4] bg-white text-[#0B2559] hover:border-[#0B2559]"
                }`}
              >
                Semua ({matchedCourses.length})
              </button>
              {countBawah > 0 && (
                <button
                  type="button"
                  onClick={() => setTierFilter("tier_bawah")}
                  className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    tierFilter === "tier_bawah"
                      ? "bg-[#0B2559] text-white"
                      : "border border-[#E6DED4] bg-white text-[#0B2559] hover:border-[#0B2559]"
                  }`}
                >
                  AI Self-Paced ({countBawah})
                </button>
              )}
              {countMenengah > 0 && (
                <button
                  type="button"
                  onClick={() => setTierFilter("tier_menengah")}
                  className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    tierFilter === "tier_menengah"
                      ? "bg-[#0073F5] text-white"
                      : "border border-[#E6DED4] bg-white text-[#0B2559] hover:border-[#0073F5]"
                  }`}
                >
                  Cohort Zoom ({countMenengah})
                </button>
              )}
              {countTinggi > 0 && (
                <button
                  type="button"
                  onClick={() => setTierFilter("tier_tinggi")}
                  className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                    tierFilter === "tier_tinggi"
                      ? "bg-[#C2530A] text-white"
                      : "border border-[#E6DED4] bg-white text-[#0B2559] hover:border-[#C2530A]"
                  }`}
                >
                  Executive 1-on-1 ({countTinggi})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((c, idx) => {
            const isEnrolled = enrolledCourseIds.includes(c.id);
            const isBawah = c.tier === "tier_bawah";
            const isTinggi = c.tier === "tier_tinggi";
            const isTopMatch = idx === 0 && tierFilter === "all";

            return (
              <article
                key={c.id}
                className={`group flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 ${
                  isTopMatch
                    ? "border-2 border-[#0B2559] shadow-[0_10px_28px_rgba(11,37,89,0.1)]"
                    : "border border-[#E6DED4] shadow-2xs hover:shadow-lg"
                }`}
              >
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                  {c.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnailUrl}
                      alt={c.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#FBF6F1] text-[#0B2559]">
                      <LandingIcon name="BookOpen" size={30} color="currentColor" />
                    </div>
                  )}

                  <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-1.5">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-xs ${
                        isBawah
                          ? "bg-[#0B2559]/90"
                          : isTinggi
                          ? "bg-[#C2530A]/95"
                          : "bg-[#0073F5]/95"
                      }`}
                    >
                      {isBawah
                        ? "🥉 Paket Bawah"
                        : isTinggi
                        ? "🥇 Paket Tinggi"
                        : "🥈 Paket Menengah"}
                    </span>
                    {isTopMatch ? (
                      <span className="rounded-lg bg-[#C2530A] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-xs">
                        Paling Sesuai
                      </span>
                    ) : c.level ? (
                      <span className="rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-bold capitalize text-[#0B2559]">
                        {c.level.replace("_", " ")}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-bold ${
                        isBawah
                          ? "border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559]"
                          : isTinggi
                          ? "border-[#F26A12]/40 bg-[#FFF4EC] text-[#C2530A]"
                          : "border-[#B9DDFE] bg-[#F0F7FF] text-[#0062D1]"
                      }`}
                    >
                      <LandingIcon
                        name={isBawah ? "Bot" : isTinggi ? "MapPin" : "Video"}
                        size={12}
                        color="currentColor"
                      />
                      <span>
                        {isBawah
                          ? "AI Speaking Partner 24/7"
                          : isTinggi
                          ? "Offline Tatap Muka 1-on-1"
                          : "Live Zoom Cohort"}
                      </span>
                    </span>
                  </div>

                  <h4 className="mb-2 line-clamp-2 text-base font-extrabold leading-snug text-[#0B2559] transition-colors group-hover:text-[#C2530A]">
                    {c.title}
                  </h4>

                  {c.shortDescription && (
                    <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-[#4A5468]">
                      {c.shortDescription}
                    </p>
                  )}

                  <p className="mb-4 mt-auto text-xs text-zinc-500">
                    Coach:{" "}
                    <span className="font-semibold text-[#0B2559]">
                      {c.instructorName || "English Ready Trainer"}
                    </span>
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400">
                        Investasi
                      </div>
                      <div className="text-lg font-extrabold text-[#0B2559]">
                        {c.isFree ? "Gratis" : formatIdr(c.price)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/courses/${c.slug}`}
                        className="rounded-xl border border-[#E6DED4] bg-white px-3 py-2 text-xs font-bold text-[#0B2559] no-underline transition hover:border-[#0B2559]"
                      >
                        Detail
                      </Link>
                      <Link
                        href={
                          isEnrolled
                            ? `/dashboard/classroom?c=${c.id}`
                            : `/checkout?courseId=${c.id}`
                        }
                        className={`flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-bold no-underline transition ${
                          isEnrolled
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-[#C2530A] text-white hover:bg-[#a84507]"
                        }`}
                      >
                        <span>{isEnrolled ? "Buka" : "Daftar"}</span>
                        <LandingIcon name="ArrowRight" size={13} color="currentColor" />
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Bottom 2-Card Band: Coach + Supporting Video Library (Screen 05 Lines 292-307) */}
      <section className="mx-auto flex max-w-[1200px] flex-wrap gap-6 px-4 pb-16 sm:px-6">
        <div className="flex min-w-0 flex-[1_1_360px] items-center gap-4 rounded-[20px] border border-[#E6DED4] bg-white p-6">
          <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#EFE7DD] text-xl font-extrabold text-[#0B2559]">
            {(primaryCourse?.instructorName || "ER").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-[13px] text-[#4A5468]">Coach Pendamping</div>
            <div className="text-[19px] font-extrabold text-[#0B2559]">
              {primaryCourse?.instructorName || "English Ready Coach"}
            </div>
            <div className="mt-0.5 text-sm leading-snug text-[#3D4760]">
              {goal.coachBioFallback}
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3 rounded-[20px] border border-[#E6DED4] bg-white p-6">
          <div className="text-[18px] font-extrabold text-[#0B2559]">
            Perpustakaan video pendukung
          </div>
          <div className="text-sm text-[#3D4760]">
            Modul pendukung dari jalur <b>{activeTrack.label}</b> yang bisa ditonton kapan saja:
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm font-semibold text-[#0B2559] sm:grid-cols-2">
            {activeTrack.supportVideos.map((vid) => (
              <Link
                key={vid}
                href={primaryCourse ? `/courses/${primaryCourse.slug}` : "#paket-tujuan"}
                className="rounded-[10px] bg-[#FBF6F1] px-3 py-2.5 text-[#0B2559] no-underline transition hover:bg-[#EFE7DD]"
              >
                {vid}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

