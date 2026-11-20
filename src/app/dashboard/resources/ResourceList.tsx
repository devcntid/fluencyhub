"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";

export type ResourceItem = {
  id: number;
  title: string;
  description: string | null;
  courseTitle: string;
  courseId: number;
  documentUrl: string | null;
  textContent: string | null;
  isCompleted: boolean;
};

function getResourceMeta(url: string | null, hasText: boolean) {
  const lower = url?.toLowerCase() || "";
  if (lower.endsWith(".pdf")) {
    return {
      label: "PDF",
      icon: "FileText",
      bg: "bg-rose-50 border-rose-200/80",
      color: "#DC2626",
    };
  }
  if (lower.match(/\.(doc|docx)$/)) {
    return {
      label: "DOC",
      icon: "FileCheck",
      bg: "bg-blue-50 border-blue-200/80",
      color: "#0062D1",
    };
  }
  if (lower.match(/\.(xls|xlsx|csv)$/)) {
    return {
      label: "Sheet",
      icon: "Layers",
      bg: "bg-emerald-50 border-emerald-200/80",
      color: "#059669",
    };
  }
  if (!url && hasText) {
    return {
      label: "Bacaan",
      icon: "BookOpen",
      bg: "bg-[#FFF4EC] border-[#F26A12]/25",
      color: "#C2530A",
    };
  }
  return {
    label: "Materi",
    icon: "Layers",
    bg: "bg-[#FBF6F1] border-[#E6DED4]",
    color: "#0B2559",
  };
}

export function ResourceList({ resources }: { resources: ResourceItem[] }) {
  const router = useRouter();
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  async function handleToggleComplete(courseId: number, lessonId: number, currentStatus: boolean) {
    if (submittingId !== null) return;
    setSubmittingId(lessonId);
    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId,
          isCompleted: !currentStatus,
        }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui progres. Silakan coba lagi.");
    } finally {
      setSubmittingId(null);
    }
  }

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl sm:rounded-3xl border border-dashed border-[#DFD5C8] bg-white py-12 sm:py-16 px-6 text-center space-y-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-[#0B2559]">
          <LandingIcon name="BookOpen" size={26} color="currentColor" />
        </div>
        <h3 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-extrabold text-[#0B2559]">
          Belum Ada Dokumen Materi
        </h3>
        <p className="max-w-sm text-xs sm:text-sm text-zinc-500 leading-relaxed">
          Dokumen PDF, lembar kerja, dan ringkasan materi untuk kelas ini akan muncul di sini.
        </p>
      </div>
    );
  }

  const completedCount = resources.filter((r) => r.isCompleted).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-zinc-500">
          Menampilkan <strong className="text-[#0B2559]">{resources.length}</strong> dokumen belajar
        </p>
        <span className="rounded-full bg-white border border-[#E6DED4] px-3 py-1 text-[11px] font-bold text-[#0B2559]">
          {completedCount}/{resources.length} selesai dibaca
        </span>
      </div>

      {/* 1 col mobile, 2 cols iPad, 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {resources.map((res) => {
          const meta = getResourceMeta(res.documentUrl, Boolean(res.textContent));
          return (
            <article
              key={res.id}
              className={`group flex flex-col rounded-2xl border bg-white p-4 sm:p-5 shadow-xs transition-all hover:shadow-md ${
                res.isCompleted
                  ? "border-emerald-200 hover:border-emerald-300"
                  : "border-[#E6DED4] hover:border-[#0073F5]/40"
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-3 mb-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${meta.bg}`}
                >
                  <LandingIcon name={meta.icon} size={20} color={meta.color} />
                </div>

                <div className="flex flex-col items-end gap-1 min-w-0">
                  <span className="inline-flex rounded-full bg-[#FBF6F1] px-2.5 py-0.5 text-[10px] font-bold text-[#0B2559] border border-[#E6DED4] max-w-full truncate">
                    {res.courseTitle}
                  </span>
                  {res.isCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      <LandingIcon name="Check" size={10} color="currentColor" />
                      <span>Selesai</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Desc */}
              <h3 className="font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559] leading-snug mb-1.5 line-clamp-2">
                {res.title}
              </h3>
              <p className="mb-4 flex-1 text-xs text-zinc-500 leading-relaxed line-clamp-3">
                {res.description || `Materi pendukung (${meta.label}) untuk kelas ${res.courseTitle}.`}
              </p>

              {/* Action Buttons */}
              <div className="mt-auto space-y-2 pt-3 border-t border-[#F3ECE4]">
                {res.documentUrl ? (
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={res.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-extrabold text-[#0062D1] hover:bg-blue-100/80 transition"
                    >
                      <LandingIcon name="Eye" size={14} color="currentColor" />
                      <span>Lihat</span>
                    </a>
                    <a
                      href={res.documentUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] py-2.5 text-xs font-extrabold text-[#0B2559] hover:bg-[#F3ECE4] transition"
                    >
                      <LandingIcon name="Download" size={14} color="currentColor" />
                      <span>Unduh</span>
                    </a>
                  </div>
                ) : res.textContent ? (
                  <Link
                    href={`/dashboard/resources/${res.id}`}
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-extrabold text-[#0062D1] hover:bg-blue-100/80 transition"
                  >
                    <LandingIcon name="BookOpen" size={14} color="currentColor" />
                    <span>Baca Materi</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center justify-center rounded-xl border border-[#E6DED4] bg-zinc-50 py-2.5 text-xs font-bold text-zinc-400"
                  >
                    Dokumen Belum Tersedia
                  </button>
                )}

                <button
                  type="button"
                  disabled={submittingId === res.id}
                  onClick={() => handleToggleComplete(res.courseId, res.id, res.isCompleted)}
                  className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold transition cursor-pointer disabled:opacity-50 ${
                    res.isCompleted
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/80"
                      : "bg-[#0B2559] text-white hover:bg-[#133882] shadow-2xs"
                  }`}
                >
                  <LandingIcon
                    name={res.isCompleted ? "CheckCircle" : "Check"}
                    size={13}
                    color="currentColor"
                  />
                  <span>
                    {submittingId === res.id
                      ? "Menyimpan..."
                      : res.isCompleted
                      ? "Sudah Dipelajari ✓"
                      : "Tandai Selesai"}
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
