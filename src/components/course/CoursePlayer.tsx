"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon as Icon } from "@/components/landing/LandingIcon";
import type { PlayerLesson, PlayerSection } from "@/lib/db/lessons.queries";

function typeLabel(type: string) {
  if (type === "live_class") return "Live";
  if (type === "document") return "Dokumen";
  if (type === "text") return "Teks";
  return "Video";
}

export function CoursePlayer({
  courseId,
  courseTitle,
  current,
  sections,
  prevId,
  nextId,
  preview,
  liveJoinUrl,
  backHref,
}: {
  courseId: number;
  courseTitle: string;
  current: PlayerLesson;
  sections: PlayerSection[];
  prevId: number | null;
  nextId: number | null;
  preview: boolean;
  liveJoinUrl: string | null;
  backHref: string;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNotesAlert, setShowNotesAlert] = useState(false);

  const total = sections.reduce((n, s) => n + s.lessons.length, 0);
  const completedCount = sections.reduce(
    (n, s) => n + s.lessons.filter((l) => l.isCompleted).length,
    0
  );
  const index = sections.flatMap((s) => s.lessons).findIndex((l) => l.id === current.id);
  const pct = total ? Math.round(((index + 1) / total) * 100) : 0;
  const progressPct = total ? Math.round((completedCount / total) * 100) : 0;

  async function handleToggleComplete() {
    if (preview || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId: current.id,
          isCompleted: !current.isCompleted,
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

  return (
    <div className="player-shell">
      <div className="player-top">
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-heading)] text-sm font-extrabold">{courseTitle}</p>
          {preview ? <span className="badge badge-inst">Preview mode</span> : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[var(--text-3)]" title="Progress Belajar">
            Progress: {progressPct}%
          </span>
          <Link href={backHref} className="btn btn-ghost btn-sm" aria-label="Close">
            ✕
          </Link>
        </div>
      </div>
      <div className="player-grid">
        <div className="player-main">
          <p className="mb-3 font-[family-name:var(--font-heading)] text-lg font-extrabold">{current.title}</p>
          
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="badge badge-primary">Lesson {index + 1}</span>
            {current.durationMinutes ? (
              <span className="badge badge-default">{current.durationMinutes} min</span>
            ) : null}
            {current.isFreePreview ? <span className="badge badge-warning">Free Preview</span> : null}
          </div>

          {current.contentType === "youtube_video" && current.youtubeVideoId ? (
            <iframe
              className="aspect-video w-full rounded-[var(--r-lg)] bg-black"
              src={`https://www.youtube-nocookie.com/embed/${current.youtubeVideoId}`}
              title={current.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}
          {current.contentType === "youtube_video" && !current.youtubeVideoId ? (
            <div className="flex aspect-video items-center justify-center rounded-[var(--r-lg)] bg-[#09090b] text-sm text-zinc-400">
              No YouTube URL on this lesson yet.
            </div>
          ) : null}
          {current.contentType === "live_class" ? (
            <div className="card">
              {liveJoinUrl ? (
                <a href={liveJoinUrl} className="btn btn-primary btn-default" target="_blank" rel="noreferrer">
                  Join live class
                </a>
              ) : (
                <p className="text-sm text-[var(--text-3)]">Join link unlocks 30 minutes before class start.</p>
              )}
            </div>
          ) : null}
          {current.contentType === "document" && current.documentUrl ? (
            <div className="card bg-[var(--brand-50)] border border-[var(--brand-200)] p-6 text-center">
              <Icon name="FileText" size={48} className="mx-auto text-[var(--brand)] mb-3" />
              <h4 className="font-semibold text-lg text-[var(--brand)] mb-1">Dokumen PDF</h4>
              <p className="text-sm text-[var(--text-3)] mb-4">Instruktur telah menyediakan materi dalam bentuk dokumen untuk diunduh.</p>
              <div className="flex justify-center gap-3">
                <a href={current.documentUrl} className="btn btn-primary btn-default" target="_blank" rel="noreferrer">
                  <Icon name="ExternalLink" size={16} /> Buka Dokumen
                </a>
                <a href={current.documentUrl} download className="btn btn-secondary btn-default" target="_blank" rel="noreferrer">
                  <Icon name="Download" size={16} /> Unduh File
                </a>
              </div>
            </div>
          ) : null}
          {current.contentType === "text" && current.textContent ? (
            <div className="card whitespace-pre-wrap text-sm">{current.textContent}</div>
          ) : null}
          {current.description ? <p className="mt-4 text-sm text-[var(--text-2)]">{current.description}</p> : null}
          
          <div className="mt-6 flex flex-wrap gap-2">
            {!preview && (
              <button
                disabled={isSubmitting}
                onClick={handleToggleComplete}
                className={`btn ${current.isCompleted ? "btn-secondary" : "btn-success"} btn-default`}
              >
                {current.isCompleted ? (
                  "Batal Tandai Selesai"
                ) : (
                  <>
                    <Icon name="CheckCircle" size={16} /> Tandai Selesai
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => setShowNotesAlert(true)}
              className="btn btn-secondary btn-default"
            >
              <Icon name="StickyNote" size={16} /> Catatan
            </button>
          </div>
          
          {showNotesAlert && (
            <div className="mt-2 text-sm text-[var(--yellow)]">
              ⚠️ Fitur catatan akan segera hadir di pembaruan selanjutnya!
            </div>
          )}

          <div className="player-nav mt-8">
            {prevId ? (
              <Link href={`/dashboard/courses/${courseId}/${prevId}`} className="btn btn-secondary btn-default">
                ← Pelajaran sebelumnya
              </Link>
            ) : (
              <span />
            )}
            {nextId ? (
              <Link href={`/dashboard/courses/${courseId}/${nextId}`} className="btn btn-primary btn-default">
                Pelajaran selanjutnya →
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>
        <aside className="player-aside">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-sm font-bold">Daftar Materi</h3>
          </div>
          {sections.map((sec) => (
            <div key={sec.id} className="mb-4">
              <p className="mb-2 text-xs font-bold text-[var(--text-3)]">{sec.title}</p>
              {sec.lessons.map((l) => (
                <Link
                  key={l.id}
                  href={`/dashboard/courses/${courseId}/${l.id}`}
                  className={`player-item${l.id === current.id ? " active" : ""}`}
                >
                  {l.isCompleted ? (
                    <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--green-bg)] text-[var(--green)]">
                      <Icon name="Check" size={12} />
                    </div>
                  ) : (
                    <span className="player-radio" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">{l.title}</span>
                    <span className="text-[10px] text-[var(--text-4)]">
                      {typeLabel(l.contentType)}
                      {l.durationMinutes ? ` · ${l.durationMinutes} min` : ""}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
