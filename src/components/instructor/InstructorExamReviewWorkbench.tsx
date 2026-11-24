"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import {
  DEFAULT_CBT_QUESTIONS,
  getOfficialGradeLabel,
  type CbtExamResult,
  type CbtQuestion,
  type CbtQuestionType,
  type CbtUserAnswer,
} from "@/lib/exams/cbt";
import type { Exam, ExamSubmission } from "@/types/db";

export type InstructorSubmissionRow = ExamSubmission & {
  studentName: string;
  studentEmail: string;
  examTitle: string;
};

const emptySubscribe = () => () => {};

function getQuestionTypeBadge(type: CbtQuestionType | string) {
  if (type === "audio_speaking") {
    return {
      label: "Speaking Interview",
      cls: "bg-purple-50 text-purple-800 border-purple-200",
    };
  }
  if (type === "vocab_match") {
    return {
      label: "Vocab A–D",
      cls: "bg-teal-50 text-teal-800 border-teal-200",
    };
  }
  if (type === "translate") {
    return {
      label: "Translate (ID → EN)",
      cls: "bg-amber-50 text-amber-900 border-amber-200",
    };
  }
  return {
    label: "Lengkapi Kalimat",
    cls: "bg-blue-50 text-[#0062D1] border-blue-200",
  };
}

function extractCbtResult(sub: InstructorSubmissionRow | null): CbtExamResult | null {
  if (!sub?.answers || typeof sub.answers !== "object") return null;
  const raw = (sub.answers as Record<string, unknown>).cbtResults;
  if (!raw || typeof raw !== "object") return null;
  const cbt = raw as Partial<CbtExamResult>;
  if (!cbt.answers || typeof cbt.answers !== "object") return null;
  return {
    totalEarnedPoints: Number(cbt.totalEarnedPoints ?? 0),
    totalPossiblePoints: Number(cbt.totalPossiblePoints ?? 100),
    finalPercentage: Number(cbt.finalPercentage ?? sub.finalScore ?? 0),
    passingScore: Number(cbt.passingScore ?? 70),
    passed: Boolean(cbt.passed),
    readingScore: Number(cbt.readingScore ?? sub.readingScore ?? 0),
    speakingScore: Number(cbt.speakingScore ?? sub.speakingScore ?? 0),
    answers: cbt.answers as Record<string, CbtUserAnswer>,
    completedAt: String(cbt.completedAt ?? sub.submittedAt),
  };
}

function getInitialPointsMap(sub: InstructorSubmissionRow | null): Record<string, number> {
  const cbt = extractCbtResult(sub);
  if (!cbt) return {};
  const map: Record<string, number> = {};
  for (const [key, ans] of Object.entries(cbt.answers)) {
    const qKey = ans.questionId || key;
    map[qKey] = Number(ans.earnedPoints ?? 0);
  }
  return map;
}

function getInitialLegacyScore(sub: InstructorSubmissionRow | null): number {
  if (!sub) return 0;
  if (sub.finalScore !== null && sub.finalScore !== undefined) return Number(sub.finalScore);
  if (sub.manualScore !== null && sub.manualScore !== undefined) return Number(sub.manualScore);
  if (sub.autoScore !== null && sub.autoScore !== undefined) return Number(sub.autoScore);
  return 0;
}

export function InstructorExamReviewWorkbench({
  course,
  courses = [],
  submissions: initialSubmissions,
  exam,
  initialSubmissionId,
  instructorHasSignature = true,
}: {
  course: { id: number; title: string };
  courses?: Array<{ id: number; title: string }>;
  submissions: InstructorSubmissionRow[];
  exam: Exam | null;
  initialSubmissionId?: number;
  instructorHasSignature?: boolean;
}) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [submissions, setSubmissions] = useState<InstructorSubmissionRow[]>(initialSubmissions);
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    if (initialSubmissionId && initialSubmissions.some((s) => s.id === initialSubmissionId)) {
      return initialSubmissionId;
    }
    const firstPending = initialSubmissions.find((s) => s.status === "pending");
    return firstPending ? firstPending.id : initialSubmissions[0]?.id ?? null;
  });

  const initialSelected = useMemo(
    () => initialSubmissions.find((s) => s.id === selectedId) ?? null,
    [initialSubmissions, selectedId]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "passed" | "failed">("all");
  const [showStudentList, setShowStudentList] = useState(false);

  const [pointsByQuestion, setPointsByQuestion] = useState<Record<string, number>>(() =>
    getInitialPointsMap(initialSelected)
  );
  const [legacyScore, setLegacyScore] = useState<number>(() =>
    getInitialLegacyScore(initialSelected)
  );
  const [feedback, setFeedback] = useState<string>(
    () => initialSelected?.instructorFeedback ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const selectedSubmission = useMemo(
    () => submissions.find((s) => s.id === selectedId) || null,
    [submissions, selectedId]
  );

  const cbtResult = useMemo(
    () => extractCbtResult(selectedSubmission),
    [selectedSubmission]
  );

  // Lookup map of all known questions in this course's exam (main + remedial + defaults)
  const questionLookup = useMemo(() => {
    const map = new Map<string, CbtQuestion>();
    const mainQs = Array.isArray(exam?.content?.cbtQuestions)
      ? (exam.content.cbtQuestions as CbtQuestion[])
      : [];
    const remedialQs = Array.isArray(exam?.content?.remedialCbtQuestions)
      ? (exam.content.remedialCbtQuestions as CbtQuestion[])
      : [];
    for (const q of [...DEFAULT_CBT_QUESTIONS, ...mainQs, ...remedialQs]) {
      if (q?.id) map.set(q.id, q);
    }
    return map;
  }, [exam]);

  function selectSubmission(sub: InstructorSubmissionRow) {
    setSelectedId(sub.id);
    setPointsByQuestion(getInitialPointsMap(sub));
    setLegacyScore(getInitialLegacyScore(sub));
    setFeedback(sub.instructorFeedback ?? "");
    setError("");
    setSuccessMsg("");
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

  // Live computed CBT metrics directly from student's answers + any per-question point adjustment
  const computedCbt = useMemo(() => {
    if (!cbtResult) return null;
    const entries = Object.entries(cbtResult.answers);
    let totalEarned = 0;
    let totalPossible = 0;
    let textEarned = 0;
    let textPossible = 0;
    let speakingEarned = 0;
    let speakingPossible = 0;
    let hasManualAdjustment = false;

    const updatedAnswers: Record<string, CbtUserAnswer> = {};

    for (const [key, ans] of entries) {
      const qKey = ans.questionId || key;
      const maxPts = Math.max(0, Number(ans.maxPoints ?? 0));
      const origPts = Math.max(0, Math.min(maxPts, Number(ans.earnedPoints ?? 0)));
      const currentPts =
        pointsByQuestion[qKey] !== undefined
          ? Math.max(0, Math.min(maxPts, Number(pointsByQuestion[qKey])))
          : origPts;

      if (currentPts !== origPts) {
        hasManualAdjustment = true;
      }

      totalEarned += currentPts;
      totalPossible += maxPts;

      if (ans.type === "audio_speaking") {
        speakingEarned += currentPts;
        speakingPossible += maxPts;
      } else {
        textEarned += currentPts;
        textPossible += maxPts;
      }

      updatedAnswers[key] = {
        ...ans,
        earnedPoints: currentPts,
      };
    }

    const finalPercentage =
      totalPossible > 0
        ? Math.round((totalEarned / totalPossible) * 100)
        : Math.round(Number(cbtResult.finalPercentage ?? 0));

    const readingScore =
      textPossible > 0 ? Math.round((textEarned / textPossible) * 100) : finalPercentage;
    const speakingScore =
      speakingPossible > 0 ? Math.round((speakingEarned / speakingPossible) * 100) : finalPercentage;

    return {
      totalEarnedPoints: totalEarned,
      totalPossiblePoints: totalPossible,
      finalPercentage,
      readingScore,
      speakingScore,
      hasTextQuestions: textPossible > 0,
      hasSpeakingQuestions: speakingPossible > 0,
      hasManualAdjustment,
      answersList: entries.map(([key, ans]) => {
        const qKey = ans.questionId || key;
        const maxPts = Math.max(0, Number(ans.maxPoints ?? 0));
        const earnedPts =
          pointsByQuestion[qKey] !== undefined
            ? Math.max(0, Math.min(maxPts, Number(pointsByQuestion[qKey])))
            : Number(ans.earnedPoints ?? 0);
        return {
          key,
          qKey,
          answer: ans,
          earnedPts,
          maxPts,
          questionMeta: questionLookup.get(qKey) || null,
        };
      }),
      updatedCbtResult: {
        ...cbtResult,
        totalEarnedPoints: totalEarned,
        totalPossiblePoints: totalPossible,
        finalPercentage,
        passingScore,
        passed: finalPercentage >= passingScore,
        readingScore,
        speakingScore,
        answers: updatedAnswers,
      } satisfies CbtExamResult,
    };
  }, [cbtResult, pointsByQuestion, questionLookup, passingScore]);

  const effectiveFinalScore = computedCbt ? computedCbt.finalPercentage : legacyScore;
  const isPassingGrade = effectiveFinalScore >= passingScore;

  function handleResetToAutoCbt() {
    if (!selectedSubmission) return;
    setPointsByQuestion(getInitialPointsMap(selectedSubmission));
    setSuccessMsg("");
    setError("");
  }

  function appendFeedbackTemplate(text: string) {
    setFeedback((prev) => (prev ? `${prev}\n\n${text}` : text));
  }

  async function handleGrade() {
    if (!selectedSubmission) return;
    setSaving(true);
    setError("");
    setSuccessMsg("");

    if (isPassingGrade && !instructorHasSignature) {
      setSaving(false);
      setError(
        "Tanda tangan digital Anda belum diunggah di profil. Harap lengkapi tanda tangan digital di menu Profil Instruktur sebelum menerbitkan sertifikat kelulusan siswa."
      );
      return;
    }

    try {
      const payload = computedCbt
        ? {
            submissionId: selectedSubmission.id,
            finalScore: computedCbt.finalPercentage,
            readingScore: computedCbt.readingScore,
            speakingScore: computedCbt.speakingScore,
            cbtResults: computedCbt.updatedCbtResult,
            feedback: feedback.trim(),
          }
        : {
            submissionId: selectedSubmission.id,
            finalScore: legacyScore,
            readingScore: legacyScore,
            speakingScore: legacyScore,
            feedback: feedback.trim(),
          };

      const res = await fetch("/api/instructor/exams/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error || "Gagal menyimpan penilaian ujian.");
        setSaving(false);
        return;
      }

      const newStatus: ExamSubmission["status"] = isPassingGrade ? "passed" : "failed";

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSubmission.id
            ? {
                ...s,
                answers: computedCbt
                  ? { ...s.answers, cbtResults: computedCbt.updatedCbtResult }
                  : s.answers,
                readingScore: computedCbt ? computedCbt.readingScore : legacyScore,
                listeningScore: computedCbt ? computedCbt.speakingScore : legacyScore,
                writingScore: computedCbt ? computedCbt.readingScore : legacyScore,
                speakingScore: computedCbt ? computedCbt.speakingScore : legacyScore,
                manualScore: effectiveFinalScore,
                finalScore: effectiveFinalScore,
                status: newStatus,
                instructorFeedback: feedback.trim(),
              }
            : s
        )
      );

      setSaving(false);
      setSuccessMsg(
        isPassingGrade
          ? `✓ Nilai akhir ${effectiveFinalScore}/100 tersimpan! Siswa dinyatakan Lulus dan sertifikat resmi ber-QR otomatis diterbitkan.`
          : `✓ Evaluasi tersimpan (Nilai akhir ${effectiveFinalScore}/100). Status siswa: Perlu Remedial CBT.`
      );
      router.refresh();
    } catch {
      setSaving(false);
      setError("Terjadi gangguan jaringan saat menyimpan penilaian.");
    }
  }

  return (
    <div suppressHydrationWarning className="flex flex-col gap-3 min-h-[calc(100vh-100px)]">
      {/* Top Header: Structured 2-Tier CBT Review Controls */}
      <div className="bg-white rounded-2xl border border-[#E6DED4] p-3 sm:px-4 sm:py-3 shadow-xs space-y-2.5 shrink-0">
        {/* Tier 1: Back, Course Selector & Exam Builder Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5 min-w-0 flex-1 flex-wrap">
            <Link
              href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E6DED4] bg-white hover:bg-[#FBF6F1] text-xs font-bold text-[#0B2559] shadow-xs transition shrink-0"
              title="Kembali ke Tab Final Exam"
            >
              <LandingIcon name="ArrowLeft" size={13} color="currentColor" />
              <span>Kurikulum</span>
            </Link>

            <span className="text-zinc-300 hidden sm:inline">•</span>

            {courses.length > 1 ? (
              <select
                aria-label="Pilih kelas untuk review ujian"
                value={course.id}
                onChange={(e) => router.push(`/instructor/exams/review?courseId=${e.target.value}`)}
                className="px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[#0B2559] text-xs font-extrabold max-w-[260px] sm:max-w-[380px] truncate cursor-pointer focus:outline-none focus:border-[#0073F5]"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[#0B2559] text-xs font-extrabold max-w-[240px] sm:max-w-[420px] truncate"
                title={course.title}
              >
                <LandingIcon name="BookOpen" size={13} color="#0073F5" />
                <span className="truncate">{course.title}</span>
              </div>
            )}

            <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-1 text-[11px] font-extrabold text-[#0B2559] shrink-0">
              KKM {passingScore}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold mr-1">
              <span className="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                {pendingCount} Pending
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                {passedCount} Lulus
              </span>
              <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200">
                {failedCount} Remedial
              </span>
            </div>

            <Link
              href={`/instructor/exams/builder?courseId=${course.id}&tab=main`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-xs font-bold text-[#0B2559] shadow-xs transition shrink-0"
            >
              <LandingIcon name="FileText" size={14} color="#0073F5" className="shrink-0" />
              <span>Kelola Soal CBT</span>
            </Link>

            <Link
              href={`/instructor/exams/builder?courseId=${course.id}&tab=remedial`}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold shadow-xs transition shrink-0 ${
                exam?.content?.remedialCbtQuestions?.length
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100"
                  : "border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] hover:bg-[#EFE7DD]"
              }`}
            >
              <LandingIcon name="RotateCcw" size={14} color="currentColor" className="shrink-0" />
              <span>
                {exam?.content?.remedialCbtQuestions?.length
                  ? `Remedial (${exam.content.remedialCbtQuestions.length} Soal)`
                  : "+ Soal Remedial"}
              </span>
            </Link>
          </div>
        </div>

        {/* Tier 2: Student Stepper */}
        {submissions.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex flex-wrap items-center gap-2 min-w-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowStudentList((prev) => !prev)}
                className={`text-xs font-bold border transition flex items-center gap-1.5 px-3 py-1.5 rounded-xl shrink-0 cursor-pointer ${
                  showStudentList
                    ? "bg-[#0B2559] text-white border-[#0B2559] shadow-xs"
                    : "bg-white text-[#0B2559] border-[#E6DED4] hover:bg-[#FBF6F1]"
                }`}
              >
                <LandingIcon name="Users" size={13} color="currentColor" />
                <span>{showStudentList ? "Tutup Daftar Siswa" : `Daftar Siswa (${submissions.length})`}</span>
              </button>

              <span className="text-zinc-200 hidden sm:inline">|</span>

              <div className="flex items-center rounded-xl border border-[#E6DED4] bg-[#FBF6F1]/70 p-0.5 max-w-full">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!hasPrev}
                  className="p-1.5 rounded-lg text-[#0B2559] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
                  title="Siswa Sebelumnya"
                >
                  <LandingIcon name="ArrowLeft" size={13} color="currentColor" />
                </button>

                <div className="flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 min-w-0">
                  <span className="text-[11px] font-extrabold text-[#0B2559] truncate max-w-[130px] sm:max-w-[200px]">
                    {selectedSubmission?.studentName || "Pilih Siswa"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 shrink-0">
                    ({filteredSubmissions.length > 0 ? `${currentIndex + 1}/${filteredSubmissions.length}` : "0/0"})
                  </span>
                  {selectedSubmission && (
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0 hidden md:inline-block ${
                        selectedSubmission.status === "passed"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedSubmission.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedSubmission.status === "passed"
                        ? `Lulus (${selectedSubmission.finalScore ?? effectiveFinalScore})`
                        : selectedSubmission.status === "failed"
                        ? `Remedial (${selectedSubmission.finalScore ?? effectiveFinalScore})`
                        : "Pending"}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!hasNext}
                  className="p-1.5 rounded-lg text-[#0B2559] hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition shrink-0 cursor-pointer"
                  title="Siswa Berikutnya"
                >
                  <LandingIcon name="ArrowRight" size={13} color="currentColor" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs self-start sm:self-auto shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0062D1] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200/80">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0073F5]" />
                Penilaian Langsung dari Jawaban Soal CBT
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Workbench Body */}
      {submissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E6DED4] p-8 sm:p-14 shadow-xs flex flex-col items-center justify-center text-center space-y-4 my-auto min-h-[420px]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#0073F5] border border-blue-100 shadow-xs">
            <LandingIcon name="FileText" size={32} color="currentColor" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0B2559]">
              Belum Ada Hasil Ujian CBT
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
              Belum ada siswa yang menyelesaikan ujian CBT untuk kelas{" "}
              <strong className="text-[#0B2559]">{course.title}</strong>. Setelah siswa mengerjakan
              soal di sistem, hasil &amp; rincian jawaban otomatis muncul di sini.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <Link
              href={`/instructor/exams/builder?courseId=${course.id}&tab=main`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition"
            >
              <LandingIcon name="FileText" size={13} color="#fff" />
              <span>Kelola Soal CBT &rarr;</span>
            </Link>
            <Link
              href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] hover:bg-[#EFE7DD] px-4 py-2.5 text-xs font-bold text-[#0B2559] transition"
            >
              Kembali ke Kurikulum
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-[560px]">
          {/* Left Collapsible Drawer: Student List */}
          {showStudentList && (
            <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl border border-[#E6DED4] p-3 shadow-xs flex flex-col h-[500px] lg:h-[calc(100vh-215px)] min-h-[500px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100">
                <span className="text-xs font-extrabold text-[#0B2559] flex items-center gap-1.5">
                  <LandingIcon name="Users" size={13} color="#0073F5" />
                  Peserta Ujian ({submissions.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowStudentList(false)}
                  className="text-zinc-400 hover:text-zinc-700 text-xs px-1.5 py-0.5 rounded-lg hover:bg-zinc-100 transition font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="relative mb-2">
                <input
                  type="text"
                  placeholder="Cari nama atau email siswa..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs py-2 px-3 pl-8 rounded-xl border border-[#E6DED4] bg-[#FBF6F1]/50 placeholder:text-zinc-400 focus:bg-white focus:border-[#0073F5] outline-none transition"
                />
                <div className="absolute left-2.5 top-2.5 text-zinc-400 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-1 text-[10px] font-bold">
                {(
                  [
                    { id: "all", label: `Semua (${submissions.length})`, activeCls: "bg-[#0B2559] text-white" },
                    { id: "pending", label: `Pending (${pendingCount})`, activeCls: "bg-amber-600 text-white" },
                    { id: "passed", label: `Lulus (${passedCount})`, activeCls: "bg-emerald-600 text-white" },
                    { id: "failed", label: `Remedial (${failedCount})`, activeCls: "bg-red-600 text-white" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2 py-0.5 rounded-md transition whitespace-nowrap cursor-pointer ${
                      statusFilter === tab.id
                        ? tab.activeCls
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto pr-1">
                {filteredSubmissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-xs text-zinc-400 mt-2">
                    Tidak ada siswa yang cocok.
                  </div>
                ) : (
                  filteredSubmissions.map((s) => {
                    const isSelected = s.id === selectedId;
                    const hasCbt = Boolean(extractCbtResult(s));
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSubmission(s)}
                        className={`w-full text-left p-2.5 rounded-xl border transition text-xs cursor-pointer ${
                          isSelected
                            ? "border-[#0073F5] bg-blue-50/70 shadow-xs ring-1 ring-[#0073F5]/25"
                            : "border-[#E6DED4] bg-white hover:bg-[#FBF6F1]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[#0B2559] truncate block text-xs">
                            {s.studentName}
                          </span>
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
                        <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                          {s.studentEmail}
                        </span>
                        <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-zinc-100 text-[10px]">
                          <span className="font-semibold text-zinc-500">
                            {hasCbt ? "Ujian CBT" : "Data Lama"}
                          </span>
                          <span className="font-extrabold text-[#0062D1]">
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

          {/* Center Pane: CBT Question-by-Question Answer Breakdown */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl border border-[#E6DED4] shadow-xs flex flex-col lg:h-[calc(100vh-215px)] min-h-[480px] overflow-hidden">
            {selectedSubmission ? (
              <>
                {/* CBT Sheet Header Bar */}
                <div className="px-4 py-3 border-b border-[#E6DED4] bg-[#FBF6F1]/70 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0B2559] text-white">
                      <LandingIcon name="FileText" size={15} color="#fff" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="m-0 text-xs sm:text-sm font-extrabold text-[#0B2559] truncate">
                        {computedCbt ? "Rincian Jawaban Ujian CBT Siswa" : "Ringkasan Pengumpulan Ujian"}
                      </h2>
                      <p className="m-0 text-[11px] text-zinc-500 truncate">
                        {computedCbt
                          ? `${computedCbt.answersList.length} soal dikerjakan langsung di sistem · Nilai otomatis dihitung dari poin per soal`
                          : "Data pengumpulan lama sebelum format soal CBT interaktif diaktifkan"}
                      </p>
                    </div>
                  </div>

                  {computedCbt && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-lg bg-white border border-[#E6DED4] px-2.5 py-1 text-[11px] font-extrabold text-[#0B2559]">
                        {computedCbt.totalEarnedPoints} / {computedCbt.totalPossiblePoints} Poin
                      </span>
                      {computedCbt.hasTextQuestions && (
                        <span className="rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#0062D1]">
                          Teks: {computedCbt.readingScore}%
                        </span>
                      )}
                      {computedCbt.hasSpeakingQuestions && (
                        <span className="rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-[11px] font-bold text-purple-800">
                          Speaking: {computedCbt.speakingScore}%
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* CBT Answers Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#FAF8F5] space-y-3.5">
                  {computedCbt ? (
                    <>
                      {/* Helpful Instructor Hint */}
                      <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 px-3.5 py-2.5 text-[11px] text-[#0B2559] flex items-start gap-2">
                        <LandingIcon name="CheckCircle" size={14} color="#0073F5" className="shrink-0 mt-0.5" />
                        <span>
                          Sistem sudah menghitung poin otomatis dari jawaban siswa di tiap soal. Jika ingin
                          menyesuaikan poin soal tertentu (misalnya terjemahan sinonim atau jawaban{" "}
                          <strong>Speaking</strong>), ubah angka <strong>Poin</strong> pada soal terkait dan
                          skor akhir di kanan otomatis terbarui.
                        </span>
                      </div>

                      {/* Question Cards */}
                      {computedCbt.answersList.map(
                        ({ key, qKey, answer, earnedPts, maxPts, questionMeta }, idx) => {
                          const badge = getQuestionTypeBadge(answer.type);
                          const pct = maxPts > 0 ? Math.round((earnedPts / maxPts) * 100) : 0;
                          const isGood = pct >= 70;
                          const responseText = answer.userResponse?.trim();

                          return (
                            <div
                              key={key}
                              className="rounded-2xl border border-[#E6DED4] bg-white p-4 shadow-2xs space-y-3"
                            >
                              {/* Card Top Row: Question # + Type + Inline Point Adjuster */}
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B2559] text-white text-xs font-extrabold">
                                    {idx + 1}
                                  </span>
                                  <div className="min-w-0 space-y-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span
                                        className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-extrabold ${badge.cls}`}
                                      >
                                        {badge.label}
                                      </span>
                                      {questionMeta?.section && (
                                        <span className="text-[10px] font-bold text-zinc-400">
                                          {questionMeta.section}
                                        </span>
                                      )}
                                      {answer.status === "timed_out" && (
                                        <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                                          Waktu Habis
                                        </span>
                                      )}
                                      {answer.status === "skipped" && (
                                        <span className="rounded-md bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 text-[10px] font-bold text-zinc-600">
                                          Dilewati
                                        </span>
                                      )}
                                    </div>
                                    <h3 className="m-0 text-xs sm:text-sm font-extrabold text-[#0B2559] leading-snug">
                                      {questionMeta?.title || `Soal CBT #${idx + 1}`}
                                    </h3>
                                  </div>
                                </div>

                                {/* Per-Question Score Box */}
                                <div className="flex items-center gap-2 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] px-2.5 py-1.5 shrink-0">
                                  <div className="text-right">
                                    <span className="block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                                      Poin Soal
                                    </span>
                                    <span
                                      className={`text-[10px] font-extrabold ${
                                        isGood ? "text-emerald-700" : "text-amber-700"
                                      }`}
                                    >
                                      {answer.similarity ?? pct}% cocok
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={0}
                                      max={maxPts}
                                      aria-label={`Poin untuk soal ${idx + 1}`}
                                      value={earnedPts}
                                      onChange={(e) => {
                                        const val = Math.max(
                                          0,
                                          Math.min(maxPts, Number(e.target.value) || 0)
                                        );
                                        setPointsByQuestion((prev) => ({ ...prev, [qKey]: val }));
                                      }}
                                      className="w-14 h-8 rounded-lg border border-[#D4C7B8] bg-white text-center text-sm font-black text-[#0B2559] focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 outline-none"
                                    />
                                    <span className="text-xs font-bold text-zinc-500">/ {maxPts}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Question Prompt (if found in bank) */}
                              {questionMeta?.question && (
                                <div className="rounded-xl bg-[#FBF6F1]/70 border border-[#EFE7DC] px-3 py-2 text-xs text-[#3D4760]">
                                  <span className="font-bold text-[#0B2559]">Pertanyaan: </span>
                                  <span>{questionMeta.question}</span>
                                </div>
                              )}

                              {/* Student Answer vs Target Key */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 mb-1">
                                    Jawaban Siswa
                                  </div>
                                  <p className="m-0 font-semibold text-[#0B2559] break-words leading-relaxed">
                                    {responseText || (
                                      <span className="italic font-normal text-zinc-400">
                                        Tidak ada jawaban tercatat
                                      </span>
                                    )}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3">
                                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                                    Kunci / Target Jawaban
                                  </div>
                                  <p className="m-0 font-semibold text-emerald-950 break-words leading-relaxed">
                                    {questionMeta?.targetAnswer || (
                                      <span className="italic font-normal text-emerald-700/70">
                                        Sesuai rubrik &amp; evaluasi instruktur
                                      </span>
                                    )}
                                  </p>
                                </div>
                              </div>

                              {/* Engine Auto-Feedback */}
                              {answer.feedback && (
                                <p className="m-0 text-[11px] text-zinc-500 leading-relaxed flex items-start gap-1.5">
                                  <span className="font-bold text-zinc-600 shrink-0">Catatan Sistem:</span>
                                  <span>{answer.feedback}</span>
                                </p>
                              )}
                            </div>
                          );
                        }
                      )}
                    </>
                  ) : (
                    /* Clean Non-Legacy Fallback when older DB record has no cbtResults */
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 sm:p-10">
                      <div className="max-w-md rounded-2xl border border-[#E6DED4] bg-white p-6 shadow-xs space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-[#C2530A] border border-amber-200">
                          <LandingIcon name="FileText" size={24} color="currentColor" />
                        </div>
                        <h3 className="m-0 text-sm sm:text-base font-extrabold text-[#0B2559]">
                          Data Ujian Versi Lama (Non-CBT)
                        </h3>
                        <p className="m-0 text-xs text-zinc-500 leading-relaxed">
                          Pengumpulan milik{" "}
                          <strong className="text-[#0B2559]">{selectedSubmission.studentName}</strong>{" "}
                          ini berasal dari sistem ujian lama sebelum fitur soal CBT langsung aktif,
                          sehingga tidak memiliki rincian jawaban per soal. Anda tetap dapat
                          memperbarui nilai akhir dan catatan evaluasi di panel sebelah kanan.
                        </p>
                        {selectedSubmission.answers?.studentNotes && (
                          <div className="rounded-xl bg-[#FBF6F1] border border-[#E6DED4] p-3 text-left text-xs text-[#3D4760]">
                            <span className="font-bold text-[#0B2559] block mb-0.5">
                              Catatan Siswa:
                            </span>
                            <span className="italic">
                              &ldquo;{String(selectedSubmission.answers.studentNotes)}&rdquo;
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-8 text-zinc-400 text-xs">
                Pilih siswa untuk meninjau rincian jawaban CBT.
              </div>
            )}
          </div>

          {/* Right Pane: CBT Score Validation & Certificate Issuance Panel */}
          <div className="w-full lg:w-[340px] shrink-0 bg-white rounded-2xl border border-[#E6DED4] p-4 shadow-xs flex flex-col lg:h-[calc(100vh-215px)] min-h-0 lg:min-h-[480px] overflow-y-auto space-y-3.5">
            {selectedSubmission ? (
              <>
                {/* Candidate Info Card */}
                <div className="bg-[#FBF6F1]/80 rounded-xl border border-[#E6DED4] p-3.5 space-y-2 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B2559] text-white font-extrabold text-sm">
                      {selectedSubmission.studentName[0]?.toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="m-0 text-sm font-extrabold text-[#0B2559] truncate">
                        {selectedSubmission.studentName}
                      </h2>
                      <p className="m-0 text-[11px] text-zinc-500 truncate">
                        {selectedSubmission.studentEmail}
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        selectedSubmission.status === "passed"
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedSubmission.status === "failed"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {selectedSubmission.status === "passed"
                        ? "Lulus"
                        : selectedSubmission.status === "failed"
                        ? "Remedial"
                        : "Pending"}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500 pt-1.5 border-t border-[#E6DED4] flex items-center justify-between">
                    <span>Waktu Selesai:</span>
                    <span suppressHydrationWarning className="font-bold text-[#0B2559]">
                      {mounted
                        ? new Date(selectedSubmission.submittedAt).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }) + " WIB"
                        : "..."}
                    </span>
                  </div>
                </div>

                {/* CBT Score Summary Card */}
                <div className="space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-[#0B2559] to-[#133882] text-white rounded-2xl p-4 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-200 block">
                            {computedCbt ? "Nilai Akhir dari Jawaban CBT" : "Nilai Akhir Ujian"}
                          </span>
                          <p className="m-0 text-[11px] text-blue-100/85 mt-0.5">
                            {getOfficialGradeLabel(effectiveFinalScore)}
                          </p>
                        </div>
                        <div className="flex items-baseline gap-1 shrink-0">
                          <span className="text-3xl font-black tracking-tight text-white">
                            {effectiveFinalScore}
                          </span>
                          <span className="text-xs font-bold text-blue-200">/100</span>
                        </div>
                      </div>

                      {computedCbt && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15 text-[11px]">
                          <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
                            <span className="text-[10px] text-blue-200 block">Jawaban Teks</span>
                            <strong className="font-extrabold text-white">
                              {computedCbt.readingScore}/100
                            </strong>
                          </div>
                          <div className="rounded-lg bg-white/10 px-2.5 py-1.5">
                            <span className="text-[10px] text-blue-200 block">Speaking CBT</span>
                            <strong className="font-extrabold text-white">
                              {computedCbt.speakingScore}/100
                            </strong>
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-white/15 flex items-center justify-between text-[11px]">
                        <span className="text-blue-200">
                          Standar Kelulusan (KKM {passingScore}):
                        </span>
                        <span
                          className={`font-black px-2 py-0.5 rounded-full text-[10px] ${
                            isPassingGrade
                              ? "bg-emerald-400/25 text-emerald-200 border border-emerald-300/35"
                              : "bg-amber-400/25 text-amber-200 border border-amber-300/35"
                          }`}
                        >
                          {isPassingGrade ? "LULUS" : "REMEDIAL"}
                        </span>
                      </div>
                    </div>

                    {/* Reset button if instructor adjusted per-question points */}
                    {computedCbt?.hasManualAdjustment && (
                      <button
                        type="button"
                        onClick={handleResetToAutoCbt}
                        className="w-full py-1.5 px-3 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] hover:bg-[#EFE7DD] text-[11px] font-bold text-[#0B2559] transition cursor-pointer"
                      >
                        ↺ Reset ke Poin Otomatis CBT
                      </button>
                    )}

                    {/* Single clean score input ONLY for old non-CBT records */}
                    {!computedCbt && (
                      <div className="rounded-xl border border-[#E6DED4] bg-[#FBF6F1]/60 p-3 space-y-1.5">
                        <label
                          htmlFor="legacy-final-score"
                          className="text-[11px] font-bold text-[#0B2559] block"
                        >
                          Nilai Akhir (0 – 100)
                        </label>
                        <input
                          id="legacy-final-score"
                          type="number"
                          min={0}
                          max={100}
                          value={legacyScore}
                          onChange={(e) =>
                            setLegacyScore(Math.max(0, Math.min(100, Number(e.target.value) || 0)))
                          }
                          className="w-full h-10 rounded-xl border border-[#D4C7B8] bg-white text-center text-lg font-black text-[#0B2559] focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 outline-none"
                        />
                      </div>
                    )}

                    {/* Status Notice */}
                    <div
                      className={`p-3 rounded-xl border text-[11px] leading-relaxed ${
                        isPassingGrade
                          ? "bg-emerald-50 text-emerald-900 border-emerald-200"
                          : "bg-amber-50 text-amber-900 border-amber-200"
                      }`}
                    >
                      {isPassingGrade ? (
                        <div className="flex items-start gap-2">
                          <LandingIcon name="CheckCircle" size={14} color="#059669" className="shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-extrabold">Lulus (Skor ≥ {passingScore})</strong>
                            <p className="m-0 mt-0.5 text-[10px] text-emerald-800">
                              Sertifikat kelulusan resmi ber-QR dengan tanda tangan digital Anda
                              otomatis diterbitkan ke akun siswa.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-2">
                          <LandingIcon name="RotateCcw" size={14} color="#d97706" className="shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-extrabold">Perlu Remedial (Skor &lt; {passingScore})</strong>
                            <p className="m-0 mt-0.5 text-[10px] text-amber-800">
                              Siswa dapat mengerjakan ulang ujian menggunakan{" "}
                              <strong>
                                {exam?.content?.remedialCbtQuestions?.length
                                  ? "Bank Soal Remedial (Set B)"
                                  : "Bank Soal Utama CBT"}
                              </strong>{" "}
                              langsung di sistem.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instructor Feedback */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="cbt-instructor-feedback"
                        className="text-[11px] font-bold text-[#0B2559] block"
                      >
                        Catatan &amp; Feedback Instruktur
                      </label>
                      <textarea
                        id="cbt-instructor-feedback"
                        rows={3}
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Tulis apresiasi, koreksi grammar/kosakata, atau arahan belajar untuk siswa..."
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E6DED4] bg-white placeholder:text-zinc-400 leading-relaxed focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 outline-none resize-none"
                      />

                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            appendFeedbackTemplate(
                              "Hasil ujian CBT sangat baik! Pemahaman kosakata dan kelancaran speaking sudah memenuhi target."
                            )
                          }
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBF6F1] hover:bg-[#EFE7DD] text-[#0B2559] border border-[#E6DED4] transition cursor-pointer"
                        >
                          + Hasil Sangat Baik
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            appendFeedbackTemplate(
                              "Perhatikan kembali struktur kalimat pada bagian Translate dan latih pengucapan Speaking."
                            )
                          }
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBF6F1] hover:bg-[#EFE7DD] text-[#0B2559] border border-[#E6DED4] transition cursor-pointer"
                        >
                          + Evaluasi Translate &amp; Speaking
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            appendFeedbackTemplate(
                              "Skor belum mencapai KKM. Silakan pelajari kembali modul dan kerjakan ujian Remedial CBT di sistem."
                            )
                          }
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition cursor-pointer"
                        >
                          + Arahan Remedial
                        </button>
                      </div>
                    </div>

                    {/* Error & Success Messages */}
                    {error && (
                      <div className="text-[11px] text-red-700 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 flex flex-col gap-2">
                        <span>{error}</span>
                        {error.toLowerCase().includes("tanda tangan") && (
                          <Link
                            href="/instructor/profile#tanda-tangan"
                            target="_blank"
                            className="inline-flex items-center gap-1.5 text-xs text-[#0062D1] hover:underline font-extrabold"
                          >
                            <span>Buka Profil untuk Upload Tanda Tangan &rarr;</span>
                          </Link>
                        )}
                      </div>
                    )}
                    {successMsg && (
                      <p className="m-0 text-[11px] text-emerald-800 font-bold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        {successMsg}
                      </p>
                    )}
                  </div>

                  {/* Digital Signature Gate Warning */}
                  {!instructorHasSignature && isPassingGrade && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 font-extrabold">
                        <LandingIcon name="Lock" size={14} color="#d97706" />
                        <span>Wajib Tanda Tangan Digital</span>
                      </div>
                      <p className="m-0 text-[11px] text-amber-800 leading-relaxed">
                        Unggah tanda tangan digital Anda di Profil Instruktur sebelum menerbitkan
                        sertifikat kelulusan siswa.
                      </p>
                      <Link
                        href="/instructor/profile#tanda-tangan"
                        target="_blank"
                        className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition"
                      >
                        Unggah Tanda Tangan &rarr;
                      </Link>
                    </div>
                  )}

                  {/* Save Button & Prev/Next */}
                  <div className="pt-2 border-t border-zinc-100 space-y-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleGrade}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${
                        isPassingGrade
                          ? "bg-[#F26A12] hover:bg-[#D65507]"
                          : "bg-[#0B2559] hover:bg-[#133882]"
                      }`}
                    >
                      <LandingIcon name={isPassingGrade ? "Award" : "FileText"} size={14} color="#fff" />
                      <span>
                        {saving
                          ? "Menyimpan..."
                          : isPassingGrade
                          ? "Simpan Nilai & Terbitkan Sertifikat"
                          : "Simpan Evaluasi (Remedial)"}
                      </span>
                    </button>

                    <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 pt-1">
                      <button
                        type="button"
                        onClick={handlePrev}
                        disabled={!hasPrev}
                        className="hover:text-[#0B2559] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        &larr; Sebelumnya
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!hasNext}
                        className="hover:text-[#0B2559] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        Berikutnya &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-zinc-400 text-xs">
                Pilih siswa untuk menilai ujian CBT.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
