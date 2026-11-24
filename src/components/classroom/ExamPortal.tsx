"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { Exam, ExamSubmission, Certificate } from "@/types/db";
import {
  type CbtQuestion,
  type CbtUserAnswer,
  type CbtExamResult,
  CBT_QUESTIONS_PER_EXAM,
  DEFAULT_CBT_QUESTIONS,
  getShuffledQuestionsForUser,
  gradeVocabMatchQuestion,
  gradeTextFillQuestion,
  gradeTranslateQuestion,
  gradeSpeakingQuestion,
  calculateCbtOverallResult,
} from "@/lib/exams/cbt";

export function ExamPortal({
  courseId,
  courseTitle,
  exam,
  submission,
  certificate,
  user,
}: {
  courseId: number;
  courseTitle: string;
  exam?: Exam | null;
  submission?: ExamSubmission | null;
  certificate?: Certificate | null;
  user: { id: number; name: string; email: string };
}) {
  const router = useRouter();

  // Mode Selection: "cbt" (Default Interactive Test) vs "pdf" (Legacy Upload)
  const [examMode, setExamMode] = useState<"cbt" | "pdf">("cbt");

  // CBT State Management
  const [cbtState, setCbtState] = useState<"lobby" | "in_progress" | "review" | "completed">("lobby");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, CbtUserAnswer>>({});
  const [currentTextResponse, setCurrentTextResponse] = useState("");
  const [currentSpeechTranscript, setCurrentSpeechTranscript] = useState("");

  // Per-Question Timer State (Cooldown in seconds)
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(90);
  const [totalSecondsElapsed, setTotalSecondsElapsed] = useState(0);

  // Audio Playback & Voice Recording State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioPlayCount, setAudioPlayCount] = useState(0);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Submission State
  const [submittingCbt, setSubmittingCbt] = useState(false);
  const [cbtResult, setCbtResult] = useState<CbtExamResult | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Refs for audio and timers
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecognitionActiveRef = useRef(false);

  // Check if student already has a previous completed submission
  const isPassed = submission ? submission.status === "passed" : Boolean(certificate);
  const isFailed = submission?.status === "failed";
  const isPending = submission?.status === "pending";

  const hasRemedialBank =
    Array.isArray(exam?.content?.remedialCbtQuestions) &&
    exam.content.remedialCbtQuestions.length > 0;
  const usingRemedialBank = Boolean(isFailed && hasRemedialBank);

  // Seeded Randomization: Draw 10 unique questions per user from the course CBT bank (or Remedial Set B)
  const { questions, sourceBankCount } = useMemo(() => {
    const customMain =
      Array.isArray(exam?.content?.cbtQuestions) && exam.content.cbtQuestions.length > 0
        ? (exam.content.cbtQuestions as CbtQuestion[])
        : null;
    const customRemedial =
      usingRemedialBank && Array.isArray(exam?.content?.remedialCbtQuestions)
        ? (exam.content.remedialCbtQuestions as CbtQuestion[])
        : null;
    const sourceBank = customRemedial || customMain || DEFAULT_CBT_QUESTIONS;
    const drawn = getShuffledQuestionsForUser(user.id, sourceBank, {
      count: CBT_QUESTIONS_PER_EXAM,
      courseId,
      isRemedial: Boolean(isFailed && !usingRemedialBank),
    });
    return { questions: drawn, sourceBankCount: sourceBank.length };
  }, [
    user.id,
    courseId,
    exam?.content?.cbtQuestions,
    exam?.content?.remedialCbtQuestions,
    usingRemedialBank,
    isFailed,
  ]);

  const timeRangeLabel = useMemo(() => {
    if (questions.length === 0) return "90 - 120 Detik";
    const times = questions.map((q) => q.timeLimitSeconds || 90);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    return minT === maxT ? `${minT} Detik` : `${minT} - ${maxT} Detik`;
  }, [questions]);

  const currentQ: CbtQuestion | undefined = questions[currentIndex];
  const passingScore = exam?.passingScore || 70;

  // Check for previous CBT results in submission answers
  useEffect(() => {
    if (submission?.answers?.cbtResults) {
      setCbtResult(submission.answers.cbtResults as CbtExamResult);
      setCbtState("completed");
    }
  }, [submission]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const full = (final + interim).trim();
        if (full) {
          setCurrentSpeechTranscript(full);
        }
      };

      recognition.onerror = () => {
        setIsRecordingVoice(false);
        isRecognitionActiveRef.current = false;
      };

      recognition.onend = () => {
        setIsRecordingVoice(false);
        isRecognitionActiveRef.current = false;
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current && isRecognitionActiveRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // Voice recording toggle
  function toggleVoiceRecording() {
    if (!speechSupported) {
      setError("Browser kamu belum mendukung Speech Recognition. Silakan gunakan Google Chrome atau ketik jawaban secara manual.");
      return;
    }

    if (isRecordingVoice) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsRecordingVoice(false);
      isRecognitionActiveRef.current = false;
    } else {
      setError("");
      setCurrentSpeechTranscript("");
      try {
        recognitionRef.current?.start();
        setIsRecordingVoice(true);
        isRecognitionActiveRef.current = true;
      } catch {
        setIsRecordingVoice(false);
        isRecognitionActiveRef.current = false;
      }
    }
  }

  // Audio Playback using Native Web Speech API
  // Rule: Audio can be played repeatedly, and cooldown timer continues running!
  function playQuestionAudio() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setError("Browser tidak mendukung text-to-speech.");
      return;
    }

    const textToSpeak = currentQ?.audioPrompt || currentQ?.question;
    if (!textToSpeak) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = "en-US";
    utterance.rate = 0.92;

    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => {
      setIsPlayingAudio(true);
      setAudioPlayCount((prev) => prev + 1);
    };
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    window.speechSynthesis.speak(utterance);
  }

  // Stop active speech and audio when changing questions
  function stopAllAudio() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      isRecognitionActiveRef.current = false;
      setIsRecordingVoice(false);
    }
  }

  // Start CBT Exam
  function handleStartCbt() {
    stopAllAudio();
    setCbtState("in_progress");
    setCurrentIndex(0);
    setUserAnswers({});
    setCurrentTextResponse("");
    setCurrentSpeechTranscript("");
    setTotalSecondsElapsed(0);
    setAudioPlayCount(0);
    setError("");

    const firstTimeLimit = questions[0]?.timeLimitSeconds || 90;
    setQuestionSecondsLeft(firstTimeLimit);
  }

  // Total Timer effect during exam
  useEffect(() => {
    if (cbtState === "in_progress") {
      totalTimerIntervalRef.current = setInterval(() => {
        setTotalSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      if (totalTimerIntervalRef.current) {
        clearInterval(totalTimerIntervalRef.current);
        totalTimerIntervalRef.current = null;
      }
    }

    return () => {
      if (totalTimerIntervalRef.current) {
        clearInterval(totalTimerIntervalRef.current);
        totalTimerIntervalRef.current = null;
      }
    };
  }, [cbtState]);

  // Per-Question Countdown Timer effect
  useEffect(() => {
    if (cbtState !== "in_progress") return;

    timerIntervalRef.current = setInterval(() => {
      setQuestionSecondsLeft((prev) => {
        if (prev <= 1) {
          // Timer expired for this question: Auto advance!
          handleLockAndNext(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [cbtState, currentIndex, currentTextResponse, currentSpeechTranscript]);

  // Auto-play audio on entering an audio question
  useEffect(() => {
    if (cbtState === "in_progress" && currentQ?.type === "audio_speaking") {
      const timeout = setTimeout(() => {
        playQuestionAudio();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [cbtState, currentIndex]);

  // Lock answer and advance to next question
  function handleLockAndNext(isTimeout = false) {
    if (!currentQ) return;
    stopAllAudio();

    const secondsTaken = currentQ.timeLimitSeconds - questionSecondsLeft;

    let evaluated: { earnedPoints: number; similarity: number; feedback: string };
    const rawResponse =
      currentQ.type === "audio_speaking"
        ? currentSpeechTranscript.trim()
        : currentTextResponse.trim();

    if (currentQ.type === "vocab_match") {
      evaluated = gradeVocabMatchQuestion(rawResponse, currentQ);
    } else if (currentQ.type === "translate") {
      evaluated = gradeTranslateQuestion(rawResponse, currentQ);
    } else if (currentQ.type === "text_fill") {
      evaluated = gradeTextFillQuestion(rawResponse, currentQ);
    } else {
      evaluated = gradeSpeakingQuestion(rawResponse, currentQ);
    }

    const answerRecord: CbtUserAnswer = {
      questionId: currentQ.id,
      type: currentQ.type,
      userResponse: rawResponse || (isTimeout ? "(Waktu habis)" : "(Kosong)"),
      secondsTaken: Math.max(1, secondsTaken),
      earnedPoints: evaluated.earnedPoints,
      maxPoints: currentQ.points,
      similarity: evaluated.similarity,
      feedback: evaluated.feedback,
      status: isTimeout && !rawResponse ? "timed_out" : rawResponse ? "answered" : "skipped",
    };

    const nextAnswers = {
      ...userAnswers,
      [currentQ.id]: answerRecord,
    };
    setUserAnswers(nextAnswers);

    if (currentIndex < questions.length - 1) {
      // Advance to next question
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setCurrentTextResponse("");
      setCurrentSpeechTranscript("");
      setAudioPlayCount(0);
      const nextLimit = questions[nextIdx]?.timeLimitSeconds || 90;
      setQuestionSecondsLeft(nextLimit);
    } else {
      // Final question reached: Complete and submit!
      handleFinishExam(nextAnswers);
    }
  }

  // Calculate final score and submit to backend API
  async function handleFinishExam(finalAnswers: Record<string, CbtUserAnswer>) {
    stopAllAudio();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (totalTimerIntervalRef.current) clearInterval(totalTimerIntervalRef.current);

    const overall = calculateCbtOverallResult(finalAnswers, questions, passingScore);
    setCbtResult(overall);
    setCbtState("completed");
    setSubmittingCbt(true);
    setError("");

    try {
      const res = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam?.id || 0,
          courseId,
          answers: {
            cbtResults: overall,
            totalSecondsElapsed,
            completedAt: new Date().toISOString(),
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan hasil ujian ke server.");
      }

      setSuccess(json.message || "Ujian berhasil dikumpulkan!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kendala saat mengirim hasil ujian. Hasil lokal Anda tetap tersimpan di layar.");
    } finally {
      setSubmittingCbt(false);
    }
  }

  // Format seconds to mm:ss
  function formatTime(sec: number) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-5 text-center sm:text-left">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[var(--brand)] border border-blue-100 shadow-2xs">
                <LandingIcon name="Award" size={13} color="currentColor" /> Computer-Based Test (CBT)
              </span>
              <span className="text-zinc-300 hidden sm:inline">•</span>
              <span className="text-xs text-zinc-500 font-semibold">{courseTitle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 font-[family-name:var(--font-heading)]">
              {exam?.title || `Final Competency Exam — ${courseTitle}`}
            </h2>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isPassed ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <LandingIcon name="Check" size={14} color="currentColor" /> Passed & Certified
              </span>
            ) : isFailed ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <LandingIcon name="RotateCcw" size={14} color="currentColor" /> Remedial Available
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <LandingIcon name="Clock" size={14} color="currentColor" /> Grading Recorded
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200">
                <LandingIcon name="Clock" size={14} color="currentColor" /> CBT Ready
              </span>
            )}
          </div>
        </div>

        {/* Exam Specifications */}
        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Passing Score</span>
            <span className="text-sm font-bold text-zinc-900">{passingScore} / 100 Points</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Format Soal</span>
            <span className="text-sm font-bold text-zinc-900">Vocab, Isian, Translate &amp; Speaking</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Waktu per Soal</span>
            <span className="text-sm font-bold text-zinc-900">{timeRangeLabel}</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Sistem Penilaian</span>
            <span className="text-sm font-bold text-blue-600">Levenshtein Typo Grading</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <LandingIcon name="AlertCircle" size={16} color="currentColor" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <LandingIcon name="CheckCircle" size={16} color="currentColor" />
          <span>{success}</span>
        </div>
      )}

      {/* VIEW 1: STUDENT PASSED (SHOW CERTIFICATE & SCORE) */}
      {isPassed && certificate && (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-50/50 via-white to-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <LandingIcon name="Award" size={32} color="#fff" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Official Completion Credential
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Congratulations, You Have Passed!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                Your official certificate of completion and academic transcript have been issued and can be downloaded or publicly verified.
              </p>
            </div>
          </div>

          {/* Scores Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">Final Exam Score:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-600">
                  {submission?.finalScore ?? certificate.finalScore}
                </span>
                <span className="text-xs text-zinc-400 font-bold">/ 100</span>
                <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                  Grade {certificate.grade}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">Competency Assessment:</span>
              <p className="text-xs text-zinc-700 font-medium italic mt-1 leading-relaxed">
                &ldquo;{submission?.instructorFeedback || "Excellent performance meeting professional English communication standards."}&rdquo;
              </p>
            </div>
          </div>

          {/* Action Buttons: Unduh Sertifikat & Rapor */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link
              href={`/certificates/${certificate.certificateCode}?view=certificate`}
              target="_blank"
              className="btn btn-primary btn-default inline-flex items-center gap-2 font-bold shadow-sm"
            >
              <LandingIcon name="Award" size={16} color="#fff" />
              <span>Unduh Sertifikat (PDF) &rarr;</span>
            </Link>
            <Link
              href={`/certificates/${certificate.certificateCode}?view=report`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-bold shadow-xs transition"
            >
              <LandingIcon name="FileText" size={15} color="currentColor" />
              <span>Unduh Rapor Nilai (PDF) &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* VIEW 2: CBT LOBBY (BEFORE STARTING TEST) */}
      {!isPassed && cbtState === "lobby" && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Petunjuk Teknis Ujian
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 font-[family-name:var(--font-heading)]">
                Peraturan & Cara Pengerjaan Soal CBT
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {usingRemedialBank && (
                <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Set B (Remedial)
                </span>
              )}
              {sourceBankCount > questions.length && (
                <span className="text-[11px] font-bold text-[#0062D1] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                  Soal Acak Unik ({questions.length} dari {sourceBankCount} Bank Soal)
                </span>
              )}
              <span className="text-xs text-zinc-500 font-medium">Total: <strong>{questions.length} Soal</strong></span>
            </div>
          </div>

          {(usingRemedialBank ? exam?.content?.remedialInstructions : exam?.content?.examInstructions) && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3.5 text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
              <span className="font-bold text-blue-900 block mb-1">Instruksi dari Instruktur:</span>
              {usingRemedialBank ? exam?.content?.remedialInstructions : exam?.content?.examInstructions}
            </div>
          )}

          {/* Rules List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border-2 border-blue-200 bg-blue-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                <LandingIcon name="FileText" size={16} color="var(--brand)" />
                <span>Tahap 1 (Pertama): Menulis Jawaban Teks</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Anda akan mengerjakan <strong>seluruh soal teks isian terlebih dahulu</strong>. Ketik jawabanmu di kotak isian. Sistem menggunakan <strong>Levenshtein Typo Scoring</strong>: typo ringan (kurang 1 huruf) tetap mendapat <strong>80% poin</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/60 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                <LandingIcon name="Volume2" size={16} color="#4338ca" />
                <span>Tahap 2 (Berikutnya): Soal Audio & Respon Suara</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Setelah soal teks selesai, Anda masuk ke <strong>soal audio & lisan</strong>. Dengarkan audio (<strong>boleh diputar berulang kali</strong>), lalu rekam jawaban lisanmu dalam bahasa Inggris menggunakan mikrofon.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <LandingIcon name="Clock" size={16} color="#b45309" />
                <span>Timer Cooldown per Nomor Soal</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Setiap nomor soal dibatasi <strong>{timeRangeLabel.toLowerCase()}</strong>. Saat memutar ulang audio, <strong>timer tetap berjalan mundur tanpa reset</strong>. Begitu waktu habis, jawaban otomatis tersimpan dan berpindah ke nomor berikutnya.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-950">
                <LandingIcon name="CheckCircle" size={16} color="#059669" />
                <span>Randomizer Berbeda Tiap Akun Siswa</span>
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed">
                {sourceBankCount > questions.length ? (
                  <>
                    Sistem memilih <strong>{questions.length} soal acak unik</strong> dari total <strong>{sourceBankCount} bank soal</strong> khusus berdasarkan ID akunmu sehingga <strong>paket soal &amp; urutannya berbeda dari siswa lain</strong>, tetap menjaga Tahap 1 teks lalu Tahap 2 audio.
                  </>
                ) : (
                  <>
                    Urutan soal teks dan audio diacak secara unik berdasarkan ID akunmu sehingga <strong>berbeda dari siswa lain</strong>, namun tetap menjaga urutan: menulis teks terlebih dahulu, lalu audio berikutnya.
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-100">
            <div className="text-xs text-zinc-500">
              Pastikan mikrofon dan speaker kamu berfungsi dengan baik sebelum memulai.
            </div>
            <button
              type="button"
              onClick={handleStartCbt}
              className="btn btn-primary btn-default w-full sm:w-auto flex items-center justify-center gap-2 font-bold px-8 py-3 shadow-md active:scale-95 transition"
            >
              <LandingIcon name="Play" size={16} color="#fff" />
              <span>Mulai Ujian CBT Sekarang &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: CBT IN PROGRESS (ACTIVE QUESTION SCREEN) */}
      {!isPassed && cbtState === "in_progress" && currentQ && (
        <div className="rounded-2xl border-2 border-blue-500/20 bg-white shadow-md overflow-hidden space-y-0">
          {/* Top Progress & Timer Bar */}
          <div className="bg-zinc-900 text-white p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black text-white ${
                currentQ.type === "vocab_match"
                  ? "bg-teal-600"
                  : currentQ.type === "translate"
                  ? "bg-amber-600"
                  : currentQ.type === "text_fill"
                  ? "bg-[#F26A12]"
                  : "bg-indigo-600"
              }`}>
                {currentIndex + 1}
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                  {currentQ.type === "vocab_match"
                    ? "Tahap 1: Vocabulary Matching (A–D)"
                    : currentQ.type === "translate"
                    ? "Tahap 1: Translate into English"
                    : currentQ.type === "text_fill"
                    ? "Tahap 1: Complete the Sentences"
                    : "Tahap 2: Speaking Interview (Audio & Suara)"}{" "}
                  • Soal {currentIndex + 1} dari {questions.length} • {currentQ.section}
                </span>
                <h4 className="text-sm font-bold text-white truncate max-w-xs sm:max-w-md">
                  {currentQ.title}
                </h4>
              </div>
            </div>

            {/* Countdown Cooldown Timer */}
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-black font-mono transition-all duration-300 ${
                  questionSecondsLeft <= 20
                    ? "bg-red-500/20 border-red-500 text-red-400 animate-pulse"
                    : "bg-zinc-800 border-zinc-700 text-amber-300"
                }`}
              >
                <LandingIcon name="Clock" size={14} color="currentColor" />
                <span>{formatTime(questionSecondsLeft)}</span>
              </div>
              <span className="text-[11px] text-zinc-400 hidden sm:inline">
                Total: {formatTime(totalSecondsElapsed)}
              </span>
            </div>
          </div>

          {/* Progress Indicator Bar */}
          <div className="h-1.5 w-full bg-zinc-100">
            <div
              className="h-full bg-[#F26A12] transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Main Question Body */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Passage (if any) */}
            {currentQ.passage && (
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200/80 text-xs text-zinc-700 leading-relaxed font-serif">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1 font-sans">
                  Konteks Bacaan:
                </span>
                {currentQ.passage}
              </div>
            )}

            {/* Question Prompt */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                  currentQ.type === "vocab_match"
                    ? "bg-teal-100 text-teal-800"
                    : currentQ.type === "translate"
                    ? "bg-amber-100 text-amber-900"
                    : currentQ.type === "text_fill"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-indigo-100 text-indigo-800"
                }`}>
                  {currentQ.type === "vocab_match"
                    ? "Vocabulary Matching"
                    : currentQ.type === "translate"
                    ? "Translate into English"
                    : currentQ.type === "text_fill"
                    ? "Complete the Sentences"
                    : "Speaking Interview Test"}
                </span>
                <span className="text-xs text-zinc-400 font-medium">• Bobot: {currentQ.points} Poin</span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                {currentQ.question}
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                {currentQ.instructions}
              </p>
            </div>

            {/* AUDIO PLAYER (FOR AUDIO QUESTIONS) */}
            {currentQ.type === "audio_speaking" && (
              <div className="p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                      <LandingIcon name="Volume2" size={24} color="#fff" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-800">
                        Audio Prompt
                      </span>
                      <p className="text-xs font-bold text-zinc-900">
                        {isPlayingAudio ? "Sedang Memutar Audio Suara..." : "Dengarkan Pertanyaan Audio"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={playQuestionAudio}
                      disabled={isPlayingAudio}
                      className="btn btn-sm bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 px-4 py-2 shadow-xs active:scale-95 transition"
                    >
                      <LandingIcon name={isPlayingAudio ? "RotateCcw" : "Play"} size={14} color="#fff" />
                      <span>{isPlayingAudio ? "Memutar..." : audioPlayCount > 0 ? "Putar Ulang Audio" : "Putar Audio"}</span>
                    </button>
                    {audioPlayCount > 0 && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                        Diputar {audioPlayCount}x
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-zinc-500 italic bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                  Tip: Audio bebas diputar berulang kali. Timer soal akan terus berjalan mundur.
                </p>
              </div>
            )}

            {/* ANSWERING AREA 0: VOCABULARY MATCHING (A-D) */}
            {currentQ.type === "vocab_match" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-800 block">
                  Pilih Jawaban yang Paling Tepat:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const letter = ["A", "B", "C", "D"][optIdx] || String(optIdx + 1);
                    const isPicked = currentTextResponse === opt;
                    return (
                      <button
                        key={`${currentQ.id}-opt-${optIdx}`}
                        type="button"
                        onClick={() => setCurrentTextResponse(opt)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition cursor-pointer ${
                          isPicked
                            ? "border-teal-600 bg-teal-50/80 ring-2 ring-teal-200 shadow-xs"
                            : "border-zinc-200 bg-white hover:border-teal-300 hover:bg-zinc-50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            isPicked
                              ? "bg-teal-600 text-white"
                              : "bg-zinc-100 text-zinc-700"
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm font-bold text-zinc-900">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ANSWERING AREA 1B: TRANSLATE INTO ENGLISH */}
            {currentQ.type === "translate" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-800 block">
                  Tulis Terjemahan Bahasa Inggris (Kalimat Lengkap):
                </label>
                <textarea
                  rows={3}
                  value={currentTextResponse}
                  onChange={(e) => setCurrentTextResponse(e.target.value)}
                  placeholder="Ketik terjemahan bahasa Inggris di sini..."
                  className="w-full rounded-xl border-2 border-amber-200 bg-white p-3.5 text-sm font-bold text-zinc-900 focus:border-amber-500 focus:outline-none transition shadow-xs"
                  autoFocus
                />
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <LandingIcon name="AlertCircle" size={13} color="currentColor" />
                  <span>Sistem menilai kecocokan struktur kalimat dan kata kunci terjemahan bahasa Inggris secara otomatis.</span>
                </p>
              </div>
            )}

            {/* ANSWERING AREA 1: TEXT FILL-IN-THE-BLANK */}
            {currentQ.type === "text_fill" && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-800 block">
                  Ketik Jawaban Isian:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={currentTextResponse}
                    onChange={(e) => setCurrentTextResponse(e.target.value)}
                    placeholder="Ketik kata/frasa jawaban di sini..."
                    className="w-full rounded-xl border-2 border-blue-200 bg-white p-3.5 text-sm font-bold text-zinc-900 focus:border-blue-600 focus:outline-none transition shadow-xs"
                    autoFocus
                  />
                  {currentTextResponse && (
                    <button
                      type="button"
                      onClick={() => setCurrentTextResponse("")}
                      className="absolute right-3 top-3.5 text-xs text-zinc-400 hover:text-zinc-600"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500 flex items-center gap-1.5">
                  <LandingIcon name="AlertCircle" size={13} color="currentColor" />
                  <span>Sistem menilai ketikan secara cerdas: typo ringan (kurang 1 huruf) tetap mendapat poin parsial.</span>
                </p>
              </div>
            )}

            {/* ANSWERING AREA 2: VOICE RECORDING (SPEAKING) */}
            {currentQ.type === "audio_speaking" && (
              <div className="space-y-4 pt-2">
                <label className="text-xs font-bold text-zinc-800 block">
                  Jawab dengan Suara Lisan (Microphone):
                </label>

                <div className="p-6 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 flex flex-col items-center justify-center text-center space-y-3">
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`h-16 w-16 rounded-full flex items-center justify-center shadow-md active:scale-95 transition-all duration-300 ${
                      isRecordingVoice
                        ? "bg-red-600 text-white animate-pulse ring-4 ring-red-200 shadow-red-500/30"
                        : "bg-[#F26A12] hover:bg-[#D65507] text-white"
                    }`}
                  >
                    <LandingIcon name={isRecordingVoice ? "Square" : "Mic"} size={26} color="#fff" />
                  </button>

                  <div>
                    <p className="text-sm font-bold text-zinc-900">
                      {isRecordingVoice ? "Mendengarkan ucapanmu... (Bicara sekarang)" : "Tekan untuk Mulai Merekam Suara"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {isRecordingVoice ? "Klik tombol merah untuk berhenti merekam." : "Sampaikan jawabanmu dalam bahasa Inggris secara jelas."}
                    </p>
                  </div>
                </div>

                {/* Live Transcript Box */}
                {currentSpeechTranscript ? (
                  <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Transkrip Ucapan Terdeteksi:
                    </span>
                    <p className="text-xs font-bold text-zinc-900 leading-relaxed italic">
                      &ldquo;{currentSpeechTranscript}&rdquo;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="text-[11px] text-zinc-400 font-medium block">
                      Kendala mikrofon? Kamu juga bisa mengetik jawaban lisanmu secara manual:
                    </span>
                    <input
                      type="text"
                      value={currentSpeechTranscript}
                      onChange={(e) => setCurrentSpeechTranscript(e.target.value)}
                      placeholder="Atau ketik kalimat jawaban lisanmu di sini..."
                      className="input input-default w-full text-xs font-medium"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Footer */}
          <div className="p-5 bg-zinc-50 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-zinc-500 font-medium text-center sm:text-left">
              Penting: Begitu lanjut, jawaban dikunci dan kamu tidak dapat kembali ke soal ini.
            </span>

            <button
              type="button"
              onClick={() => handleLockAndNext(false)}
              className="btn btn-primary btn-default w-full sm:w-auto flex items-center justify-center gap-2 font-bold px-6 shadow-xs active:scale-95 transition"
            >
              <span>
                {currentIndex < questions.length - 1
                  ? "Kunci & Lanjut ke Soal Berikutnya \u2192"
                  : "Kunci & Kumpulkan Jawaban Ujian \u2713"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 4: COMPLETED CBT RESULT & REVIEW */}
      {!isPassed && cbtState === "completed" && cbtResult && (
        <div className="rounded-2xl border-2 border-zinc-200 bg-white p-6 sm:p-8 shadow-xs space-y-6 animate-in fade-in">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left border-b border-zinc-100 pb-6">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white font-black text-2xl shadow-md ${
              cbtResult.passed ? "bg-emerald-500 shadow-emerald-500/20" : "bg-amber-500 shadow-amber-500/20"
            }`}>
              {cbtResult.finalPercentage}
            </div>

            <div className="min-w-0">
              <span className={`text-xs font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-block mb-1 ${
                cbtResult.passed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                {cbtResult.passed ? "STATUS: LULUS (PASSED)" : "STATUS: BELUM LULUS (REMEDIAL TERSEDIA)"}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {cbtResult.passed
                  ? "Selamat! Nilai Ujian Kamu Memenuhi Syarat Kelulusan"
                  : "Hasil Ujian Belum Mencapai Batas Kelulusan"}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                Total Skor: <strong>{cbtResult.totalEarnedPoints}</strong> dari {cbtResult.totalPossiblePoints} poin maksimal (Persentase: {cbtResult.finalPercentage}% • Passing Score: {passingScore}%).
              </p>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 text-center">
              <span className="text-xs font-bold text-blue-900 block">Skor Soal Teks (Reading & Grammar)</span>
              <span className="text-2xl font-black text-blue-700">{cbtResult.readingScore}%</span>
            </div>
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 text-center">
              <span className="text-xs font-bold text-indigo-900 block">Skor Soal Audio & Lisan (Speaking)</span>
              <span className="text-2xl font-black text-indigo-700">{cbtResult.speakingScore}%</span>
            </div>
          </div>

          {/* Question Breakdown Review */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-zinc-900">
              Rincian Evaluasi Jawaban per Nomor:
            </h4>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const ans = cbtResult.answers[q.id];
                const earned = ans ? ans.earnedPoints : 0;
                const isFull = earned >= q.points * 0.95;
                const isPartial = earned > 0 && !isFull;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      isFull
                        ? "border-emerald-200 bg-emerald-50/30"
                        : isPartial
                        ? "border-amber-200 bg-amber-50/30"
                        : "border-red-200 bg-red-50/30"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-zinc-900">
                        {idx + 1}. {q.title} ({q.type === "text_fill" ? "Teks Isian" : "Audio Lisan"})
                      </span>
                      <span className={isFull ? "text-emerald-700" : isPartial ? "text-amber-700" : "text-red-700"}>
                        {earned} / {q.points} Poin
                      </span>
                    </div>

                    <p className="text-zinc-600 font-medium">{q.question}</p>

                    <div className="bg-white p-3 rounded-lg border border-zinc-200/80 space-y-1">
                      <div>
                        <span className="text-zinc-400 font-semibold">Jawaban Kamu: </span>
                        <strong className="text-zinc-900">{ans?.userResponse || "(Tidak dijawab)"}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-400 font-semibold">Kunci Target: </span>
                        <span className="text-emerald-700 font-bold">{q.targetAnswer}</span>
                      </div>
                      <div className="pt-1 text-[11px] text-zinc-500 italic">
                        {ans?.feedback || "Evaluasi otomatis selesai."}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Retake / Back to Course Button */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100">
            {!cbtResult.passed && (
              <button
                type="button"
                onClick={handleStartCbt}
                className="btn btn-secondary btn-default flex items-center gap-2 font-bold text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                <LandingIcon name="RotateCcw" size={15} color="currentColor" />
                <span>Ulangi Ujian (Remedial CBT) &rarr;</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => router.refresh()}
              className="btn btn-primary btn-default font-bold ml-auto"
            >
              <span>Refresh Status & Kembali ke Kelas &rarr;</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
