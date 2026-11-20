"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function CourseSwitcher({
  courses,
  currentCourseId,
  currentTab,
}: {
  courses: { id: number; title: string }[];
  currentCourseId: number | "all";
  currentTab: string;
}) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 80);
    window.addEventListener("resize", checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScroll);
    };
  }, [courses, checkScroll]);

  function scrollByStep(dir: "left" | "right") {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(200, Math.floor(el.clientWidth * 0.65));
    el.scrollBy({ left: dir === "left" ? -step : step, behavior: "smooth" });
  }

  function handleSelect(courseId: number | "all") {
    if (courseId !== currentCourseId) {
      router.push(`/dashboard/classroom?tab=${currentTab}&c=${courseId}`);
    }
  }

  const isAll = currentCourseId === "all";

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#0B2559]/8 text-[#0B2559]">
            <LandingIcon name="GraduationCap" size={14} color="currentColor" />
          </span>
          <span className="text-xs font-extrabold uppercase tracking-wider text-[#0B2559]">
            Filter Kelas
          </span>
          <span className="rounded-full bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-[10px] font-bold text-zinc-500">
            {courses.length} Kelas
          </span>
        </div>

        {!isAll && (
          <button
            type="button"
            onClick={() => handleSelect("all")}
            className="text-[11px] font-bold text-[#C2530A] hover:text-[#F26A12] hover:underline cursor-pointer"
          >
            Lihat Semua Kelas
          </button>
        )}
      </div>

      {/* Mobile (< 640px): Full-width readable dropdown selector */}
      <div className="relative sm:hidden">
        <select
          aria-label="Pilih kelas"
          value={isAll ? "all" : String(currentCourseId)}
          onChange={(e) => {
            const val = e.target.value;
            handleSelect(val === "all" ? "all" : Number(val));
          }}
          className="w-full appearance-none rounded-xl border border-[#E6DED4] bg-[#FBF6F1]/70 px-3.5 py-2.5 pr-10 text-xs font-bold text-[#0B2559] focus:border-[#0073F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0073F5]/15 transition"
        >
          <option value="all">Semua Kelas ({courses.length} kelas terdaftar)</option>
          {courses.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.title}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
          <LandingIcon name="ChevronDown" size={16} color="currentColor" />
        </span>
      </div>

      {/* iPad & Desktop (>= 640px): Sleek pill bar with arrow controls, zero ugly scrollbar */}
      <div className="hidden sm:flex items-center gap-1.5">
        {(canScrollLeft || canScrollRight) && (
          <button
            type="button"
            onClick={() => scrollByStep("left")}
            disabled={!canScrollLeft}
            aria-label="Geser daftar kelas ke kiri"
            className={`shrink-0 w-8 h-8 rounded-xl border border-[#E6DED4] bg-white flex items-center justify-center text-[#0B2559] transition ${
              canScrollLeft
                ? "hover:bg-[#FBF6F1] hover:border-[#0B2559]/30 cursor-pointer"
                : "opacity-30 cursor-not-allowed"
            }`}
          >
            <LandingIcon name="ChevronLeft" size={16} color="currentColor" />
          </button>
        )}

        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
        >
          <button
            type="button"
            onClick={() => handleSelect("all")}
            className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap ${
              isAll
                ? "bg-[#0B2559] text-white border-[#0B2559] shadow-sm"
                : "bg-[#FBF6F1]/70 text-[#0B2559] border-[#E6DED4] hover:bg-white hover:border-[#0B2559]/35"
            }`}
          >
            <LandingIcon name="Layers" size={14} color={isAll ? "#fff" : "currentColor"} />
            <span>Semua Kelas</span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-extrabold ${
                isAll
                  ? "bg-white/15 text-white"
                  : "bg-white text-[#0B2559] border border-[#E6DED4]"
              }`}
            >
              {courses.length}
            </span>
          </button>

          {courses.map((c) => {
            const isActive = !isAll && c.id === currentCourseId;
            return (
              <button
                key={c.id}
                type="button"
                title={c.title}
                onClick={() => handleSelect(c.id)}
                className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer max-w-[260px] ${
                  isActive
                    ? "bg-[#0B2559] text-white border-[#0B2559] shadow-sm"
                    : "bg-white text-zinc-700 border-[#E6DED4] hover:border-[#0073F5]/45 hover:text-[#0B2559] hover:bg-blue-50/30"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                    isActive ? "bg-[#F26A12]" : "bg-[#0073F5]/40"
                  }`}
                />
                <span className="truncate">{c.title}</span>
              </button>
            );
          })}
        </div>

        {(canScrollLeft || canScrollRight) && (
          <button
            type="button"
            onClick={() => scrollByStep("right")}
            disabled={!canScrollRight}
            aria-label="Geser daftar kelas ke kanan"
            className={`shrink-0 w-8 h-8 rounded-xl border border-[#E6DED4] bg-white flex items-center justify-center text-[#0B2559] transition ${
              canScrollRight
                ? "hover:bg-[#FBF6F1] hover:border-[#0B2559]/30 cursor-pointer"
                : "opacity-30 cursor-not-allowed"
            }`}
          >
            <LandingIcon name="ChevronRight" size={16} color="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}
