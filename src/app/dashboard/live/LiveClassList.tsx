/* eslint-disable @next/next/no-img-element */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { UpcomingLiveClass } from "@/lib/db/lessons.queries";
import { formatTimeWIB, formatFullDateWIB, formatDayLabelWIB } from "@/lib/utils/date";

function CoachAvatar({ src, name }: { src?: string | null; name?: string | null }) {
  const [failed, setFailed] = useState(false);
  const initials = (name || "TR")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || "")
    .join("");

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name || "Trainer"}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="h-6 w-6 rounded-full object-cover ring-1 ring-[#E6DED4] shrink-0"
      />
    );
  }

  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0B2559] text-[10px] font-extrabold text-white">
      {initials || "TR"}
    </span>
  );
}

export function LiveClassList({ liveClasses }: { liveClasses: UpcomingLiveClass[] }) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [filter, setFilter] = useState<"all" | "active" | "ended">("all");
  const [submittingIds, setSubmittingIds] = useState<Record<number, boolean>>({});
  const [completedMap, setCompletedMap] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    for (const c of liveClasses) {
      if (c.isCompleted) init[c.id] = true;
    }
    return init;
  });

  async function handleToggleAttendance(session: UpcomingLiveClass, desiredState?: boolean) {
    if (submittingIds[session.id]) return;

    const durationMin = session.durationMinutes > 0 ? session.durationMinutes : 60;
    const startTime = session.liveClassDatetime ? new Date(session.liveClassDatetime).getTime() : 0;
    const endTime = startTime > 0 ? startTime + durationMin * 60 * 1000 : 0;
    const isEnded = endTime > 0 && currentTime.getTime() >= endTime;

    const currentCompleted = completedMap[session.id] ?? Boolean(session.isCompleted);
    const nextState = desiredState !== undefined ? desiredState : !currentCompleted;

    if (nextState && !isEnded) {
      alert(
        "Sesi Live Mentoring belum selesai. Status Hadir hanya dapat ditandai setelah sesi berakhir."
      );
      return;
    }

    setSubmittingIds((prev) => ({ ...prev, [session.id]: true }));
    setCompletedMap((prev) => ({ ...prev, [session.id]: nextState }));

    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: session.courseId,
          lessonId: session.id,
          isCompleted: nextState,
        }),
      });
      if (!res.ok) throw new Error("Failed to record attendance");
      router.refresh();
    } catch (err) {
      console.error(err);
      setCompletedMap((prev) => ({ ...prev, [session.id]: currentCompleted }));
    } finally {
      setSubmittingIds((prev) => ({ ...prev, [session.id]: false }));
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (liveClasses.length === 0) {
    return (
      <div className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white p-8 sm:p-12 text-center shadow-xs space-y-3">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-[#0B2559]">
          <LandingIcon name="Video" size={28} color="currentColor" />
        </div>
        <h3 className="text-base sm:text-lg font-extrabold text-[#0B2559]">
          Belum Ada Jadwal Live Mentoring
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">
          Jadwal kelas interaktif Zoom akan muncul di sini setelah dijadwalkan oleh trainer.
        </p>
      </div>
    );
  }

  const sessionsWithStatus = liveClasses.map((session) => {
    const durationMin = session.durationMinutes > 0 ? session.durationMinutes : 60;
    const startTime = session.liveClassDatetime ? new Date(session.liveClassDatetime).getTime() : 0;
    const endTime = startTime > 0 ? startTime + durationMin * 60 * 1000 : 0;
    const startDate = startTime > 0 ? new Date(startTime) : null;
    const endDate = endTime > 0 ? new Date(endTime) : null;

    const nowMs = currentTime.getTime();
    const isEnded = endTime > 0 && nowMs >= endTime;
    const isLiveNow = startTime > 0 && nowMs >= startTime && nowMs < endTime;
    const isWaitingRoom = startTime > 0 && nowMs >= startTime - 15 * 60 * 1000 && nowMs < startTime;
    const isUpcoming = startTime > 0 && nowMs < startTime - 15 * 60 * 1000;

    return {
      session,
      durationMin,
      startDate,
      endDate,
      isEnded,
      isLiveNow,
      isWaitingRoom,
      isUpcoming,
    };
  });

  const sortedSessions = [...sessionsWithStatus].sort((a, b) => {
    const getPriority = (item: (typeof sessionsWithStatus)[number]) => {
      if (item.isLiveNow) return 0;
      if (item.isWaitingRoom) return 1;
      if (!item.isEnded) return 2;
      return 3;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);
    if (prioA !== prioB) return prioA - prioB;

    if (prioA < 3) {
      const timeA = a.startDate ? a.startDate.getTime() : Infinity;
      const timeB = b.startDate ? b.startDate.getTime() : Infinity;
      return timeA - timeB;
    }

    const timeA = a.startDate ? a.startDate.getTime() : 0;
    const timeB = b.startDate ? b.startDate.getTime() : 0;
    return timeB - timeA;
  });

  const activeCount = sortedSessions.filter((s) => !s.isEnded).length;
  const endedCount = sortedSessions.filter((s) => s.isEnded).length;

  const filteredSessions = sortedSessions.filter((s) => {
    if (filter === "active") return !s.isEnded;
    if (filter === "ended") return s.isEnded;
    return true;
  });

  const attendedCount = Object.values(completedMap).filter(Boolean).length;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Cohort Online Mentoring Banner */}
      <div className="rounded-2xl border border-[#E6DED4] bg-gradient-to-r from-[#0B2559] via-[#10306F] to-[#163D8A] p-4 sm:p-5 text-white shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#F26A12] text-white">
              Cohort Online Mentoring
            </span>
            <span className="text-[11px] font-semibold text-blue-200">
              Kelompok Kecil • Live Feedback Trainer
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
            Ruang Kelas Live Interaktif via Zoom
          </h3>
          <p className="text-xs text-blue-100/85 leading-relaxed">
            Latihan percakapan kelompok, koreksi pelafalan/grammar langsung, dan sesi tanya jawab.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-center sm:text-left">
            <div className="text-[10px] text-blue-200 font-bold uppercase tracking-wider">
              Kehadiran Kamu
            </div>
            <div className="text-sm font-extrabold text-white">
              {attendedCount} / {liveClasses.length} Sesi
            </div>
          </div>
          <Link
            href="/dashboard/private-sessions"
            className="px-4 py-2.5 rounded-xl bg-white text-[#0B2559] hover:bg-[#FBF6F1] font-extrabold text-xs shadow-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Booking 1-on-1 Coaching &rarr;</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs font-semibold text-zinc-500">
          Menampilkan <strong className="text-[#0B2559]">{filteredSessions.length}</strong> dari{" "}
          {liveClasses.length} sesi Live Zoom
        </p>

        <div className="grid grid-cols-3 sm:flex items-center gap-1 rounded-xl bg-white border border-[#E6DED4] p-1 text-[11px] sm:text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-2.5 sm:px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
              filter === "all"
                ? "bg-[#0B2559] text-white shadow-2xs"
                : "text-zinc-600 hover:text-[#0B2559]"
            }`}
          >
            Semua ({liveClasses.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`rounded-lg px-2.5 sm:px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
              filter === "active"
                ? "bg-[#F26A12] text-white shadow-2xs"
                : "text-zinc-600 hover:text-[#0B2559]"
            }`}
          >
            Aktif ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("ended")}
            className={`rounded-lg px-2.5 sm:px-3 py-1.5 transition cursor-pointer whitespace-nowrap ${
              filter === "ended"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-zinc-600 hover:text-[#0B2559]"
            }`}
          >
            Selesai ({endedCount})
          </button>
        </div>
      </div>

      {/* Session Cards */}
      <div className="space-y-3.5">
        {filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DFD5C8] bg-white py-12 text-center text-xs sm:text-sm font-medium text-zinc-500">
            Tidak ada sesi pada kategori ini.
          </div>
        ) : (
          filteredSessions.map(
            (
              {
                session,
                durationMin,
                startDate,
                endDate,
                isEnded,
                isLiveNow,
                isWaitingRoom,
                isUpcoming,
              },
              index
            ) => {
              const showDivider =
                filter === "all" &&
                isEnded &&
                index > 0 &&
                !filteredSessions[index - 1].isEnded;
              const isAttended = Boolean(completedMap[session.id] ?? session.isCompleted);

              return (
                <div key={session.id} className="space-y-3.5">
                  {showDivider && (
                    <div className="flex items-center gap-3 pt-2">
                      <div className="h-px flex-1 bg-[#E6DED4]" />
                      <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-zinc-400 uppercase tracking-wider">
                        <LandingIcon name="CheckCircle" size={13} color="currentColor" />
                        Sesi Selesai
                      </span>
                      <div className="h-px flex-1 bg-[#E6DED4]" />
                    </div>
                  )}

                  <div
                    id={`live-${session.id}`}
                    className={`relative flex flex-col xl:flex-row xl:items-center gap-4 overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all ${
                      isLiveNow
                        ? "border-rose-300 bg-white shadow-md ring-2 ring-rose-200/70"
                        : isWaitingRoom
                        ? "border-blue-300 bg-blue-50/20 shadow-xs"
                        : isEnded
                        ? "border-[#E6DED4] bg-white/80 hover:bg-white"
                        : "border-[#E6DED4] bg-white shadow-xs hover:border-[#0073F5]/35"
                    }`}
                  >
                    {/* Left Status Accent */}
                    <div
                      className={`absolute bottom-0 left-0 top-0 w-1.5 ${
                        isLiveNow
                          ? "bg-rose-500"
                          : isWaitingRoom
                          ? "bg-[#F26A12]"
                          : isEnded
                          ? "bg-zinc-300"
                          : "bg-[#0073F5]"
                      }`}
                    />

                    {/* Time Block */}
                    <div className="pl-2 flex flex-col sm:flex-row sm:items-center sm:justify-between xl:w-[190px] xl:flex-col xl:items-center xl:justify-center xl:text-center border-b xl:border-b-0 xl:border-r border-[#F0EAE2] pb-3.5 xl:pb-0 xl:pr-5 gap-2 shrink-0">
                      <div className="flex items-center gap-2 xl:flex-col xl:gap-0.5">
                        <span
                          className={`text-[11px] font-extrabold uppercase tracking-wider ${
                            isLiveNow
                              ? "text-rose-600"
                              : isWaitingRoom
                              ? "text-[#C2530A]"
                              : isEnded
                              ? "text-zinc-400"
                              : "text-[#0062D1]"
                          }`}
                        >
                          {formatDayLabelWIB(startDate, currentTime)}
                        </span>
                        <span className="text-zinc-300 xl:hidden">•</span>
                        <span className="text-[11px] font-medium text-zinc-500 xl:hidden">
                          {formatFullDateWIB(startDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 xl:flex-col xl:gap-1">
                        <div className="flex items-center gap-1 font-extrabold font-[family-name:var(--font-heading)] text-[#0B2559]">
                          <span className="text-lg sm:text-xl">{formatTimeWIB(startDate)}</span>
                          <span className="text-xs text-zinc-400 font-normal">–</span>
                          <span className="text-lg sm:text-xl">{formatTimeWIB(endDate)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400">WIB</span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-[10px] font-bold text-zinc-600">
                            {durationMin} mnt
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-zinc-400 hidden xl:block">
                        {formatFullDateWIB(startDate)}
                      </span>
                    </div>

                    {/* Details Block */}
                    <div className="pl-2 xl:pl-0 flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isLiveNow && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-700 border border-rose-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600" />
                            Sedang Berlangsung
                          </span>
                        )}
                        {isWaitingRoom && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#C2530A] border border-[#F26A12]/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#F26A12]" />
                            Ruang Tunggu Dibuka
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-[#0062D1] border border-blue-200/80">
                            <LandingIcon name="Clock" size={10} color="currentColor" />
                            Akan Datang
                          </span>
                        )}
                        {isEnded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-bold text-zinc-500 border border-zinc-200">
                            Selesai
                          </span>
                        )}

                        <span className="inline-flex rounded-full bg-[#FBF6F1] px-2.5 py-0.5 text-[10px] font-bold text-[#0B2559] border border-[#E6DED4] max-w-full truncate">
                          {session.moduleName}
                        </span>

                        {isEnded && isAttended && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                            <LandingIcon name="Check" size={10} color="currentColor" />
                            Hadir
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-extrabold text-[#0B2559] leading-snug break-words">
                        {session.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <CoachAvatar src={session.coachAvatar} name={session.coachName} />
                        <span className="truncate">
                          Trainer:{" "}
                          <strong className="text-[#0B2559] font-semibold">
                            {session.coachName}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Action Block */}
                    <div className="pl-2 xl:pl-0 w-full xl:w-[195px] flex flex-col sm:flex-row xl:flex-col items-stretch gap-2 shrink-0 pt-3 xl:pt-0 border-t xl:border-t-0 border-[#F0EAE2]">
                      {isEnded ? (
                        <button
                          type="button"
                          disabled={submittingIds[session.id]}
                          onClick={() => handleToggleAttendance(session)}
                          className={`flex-1 xl:flex-none flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold transition cursor-pointer ${
                            isAttended
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80"
                              : "bg-[#0B2559] text-white hover:bg-[#133882] shadow-xs"
                          }`}
                        >
                          <LandingIcon
                            name={isAttended ? "CheckCircle" : "Check"}
                            size={14}
                            color="currentColor"
                          />
                          <span>
                            {submittingIds[session.id]
                              ? "Menyimpan..."
                              : isAttended
                              ? "Tercatat Hadir ✓"
                              : "Tandai Hadir"}
                          </span>
                        </button>
                      ) : isLiveNow ? (
                        <a
                          href={session.liveClassUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 xl:flex-none flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition"
                        >
                          <LandingIcon name="Video" size={15} color="#fff" />
                          <span>Gabung Zoom Sekarang</span>
                        </a>
                      ) : isWaitingRoom ? (
                        <a
                          href={session.liveClassUrl || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 xl:flex-none flex items-center justify-center gap-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition"
                        >
                          <LandingIcon name="Video" size={15} color="#fff" />
                          <span>Masuk Ruang Tunggu</span>
                        </a>
                      ) : (
                        <div
                          className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-[#FBF6F1] px-4 py-2.5 text-xs font-bold text-zinc-500 border border-[#E6DED4] select-none"
                          title="Ruang Zoom dibuka 15 menit sebelum jadwal dimulai"
                        >
                          <LandingIcon name="Clock" size={14} color="currentColor" />
                          <span>Buka 15 mnt sebelum</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }
          )
        )}
      </div>
    </div>
  );
}
