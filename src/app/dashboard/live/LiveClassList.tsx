/* eslint-disable @next/next/no-img-element */
 
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { UpcomingLiveClass } from "@/lib/db/lessons.queries";

export function LiveClassList({ liveClasses }: { liveClasses: UpcomingLiveClass[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const c = searchParams.get("c");
  
  const defaultSelectedCourse = c 
    ? liveClasses.find((l) => l.courseId === Number(c))?.courseTitle || "all" 
    : "all";

  const [selectedCourse, setSelectedCourse] = useState<string>(defaultSelectedCourse);

  const courses = Array.from(new Set(liveClasses.map((c) => c.courseTitle)));

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const title = e.target.value;
    setSelectedCourse(title);
    if (title === "all") {
      router.push("/dashboard/live");
    } else {
      const cid = liveClasses.find((l) => l.courseTitle === title)?.courseId;
      if (cid) router.push(`/dashboard/live?c=${cid}`);
    }
  };

  const filteredClasses =
    selectedCourse === "all"
      ? liveClasses
      : liveClasses.filter((c) => c.courseTitle === selectedCourse);

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const formatDayLabel = (d: Date | null) => {
    if (!d) return "TBA";
    if (d.toDateString() === now.toDateString()) return "HARI INI";
    if (d.toDateString() === tomorrow.toDateString()) return "BESOK";
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "");
  };

  const formatTime = (d: Date | null) => {
    if (!d) return "--:--";
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":");
  };

  if (liveClasses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center">
        <LandingIcon name="Video" size={48} className="mx-auto mb-4 text-zinc-300" color="currentColor" />
        <h3 className="text-lg font-bold text-zinc-900">Belum ada jadwal Live Mentoring</h3>
        <p className="text-zinc-500">Jadwal kelas interaktif akan muncul di sini.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Dropdown */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm font-medium text-zinc-500">
          Menampilkan {filteredClasses.length} sesi
        </p>
        <div className="w-full mt-4 md:mt-0 flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
          <button
            type="button"
            onClick={() => handleSelect({ target: { value: "all" } } as any)}
            className={`snap-start shrink-0 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
              selectedCourse === "all"
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            Semua Kelas
          </button>
          {courses.map((course) => (
            <button
              key={course}
              type="button"
              onClick={() => handleSelect({ target: { value: course } } as any)}
              className={`snap-start shrink-0 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${
                selectedCourse === course
                  ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                  : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              Kelas: {course}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredClasses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-zinc-500">
            Tidak ada jadwal untuk kelas ini.
          </div>
        ) : (
          filteredClasses.map((session) => {
            const sessionTime = session.liveClassDatetime ? session.liveClassDatetime.getTime() : 0;
            const twoHours = 2 * 60 * 60 * 1000;
            const isCompleted = sessionTime > 0 && now.getTime() > sessionTime + twoHours;
            const isToday = session.liveClassDatetime?.toDateString() === now.toDateString();
            const isActive = !isCompleted && (isToday || (sessionTime - now.getTime() < twoHours && sessionTime > now.getTime()));

            return (
              <div
                key={session.id}
                id={`live-${session.id}`}
                className={`relative flex flex-col items-center gap-6 overflow-hidden rounded-2xl border bg-white p-6 transition-all md:flex-row ${
                  isActive ? "border-blue-200 shadow-sm" : "border-zinc-200"
                }`}
              >
                {isActive && <div className="absolute bottom-0 left-0 top-0 w-1 bg-blue-500" />}
                <div className="flex min-w-[80px] flex-col items-center justify-center">
                  <span
                    className={`mb-1 text-xs font-bold uppercase tracking-wider ${
                      isActive ? "text-blue-500" : "text-zinc-400"
                    }`}
                  >
                    {formatDayLabel(session.liveClassDatetime)}
                  </span>
                  <span className="text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
                    {formatTime(session.liveClassDatetime)}
                  </span>
                  <span className="text-xs font-medium text-zinc-400">WIB</span>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="mb-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    {selectedCourse === "all" && (
                      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100 text-center line-clamp-2 leading-tight max-w-full break-words shrink">
                        {session.courseTitle}
                      </span>
                    )}
                    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100 text-center line-clamp-2 leading-tight max-w-full break-words shrink">
                      {session.moduleName}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold text-zinc-900">{session.title}</h3>
                  <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 md:justify-start">
                    <img
                      src={session.coachAvatar}
                      alt={session.coachName}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span>Coach: {session.coachName}</span>
                  </div>
                </div>

                <div className="mt-4 min-w-[120px] md:mt-0 md:text-right">
                  {isCompleted ? (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-50 px-5 py-2.5 font-semibold text-green-600 border border-green-200 md:w-auto">
                      <LandingIcon name="CheckCircle" size={16} color="currentColor" />
                      Selesai
                    </div>
                  ) : isActive ? (
                    <a
                      href={session.liveClassUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 md:w-auto"
                    >
                      <LandingIcon name="Video" size={16} color="currentColor" />
                      Join Room
                    </a>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-zinc-400">
                      <LandingIcon name="Clock" size={16} color="currentColor" />
                      Menunggu
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
 
