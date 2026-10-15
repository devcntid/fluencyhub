"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

interface CoursePublishEligibility {
  eligible: boolean;
  hasSection: boolean;
  hasVideo: boolean;
  hasDocument: boolean;
  moduleWithBoth: boolean;
  message: string;
}

export function InstructorCoursePublishButton({
  courseId,
  courseTitle,
  status,
  compact = false,
}: {
  courseId: number;
  courseTitle: string;
  status: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [eligibility, setEligibility] = useState<CoursePublishEligibility | null>(null);

  const isPublished = status === "published";

  async function handlePublish() {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErrorMessage(data.error || "Cannot publish course yet.");
        if (data.eligibility) {
          setEligibility(data.eligibility);
        } else {
          // Fallback eligibility info
          setEligibility({
            eligible: false,
            hasSection: false,
            hasVideo: false,
            hasDocument: false,
            moduleWithBoth: false,
            message: data.error || "Course does not meet the minimum requirements.",
          });
        }
        setShowErrorDialog(true);
        return;
      }

      toast.success(`Kursus "${courseTitle}" berhasil dipublikasikan!`);
      router.refresh();
    } catch {
      setErrorMessage("Network error while trying to publish course.");
      setShowErrorDialog(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleUnpublish() {
    const ok = await confirm({
      title: "Tarik Kursus (Unpublish)?",
      message: `Kursus "${courseTitle}" akan diubah statusnya menjadi Draft dan disembunyikan dari katalog publik. Siswa baru tidak akan dapat mendaftar.`,
      confirmText: "Unpublish ke Draft",
      cancelText: "Batal",
      variant: "warning",
    });

    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "draft" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Gagal menarik kursus ke Draft.");
        return;
      }

      toast.success(`Kursus "${courseTitle}" berhasil ditarik ke Draft.`);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan saat unpublish.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {isPublished ? (
        <button
          type="button"
          disabled={loading}
          onClick={handleUnpublish}
          title="Course is currently LIVE. Click to unpublish and revert to Draft."
          className={`btn btn-sm flex items-center justify-center gap-1.5 font-bold transition text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 disabled:opacity-50 ${
            compact ? "px-2.5 py-1 text-xs" : "flex-1 lg:flex-none"
          }`}
        >
          <LandingIcon name="Lock" size={13} color="currentColor" />
          <span>{loading ? "Updating..." : "Unpublish"}</span>
        </button>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={handlePublish}
          title="Click to publish course to the public catalog."
          className={`btn btn-sm flex items-center justify-center gap-1.5 font-bold transition text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs border-none disabled:opacity-50 ${
            compact ? "px-2.5 py-1 text-xs" : "flex-1 lg:flex-none"
          }`}
        >
          <LandingIcon name="CheckCircle" size={14} color="#ffffff" />
          <span>{loading ? "Checking..." : "Publish"}</span>
        </button>
      )}

      {/* Minimum Requirements Modal */}
      <AdminFormDialog
        title="Publish Course Requirement"
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
      >
        <div className="space-y-4 text-left">
          <div className="flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 p-4">
            <div className="text-amber-600 shrink-0 mt-0.5">
              <LandingIcon name="AlertCircle" size={20} color="currentColor" />
            </div>
            <div className="text-xs text-amber-800 space-y-1">
              <p className="font-bold text-sm text-amber-900">Course Not Ready to Publish</p>
              <p>{errorMessage}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 p-4 space-y-3">
            <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
              Minimum Publishing Checklist:
            </p>

            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    eligibility?.hasSection
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {eligibility?.hasSection ? "✓" : "✕"}
                </span>
                <span className={eligibility?.hasSection ? "text-zinc-800 font-semibold" : "text-zinc-500"}>
                  At least 1 module (section) created
                </span>
              </li>

              <li className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    eligibility?.hasVideo
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {eligibility?.hasVideo ? "✓" : "✕"}
                </span>
                <span className={eligibility?.hasVideo ? "text-zinc-800 font-semibold" : "text-zinc-500"}>
                  At least 1 video lesson
                </span>
              </li>

              <li className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    eligibility?.hasDocument
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {eligibility?.hasDocument ? "✓" : "✕"}
                </span>
                <span className={eligibility?.hasDocument ? "text-zinc-800 font-semibold" : "text-zinc-500"}>
                  At least 1 document or reading material
                </span>
              </li>

              <li className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    eligibility?.moduleWithBoth
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {eligibility?.moduleWithBoth ? "✓" : "!"}
                </span>
                <span className={eligibility?.moduleWithBoth ? "text-zinc-800 font-semibold" : "text-zinc-600 font-medium"}>
                  Both video and document materials in at least 1 module
                </span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200">
            <button
              type="button"
              className="btn btn-secondary btn-sm text-xs"
              onClick={() => setShowErrorDialog(false)}
            >
              Close
            </button>
            <Link
              href={`/instructor/curriculum?courseId=${courseId}`}
              className="btn btn-primary btn-sm text-xs font-bold"
              onClick={() => setShowErrorDialog(false)}
            >
              Go to Curriculum & Add Materials
            </Link>
          </div>
        </div>
      </AdminFormDialog>
    </>
  );
}
