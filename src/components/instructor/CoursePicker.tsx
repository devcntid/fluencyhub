"use client";

import { useRouter } from "next/navigation";

export function CoursePicker({
  courses,
  selectedId,
  hrefTemplate,
}: {
  courses: Array<{ id: number; title: string }>;
  selectedId: number;
  hrefTemplate: string;
}) {
  const router = useRouter();
  return (
    <select
      className="input w-full sm:w-auto min-w-48 max-w-full text-xs sm:text-sm font-semibold rounded-xl bg-white border-zinc-200 shadow-2xs py-2 px-3 focus:border-[var(--brand)] outline-none cursor-pointer"
      value={selectedId}
      onChange={(e) => router.push(hrefTemplate.replace("{id}", e.target.value))}
    >
      {courses.map((c) => (
        <option key={c.id} value={c.id}>
          {c.title}
        </option>
      ))}
    </select>
  );
}
