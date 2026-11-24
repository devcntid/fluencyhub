"use client";

import { useState } from "react";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";
import type { Testimonial } from "@/types/db";

const SCORE_PROGRESSIONS = [
  { baseline: 48, exit: 74 },
  { baseline: 44, exit: 71 },
  { baseline: 53, exit: 81 },
];

const FALLBACK_MOMENT: Testimonial[] = [
  {
    id: 0,
    name: "Budi Santoso",
    role: "Software Engineer",
    quote:
      "Setelah 6 minggu di cohort, akhirnya berani presentasi architecture system di forum tim global tanpa gugup dan tanpa bergantung pada teks penuh.",
    avatarUrl: null,
    rating: 5,
    sortOrder: 0,
    isActive: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "ER";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function TestimonialSection({ items }: { items: Testimonial[] }) {
  const moments = items.length > 0 ? items : FALLBACK_MOMENT;
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedAvatarUrls, setFailedAvatarUrls] = useState<Record<string, boolean>>({});

  const safeIndex = activeIndex % moments.length;
  const current = moments[safeIndex];
  const progression = SCORE_PROGRESSIONS[safeIndex % SCORE_PROGRESSIONS.length];
  const avatarSrc = current.avatarUrl?.trim() || "";
  const showAvatarImage = Boolean(avatarSrc) && !failedAvatarUrls[avatarSrc];

  return (
    <section
      id="podcast"
      className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-8 px-4 py-14 scroll-mt-20 sm:px-6 sm:py-[72px]"
    >
      {/* Left: English Ready Podcast Card */}
      <div className="flex min-w-0 flex-[1_1_520px] flex-wrap items-center gap-6 rounded-[24px] bg-[#0B2559] p-6 text-white sm:gap-7 sm:p-9">
        <div className="shrink-0">
          <EnglishReadyLogo variant="icon" height={96} className="sm:hidden" />
          <EnglishReadyLogo variant="icon" height={120} className="hidden sm:inline-flex" />
        </div>

        <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5">
          <div className="text-[12.5px] font-bold uppercase tracking-[0.12em] text-[#AFC4EA] sm:text-[13px]">
            English Ready Podcast · tayang setiap Rabu
          </div>
          <h3 className="m-0 text-[22px] font-extrabold leading-snug tracking-[-0.02em] text-white sm:text-[26px]">
            Dari Gugup Saat Daily Standup Sampai Memimpin Sprint Global
          </h3>
          <p className="m-0 text-[15.5px] leading-[1.6] text-[#D5DDEE] sm:text-[16px]">
            Cerita orang Indonesia yang berkarier dan berkontribusi di panggung global.
          </p>
          <div className="mt-1.5 flex flex-wrap gap-3">
            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[12px] bg-white px-[18px] py-3 text-[15px] font-bold text-[#0B2559] transition hover:bg-[#F5ECE3]"
            >
              Tonton di YouTube
            </a>
            <a
              href="https://open.spotify.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-[12px] border-2 border-white bg-transparent px-[18px] py-3 text-[15px] font-bold text-white transition hover:bg-white/10"
            >
              Dengarkan di Spotify
            </a>
          </div>
        </div>
      </div>

      {/* Right: Ready Moment */}
      <div className="flex min-w-0 flex-[1_1_360px] flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="m-0 text-[28px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[32px]">
            Ready Moment
          </h2>
          {moments.length > 1 && (
            <div className="flex items-center gap-1.5">
              {moments.map((m, idx) => (
                <button
                  key={m.id}
                  type="button"
                  aria-label={`Lihat cerita ${m.name}`}
                  onClick={() => setActiveIndex(idx)}
                  className={`h-2.5 cursor-pointer rounded-full transition-all ${
                    idx === safeIndex ? "w-6 bg-[#0B2559]" : "w-2.5 bg-[#D4C7B8] hover:bg-[#0B2559]/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 rounded-[20px] border border-dashed border-[#C9BBA9] bg-white p-6">
          <p className="m-0 text-[16.5px] leading-[1.6] text-[#0B2559] sm:text-[17px]">
            “{current.quote}”
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex min-w-0 items-center gap-3">
              {showAvatarImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={avatarSrc}
                  src={avatarSrc}
                  alt={`Foto ${current.name}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={() =>
                    setFailedAvatarUrls((prev) => ({ ...prev, [avatarSrc]: true }))
                  }
                  className="h-11 w-11 shrink-0 rounded-full border-2 border-[#E6DED4] bg-[#FBF6F1] object-cover object-top"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0B2559] text-xs font-extrabold tracking-wide text-white"
                >
                  {getInitials(current.name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold text-[#0B2559]">
                  {current.name}
                </div>
                <div className="truncate text-xs font-medium text-[#4A5468]">
                  {current.role}
                </div>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-[#E6DED4] bg-[#FBF6F1] px-3 py-1 text-xs font-bold text-[#0B2559]">
              Baseline {progression.baseline} → Exit {progression.exit}
            </span>
          </div>
        </div>

        <div className="text-[13px] text-[#4A5468]">
          Setiap cerita disertai skor sebelum dan sesudah, bukan rating bintang.
        </div>
      </div>
    </section>
  );
}
