"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { ExamSubmission } from "@/types/db";

export type InstructorSubmissionRow = ExamSubmission & {
  studentName: string;
  studentEmail: string;
  examTitle: string;
};

function getYouTubeId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export function ExamSubmissionsDialog({
  courseTitle,
  submissions,
  initialSubmissionId,
  passingScore = 70,
  triggerLabel = "Review Submissions",
  triggerClassName = "btn btn-secondary btn-sm",
}: {
  courseTitle: string;
  submissions: InstructorSubmissionRow[];
  initialSubmissionId?: number;
  passingScore?: number;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<InstructorSubmissionRow | null>(
    (initialSubmissionId ? submissions.find((s) => s.id === initialSubmissionId) : null) ||
      submissions[0] ||
      null
  );

  const [score, setScore] = useState<number>(85);
  const [feedback, setFeedback] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const pendingCount = submissions.filter((s) => s.status === "pending").length;

  function handleOpen(sub?: InstructorSubmissionRow) {
    const target =
      sub ||
      (initialSubmissionId ? submissions.find((s) => s.id === initialSubmissionId) : null) ||
      submissions[0] ||
      null;
    setSelectedSubmission(target);
    setScore(target?.manualScore ?? 80);
    setFeedback(target?.instructorFeedback ?? "Clear articulation and well-structured presentation throughout the assessment.");
    setError("");
    setSuccessMsg("");
    setOpen(true);
  }

  async function handleGrade() {
    if (!selectedSubmission) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/instructor/exams/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: selectedSubmission.id,
          manualScore: Number(score),
          feedback: feedback.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to save grading evaluation.");
        setSaving(false);
        return;
      }

      setSaving(false);
      setSuccessMsg(json.message || "Grading evaluation saved successfully!");
      router.refresh();
    } catch {
      setSaving(false);
      setError("A network error occurred.");
    }
  }

  const ytId = selectedSubmission ? getYouTubeId(selectedSubmission.youtubeUrl) : null;

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => handleOpen()}
      >
        <LandingIcon name="Award" size={14} color="currentColor" />
        {triggerLabel}
        {pendingCount > 0 && (
          <span className="ml-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-extrabold">
            {pendingCount}
          </span>
        )}
      </button>

      <AdminFormDialog
        title={`Review Exam Submissions — ${courseTitle}`}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="min(1100px, 95vw)"
      >
        <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
          {/* Submissions List Sidebar */}
          <div className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-zinc-200 pb-4 md:pb-0 pr-0 md:pr-4 space-y-2 max-h-[560px] overflow-y-auto">
            <div className="flex items-center justify-between pb-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Enrolled Students ({submissions.length})
              </span>
              {pendingCount > 0 && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  {pendingCount} Pending
                </span>
              )}
            </div>

            {submissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400">
                No students have submitted answers yet.
              </div>
            ) : (
              submissions.map((s) => {
                const isSelected = selectedSubmission?.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubmission(s);
                      setScore(s.manualScore ?? 80);
                      setFeedback(s.instructorFeedback ?? "");
                      setError("");
                      setSuccessMsg("");
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition text-xs ${
                      isSelected
                        ? "border-[var(--brand)] bg-blue-50/70 shadow-xs ring-1 ring-blue-500/30"
                        : "border-zinc-200 bg-white hover:bg-zinc-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-zinc-900 truncate block">{s.studentName}</span>
                      <span
                        className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full shrink-0 ${
                          s.status === "passed"
                            ? "bg-emerald-100 text-emerald-800"
                            : s.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {s.status === "passed" ? "Passed" : s.status === "failed" ? "Failed" : "Pending"}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block truncate mt-0.5">{s.studentEmail}</span>
                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-100 text-[10px]">
                      <span className="text-zinc-500">
                        {new Date(s.submittedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                      </span>
                      <span className="font-bold text-blue-600">
                        {s.finalScore !== null ? `Score: ${s.finalScore}/100` : "Not Graded"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Details & Grading Form */}
          <div className="flex-1 min-w-0 space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {selectedSubmission ? (
              <>
                {/* Header Student Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 pb-3 bg-zinc-50/60 p-3.5 rounded-xl border">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand)] text-white font-extrabold text-sm shadow-xs">
                      {selectedSubmission.studentName[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 truncate">
                        {selectedSubmission.studentName}
                      </h3>
                      <p className="text-xs text-zinc-500 truncate">{selectedSubmission.studentEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <div className="text-right">
                      <span className="text-[10px] text-zinc-400 block uppercase font-semibold">Exam Status</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block ${
                          selectedSubmission.status === "passed"
                            ? "bg-emerald-100 text-emerald-800"
                            : selectedSubmission.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {selectedSubmission.status === "passed"
                          ? `Passed (${selectedSubmission.finalScore}/100)`
                          : selectedSubmission.status === "failed"
                          ? `Failed (${selectedSubmission.finalScore}/100)`
                          : "Pending Review"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Submitted Answer Document */}
                {selectedSubmission.answers?.answerFileUrl ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                        <LandingIcon name="FileText" size={14} color="currentColor" />
                        Student Answer Sheet
                      </span>
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        Ready for Review
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 font-extrabold text-xs border border-red-100">
                          PDF
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                            {selectedSubmission.answers?.answerFileName || "Answer_Sheet.pdf"}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <a
                          href={selectedSubmission.answers.answerFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm flex items-center gap-1.5 text-xs font-bold"
                        >
                          <LandingIcon name="ExternalLink" size={13} color="currentColor" />
                          <span>Open</span>
                        </a>
                        <a
                          href={selectedSubmission.answers.answerFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          download
                          className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          <LandingIcon name="Download" size={13} color="#fff" />
                          <span>Download Answers</span>
                        </a>
                      </div>
                    </div>

                    {selectedSubmission.answers?.studentNotes && (
                      <div className="text-xs bg-white/90 p-3 rounded-xl border border-blue-100 text-zinc-700">
                        <span className="font-bold text-zinc-900 block mb-1">Student Notes:</span>
                        <p className="italic text-zinc-600 leading-relaxed">&ldquo;{selectedSubmission.answers.studentNotes}&rdquo;</p>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* YouTube Video Player (Optional) */}
                {ytId || selectedSubmission.youtubeUrl ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-2">
                    <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                      <LandingIcon name="Video" size={14} color="currentColor" />
                      Student Speaking Assessment Video (Optional)
                    </span>
                    {ytId ? (
                      <div className="relative aspect-video w-full max-h-[260px] rounded-xl overflow-hidden border border-zinc-300 bg-black shadow-xs mx-auto">
                        <iframe
                          src={`https://www.youtube.com/embed/${ytId}`}
                          title="Student Speaking Video"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-zinc-200 p-3 bg-white text-xs">
                        <span className="text-zinc-500 block mb-1">Student YouTube URL:</span>
                        <a
                          href={selectedSubmission.youtubeUrl || undefined}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 font-bold underline break-all"
                        >
                          {selectedSubmission.youtubeUrl} &rarr;
                        </a>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Grading Controls */}
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                      <LandingIcon name="Award" size={14} color="currentColor" />
                      Instructor Grading & Feedback Form
                    </h4>
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        score >= passingScore
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {score >= passingScore ? `✓ LULUS (>= ${passingScore})` : `✕ REMEDIAL (< ${passingScore})`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="block">
                      <span className="label font-bold text-zinc-700">Student Exam Score (0 - 100)</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className="input font-extrabold text-xl text-center h-12 w-full bg-white border-zinc-300 rounded-xl"
                        value={score}
                        onChange={(e) => setScore(Number(e.target.value))}
                      />
                      <span className="text-[11px] text-zinc-500 mt-1 block">
                        {score >= passingScore
                          ? "✓ Passing score achieved. An official certificate will automatically be issued to the student."
                          : "✕ Score below passing threshold. Student requires Remedial and can submit a revised paper."}
                      </span>
                    </label>

                    <label className="block">
                      <span className="label font-bold text-zinc-700">Instructor Feedback & Comments</span>
                      <textarea
                        rows={3}
                        className="input text-xs w-full bg-white border-zinc-300 rounded-xl leading-relaxed"
                        placeholder="Provide feedback on articulation, grammar, vocabulary, or pronunciation..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                    </label>
                  </div>
                </div>

                {error && <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200">{error}</p>}
                {successMsg && (
                  <p className="text-xs text-emerald-700 font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <LandingIcon name="CheckCircle" size={15} color="currentColor" />
                    {successMsg}
                  </p>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    className="btn btn-secondary btn-default font-semibold"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleGrade}
                    className={`btn btn-default text-white font-extrabold shadow-sm flex items-center gap-2 ${
                      score >= passingScore
                        ? "bg-blue-600 hover:bg-blue-700 btn-primary"
                        : "bg-amber-600 hover:bg-amber-700"
                    }`}
                  >
                    <LandingIcon name={score >= passingScore ? "Award" : "FileText"} size={15} color="#fff" />
                    {saving
                      ? "Saving..."
                      : score >= passingScore
                      ? "Save & Issue Certificate"
                      : "Save Evaluation (Remedial)"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex h-64 items-center justify-center text-center p-8 text-zinc-400 text-xs">
                Select a student on the left panel to review answers and grade.
              </div>
            )}
          </div>
        </div>
      </AdminFormDialog>
    </>
  );
}
