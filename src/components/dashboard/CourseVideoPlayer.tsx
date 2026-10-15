"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { PlayerSection, PlayerLesson } from "@/lib/db/lessons.queries";

function getLessonMeta(contentType: string) {
  if (contentType === "live_class") {
    return {
      label: "Live Zoom",
      icon: "Video",
      badgeClass: "bg-red-50 text-red-600 border-red-200",
      btnBg: "bg-red-600",
    };
  }
  if (contentType === "document") {
    return {
      label: "PDF Document",
      icon: "FileText",
      badgeClass: "bg-blue-50 text-blue-600 border-blue-200",
      btnBg: "bg-blue-600",
    };
  }
  if (contentType === "text") {
    return {
      label: "Reading Material",
      icon: "BookOpen",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      btnBg: "bg-amber-600",
    };
  }
  return {
    label: "Video Lesson",
    icon: "Play",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
    btnBg: "bg-[var(--brand)]",
  };
}

export function CourseVideoPlayer({
  course,
  curriculum,
  overallProgress,
}: {
  course: { id: number; title: string; thumbnail_url?: string | null; thumbnailUrl?: string | null };
  curriculum: PlayerSection[];
  overallProgress?: { total: number; completed: number };
}) {
  const router = useRouter();
  const [activeLessonId, setActiveLessonId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notes state
  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState(""); // For "Saved!" indication


  // Find the active lesson object
  let activeLesson: PlayerLesson | null = null;
  if (activeLessonId) {
    for (const sec of curriculum) {
      const lesson = sec.lessons.find((l) => l.id === activeLessonId);
      if (lesson) {
        activeLesson = lesson;
        break;
      }
    }
  }



  async function handleToggleComplete() {
    if (!activeLesson || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: activeLesson.courseId || course.id,
          lessonId: activeLesson.id,
          isCompleted: !activeLesson.isCompleted,
        }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Load note content
  useEffect(() => {
    if (!activeLessonId) {
      return;
    }
    let isMounted = true;
    
    fetch(`/api/dashboard/notes?lessonId=${activeLessonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.note) {
          setNoteContent(data.note.content);
        }
      })
      .catch((err) => console.error("Failed to load note:", err));
      
    return () => {
      isMounted = false;
    };
  }, [activeLessonId]);

  async function handleSaveNote() {
    if (!activeLessonId || isSavingNote) return;
    setIsSavingNote(true);
    setNoteStatus("Saving...");
    try {
      const res = await fetch("/api/dashboard/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: activeLessonId,
          content: noteContent,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setNoteStatus("Saved!");
      setTimeout(() => setNoteStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setNoteStatus("Failed to save");
    } finally {
      setIsSavingNote(false);
    }
  }

  function handleDownloadNote() {
    if (!activeLesson) return;
    const blob = new Blob([noteContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Notes - ${activeLesson.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }


  // --- PLAYER VIEW ---
  if (activeLesson) {
    const total = curriculum.reduce((n, s) => n + s.lessons.length, 0);
    const index = curriculum.flatMap((s) => s.lessons).findIndex((l) => l.id === activeLessonId);
    const pct = total ? Math.round(((index + 1) / total) * 100) : 0;

    return (
      <div className="animate-in fade-in zoom-in-95 duration-300">
        <button
          className="mb-4 flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 transition"
          onClick={() => setActiveLessonId(null)}
        >
          <LandingIcon name="ArrowLeft" size={14} /> Back to Syllabus Grid
        </button>

        <div className="player-shell border border-[var(--border)] rounded-[var(--r-lg)] overflow-hidden shadow-sm" style={{ minHeight: 'auto' }}>
          <div className="player-top">
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-heading)] text-sm font-extrabold">{activeLesson.courseTitle || course.title}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-[var(--text-3)]">
                {index + 1}/{total} · {pct}%
              </span>
              <button onClick={() => setActiveLessonId(null)} className="btn btn-ghost btn-sm" aria-label="Close">
                ✕
              </button>
            </div>
          </div>
          
          <div className="player-grid">
            {/* Main Content Area */}
            <div className="player-main">
              <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <p className="font-[family-name:var(--font-heading)] text-lg font-extrabold text-zinc-900">{activeLesson.title}</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getLessonMeta(activeLesson.contentType).badgeClass}`}>
                  <LandingIcon name={getLessonMeta(activeLesson.contentType).icon} size={12} color="currentColor" />
                  {getLessonMeta(activeLesson.contentType).label}
                </span>
              </div>
              
              {activeLesson.contentType === "document" || (activeLesson.documentUrl && !activeLesson.youtubeVideoId) ? (
                <div className="rounded-[var(--r-lg)] border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[var(--brand)] shadow-xs">
                        <LandingIcon name="FileText" size={22} color="currentColor" />
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-[var(--brand)] uppercase tracking-wider mb-0.5">
                          Study Resource / Document
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug">{activeLesson.title}</h4>
                      </div>
                    </div>
                    {activeLesson.documentUrl && (
                      <a
                        href={activeLesson.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand)] text-white text-xs font-bold shadow-xs hover:opacity-95 transition active:scale-95 shrink-0"
                      >
                        <LandingIcon name="ExternalLink" size={13} color="#fff" />
                        <span>Open / Download PDF</span>
                      </a>
                    )}
                  </div>
                  {activeLesson.description && (
                    <div className="pt-4 text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                      {activeLesson.description}
                    </div>
                  )}
                  {activeLesson.documentUrl?.match(/\.(pdf)($|\?)/i) && (
                    <div className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                      <iframe src={activeLesson.documentUrl} className="h-full w-full" title={activeLesson.title} />
                    </div>
                  )}
                </div>
              ) : activeLesson.contentType === "text" || (activeLesson.textContent && !activeLesson.youtubeVideoId) ? (
                <div className="rounded-[var(--r-lg)] border border-zinc-200 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3 pb-4 border-b border-zinc-100">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-xs">
                      <LandingIcon name="BookOpen" size={22} color="currentColor" />
                    </div>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 uppercase tracking-wider mb-0.5">
                        Reading Material
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug">{activeLesson.title}</h4>
                    </div>
                  </div>
                  <div className="prose max-w-none text-zinc-700 leading-relaxed pt-5 whitespace-pre-line text-xs sm:text-sm">
                    {activeLesson.textContent || activeLesson.description || "No written content provided."}
                  </div>
                </div>
              ) : activeLesson.contentType === "live_class" || (activeLesson.liveClassUrl && !activeLesson.youtubeVideoId) ? (
                <div className="rounded-[var(--r-lg)] border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-white p-5 sm:p-6 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-blue-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                        <LandingIcon name="Video" size={22} color="#fff" />
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider mb-0.5">
                          Live Zoom Mentoring Session
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug">{activeLesson.title}</h4>
                      </div>
                    </div>
                    {activeLesson.liveClassUrl ? (
                      <a
                        href={activeLesson.liveClassUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-xs hover:bg-red-700 transition active:scale-95 shrink-0"
                      >
                        <LandingIcon name="Video" size={14} color="#fff" />
                        <span>Join Live Room</span>
                      </a>
                    ) : (
                      <Link
                        href={course.id ? `/dashboard/classroom?tab=live&c=${course.id}` : `/dashboard/classroom?tab=live&c=all`}
                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-xs hover:bg-blue-700 transition active:scale-95 shrink-0"
                      >
                        <LandingIcon name="Video" size={13} color="#fff" />
                        <span>View Live Schedule &rarr;</span>
                      </Link>
                    )}
                  </div>
                  <div className="pt-4 space-y-3">
                    {activeLesson.liveClassDatetime && (
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
                        <LandingIcon name="Clock" size={14} color="var(--brand)" />
                        <span>
                          Schedule: {new Date(activeLesson.liveClassDatetime).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })} WIB
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      This is an interactive Live Mentoring session. Click above to join the Zoom meeting, or visit the <strong>Live Zoom</strong> tab for room status and schedule details.
                    </p>
                  </div>
                </div>
              ) : activeLesson.youtubeVideoId ? (
                <iframe
                  className="aspect-video w-full rounded-[var(--r-lg)] bg-black"
                  src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtubeVideoId}?autoplay=1`}
                  title={activeLesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-[var(--r-lg)] bg-[#09090b] text-sm text-zinc-400">
                  <div className="text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 mx-auto mb-3">
                      <LandingIcon name="Video" size={26} color="rgba(255,255,255,0.7)" />
                    </div>
                    <p className="text-white font-bold">{activeLesson.title}</p>
                    <p className="text-xs text-white/40 mt-1">Video not available</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-5">
                <button
                  disabled={isSubmitting}
                  onClick={handleToggleComplete}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
                    activeLesson.isCompleted
                      ? "bg-zinc-600 hover:bg-zinc-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  <LandingIcon name={activeLesson.isCompleted ? "X" : "CheckCircle"} size={14} color="#fff" />
                  {activeLesson.isCompleted ? "Mark as Incomplete" : "Mark as Completed"}
                </button>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                    showNotes
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <LandingIcon name="StickyNote" size={14} /> Notes
                </button>
              </div>

              {showNotes && (
                <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <LandingIcon name="Pencil" size={14} /> Personal Notes
                    </h4>
                    <span className="text-xs font-semibold text-green-600">{noteStatus}</span>
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Type your notes here..."
                    className="w-full min-h-[150px] rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
                  />
                  <div className="mt-3 flex justify-between gap-2">
                    <button
                      onClick={handleDownloadNote}
                      disabled={!noteContent.trim()}
                      className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <LandingIcon name="Download" size={12} /> Download
                    </button>
                    <button
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSavingNote ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              )}
              
              {activeLesson.description && activeLesson.contentType !== "document" && (
                <div className="mt-6 text-sm text-[var(--text-2)] whitespace-pre-wrap">
                  {activeLesson.description}
                </div>
              )}
            </div>

            {/* Sidebar Curriculum */}
            <aside className="player-aside">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold">Lesson List</h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {curriculum.map((sec) => (
                  <div key={sec.id} className="mb-4">
                    {sec.courseTitle && (
                      <span className="text-[10px] font-bold text-[var(--brand)] uppercase tracking-wider block mb-0.5">
                        {sec.courseTitle}
                      </span>
                    )}
                    <p className="mb-2 text-xs font-bold text-[var(--text-3)]">{sec.title}</p>
                    {sec.lessons.map((l) => {
                      const isPlaying = l.id === activeLessonId;
                      const meta = getLessonMeta(l.contentType);
                      return (
                        <button
                          key={l.id}
                          onClick={() => setActiveLessonId(l.id)}
                          className={`player-item w-full text-left transition ${isPlaying ? "active" : "hover:bg-zinc-50"}`}
                        >
                          {l.isCompleted ? (
                            <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--green-bg)] text-[var(--green)]">
                              <LandingIcon name="Check" size={12} />
                            </div>
                          ) : (
                            <div className={`player-radio flex items-center justify-center ${isPlaying ? 'border-[var(--brand)] shadow-[inset_0_0_0_3px_var(--brand)]' : ''}`} />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className={`block truncate text-[13px] font-semibold ${isPlaying ? 'text-[var(--brand)]' : 'text-zinc-900'}`}>{l.title}</span>
                            <span className="text-[10px] text-[var(--text-4)] flex items-center gap-1 mt-0.5">
                              <LandingIcon name={meta.icon} size={11} color="currentColor" />
                              <span>{meta.label}{l.durationMinutes ? ` · ${l.durationMinutes} min` : ""}</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // --- GRID VIEW (Modules List) ---
  const allLessons = curriculum.flatMap((sec) => sec.lessons);
  const totalVideos = allLessons.length;
  const totalLessons = overallProgress?.total ?? allLessons.length;
  const completedLessons = overallProgress?.completed ?? allLessons.filter((l) => l.isCompleted).length;
  const is100Percent = totalLessons > 0 && completedLessons >= totalLessons;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 100% Unlock Banner or Progress Motivation Banner */}
      {is100Percent ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
              <LandingIcon name="Award" size={22} color="currentColor" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-emerald-950">
                🎉 All Course Lessons Completed 100%! Final Exam Unlocked!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Congratulations! You have completed all {totalLessons} course requirements. Head to the <strong>Final Exam</strong> tab to download your question sheet & complete the certification exam.
              </p>
            </div>
          </div>
          <Link
            href={course.id ? `/dashboard/classroom?tab=exam&c=${course.id}` : `/dashboard/classroom?tab=exam&c=all`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition shrink-0"
          >
            <LandingIcon name="Award" size={14} color="#fff" />
            Open Final Exam &rarr;
          </Link>
        </div>
      ) : totalLessons > 0 ? (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[var(--brand)] font-bold">
              <LandingIcon name="Lock" size={14} color="currentColor" />
            </span>
            <span>
              Course Progress: <strong className="text-zinc-900">{completedLessons}/{totalLessons} ({Math.round((completedLessons / totalLessons) * 100)}%)</strong>. Complete 100% of course materials (videos, live zoom, and study resources) to unlock the <strong>Final Exam & Certification</strong> tab.
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full self-start lg:self-auto shrink-0">
            {totalLessons - completedLessons} items left
          </span>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-bold text-zinc-900">
            Modules & Video Lessons
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Study all theory video lessons independently prior to Live Roleplay sessions and Certification Exam.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start lg:self-auto rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs shrink-0">
          <LandingIcon name="PlayCircle" size={14} color="var(--brand)" />
          {totalVideos} Videos Available
        </span>
      </div>

      {curriculum.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-b from-white to-zinc-50/50 p-8 sm:p-14 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[var(--brand)] shadow-xs">
            <LandingIcon name="Video" size={32} color="currentColor" />
          </div>
          <h3 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-bold text-zinc-900 mb-1">
            Lessons in Preparation
          </h3>
          <p className="max-w-md mx-auto text-xs sm:text-sm text-zinc-500 mb-6 leading-relaxed">
            The instructor is preparing curriculum lessons for this course. In the meantime, you can participate in interactive sessions on <strong className="text-zinc-700">Live Zoom</strong> or download reading materials under the <strong className="text-zinc-700">Resources</strong> tab.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={course.id ? `/dashboard/classroom?tab=live&c=${course.id}` : `/dashboard/classroom?tab=live&c=all`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <LandingIcon name="Video" size={14} color="currentColor" /> View Live Zoom Schedule &rarr;
            </Link>
            <Link
              href={course.id ? `/dashboard/classroom?tab=resources&c=${course.id}` : `/dashboard/classroom?tab=resources&c=all`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <LandingIcon name="BookOpen" size={14} color="currentColor" /> View Documents & Resources &rarr;
            </Link>
          </div>
        </div>
      ) : (
        curriculum.map((sec, secIdx) => (
          <div key={sec.id} className="mb-8">
            <div className="mb-4">
              {sec.courseTitle && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[var(--brand)] border border-blue-100 mb-1.5">
                  <LandingIcon name="GraduationCap" size={12} color="currentColor" /> {sec.courseTitle}
                </span>
              )}
              <h2 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-base font-bold text-[var(--brand)]">
                <LandingIcon name="PlayCircle" size={18} color="currentColor" /> {sec.title}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sec.lessons.map((l, lIdx) => {
                const isLocked = false;
                const isDone = l.isCompleted;
                const meta = getLessonMeta(l.contentType);

                return (
                  <button
                    key={l.id}
                    onClick={() => !isLocked && setActiveLessonId(l.id)}
                    className={`group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left transition-all duration-200 ${
                      isLocked ? "cursor-default opacity-70" : "cursor-pointer hover:-translate-y-1 hover:shadow-md hover:border-zinc-300"
                    }`}
                  >
                    <div className="relative aspect-video w-full bg-zinc-900 overflow-hidden">
                      {(l.courseThumbnail || course.thumbnailUrl || course.thumbnail_url) && !isLocked && (
                        <Image
                          src={l.courseThumbnail || course.thumbnailUrl || course.thumbnail_url!}
                          alt={l.title}
                          fill
                          unoptimized
                          priority={secIdx === 0 && lIdx === 0}
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      
                      {isLocked ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <LandingIcon name="Lock" size={24} color="rgba(255,255,255,0.6)" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors group-hover:bg-black/35">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition-transform duration-200 group-hover:scale-110 ${meta.btnBg}`}>
                            <LandingIcon name={meta.icon} size={meta.icon === "Play" ? 16 : 18} color="#fff" />
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[9px] font-bold text-white bg-black/75 flex items-center gap-1">
                        <LandingIcon name={meta.icon} size={10} color="#fff" />
                        <span>{meta.label}</span>
                        {l.durationMinutes ? <span>· {l.durationMinutes}m</span> : null}
                      </div>
                      
                      {isDone && (
                        <div className="absolute left-2 top-2">
                           <span className="flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700">
                             <LandingIcon name="Check" size={10} color="currentColor" /> Done
                           </span>
                        </div>
                      )}
                      {l.isFreePreview && (
                        <div className="absolute right-2 top-2">
                           <span className="rounded-full border border-amber-200 bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                             Free
                           </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-1 flex-col p-3">
                      <div className="mb-1 flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand)]">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[9px] font-bold ${meta.badgeClass}`}>
                          <LandingIcon name={meta.icon} size={10} color="currentColor" />
                          {meta.label}
                        </span>
                        {l.courseTitle && (
                          <span className="truncate max-w-[130px] text-zinc-400 font-medium normal-case">
                            {l.courseTitle}
                          </span>
                        )}
                      </div>
                      <p
                        className={`font-[family-name:var(--font-heading)] text-sm font-semibold leading-tight ${
                          isLocked ? "text-zinc-500" : "text-zinc-900 group-hover:text-[var(--brand)]"
                        } transition-colors line-clamp-2`}
                      >
                        {l.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
