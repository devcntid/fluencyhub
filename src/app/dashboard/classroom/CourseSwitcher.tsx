"use client";

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

  function handleSelect(courseId: number | "all") {
    if (courseId !== currentCourseId) {
      router.push(`/dashboard/classroom?tab=${currentTab}&c=${courseId}`);
    }
  }

  const isAll = currentCourseId === "all";

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <span className="text-xs font-bold text-zinc-400 shrink-0 uppercase tracking-wider mr-1">
          Materi Kelas:
        </span>
        <div className="flex items-center gap-2 flex-nowrap shrink-0">
          {/* Tombol Lihat Semua Materi */}
          <button
            type="button"
            onClick={() => handleSelect("all")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
              isAll
                ? "bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm ring-2 ring-blue-500/20"
                : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <LandingIcon
              name="Layers"
              size={15}
              color={isAll ? "#fff" : "currentColor"}
            />
            <span>Semua Materi</span>
            {isAll && (
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse ml-0.5" />
            )}
          </button>

          {/* Tombol Per Kelas */}
          {courses.map((c) => {
            const isActive = !isAll && c.id === currentCourseId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer whitespace-nowrap active:scale-95 ${
                  isActive
                    ? "bg-[var(--brand)] text-white border-[var(--brand)] shadow-sm ring-2 ring-blue-500/20"
                    : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
                }`}
              >
                <LandingIcon
                  name="GraduationCap"
                  size={15}
                  color={isActive ? "#fff" : "currentColor"}
                />
                <span>{c.title}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
