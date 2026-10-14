"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ExamConfigDialog } from "./ExamConfigDialog";
import type { Exam, ExamSubmission } from "@/types/db";

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

export function InstructorExamReviewWorkbench({
  course,
  courses: _courses,
  submissions: initialSubmissions,
  exam,
  initialSubmissionId,
}: {
  course: { id: number; title: string };
  courses?: Array<{ id: number; title: string }>;
  submissions: InstructorSubmissionRow[];
  exam: Exam | null;
  initialSubmissionId?: number;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [submissions, setSubmissions] = useState<InstructorSubmissionRow[]>(initialSubmissions);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    if (initialSubmissionId && initialSubmissions.some((s) => s.id === initialSubmissionId)) {
      return initialSubmissionId;
    }
    const firstPending = initialSubmissions.find((s) => s.status === "pending");
    return firstPending ? firstPending.id : initialSubmissions[0]?.id ?? null;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "passed" | "failed">("all");
  const [showStudentList, setShowStudentList] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<"pdf" | "video">("pdf");

  const selectedSubmission = useMemo(() => {
    return submissions.find((s) => s.id === selectedId) || null;
  }, [submissions, selectedId]);

  const [readingScore, setReadingScore] = useState<number>(
    () => selectedSubmission?.readingScore ?? selectedSubmission?.manualScore ?? 85
  );
  const [listeningScore, setListeningScore] = useState<number>(
    () => selectedSubmission?.listeningScore ?? selectedSubmission?.manualScore ?? 85
  );
  const [writingScore, setWritingScore] = useState<number>(
    () => selectedSubmission?.writingScore ?? selectedSubmission?.manualScore ?? 85
  );
  const [speakingScore, setSpeakingScore] = useState<number>(
    () => selectedSubmission?.speakingScore ?? selectedSubmission?.manualScore ?? 85
  );

  const averageScore = Math.round(
    (Number(readingScore || 0) +
      Number(listeningScore || 0) +
      Number(writingScore || 0) +
      Number(speakingScore || 0)) /
      4
  );

  const [feedback, setFeedback] = useState<string>(() => selectedSubmission?.instructorFeedback ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync state whenever props change (e.g. course switched)
  useEffect(() => {
    setSubmissions(initialSubmissions);
    const targetId =
      initialSubmissionId && initialSubmissions.some((s) => s.id === initialSubmissionId)
        ? initialSubmissionId
        : initialSubmissions.find((s) => s.status === "pending")?.id ?? initialSubmissions[0]?.id ?? null;
    setSelectedId(targetId);
    const targetSub = initialSubmissions.find((s) => s.id === targetId);
    const defScore = targetSub?.status === "passed" ? 85 : targetSub?.status === "failed" ? 55 : 80;
    setReadingScore(targetSub?.readingScore ?? targetSub?.manualScore ?? defScore);
    setListeningScore(targetSub?.listeningScore ?? targetSub?.manualScore ?? defScore);
    setWritingScore(targetSub?.writingScore ?? targetSub?.manualScore ?? defScore);
    setSpeakingScore(targetSub?.speakingScore ?? targetSub?.manualScore ?? defScore);
    setFeedback(targetSub?.instructorFeedback ?? "");
    setError("");
    setSuccessMsg("");
    setActiveMediaTab("pdf");
    setSearchQuery("");
    setStatusFilter("all");
  }, [initialSubmissions, initialSubmissionId, course.id]);

  function selectSubmission(sub: InstructorSubmissionRow) {
    setSelectedId(sub.id);
    const defScore = sub.status === "passed" ? 85 : sub.status === "failed" ? 55 : 80;
    setReadingScore(sub.readingScore ?? sub.manualScore ?? defScore);
    setListeningScore(sub.listeningScore ?? sub.manualScore ?? defScore);
    setWritingScore(sub.writingScore ?? sub.manualScore ?? defScore);
    setSpeakingScore(sub.speakingScore ?? sub.manualScore ?? defScore);
    setFeedback(sub.instructorFeedback ?? "");
    setError("");
    setSuccessMsg("");
    setActiveMediaTab("pdf");
  }

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchSearch =
        s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studentEmail.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (statusFilter === "all") return true;
      return s.status === statusFilter;
    });
  }, [submissions, searchQuery, statusFilter]);

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const passedCount = submissions.filter((s) => s.status === "passed").length;
  const failedCount = submissions.filter((s) => s.status === "failed").length;
  const passingScore = exam?.passingScore ?? 70;

  const currentIndex = filteredSubmissions.findIndex((s) => s.id === selectedId);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredSubmissions.length - 1;

  function handlePrev() {
    if (hasPrev) selectSubmission(filteredSubmissions[currentIndex - 1]);
  }

  function handleNext() {
    if (hasNext) selectSubmission(filteredSubmissions[currentIndex + 1]);
  }

  function appendFeedbackTemplate(text: string) {
    setFeedback((prev) => (prev ? `${prev}\n\n${text}` : text));
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
          readingScore: Number(readingScore),
          listeningScore: Number(listeningScore),
          writingScore: Number(writingScore),
          speakingScore: Number(speakingScore),
          feedback: feedback.trim(),
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Gagal menyimpan penilaian.");
        setSaving(false);
        return;
      }

      const calculatedAverage = Math.round(
        (Number(readingScore) + Number(listeningScore) + Number(writingScore) + Number(speakingScore)) / 4
      );
      const isPassed = calculatedAverage >= passingScore;
      const newStatus = isPassed ? "passed" : "failed";

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                readingScore: Number(readingScore),
                listeningScore: Number(listeningScore),
                writingScore: Number(writingScore),
                speakingScore: Number(speakingScore),
                manualScore: calculatedAverage,
                finalScore: calculatedAverage,
                status: newStatus,
                instructorFeedback: feedback.trim(),
              }
            : s
        )
      );

      setSaving(false);
      setSuccessMsg(
        isPassed
          ? `✓ Nilai rata-rata ${calculatedAverage} tersimpan! Siswa dinyatakan Lulus dan Sertifikat resmi telah otomatis terbit.`
          : `✓ Penilaian tersimpan (Nilai rata-rata ${calculatedAverage}). Siswa berstatus Belum Lulus / Remedial.`
      );
      router.refresh();
    } catch {
      setSaving(false);
      setError("Terjadi kesalahan koneksi saat menyimpan penilaian.");
    }
  }

  const ytId = selectedSubmission ? getYouTubeId(selectedSubmission.youtubeUrl) : null;
  const isPassingGrade = averageScore >= passingScore;

  return (
    <div suppressHydrationWarning className="flex flex-col gap-3 min-h-[calc(100vh-100px)]">
      {/* Top Header: Structured 2-Tier SpeedGrader Controls */}
      <div className="bg-white rounded-2xl border border-zinc-200 p-3 sm:px-4 sm:py-3 shadow-xs space-y-2.5 shrink-0">
        {/* Tier 1: Context, Back Button, Course Title, and Exam Configurations */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100">
          {/* Left: Back & Course Title */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Link
              href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 shadow-xs transition shrink-0"
              title="Kembali ke Kurikulum"
            >
              <LandingIcon name="ArrowLeft" size={13} color="currentColor" />
              <span>Kurikulum</span>
            </Link>

            <span className="text-zinc-300 hidden sm:inline">•</span>

            {/* Course Title Badge */}
            <div
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-950 text-xs font-extrabold max-w-[240px] sm:max-w-[420px] truncate shadow-2xs"
              title={`Kelas aktif: ${course.title}`}
            >
              <LandingIcon name="BookOpen" size={13} color="#2563eb" />
              <span className="truncate">{course.title}</span>
              {exam && (
                <span className="hidden md:inline-block text-[11px] font-semibold text-blue-600/80 shrink-0 ml-1">
                  (KKM: {passingScore})
                </span>
              )}
            </div>
          </div>

          {/* Right: Question Config Dialog Triggers & Summary Badges */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Metrics Badges */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold mr-1">
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                {pendingCount} Pending
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                {passedCount} Lulus
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200">
                {failedCount} Remedial
              </span>
            </div>

            <ExamConfigDialog
              courseId={course.id}
              courseTitle={course.title}
              initialExam={exam}
              initialTab="main"
              triggerLabel="📄 Soal Utama"
              triggerClassName="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-xs font-bold text-blue-900 shadow-xs transition shrink-0 cursor-pointer"
            />

            <ExamConfigDialog
              courseId={course.id}
              courseTitle={course.title}
              initialExam={exam}
              initialTab="remedial"
              iconName="RotateCcw"
              triggerLabel={exam?.content?.remedialFileUrl ? "🔄 Remedial (Aktif)" : "🔄 + Remedial"}
              triggerClassName={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs transition shrink-0 cursor-pointer ${
                exam?.content?.remedialFileUrl
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
              }`}
            />
          </div>
        </div>

        {/* Tier 2: SpeedGrader Student Stepper & Active Candidate Navigator */}
        {submissions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {/* Left: Toggle Student Drawer & Active Student Stepper */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => setShowStudentList((prev) => !prev)}
                className={`btn btn-sm text-xs font-bold border transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  showStudentList
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
                title={showStudentList ? "Sembunyikan panel daftar siswa (Lebarkan Dokumen)" : "Buka daftar semua siswa"}
              >
                <LandingIcon name="Users" size={13} color="currentColor" />
                <span>{showStudentList ? "Tutup Daftar Siswa" : `Buka Daftar Siswa (${submissions.length})`}</span>
              </button>

              <span className="text-zinc-200 hidden sm:inline">|</span>

              {/* Student Stepper with Active Student Badge */}
              <div className="flex items-center rounded-xl border border-zinc-200 bg-zinc-50/80 p-0.5 shadow-xs">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Siswa Sebelumnya (Keyboard: Panah Kiri)"
                >
                  <LandingIcon name="ArrowLeft" size={13} color="currentColor" />
                </button>

                <div className="flex items-center gap-2 px-2.5 py-0.5 min-w-0">
                  <span className="text-[11px] font-black text-zinc-800 truncate max-w-[140px] sm:max-w-[200px]">
                    {selectedSubmission?.studentName || "Pilih Siswa"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400">
                    ({filteredSubmissions.length > 0 ? `${currentIndex + 1}/${filteredSubmissions.length}` : "0/0"})
                  </span>
                  {selectedSubmission && (
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-md shrink-0 hidden sm:inline-block ${
                        selectedSubmission.status === "passed"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedSubmission.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedSubmission.status === "passed"
                        ? `Lulus (${selectedSubmission.finalScore})`
                        : selectedSubmission.status === "failed"
                        ? "Remedial"
                        : "Pending"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-white hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  title="Siswa Berikutnya (Keyboard: Panah Kanan)"
                >
                  <LandingIcon name="ArrowRight" size={13} color="currentColor" />
                </button>
              </div>
            </div>

            {/* Right: Mode Tampilan Badge / Hint */}
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {!showStudentList ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Mode Fokus (Dokumen Lebar Maksimal)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-lg">
                  Mode Panel Lengkap (3 Kolom)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Workbench Body */}
      {submissions.length === 0 ? (
        /* Empty State for course with 0 submissions */
        <div className="bg-white rounded-2xl border border-zinc-200 p-8 sm:p-14 shadow-xs flex flex-col items-center justify-center text-center space-y-4 my-auto min-h-[420px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[var(--brand)] border border-blue-100 shadow-xs">
            <LandingIcon name="FileText" size={32} color="currentColor" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-zinc-900">
              Belum Ada Siswa Mengumpulkan Jawaban Ujian
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Kelas <strong>{course.title}</strong> saat ini belum memiliki lembar jawaban ujian yang dikumpulkan oleh siswa.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
              className="btn btn-primary btn-sm text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs"
            >
              <LandingIcon name="FileText" size={13} color="#fff" />
              Kelola File Soal Ujian &rarr;
            </Link>
            <Link
              href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
              className="btn btn-secondary btn-sm text-xs font-bold"
            >
              Kembali ke Kurikulum
            </Link>
          </div>
        </div>
      ) : (
        /* Active Dual-Pane / Three-Pane SpeedGrader Workbench */
        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-[580px]">
          {/* Left Drawer / Sidebar: Student List (Collapsible) */}
          {showStudentList && (
            <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-zinc-200 p-3 shadow-xs flex flex-col h-[520px] lg:h-[calc(100vh-215px)] min-h-[520px]">
              {/* Drawer Header with Title & Quick Close */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                <span className="text-xs font-extrabold text-zinc-800 flex items-center gap-1.5">
                  <LandingIcon name="Users" size={13} color="#2563eb" />
                  Daftar Peserta ({submissions.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowStudentList(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs px-1.5 py-0.5 rounded-lg hover:bg-zinc-100 transition font-bold flex items-center gap-1"
                  title="Tutup panel (Lebarkan lembar dokumen)"
                >
                  <span>Tutup</span>
                  <span>✕</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2 px-3 pl-8 rounded-xl border border-zinc-200 bg-zinc-50 placeholder:text-zinc-400 focus:bg-white focus:border-blue-500 outline-none transition"
                />
                <div className="absolute left-2.5 top-2.5 text-zinc-400 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2 py-0.5 rounded-md transition whitespace-nowrap ${
                    statusFilter === "all" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Semua ({submissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2 py-0.5 rounded-md transition whitespace-nowrap ${
                    statusFilter === "pending"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  Pending ({pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("passed")}
                  className={`px-2 py-0.5 rounded-md transition whitespace-nowrap ${
                    statusFilter === "passed"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  Lulus ({passedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("failed")}
                  className={`px-2 py-0.5 rounded-md transition whitespace-nowrap ${
                    statusFilter === "failed" ? "bg-red-600 text-white" : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  Remedial ({failedCount})
                </button>
              </div>

              {/* Submissions List */}
              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                {filteredSubmissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400 mt-2">
                    Tidak ada peserta yang cocok.
                  </div>
                ) : (
                  filteredSubmissions.map((s) => {
                    const isSelected = s.id === selectedId;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSubmission(s)}
                        className={`w-full text-left p-2.5 rounded-xl border transition text-xs relative ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/80 shadow-xs ring-1 ring-blue-500/30"
                            : "border-zinc-200 bg-white hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-zinc-900 truncate block text-xs">{s.studentName}</span>
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 ${
                              s.status === "passed"
                                ? "bg-emerald-100 text-emerald-800"
                                : s.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {s.status === "passed" ? "Lulus" : s.status === "failed" ? "Remedial" : "Pending"}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-400 block truncate mt-0.5">{s.studentEmail}</span>
                        <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-100 text-[10px]">
                          <span suppressHydrationWarning className="text-zinc-400">
                            {mounted
                              ? new Date(s.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
                              : "..."}
                          </span>
                          <span className="font-bold text-blue-600">
                            {s.finalScore !== null ? `${s.finalScore}/100` : "Belum Dinilai"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Center Canvas: Document & Video Media Viewer */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-zinc-200 shadow-xs flex flex-col h-[600px] lg:h-[calc(100vh-215px)] min-h-[540px] overflow-hidden">
            {selectedSubmission ? (
              <>
                {/* Media Header Toolbar */}
                <div className="p-3 border-b border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Tab Selector if Video exists */}
                    {(ytId || selectedSubmission.youtubeUrl) ? (
                      <div className="flex items-center bg-zinc-200/80 p-0.5 rounded-lg text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => setActiveMediaTab("pdf")}
                          className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                            activeMediaTab === "pdf" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          <LandingIcon name="FileText" size={13} color="currentColor" />
                          <span>Lembar Jawaban PDF</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMediaTab("video")}
                          className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                            activeMediaTab === "video" ? "bg-white text-zinc-900 shadow-xs" : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          <LandingIcon name="Video" size={13} color="currentColor" />
                          <span>Video Siswa</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 font-extrabold text-[11px] border border-red-100 shrink-0">
                          PDF
                        </div>
                        <span className="text-xs font-bold text-zinc-800 truncate">
                          {selectedSubmission.answers?.answerFileName || "Lembar_Jawaban_Ujian.pdf"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Document Action Buttons */}
                  {selectedSubmission.answers?.answerFileUrl && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={selectedSubmission.answers.answerFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm text-[11px] font-bold py-1 px-2.5 flex items-center gap-1"
                      >
                        <LandingIcon name="Eye" size={12} color="currentColor" />
                        <span>Buka Tab Baru</span>
                      </a>
                      <a
                        href={selectedSubmission.answers.answerFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="btn btn-primary btn-sm text-[11px] font-bold py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1"
                      >
                        <LandingIcon name="Download" size={12} color="#fff" />
                        <span>Download</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Media Body Viewer */}
                <div className="flex-1 min-h-0 bg-zinc-100 relative">
                  {activeMediaTab === "pdf" ? (
                    selectedSubmission.answers?.answerFileUrl ? (
                      <iframe
                        src={selectedSubmission.answers.answerFileUrl}
                        className="w-full h-full border-0"
                        title="Lembar Jawaban Siswa"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-center p-8 text-zinc-400 text-xs">
                        Siswa tidak melampirkan file lembar jawaban.
                      </div>
                    )
                  ) : (
                    <div className="flex h-full items-center justify-center p-4 bg-black/95">
                      {ytId ? (
                        <div className="relative aspect-video w-full max-w-2xl max-h-full rounded-xl overflow-hidden shadow-lg border border-zinc-800">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="Student Speaking Video"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="h-full w-full"
                          />
                        </div>
                      ) : (
                        <div className="text-white text-xs text-center space-y-2">
                          <p>Tautan Video Siswa:</p>
                          <a
                            href={selectedSubmission.youtubeUrl || "#"}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 underline font-bold"
                          >
                            {selectedSubmission.youtubeUrl} &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Student Notes Bar (if any) */}
                {selectedSubmission.answers?.studentNotes && (
                  <div className="px-4 py-2.5 bg-blue-50/80 border-t border-blue-100 text-xs text-zinc-700 flex items-start gap-2 shrink-0">
                    <span className="font-bold text-blue-900 shrink-0">Catatan Siswa:</span>
                    <p className="italic text-zinc-600 truncate">&ldquo;{selectedSubmission.answers.studentNotes}&rdquo;</p>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-8 text-zinc-400 text-xs">
                Pilih peserta di panel kiri untuk menampilkan lembar jawaban.
              </div>
            )}
          </div>

          {/* Right Pane: Sticky Grading Workbench Panel */}
          <div className="w-full lg:w-[330px] xl:w-[340px] shrink-0 bg-white rounded-2xl border border-zinc-200 p-3.5 shadow-xs flex flex-col h-auto lg:h-[calc(100vh-215px)] min-h-[540px] overflow-y-auto space-y-3.5">
            {selectedSubmission ? (
              <>
                {/* Candidate Info Card */}
                <div className="bg-zinc-50/80 rounded-xl border border-zinc-200 p-3.5 space-y-2 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm shadow-xs">
                      {selectedSubmission.studentName[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-sm font-black text-zinc-900 truncate">{selectedSubmission.studentName}</h2>
                      <p className="text-[11px] text-zinc-400 truncate">{selectedSubmission.studentEmail}</p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        selectedSubmission.status === "passed"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedSubmission.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800 font-extrabold"
                      }`}
                    >
                      {selectedSubmission.status === "passed"
                        ? `Lulus (${selectedSubmission.finalScore})`
                        : selectedSubmission.status === "failed"
                        ? `Remedial (${selectedSubmission.finalScore})`
                        : "Pending"}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-200/60 flex items-center justify-between">
                    <span>Waktu Pengumpulan:</span>
                    <span suppressHydrationWarning className="font-semibold text-zinc-600">
                      {mounted
                        ? `${new Date(selectedSubmission.submittedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} WIB`
                        : "..."}
                    </span>
                  </div>
                </div>

                {/* Grading Input Section */}
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                        <LandingIcon name="Award" size={14} color="currentColor" />
                        Penilaian Instruktur
                      </h3>
                      <span className="text-[10px] font-bold text-zinc-400">Standar Lulus: {passingScore}</span>
                    </div>

                    {/* 4 Skills Input Section */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-zinc-700">
                          Penilaian 4 Aspek Kemahiran (0 - 100)
                        </label>
                        <span className="text-[10px] text-zinc-400">Instruktur mengisi tiap aspek</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Reading */}
                        <div className="bg-blue-50/40 border border-blue-200/80 rounded-xl p-2 transition focus-within:border-blue-400 focus-within:bg-blue-50/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-blue-900 flex items-center gap-1">
                              <LandingIcon name="BookOpen" size={12} color="var(--brand, #2563eb)" />
                              Reading
                            </span>
                            <span className="text-[9px] text-blue-600 font-semibold">Membaca</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={readingScore}
                              onChange={(e) => setReadingScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                              className="w-full text-base font-black text-center h-9 py-1 px-2 rounded-lg border border-blue-200 bg-white shadow-2xs focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-zinc-400">/100</span>
                          </div>
                        </div>

                        {/* Listening */}
                        <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-xl p-2 transition focus-within:border-indigo-400 focus-within:bg-indigo-50/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-indigo-900 flex items-center gap-1">
                              <LandingIcon name="Volume2" size={12} color="#4f46e5" />
                              Listening
                            </span>
                            <span className="text-[9px] text-indigo-600 font-semibold">Mendengar</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={listeningScore}
                              onChange={(e) => setListeningScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                              className="w-full text-base font-black text-center h-9 py-1 px-2 rounded-lg border border-indigo-200 bg-white shadow-2xs focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-zinc-400">/100</span>
                          </div>
                        </div>

                        {/* Writing */}
                        <div className="bg-violet-50/40 border border-violet-200/80 rounded-xl p-2 transition focus-within:border-violet-400 focus-within:bg-violet-50/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-violet-900 flex items-center gap-1">
                              <LandingIcon name="FileText" size={12} color="#7c3aed" />
                              Writing
                            </span>
                            <span className="text-[9px] text-violet-600 font-semibold">Menulis</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={writingScore}
                              onChange={(e) => setWritingScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                              className="w-full text-base font-black text-center h-9 py-1 px-2 rounded-lg border border-violet-200 bg-white shadow-2xs focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-zinc-400">/100</span>
                          </div>
                        </div>

                        {/* Speaking */}
                        <div className="bg-emerald-50/40 border border-emerald-200/80 rounded-xl p-2 transition focus-within:border-emerald-400 focus-within:bg-emerald-50/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-emerald-900 flex items-center gap-1">
                              <LandingIcon name="Video" size={12} color="#059669" />
                              Speaking
                            </span>
                            <span className="text-[9px] text-emerald-600 font-semibold">Berbicara</span>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={speakingScore}
                              onChange={(e) => setSpeakingScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                              className="w-full text-base font-black text-center h-9 py-1 px-2 rounded-lg border border-emerald-200 bg-white shadow-2xs focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-zinc-400">/100</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-zinc-400 font-semibold">Preset Cepat Semua Aspek:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {[100, 95, 90, 85, 80, 75, 70, 65, 50].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => {
                              setReadingScore(val);
                              setListeningScore(val);
                              setWritingScore(val);
                              setSpeakingScore(val);
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border transition ${
                              readingScore === val && listeningScore === val && writingScore === val && speakingScore === val
                                ? val >= passingScore
                                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                  : "bg-red-600 text-white border-red-600 shadow-2xs"
                                : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                            }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto-Calculated Average Score Highlight */}
                    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 text-white rounded-xl p-3 shadow-sm border border-zinc-700/60">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-zinc-400 block">
                            Nilai Akhir (Kalkulasi Otomatis)
                          </span>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            (R: {readingScore} + L: {listeningScore} + W: {writingScore} + S: {speakingScore}) ÷ 4
                          </p>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black tracking-tight text-white">{averageScore}</span>
                          <span className="text-xs font-bold text-zinc-400">/ 100</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-zinc-700/80 flex items-center justify-between text-[11px]">
                        <span className="text-zinc-300">Hasil Kelulusan:</span>
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                            isPassingGrade
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {isPassingGrade ? "LULUS (>= 70)" : "BELUM LULUS / REMEDIAL (< 70)"}
                        </span>
                      </div>
                    </div>

                    {/* Live Dynamic Status Notice */}
                    <div
                      className={`p-2.5 rounded-xl border text-[11px] leading-relaxed transition ${
                        isPassingGrade
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}
                    >
                      {isPassingGrade ? (
                        <div className="flex items-start gap-1.5">
                          <div className="mt-0.5 text-emerald-600 shrink-0">
                            <LandingIcon name="CheckCircle" size={13} color="currentColor" />
                          </div>
                          <div>
                            <strong className="font-bold">STATUS: LULUS</strong>
                            <p className="mt-0.5 text-[10px] text-emerald-700">
                              Sertifikat kelulusan ber-QR code otomatis terbit ke profil siswa.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <div className="mt-0.5 text-amber-600 shrink-0">
                            <LandingIcon name="FileText" size={13} color="currentColor" />
                          </div>
                          <div>
                            <strong className="font-bold">STATUS: BELUM LULUS (REMEDIAL)</strong>
                            <p className="mt-0.5 text-[10px] text-amber-700">
                              Nilai di bawah {passingScore}. Siswa akan mengunduh{" "}
                              <strong>{exam?.content?.remedialFileUrl ? "Lembar Soal Khusus Remedial (Paket B)" : "Lembar Soal Utama untuk perbaikan"}</strong>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Feedback Textarea */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-zinc-600 block">Catatan & Masukan Instruktur</label>
                      <textarea
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tuliskan evaluasi artikulasi, analisis, atau arahan remedial..."
                        className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 bg-white placeholder:text-zinc-400 leading-relaxed focus:ring-2 focus:ring-blue-500 outline-none"
                      />

                      {/* Feedback Template Quick Chips */}
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        <button
                          type="button"
                          onClick={() => appendFeedbackTemplate("Artikulasi sangat jelas dan struktur penyampaian baik.")}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                        >
                          + Artikulasi Baik
                        </button>
                        <button
                          type="button"
                          onClick={() => appendFeedbackTemplate("Perhatikan kembali kelengkapan analisis data pada poin akhir.")}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                        >
                          + Analisis Akhir
                        </button>
                        <button
                          type="button"
                          onClick={() => appendFeedbackTemplate("Nilai belum memenuhi batas. Silakan kumpulkan lembar remedial.")}
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-100 transition"
                        >
                          + Remedial
                        </button>
                      </div>
                    </div>

                    {/* Feedback Messages */}
                    {error && (
                      <p className="text-[11px] text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
                        {error}
                      </p>
                    )}
                    {successMsg && (
                      <p className="text-[11px] text-emerald-800 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                        <LandingIcon name="CheckCircle" size={13} color="currentColor" />
                        {successMsg}
                      </p>
                    )}
                  </div>

                  {/* Primary CTA Submit Button */}
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleGrade}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-black text-white shadow-xs transition flex items-center justify-center gap-2 ${
                        isPassingGrade ? "bg-blue-600 hover:bg-blue-700" : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      <LandingIcon name={isPassingGrade ? "Award" : "FileText"} size={14} color="#fff" />
                      <span>
                        {saving
                          ? "Menyimpan..."
                          : selectedSubmission.status !== "pending"
                          ? isPassingGrade
                            ? "Perbarui Penilaian & Terbitkan Sertifikat"
                            : "Perbarui Evaluasi (Set ke Remedial)"
                          : isPassingGrade
                          ? "Simpan & Terbitkan Sertifikat"
                          : "Simpan Evaluasi (Remedial)"}
                      </span>
                    </button>

                    {/* Prev / Next Shortcuts */}
                    <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-500 pt-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!hasPrev}
                        className="hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        &larr; Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!hasNext}
                        className="hover:text-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                      >
                        Berikutnya &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-zinc-400 text-xs">
                Pilih peserta untuk melakukan penilaian.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
