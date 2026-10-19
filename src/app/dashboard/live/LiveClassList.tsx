/* eslint-disable @next/next/no-img-element */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { UpcomingLiveClass } from "@/lib/db/lessons.queries";
import { formatTimeWIB, formatFullDateWIB, formatDayLabelWIB } from "@/lib/utils/date";

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

    // Hitung apakah sesi sudah selesai
    const durationMin = session.durationMinutes > 0 ? session.durationMinutes : 60;
    const startTime = session.liveClassDatetime ? new Date(session.liveClassDatetime).getTime() : 0;
    const endTime = startTime > 0 ? startTime + durationMin * 60 * 1000 : 0;
    const isEnded = endTime > 0 && currentTime.getTime() >= endTime;

    const currentCompleted = completedMap[session.id] ?? Boolean(session.isCompleted);
    const nextState = desiredState !== undefined ? desiredState : !currentCompleted;

    // Status Attended hanya dapat diberikan setelah sesi Live Mentoring selesai
    if (nextState && !isEnded) {
      alert("Sesi Live Mentoring belum selesai. Status Attended hanya dapat diberikan setelah sesi Live Mentoring selesai.");
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
    // Tick every 10 seconds so status transitions seamlessly if a session ends while on page
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (liveClasses.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-xs">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
          <LandingIcon name="Video" size={32} color="currentColor" />
        </div>
        <h3 className="text-lg font-bold text-zinc-900">No Live Mentoring scheduled yet</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Zoom interactive class schedules for this course will appear here once scheduled by the instructor.
        </p>
      </div>
    );
  }

  // Pre-calculate status for all sessions
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
    const canJoin = isLiveNow || isWaitingRoom;

    return {
      session,
      durationMin,
      startDate,
      endDate,
      isEnded,
      isLiveNow,
      isWaitingRoom,
      isUpcoming,
      canJoin,
    };
  });

  // Sort sessions:
  // 1. Live Now (priority 0) -> top
  // 2. Waiting Room Open (priority 1)
  // 3. Upcoming (priority 2) -> ordered by startTime ASC
  // 4. Completed (priority 3) -> bottom
  const sortedSessions = [...sessionsWithStatus].sort((a, b) => {
    const getPriority = (item: (typeof sessionsWithStatus)[number]) => {
      if (item.isLiveNow) return 0;
      if (item.isWaitingRoom) return 1;
      if (!item.isEnded) return 2;
      return 3;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

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

  return (
    <div className="space-y-4">
      {/* Top Filter and Info Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-zinc-500">
          Showing {filteredSessions.length} of {liveClasses.length} live mentoring sessions
        </p>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 rounded-xl bg-zinc-100 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === "all"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            All ({liveClasses.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === "active"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Active & Upcoming ({activeCount})
          </button>
          <button
            onClick={() => setFilter("ended")}
            className={`rounded-lg px-3 py-1.5 transition ${
              filter === "ended"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            Completed ({endedCount})
          </button>
        </div>
      </div>

      {/* Session Cards */}
      <div className="flex flex-col gap-4">
        {filteredSessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-zinc-500">
            No sessions found in this category.
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
                canJoin,
              },
              index
            ) => {
              const showDivider =
                filter === "all" &&
                isEnded &&
                index > 0 &&
                !filteredSessions[index - 1].isEnded;

              return (
                <div key={session.id} className="space-y-4">
                  {showDivider && (
                    <div className="flex items-center gap-3 pt-2">
                      <div className="h-px flex-1 bg-zinc-200" />
                      <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 uppercase tracking-wider">
                        <LandingIcon name="CheckCircle" size={13} color="currentColor" />
                        Completed Sessions
                      </span>
                      <div className="h-px flex-1 bg-zinc-200" />
                    </div>
                  )}

                  <div
                    id={`live-${session.id}`}
                    className={`relative flex flex-col items-stretch gap-4 sm:gap-5 overflow-hidden rounded-2xl border p-4 sm:p-5 transition-all lg:flex-row lg:items-center ${
                      isLiveNow
                        ? "border-red-300 bg-white shadow-md shadow-red-100/50 ring-2 ring-red-200"
                        : isWaitingRoom
                        ? "border-blue-300 bg-blue-50/20 shadow-sm"
                        : isEnded
                        ? "border-zinc-200 bg-zinc-50/60 opacity-80 hover:opacity-100"
                        : "border-zinc-200 bg-white shadow-xs"
                    }`}
                  >
                    {/* Left Accent Bar */}
                    {isLiveNow && (
                      <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-red-500 animate-pulse" />
                    )}
                    {isWaitingRoom && (
                      <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-blue-500" />
                    )}

                    {/* Left Block: Time Range & Duration */}
                    <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-start lg:w-auto lg:min-w-[175px] lg:flex-col lg:items-center lg:justify-center text-left sm:text-center border-b pb-3.5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5 border-zinc-100 gap-3 sm:gap-6 lg:gap-1.5 shrink-0">
                      <div className="flex items-center gap-2 sm:flex-col sm:gap-0.5 lg:items-center shrink-0">
                        <span
                          className={`text-[11px] font-black uppercase tracking-wider ${
                            isLiveNow
                              ? "text-red-600"
                              : isWaitingRoom
                              ? "text-blue-600"
                              : isEnded
                              ? "text-zinc-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {formatDayLabelWIB(startDate, currentTime)}
                        </span>
                        <span className="text-[11px] text-zinc-300 sm:hidden">•</span>
                        <span className="text-[11px] text-zinc-500 sm:hidden">
                          {formatFullDateWIB(startDate)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 font-extrabold font-[family-name:var(--font-heading)] text-zinc-900 shrink-0">
                        <span className="text-xl sm:text-2xl">{formatTimeWIB(startDate)}</span>
                        <span className="text-xs text-zinc-400 font-normal">-</span>
                        <span className="text-xl sm:text-2xl">{formatTimeWIB(endDate)}</span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                        <span className="text-[11px] font-bold text-zinc-400">WIB</span>
                        <span className="text-zinc-300">•</span>
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-600">
                          <LandingIcon name="Clock" size={11} color="currentColor" />
                          {durationMin} Mins
                        </span>
                        <span className="text-zinc-300 hidden sm:inline lg:hidden">•</span>
                        <span className="text-[11px] text-zinc-500 hidden sm:inline lg:hidden">
                          {formatFullDateWIB(startDate)}
                        </span>
                      </div>

                      <span className="mt-0.5 text-[10px] text-zinc-400 hidden lg:block">
                        {formatFullDateWIB(startDate)}
                      </span>
                    </div>

                    {/* Center Block: Status & Details */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {/* Live Status Badge */}
                        {isLiveNow && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700 border border-red-200 animate-pulse">
                            <span className="h-2 w-2 rounded-full bg-red-600 animate-ping inline-block" />
                            HAPPENING NOW
                          </span>
                        )}
                        {isWaitingRoom && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 border border-blue-200">
                            <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                            WAITING ROOM OPEN
                          </span>
                        )}
                        {isUpcoming && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 border border-amber-200">
                            <LandingIcon name="Clock" size={11} color="currentColor" />
                            Upcoming
                          </span>
                        )}
                        {isEnded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border border-zinc-200">
                            <LandingIcon name="CheckCircle" size={11} color="currentColor" />
                            Completed
                          </span>
                        )}

                        {/* Module Badge */}
                        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-600 border border-blue-100 max-w-full truncate">
                          {session.moduleName}
                        </span>

                        {/* Attended Badge - Hanya tampil jika sesi sudah selesai dan dihadiri */}
                        {isEnded && Boolean(completedMap[session.id] ?? session.isCompleted) && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                            <LandingIcon name="Check" size={11} color="currentColor" />
                            Attended ✓
                          </span>
                        )}
                      </div>

                      <h3 className="mb-1.5 text-base sm:text-lg font-bold text-zinc-900 leading-snug break-words">
                        {session.title}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <img
                          src={session.coachAvatar}
                          alt={session.coachName}
                          className="h-5 w-5 rounded-full object-cover ring-1 ring-zinc-200 shrink-0"
                        />
                        <span className="truncate">
                          Instructor: <strong className="text-zinc-700 font-semibold">{session.coachName}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Right Block: Action Button & Attendance Toggle */}
                    <div className="w-full lg:w-auto lg:min-w-[190px] flex flex-col items-stretch lg:items-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-zinc-100">
                      {isEnded ? (
                        <>
                          <div
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-200 cursor-not-allowed lg:w-auto select-none"
                            title="This session has ended based on the scheduled duration"
                          >
                            <LandingIcon name="CheckCircle" size={15} color="currentColor" />
                            <span>Session Ended</span>
                          </div>
                        </>
                      ) : isLiveNow ? (
                        <>
                          <a
                            href={session.liveClassUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-red-200 transition hover:bg-red-700 active:scale-95 lg:w-auto"
                          >
                            <LandingIcon name="Video" size={16} color="currentColor" />
                            <span>Join Live Room</span>
                          </a>
                          <span className="text-[10px] font-bold text-red-600 text-center lg:text-right animate-pulse">
                            Happening right now
                          </span>
                        </>
                      ) : isWaitingRoom ? (
                        <>
                          <a
                            href={session.liveClassUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:scale-95 lg:w-auto"
                          >
                            <LandingIcon name="Video" size={16} color="currentColor" />
                            <span>Enter Waiting Room</span>
                          </a>
                          <span className="text-[10px] text-blue-600 font-semibold text-center lg:text-right">
                            Zoom room is open
                          </span>
                        </>
                      ) : (
                        <>
                          <div
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-xs font-bold text-zinc-400 border border-zinc-200 cursor-not-allowed lg:w-auto select-none"
                            title="Zoom room will open 15 minutes before class starts"
                          >
                            <LandingIcon name="Clock" size={15} color="currentColor" />
                            <span>Opens 15m before start</span>
                          </div>
                        </>
                      )}

                      {/* Attendance Toggle - Hanya dapat ditandai setelah sesi selesai */}
                      {isEnded && (
                        <button
                          type="button"
                          disabled={submittingIds[session.id]}
                          onClick={() => handleToggleAttendance(session)}
                          className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition lg:w-auto cursor-pointer ${
                            (completedMap[session.id] ?? session.isCompleted)
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80"
                              : "bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-50 shadow-2xs"
                          }`}
                          title="Tandai kehadiran sesi ini setelah selesai"
                        >
                          <LandingIcon
                            name={(completedMap[session.id] ?? session.isCompleted) ? "CheckCircle" : "Check"}
                            size={13}
                            color="currentColor"
                          />
                          <span>
                            {submittingIds[session.id]
                              ? "Updating..."
                              : (completedMap[session.id] ?? session.isCompleted)
                              ? "Attended ✓"
                              : "Mark as Attended"}
                          </span>
                        </button>
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
