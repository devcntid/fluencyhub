"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { PlayerSection, PlayerLesson } from "@/lib/db/lessons.queries";

export function CourseVideoPlayer({
  course,
  curriculum,
}: {
  course: { id: number; title: string; thumbnail_url?: string | null; thumbnailUrl?: string | null };
  curriculum: PlayerSection[];
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
      alert("Terjadi kesalahan. Silakan coba lagi.");
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
    setNoteStatus("Menyimpan...");
    try {
      const res = await fetch("/api/dashboard/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lessonId: activeLessonId,
          content: noteContent,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setNoteStatus("Tersimpan!");
      setTimeout(() => setNoteStatus(""), 3000);
    } catch (err) {
      console.error(err);
      setNoteStatus("Gagal menyimpan");
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
    a.download = `Catatan - ${activeLesson.title}.txt`;
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
          <LandingIcon name="ArrowLeft" size={14} /> Kembali ke Grid Silabus
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
            {/* Main Video Area */}
            <div className="player-main">
              <p className="mb-3 font-[family-name:var(--font-heading)] text-lg font-extrabold">{activeLesson.title}</p>
              
              {activeLesson.youtubeVideoId ? (
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
                    <p className="text-xs text-white/40 mt-1">Video tidak tersedia</p>
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
                  {activeLesson.isCompleted ? "Batal Tandai Selesai" : "Tandai Selesai"}
                </button>
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold shadow-sm transition ${
                    showNotes
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <LandingIcon name="StickyNote" size={14} /> Catatan
                </button>
              </div>

              {showNotes && (
                <div className="mt-5 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                      <LandingIcon name="Pencil" size={14} /> Catatan Pribadi
                    </h4>
                    <span className="text-xs font-semibold text-green-600">{noteStatus}</span>
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Ketik catatan Anda di sini..."
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
                      {isSavingNote ? "Menyimpan..." : "Simpan"}
                    </button>
                  </div>
                </div>
              )}
              
              {activeLesson.description && (
                <div className="mt-6 text-sm text-[var(--text-2)] whitespace-pre-wrap">
                  {activeLesson.description}
                </div>
              )}
            </div>

            {/* Sidebar Curriculum */}
            <aside className="player-aside">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold">Daftar Materi</h3>
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
                            <span className="text-[10px] text-[var(--text-4)]">
                              Video {l.durationMinutes ? ` · ${l.durationMinutes} min` : ""}
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
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  const is100Percent = totalLessons > 0 && completedLessons >= totalLessons;
  const totalVideos = totalLessons;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 100% Unlock Banner or Progress Motivation Banner */}
      {is100Percent ? (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-xs">
              <LandingIcon name="Award" size={22} color="currentColor" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-emerald-950">
                🎉 Semua Materi Selesai 100%! Fitur Ujian Akhir Terbuka!
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                Selamat! Anda telah menyelesaikan seluruh {totalLessons} materi. Akses tab <strong>Ujian Akhir</strong> untuk mengunduh lembar soal & mengerjakan ujian sertifikasi.
              </p>
            </div>
          </div>
          <Link
            href={course.id ? `/dashboard/classroom?tab=exam&c=${course.id}` : `/dashboard/classroom?tab=exam&c=all`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition shrink-0"
          >
            <LandingIcon name="Award" size={14} color="#fff" />
            Buka Ujian Akhir &rarr;
          </Link>
        </div>
      ) : totalLessons > 0 ? (
        <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-600">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-[var(--brand)] font-bold">
              <LandingIcon name="Lock" size={14} color="currentColor" />
            </span>
            <span>
              Progres Materi: <strong className="text-zinc-900">{completedLessons}/{totalLessons} ({Math.round((completedLessons / totalLessons) * 100)}%)</strong>. Selesaikan 100% materi untuk membuka tab <strong>Ujian Akhir & Sertifikasi</strong>.
            </span>
          </div>
          <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
            {totalLessons - completedLessons} materi lagi
          </span>
        </div>
      ) : null}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-4">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-bold text-zinc-900">
            Daftar Modul & Video Pembelajaran
          </h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            Pelajari seluruh video teori secara mandiri sebelum sesi Live Roleplay dan Ujian Sertifikasi.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 shadow-xs">
          <LandingIcon name="PlayCircle" size={14} color="var(--brand)" />
          {totalVideos} Video Tersedia
        </span>
      </div>

      {curriculum.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-gradient-to-b from-white to-zinc-50/50 p-8 sm:p-14 text-center shadow-xs">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[var(--brand)] shadow-xs">
            <LandingIcon name="Video" size={32} color="currentColor" />
          </div>
          <h3 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-bold text-zinc-900 mb-1">
            Materi Video Sedang Dipersiapkan
          </h3>
          <p className="max-w-md mx-auto text-xs sm:text-sm text-zinc-500 mb-6 leading-relaxed">
            Instruktur sedang menyusun video pembelajaran untuk kursus ini. Sembari menunggu, Anda dapat mengikuti sesi interaktif di <strong className="text-zinc-700">Live Zoom</strong> atau mengunduh bahan bacaan di tab <strong className="text-zinc-700">Resources</strong>.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href={course.id ? `/dashboard/classroom?tab=live&c=${course.id}` : `/dashboard/classroom?tab=live&c=all`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <LandingIcon name="Video" size={14} color="currentColor" /> Buka Jadwal Live Zoom &rarr;
            </Link>
            <Link
              href={course.id ? `/dashboard/classroom?tab=resources&c=${course.id}` : `/dashboard/classroom?tab=resources&c=all`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50 shadow-xs transition"
            >
              <LandingIcon name="BookOpen" size={14} color="currentColor" /> Buka Dokumen & Resources &rarr;
            </Link>
          </div>
        </div>
      ) : (
        curriculum.map((sec) => (
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {sec.lessons.map((l) => {
                const isLocked = false;
                const isDone = l.isCompleted;

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
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      
                      {isLocked ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <LandingIcon name="Lock" size={24} color="rgba(255,255,255,0.6)" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/30">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand)] shadow-[0_4px_14px_rgba(26,86,219,0.5)] transition-transform duration-200 group-hover:scale-110">
                            <LandingIcon name="Play" size={16} color="#fff" />
                          </div>
                        </div>
                      )}

                      <div className="absolute bottom-2 right-2 rounded px-1.5 py-0.5 text-[9px] font-bold text-white bg-black/75">
                        {l.durationMinutes} min
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
                        <span>Lesson {l.id}</span>
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
