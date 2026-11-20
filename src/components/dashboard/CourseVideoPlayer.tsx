"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ProtectedVideoPlayer } from "@/components/video/ProtectedVideoPlayer";
import type { PlayerSection, PlayerLesson } from "@/lib/db/lessons.queries";

function getLessonMeta(contentType: string) {
  if (contentType === "live_class") {
    return {
      label: "Live Zoom",
      shortLabel: "Live",
      icon: "Video",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      btnBg: "bg-rose-600",
    };
  }
  if (contentType === "document") {
    return {
      label: "Dokumen PDF",
      shortLabel: "PDF",
      icon: "FileText",
      badgeClass: "bg-blue-50 text-[#0062D1] border-blue-200",
      btnBg: "bg-[#0B2559]",
    };
  }
  if (contentType === "text") {
    return {
      label: "Materi Bacaan",
      shortLabel: "Bacaan",
      icon: "BookOpen",
      badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
      btnBg: "bg-[#C2530A]",
    };
  }
  return {
    label: "Video Materi",
    shortLabel: "Video",
    icon: "Play",
    badgeClass: "bg-[#FBF6F1] text-[#0B2559] border-[#E6DED4]",
    btnBg: "bg-[#0073F5]",
  };
}

export function CourseVideoPlayer({
  course,
  curriculum,
  overallProgress,
  initialLessonId,
}: {
  course: { id: number; title: string; thumbnail_url?: string | null; thumbnailUrl?: string | null };
  curriculum: PlayerSection[];
  overallProgress?: { total: number; completed: number };
  initialLessonId?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlLesson = searchParams.get("lesson");
  const parsedUrlLesson = urlLesson ? Number(urlLesson) : null;

  const [localLessonId, setLocalLessonId] = useState<number | null>(
    parsedUrlLesson && !Number.isNaN(parsedUrlLesson)
      ? parsedUrlLesson
      : initialLessonId || null
  );

  // URL param takes precedence when present
  const activeLessonId =
    parsedUrlLesson && !Number.isNaN(parsedUrlLesson) ? parsedUrlLesson : localLessonId;

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grid search, status filter & collapsed sections
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "todo" | "done">("all");
  const [collapsedSections, setCollapsedSections] = useState<Record<number, boolean>>({});

  // Notes state
  const [showNotes, setShowNotes] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [noteStatus, setNoteStatus] = useState("");

  function handleSelectLesson(lessonId: number) {
    setLocalLessonId(lessonId);
    setNoteContent("");
    setNoteStatus("");
    const params = new URLSearchParams(searchParams.toString());
    params.set("lesson", String(lessonId));
    router.replace(`?${params.toString()}`, { scroll: false });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleClosePlayer() {
    setLocalLessonId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("lesson");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  function toggleSection(sectionId: number) {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }

  // Find active lesson
  const activeLesson: PlayerLesson | null = useMemo(() => {
    if (!activeLessonId) return null;
    for (const sec of curriculum) {
      const found = sec.lessons.find((l) => l.id === activeLessonId);
      if (found) return found;
    }
    return null;
  }, [curriculum, activeLessonId]);

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
      alert("Gagal memperbarui progres. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Load note content for active lesson
  useEffect(() => {
    if (!activeLessonId) return;
    let isMounted = true;

    fetch(`/api/dashboard/notes?lessonId=${activeLessonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setNoteContent(data?.note?.content || "");
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
      if (!res.ok) throw new Error("Failed to save");
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

  const allFlatLessons = useMemo(() => curriculum.flatMap((s) => s.lessons), [curriculum]);

  // Filtered curriculum for Grid View
  const filteredCurriculum = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return curriculum
      .map((sec) => {
        const secMatches =
          !q ||
          sec.title.toLowerCase().includes(q) ||
          (sec.courseTitle?.toLowerCase().includes(q) ?? false);

        const lessons = sec.lessons.filter((l) => {
          if (statusFilter === "done" && !l.isCompleted) return false;
          if (statusFilter === "todo" && l.isCompleted) return false;
          if (!q) return true;
          return (
            secMatches ||
            l.title.toLowerCase().includes(q) ||
            (l.courseTitle?.toLowerCase().includes(q) ?? false)
          );
        });

        return { ...sec, lessons };
      })
      .filter((sec) => sec.lessons.length > 0);
  }, [curriculum, searchQuery, statusFilter]);

  // ==================== PLAYER VIEW ====================
  if (activeLesson) {
    const total = allFlatLessons.length;
    const index = allFlatLessons.findIndex((l) => l.id === activeLessonId);
    const pct = total ? Math.round(((index + 1) / total) * 100) : 0;
    const prevLesson = index > 0 ? allFlatLessons[index - 1] : null;
    const nextLesson = index >= 0 && index < allFlatLessons.length - 1 ? allFlatLessons[index + 1] : null;
    const activeMeta = getLessonMeta(activeLesson.contentType);
    const completedInPlaylist = allFlatLessons.filter((l) => l.isCompleted).length;

    return (
      <div className="space-y-4">
        {/* Back Strip */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleClosePlayer}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0B2559] hover:bg-[#FBF6F1] transition shadow-2xs cursor-pointer"
          >
            <LandingIcon name="ArrowLeft" size={14} color="currentColor" />
            <span>Kembali ke Daftar Materi</span>
          </button>

          <span className="text-xs font-bold text-zinc-500">
            Materi {index + 1} dari {total}
          </span>
        </div>

        {/* Main Player Card */}
        <div
          className="player-shell rounded-2xl sm:rounded-3xl border border-[#E6DED4] overflow-hidden shadow-sm bg-white"
          style={{ minHeight: "auto" }}
        >
          {/* Navy Player Topbar */}
          <div className="bg-[#0B2559] text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-2.5">
              <span className="hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                <LandingIcon name={activeMeta.icon} size={14} color="#fff" />
              </span>
              <p className="truncate font-[family-name:var(--font-heading)] text-xs sm:text-sm font-extrabold">
                {activeLesson.courseTitle || course.title}
              </p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold text-blue-100">
                {index + 1}/{total} · {pct}%
              </span>
              <button
                type="button"
                onClick={handleClosePlayer}
                aria-label="Tutup pemutar"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="player-grid">
            {/* Main Content */}
            <div className="player-main p-4 sm:p-5 lg:p-6">
              <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-[family-name:var(--font-heading)] text-base sm:text-lg lg:text-xl font-extrabold text-[#0B2559] leading-snug">
                  {activeLesson.title}
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${activeMeta.badgeClass}`}
                >
                  <LandingIcon name={activeMeta.icon} size={12} color="currentColor" />
                  {activeMeta.label}
                </span>
              </div>

              {/* Media / Content Switch */}
              {activeLesson.contentType === "document" ||
              (activeLesson.documentUrl && !activeLesson.youtubeVideoId) ? (
                <div className="rounded-2xl border border-[#E6DED4] bg-[#FBF6F1]/50 p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6DED4]">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0062D1] border border-blue-200/70">
                        <LandingIcon name="FileText" size={22} color="currentColor" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-[#0062D1] uppercase tracking-wider">
                          Dokumen Materi
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-[#0B2559] leading-snug">
                          {activeLesson.title}
                        </h4>
                      </div>
                    </div>
                    {activeLesson.documentUrl && (
                      <a
                        href={activeLesson.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] text-white text-xs font-bold shadow-xs transition shrink-0"
                      >
                        <LandingIcon name="ExternalLink" size={13} color="#fff" />
                        <span>Buka / Unduh PDF</span>
                      </a>
                    )}
                  </div>
                  {activeLesson.description && (
                    <div className="text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-line">
                      {activeLesson.description}
                    </div>
                  )}
                  {activeLesson.documentUrl?.match(/\.(pdf)($|\?)/i) && (
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#E6DED4] bg-white">
                      <iframe
                        src={activeLesson.documentUrl}
                        className="h-full w-full"
                        title={activeLesson.title}
                      />
                    </div>
                  )}
                </div>
              ) : activeLesson.contentType === "text" ||
                (activeLesson.textContent && !activeLesson.youtubeVideoId) ? (
                <div className="rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-6 space-y-4">
                  <div className="flex items-start sm:items-center gap-3 pb-4 border-b border-[#F0EAE2]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#C2530A] border border-[#F26A12]/25">
                      <LandingIcon name="BookOpen" size={22} color="currentColor" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold text-[#C2530A] uppercase tracking-wider">
                        Materi Bacaan
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-[#0B2559] leading-snug">
                        {activeLesson.title}
                      </h4>
                    </div>
                  </div>
                  <div className="prose max-w-none text-zinc-700 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                    {activeLesson.textContent || activeLesson.description || "Belum ada isi materi."}
                  </div>
                </div>
              ) : activeLesson.contentType === "live_class" ||
                (activeLesson.liveClassUrl && !activeLesson.youtubeVideoId) ? (
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-white p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2559] text-white">
                        <LandingIcon name="Video" size={22} color="#fff" />
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold text-[#0062D1] uppercase tracking-wider">
                          Sesi Live Zoom Mentoring
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-[#0B2559] leading-snug">
                          {activeLesson.title}
                        </h4>
                      </div>
                    </div>
                    {activeLesson.liveClassUrl ? (
                      <a
                        href={activeLesson.liveClassUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-xs transition shrink-0"
                      >
                        <LandingIcon name="Video" size={14} color="#fff" />
                        <span>Gabung Ruang Zoom</span>
                      </a>
                    ) : (
                      <Link
                        href={
                          course.id
                            ? `/dashboard/classroom?tab=live&c=${course.id}`
                            : `/dashboard/classroom?tab=live&c=all`
                        }
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] text-white text-xs font-extrabold shadow-xs transition shrink-0"
                      >
                        <LandingIcon name="Video" size={13} color="#fff" />
                        <span>Lihat Jadwal Live &rarr;</span>
                      </Link>
                    )}
                  </div>
                  <div className="space-y-2.5">
                    {activeLesson.liveClassDatetime && (
                      <div className="flex items-center gap-2 text-xs font-bold text-[#0B2559]">
                        <LandingIcon name="Clock" size={14} color="#0073F5" />
                        <span>
                          Jadwal:{" "}
                          {new Date(activeLesson.liveClassDatetime).toLocaleString("id-ID", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}{" "}
                          WIB
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      Sesi mentoring interaktif via Zoom. Klik tombol di atas untuk masuk atau cek
                      tab <strong>Live Zoom</strong> untuk detail jadwal lengkap.
                    </p>
                  </div>
                </div>
              ) : (
                <ProtectedVideoPlayer
                  youtubeVideoId={activeLesson.youtubeVideoId}
                  title={activeLesson.title}
                  autoplay={true}
                  onNextLesson={nextLesson ? () => handleSelectLesson(nextLesson.id) : undefined}
                />
              )}

              {/* Responsive Action Controls */}
              <div className="mt-5 pt-4 border-t border-[#F0EAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleToggleComplete}
                    className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs transition cursor-pointer disabled:opacity-50 ${
                      activeLesson.isCompleted
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-[#0B2559] hover:bg-[#133882]"
                    }`}
                  >
                    <LandingIcon
                      name={activeLesson.isCompleted ? "CheckCircle" : "Check"}
                      size={14}
                      color="#fff"
                    />
                    <span>{activeLesson.isCompleted ? "Selesai ✓" : "Tandai Selesai"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowNotes(!showNotes)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition cursor-pointer ${
                      showNotes
                        ? "border-[#0073F5] bg-blue-50 text-[#0062D1]"
                        : "border-[#E6DED4] bg-white text-[#0B2559] hover:bg-[#FBF6F1]"
                    }`}
                  >
                    <LandingIcon name="StickyNote" size={14} color="currentColor" />
                    <span>Catatan</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!prevLesson}
                    onClick={() => prevLesson && handleSelectLesson(prevLesson.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2.5 text-xs font-bold text-[#0B2559] hover:bg-[#FBF6F1] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <LandingIcon name="ChevronLeft" size={14} color="currentColor" />
                    <span>Sebelumnya</span>
                  </button>
                  <button
                    type="button"
                    disabled={!nextLesson}
                    onClick={() => nextLesson && handleSelectLesson(nextLesson.id)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-3.5 py-2.5 text-xs font-extrabold text-white shadow-xs transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Berikutnya</span>
                    <LandingIcon name="ChevronRight" size={14} color="#fff" />
                  </button>
                </div>
              </div>

              {/* Personal Notes Box */}
              {showNotes && (
                <div className="mt-4 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1]/70 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs sm:text-sm font-extrabold text-[#0B2559] flex items-center gap-2">
                      <LandingIcon name="Pencil" size={14} color="currentColor" />
                      <span>Catatan Pribadi</span>
                    </h4>
                    {noteStatus && (
                      <span className="text-xs font-bold text-emerald-700">{noteStatus}</span>
                    )}
                  </div>
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Tulis poin penting, kosakata baru, atau kalimat latihan dari materi ini..."
                    className="w-full min-h-[130px] rounded-xl border border-[#E6DED4] bg-white p-3 text-xs sm:text-sm text-zinc-700 focus:border-[#0073F5] focus:outline-none focus:ring-2 focus:ring-[#0073F5]/15 resize-y"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadNote}
                      disabled={!noteContent.trim()}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer disabled:opacity-45"
                    >
                      <LandingIcon name="Download" size={13} color="currentColor" />
                      <span>Unduh .txt</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      disabled={isSavingNote}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-4 py-2 text-xs font-extrabold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                    >
                      {isSavingNote ? "Menyimpan..." : "Simpan Catatan"}
                    </button>
                  </div>
                </div>
              )}

              {activeLesson.description && activeLesson.contentType !== "document" && (
                <div className="mt-5 rounded-2xl bg-[#FBF6F1]/70 border border-[#EFE7DC] p-4 text-xs sm:text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Ringkasan Materi
                  </p>
                  {activeLesson.description}
                </div>
              )}
            </div>

            {/* Playlist Sidebar / Bottom List */}
            <aside className="player-aside bg-[#FBF6F1]/50">
              <div className="mb-3 pb-3 border-b border-[#E6DED4] flex items-center justify-between gap-2">
                <h3 className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-[#0B2559]">
                  Daftar Materi
                </h3>
                <span className="rounded-full bg-white border border-[#E6DED4] px-2.5 py-0.5 text-[11px] font-bold text-zinc-600">
                  {completedInPlaylist}/{total} selesai
                </span>
              </div>

              <div className="max-h-[420px] xl:max-h-[560px] overflow-y-auto space-y-4 pr-1">
                {curriculum.map((sec) => (
                  <div key={sec.id} className="space-y-1.5">
                    {sec.courseTitle && (
                      <span className="text-[10px] font-extrabold text-[#0062D1] uppercase tracking-wider block">
                        {sec.courseTitle}
                      </span>
                    )}
                    <p className="text-xs font-extrabold text-[#0B2559]">{sec.title}</p>
                    <div className="space-y-1">
                      {sec.lessons.map((l) => {
                        const isPlaying = l.id === activeLessonId;
                        const meta = getLessonMeta(l.contentType);
                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleSelectLesson(l.id)}
                            className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left transition cursor-pointer border ${
                              isPlaying
                                ? "bg-white border-[#0073F5] shadow-2xs ring-1 ring-[#0073F5]/20"
                                : "bg-transparent border-transparent hover:bg-white/80 hover:border-[#E6DED4]"
                            }`}
                          >
                            {l.isCompleted ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                <LandingIcon name="Check" size={11} color="currentColor" />
                              </span>
                            ) : (
                              <span
                                className={`h-5 w-5 shrink-0 rounded-full border-2 flex items-center justify-center ${
                                  isPlaying
                                    ? "border-[#0073F5] bg-[#0073F5]/10"
                                    : "border-[#D5C9B8] bg-white"
                                }`}
                              >
                                {isPlaying && (
                                  <span className="h-2 w-2 rounded-full bg-[#0073F5]" />
                                )}
                              </span>
                            )}
                            <div className="min-w-0 flex-1">
                              <span
                                className={`block truncate text-xs font-bold ${
                                  isPlaying ? "text-[#0062D1]" : "text-[#0B2559]"
                                }`}
                              >
                                {l.title}
                              </span>
                              <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                <LandingIcon name={meta.icon} size={10} color="currentColor" />
                                <span>
                                  {meta.shortLabel}
                                  {l.durationMinutes ? ` · ${l.durationMinutes} mnt` : ""}
                                </span>
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  // ==================== GRID VIEW (MODULES LIST) ====================
  const totalVideos = allFlatLessons.length;
  const completedVideosCount = allFlatLessons.filter((l) => l.isCompleted).length;
  const todoVideosCount = Math.max(0, totalVideos - completedVideosCount);
  const totalLessons = overallProgress?.total ?? totalVideos;
  const completedLessons = overallProgress?.completed ?? completedVideosCount;
  const is100Percent = totalLessons > 0 && completedLessons >= totalLessons;

  return (
    <div className="w-full space-y-5">
      {/* 100% Completion Celebration Banner */}
      {is100Percent && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <LandingIcon name="Award" size={22} color="#fff" />
            </div>
            <div>
              <h3 className="font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-emerald-950">
                Seluruh Materi Selesai 100%!
              </h3>
              <p className="text-xs text-emerald-800/85 mt-0.5 leading-relaxed">
                Keren! Kamu sudah menuntaskan semua {totalLessons} materi. Lanjutkan ke{" "}
                <strong>Final Exam</strong> untuk mendapatkan sertifikatmu.
              </p>
            </div>
          </div>
          <Link
            href={
              course.id
                ? `/dashboard/classroom?tab=exam&c=${course.id}`
                : `/dashboard/classroom?tab=exam&c=all`
            }
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition shrink-0"
          >
            <LandingIcon name="Award" size={14} color="#fff" />
            <span>Buka Final Exam &rarr;</span>
          </Link>
        </div>
      )}

      {/* Search & Status Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-heading)] text-lg sm:text-xl font-extrabold text-[#0B2559] tracking-tight">
            Modul &amp; Video Materi
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Pelajari setiap modul secara bertahap sebelum sesi praktik dan Final Exam.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul materi..."
              className="w-full rounded-xl border border-[#E6DED4] bg-white pl-9 pr-8 py-2 text-xs font-medium text-[#0B2559] placeholder:text-zinc-400 focus:border-[#0073F5] focus:outline-none focus:ring-2 focus:ring-[#0073F5]/15 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filter Pills */}
          <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E6DED4] text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === "all"
                  ? "bg-[#0B2559] text-white shadow-2xs"
                  : "text-zinc-600 hover:text-[#0B2559]"
              }`}
            >
              Semua ({totalVideos})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("todo")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === "todo"
                  ? "bg-[#F26A12] text-white shadow-2xs"
                  : "text-zinc-600 hover:text-[#0B2559]"
              }`}
            >
              Belum ({todoVideosCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("done")}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer whitespace-nowrap ${
                statusFilter === "done"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "text-zinc-600 hover:text-[#0B2559]"
              }`}
            >
              Selesai ({completedVideosCount})
            </button>
          </div>
        </div>
      </div>

      {/* Empty Search Result */}
      {filteredCurriculum.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#DFD5C8] bg-white p-8 sm:p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-zinc-400">
            <LandingIcon name="Video" size={24} color="currentColor" />
          </div>
          <h3 className="font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559]">
            {searchQuery || statusFilter !== "all"
              ? "Materi Tidak Ditemukan"
              : "Materi Sedang Disiapkan"}
          </h3>
          <p className="max-w-md mx-auto text-xs text-zinc-500 leading-relaxed">
            {searchQuery || statusFilter !== "all"
              ? "Coba ubah kata kunci pencarian atau reset filter status untuk melihat semua materi."
              : "Instruktur sedang menyusun materi untuk kelas ini. Sementara itu, cek jadwal Live Zoom atau dokumen belajar."}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredCurriculum.map((sec, secIdx) => {
            const isCollapsed = Boolean(collapsedSections[sec.id]);
            const secDone = sec.lessons.filter((l) => l.isCompleted).length;
            const secTotal = sec.lessons.length;
            const secComplete = secTotal > 0 && secDone === secTotal;

            return (
              <section
                key={sec.id}
                className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white shadow-xs overflow-hidden"
              >
                {/* Module Header */}
                <button
                  type="button"
                  onClick={() => toggleSection(sec.id)}
                  className="w-full px-4 py-4 sm:px-6 sm:py-4.5 flex items-center justify-between gap-3 text-left hover:bg-[#FBF6F1]/50 transition cursor-pointer"
                >
                  <div className="min-w-0 space-y-1">
                    {sec.courseTitle && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#0B2559]/8 text-[#0B2559]">
                        <LandingIcon name="GraduationCap" size={11} color="currentColor" />
                        <span className="truncate max-w-[260px] sm:max-w-md">
                          {sec.courseTitle}
                        </span>
                      </span>
                    )}
                    <h3 className="flex items-center gap-2 font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559] leading-snug">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#0073F5]/10 text-[#0073F5] text-xs font-black">
                        {secIdx + 1}
                      </span>
                      <span className="truncate">{sec.title}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${
                        secComplete
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-[#FBF6F1] text-zinc-600 border-[#E6DED4]"
                      }`}
                    >
                      {secDone}/{secTotal}
                      <span className="hidden sm:inline"> selesai</span>
                    </span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-lg bg-[#FBF6F1] text-[#0B2559] transition-transform duration-200 ${
                        isCollapsed ? "" : "rotate-180"
                      }`}
                    >
                      <LandingIcon name="ChevronDown" size={15} color="currentColor" />
                    </span>
                  </div>
                </button>

                {/* Module Lessons Grid (1 col mobile, 2 cols iPad, 3 cols desktop) */}
                {!isCollapsed && (
                  <div className="px-4 pb-4 pt-1 sm:px-6 sm:pb-6 border-t border-[#F3ECE4]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pt-3">
                      {sec.lessons.map((l, lIdx) => {
                        const isDone = l.isCompleted;
                        const meta = getLessonMeta(l.contentType);
                        const thumbUrl = l.courseThumbnail || course.thumbnailUrl || course.thumbnail_url;

                        return (
                          <button
                            key={l.id}
                            type="button"
                            onClick={() => handleSelectLesson(l.id)}
                            className={`group flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-200 cursor-pointer bg-white hover:-translate-y-0.5 hover:shadow-md hover:shadow-[#0B2559]/6 ${
                              isDone
                                ? "border-emerald-200/90 hover:border-emerald-300"
                                : "border-[#E6DED4] hover:border-[#0073F5]/45"
                            }`}
                          >
                            {/* Thumbnail with object-top so portraits never crop heads */}
                            <div className="relative aspect-video w-full bg-[#0B2559] overflow-hidden">
                              {thumbUrl ? (
                                <Image
                                  src={thumbUrl}
                                  alt={l.title}
                                  fill
                                  unoptimized
                                  priority={secIdx === 0 && lIdx === 0}
                                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-[#0B2559] via-[#12367E] to-[#1A4B9E]" />
                              )}

                              {/* Clean editorial gradient scrim */}
                              <div className="absolute inset-0 bg-gradient-to-t from-[#0B2559]/75 via-[#0B2559]/15 to-transparent transition-opacity group-hover:from-[#0B2559]/85" />

                              {/* Centered Play / Content Button */}
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-[#0B2559] shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:bg-[#F26A12] group-hover:text-white">
                                  <LandingIcon
                                    name={meta.icon}
                                    size={meta.icon === "Play" ? 17 : 18}
                                    color="currentColor"
                                  />
                                </div>
                              </div>

                              {/* Top-left Done Pill */}
                              {isDone && (
                                <div className="absolute left-2.5 top-2.5">
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[10px] font-extrabold text-white shadow-xs backdrop-blur-xs">
                                    <LandingIcon name="Check" size={10} color="#fff" />
                                    <span>Selesai</span>
                                  </span>
                                </div>
                              )}

                              {/* Top-right Free Pill */}
                              {l.isFreePreview && (
                                <div className="absolute right-2.5 top-2.5">
                                  <span className="rounded-full bg-[#F26A12] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-xs">
                                    Gratis
                                  </span>
                                </div>
                              )}

                              {/* Bottom-right Duration Pill */}
                              {l.durationMinutes ? (
                                <div className="absolute bottom-2.5 right-2.5 rounded-lg bg-[#0B2559]/85 backdrop-blur-xs px-2 py-0.5 text-[10px] font-bold text-white border border-white/15">
                                  {l.durationMinutes} mnt
                                </div>
                              ) : null}
                            </div>

                            {/* Card Body */}
                            <div className="flex flex-1 flex-col p-3.5 sm:p-4 gap-2">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${meta.badgeClass}`}
                                >
                                  <LandingIcon name={meta.icon} size={10} color="currentColor" />
                                  <span>{meta.shortLabel}</span>
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400">
                                  Materi {String(lIdx + 1).padStart(2, "0")}
                                </span>
                              </div>

                              <h4 className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-[#0B2559] group-hover:text-[#0062D1] transition-colors leading-snug line-clamp-2 flex-1">
                                {l.title}
                              </h4>

                              <div className="pt-2.5 mt-auto border-t border-[#F3ECE4] flex items-center justify-between text-[11px] font-bold">
                                <span className={isDone ? "text-emerald-700" : "text-[#0062D1]"}>
                                  {isDone ? "Tonton Ulang" : "Mulai Belajar"}
                                </span>
                                <span className="text-zinc-400 group-hover:translate-x-0.5 group-hover:text-[#F26A12] transition-all">
                                  &rarr;
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
