"use client";

import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function CoursePicker({
  courses,
  selectedId,
  hrefTemplate,
  variant = "light",
}: {
  courses: Array<{ id: number; title: string }>;
  selectedId: number;
  hrefTemplate: string;
  variant?: "light" | "glass";
}) {
  const router = useRouter();

  const selectClass =
    variant === "glass"
      ? "w-full appearance-none rounded-xl border border-white/25 bg-white/95 py-2.5 pl-3.5 pr-9 text-xs sm:text-sm font-bold text-[#0B2559] shadow-xs outline-none transition focus:border-[#F26A12] focus:ring-2 focus:ring-[#F26A12]/30 cursor-pointer"
      : "w-full sm:w-auto min-w-52 max-w-full appearance-none rounded-xl border border-[#E6DED4] bg-white py-2.5 pl-3.5 pr-9 text-xs sm:text-sm font-bold text-[#0B2559] shadow-2xs outline-none transition focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 cursor-pointer";

  return (
    <div className="relative w-full">
      <select
        aria-label="Pilih kelas"
        className={selectClass}
        value={selectedId}
        onChange={(e) => router.push(hrefTemplate.replace("{id}", e.target.value))}
      >
        {courses.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#0B2559]/70">
        <LandingIcon name="ChevronDown" size={16} color="currentColor" />
      </span>
    </div>
  );
}
