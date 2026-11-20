"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";
import {
  PART1_GOAL_OPTIONS,
  PART1_SITUATION_OPTIONS,
  PART2_LISTENING_QUESTIONS,
  PART3_CONTEXT_QUESTIONS,
  PART4_SPEAKING_PROMPTS,
} from "@/lib/ready-check/questions";
import {
  READY_CHECK_STORAGE_KEY,
  type ProgramGoalSlug,
  type ReadyCheckResult,
} from "@/lib/ready-check/types";
import { ReadyCheckResultView } from "./ReadyCheckResultView";

type FlowStage = "intro" | "step1" | "step2" | "step3" | "step4" | "result";

const INTRO_ITEMS = [
  {
    num: 1,
    title: "Tentang kamu",
    desc: "Tujuan belajar & tingkat percaya diri",
    duration: "1–2 mnt",
    accent: false,
  },
  {
    num: 2,
    title: "Pemahaman mendengar",
    desc: "3 potongan audio rapat & koordinasi kerja",
    duration: "2–3 mnt",
    accent: false,
  },
  {
    num: 3,
    title: "Bahasa konteks kerja",
    desc: "Pilihan kata & nada komunikasi lintas budaya",
    duration: "2–3 mnt",
    accent: false,
  },
  {
    num: 4,
    title: "Tugas bicara (AI)",
    desc: "2 skenario singkat, rekam suaramu langsung",
    duration: "3 mnt",
    accent: true,
  },
];

const STEPPER_META = [
  { index: 1, short: "Profil" },
  { index: 2, short: "Mendengar" },
  { index: 3, short: "Konteks" },
  { index: 4, short: "Bicara" },
];

const OPTION_LETTERS = ["A", "B", "C", "D"];

const WAVEFORM_BASE = [14, 26, 38, 22, 34, 46, 28, 18, 42, 30, 20, 36, 24, 16, 28, 14];

function GoalIcon({ goalId, active }: { goalId: ProgramGoalSlug; active: boolean }) {
  const stroke = active ? "#0073F5" : "#4A5468";
  if (goalId === "ready-to-speak") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (goalId === "ready-for-work") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  }
  if (goalId === "ready-to-go") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function getConfidenceDescriptor(val: number): { label: string; colorClass: string } {
  if (val <= 1.8) return { label: "Sering freeze & ragu", colorClass: "bg-rose-50 text-rose-700 border-rose-200" };
  if (val <= 2.6) return { label: "Masih agak grogi", colorClass: "bg-[#FFF4EC] text-[#C2530A] border-[#F26A12]/30" };
  if (val <= 3.5) return { label: "Tergantung topik", colorClass: "bg-blue-50 text-[#0062D1] border-blue-200" };
  if (val <= 4.3) return { label: "Cukup percaya diri", colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  return { label: "Sangat yakin bicara", colorClass: "bg-emerald-100 text-emerald-800 border-emerald-300" };
}

export function ReadyCheckFlow({
  userName,
  isLoggedIn,
  startDirectly,
  autoSaveOnMount,
}: {
  userName?: string | null;
  isLoggedIn: boolean;
  startDirectly: boolean;
  autoSaveOnMount: boolean;
}) {
  const [stage, setStage] = useState<FlowStage>(startDirectly ? "step1" : "intro");
  const [consentChecked, setConsentChecked] = useState(startDirectly);

  // Step 1 state
  const [selectedGoal, setSelectedGoal] = useState<ProgramGoalSlug>("ready-for-work");
  const [confidenceScore, setConfidenceScore] = useState<number>(2.6);
  const [hardSituations, setHardSituations] = useState<string[]>(["wawancara", "rapat"]);

  // Step 2 state (Listening)
  const [listenIdx, setListenIdx] = useState(0);
  const [part2Answers, setPart2Answers] = useState<Record<string, number>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRate, setAudioRate] = useState<number>(0.96);
  const [showTranscriptHelper, setShowTranscriptHelper] = useState(false);

  // Step 3 state (Workplace context)
  const [contextIdx, setContextIdx] = useState(0);
  const [part3Answers, setPart3Answers] = useState<Record<string, number>>({});

  // Step 4 state (Speaking)
  const [speakIdx, setSpeakIdx] = useState(0);
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [rerecordedMap, setRerecordedMap] = useState<Record<string, boolean>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micNote, setMicNote] = useState<string | null>(null);
  const [showTextFallback, setShowTextFallback] = useState(false);

  // Result & submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSavingBaseline, setIsSavingBaseline] = useState(false);
  const [result, setResult] = useState<ReadyCheckResult | null>(null);

  interface SpeechRecognitionResultEventLike {
    results: ArrayLike<ArrayLike<{ transcript: string }>>;
  }

  interface SpeechRecognitionErrorEventLike {
    error?: string;
  }

  interface BrowserSpeechRecognition {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onstart: (() => void) | null;
    onend: (() => void) | null;
    onerror: ((e: SpeechRecognitionErrorEventLike) => void) | null;
    onresult: ((e: SpeechRecognitionResultEventLike) => void) | null;
  }

  type WindowWithSpeech = Window & {
    SpeechRecognition?: new () => BrowserSpeechRecognition;
    webkitSpeechRecognition?: new () => BrowserSpeechRecognition;
  };

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isRecognitionRunningRef = useRef(false);

  // Auto-restore pending evaluation when returning from Google OAuth (?save=1)
  useEffect(() => {
    if (!autoSaveOnMount) return;
    let active = true;
    void (async () => {
      await Promise.resolve();
      if (!active) return;
      try {
        const raw = localStorage.getItem(READY_CHECK_STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw) as ReadyCheckResult;
        if (parsed && typeof parsed.overallScore === "number") {
          setResult(parsed);
          setStage("result");
          if (isLoggedIn && !parsed.saved) {
            await saveResultToAccount(parsed);
          }
        }
      } catch {
        // ignore invalid storage
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSaveOnMount, isLoggedIn]);

  // Setup browser speech recognition once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithSpeech;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      isRecognitionRunningRef.current = true;
    };
    rec.onend = () => {
      isRecognitionRunningRef.current = false;
    };
    rec.onerror = (e: SpeechRecognitionErrorEventLike) => {
      isRecognitionRunningRef.current = false;
      if (e?.error === "not-allowed" || e?.error === "audio-capture") {
        setMicNote("Mikrofon tidak diizinkan atau tidak terdeteksi. Tenang, kamu tetap bisa mengetik jawabanmu di bawah.");
        setShowTextFallback(true);
      }
    };
    rec.onresult = (event: SpeechRecognitionResultEventLike) => {
      let captured = "";
      for (let i = 0; i < event.results.length; i++) {
        captured += event.results[i][0].transcript + " ";
      }
      const currentPrompt = PART4_SPEAKING_PROMPTS[speakIdx];
      if (currentPrompt && captured.trim()) {
        setTranscripts((prev) => ({
          ...prev,
          [currentPrompt.id]: captured.trim(),
        }));
      }
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        // ignore
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebind active prompt index for speech result handler
  useEffect(() => {
    if (!recognitionRef.current) return;
    const currentPrompt = PART4_SPEAKING_PROMPTS[speakIdx];
    recognitionRef.current.onresult = (event: SpeechRecognitionResultEventLike) => {
      let captured = "";
      for (let i = 0; i < event.results.length; i++) {
        captured += event.results[i][0].transcript + " ";
      }
      if (currentPrompt && captured.trim()) {
        setTranscripts((prev) => ({
          ...prev,
          [currentPrompt.id]: captured.trim(),
        }));
      }
    };
  }, [speakIdx]);

  // Smooth scroll top on stage/question change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stage, listenIdx, contextIdx, speakIdx]);

  // Keyboard shortcuts 1-4 for Step 2 & Step 3 options
  useEffect(() => {
    if (stage !== "step2" && stage !== "step3") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      const num = Number(e.key);
      if (num >= 1 && num <= 4) {
        const idx = num - 1;
        if (stage === "step2") {
          const q = PART2_LISTENING_QUESTIONS[listenIdx];
          if (q && idx < q.options.length) {
            setPart2Answers((prev) => ({ ...prev, [q.id]: idx }));
          }
        } else if (stage === "step3") {
          const q = PART3_CONTEXT_QUESTIONS[contextIdx];
          if (q && idx < q.options.length) {
            setPart3Answers((prev) => ({ ...prev, [q.id]: idx }));
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [stage, listenIdx, contextIdx]);

  function stopAudioPlayback() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  }

  function stopRecordingCleanup() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      isRecognitionRunningRef.current = false;
    }
    setIsRecording(false);
  }

  function toggleListeningClip(script: string, overrideRate?: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setShowTranscriptHelper(true);
      return;
    }
    if (isPlayingAudio && overrideRate === undefined) {
      stopAudioPlayback();
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(script);
    utt.lang = "en-US";
    utt.rate = overrideRate ?? audioRate;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utt.voice = enVoice;
    utt.onstart = () => setIsPlayingAudio(true);
    utt.onend = () => setIsPlayingAudio(false);
    utt.onerror = () => {
      setIsPlayingAudio(false);
      setShowTranscriptHelper(true);
    };
    window.speechSynthesis.speak(utt);
  }

  function toggleSituation(id: string) {
    setHardSituations((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
      }
      if (prev.length >= 2) {
        return [prev[1], id];
      }
      return [...prev, id];
    });
  }

  function toggleVoiceRecording() {
    const currentPrompt = PART4_SPEAKING_PROMPTS[speakIdx];
    if (!currentPrompt) return;

    if (!isRecording) {
      setMicNote(null);
      setSubmitError(null);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recognitionRef.current && !isRecognitionRunningRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setShowTextFallback(true);
        }
      } else if (!recognitionRef.current) {
        setShowTextFallback(true);
        setMicNote("Browser ini belum mendukung dikte suara otomatis. Silakan ketik jawabanmu di bawah.");
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          const next = prev + 1;
          setDurations((d) => ({ ...d, [currentPrompt.id]: next }));
          if (next >= currentPrompt.targetSeconds) {
            stopRecordingCleanup();
          }
          return next;
        });
      }, 1000);
    } else {
      stopRecordingCleanup();
      setDurations((d) => ({
        ...d,
        [currentPrompt.id]: Math.max(recordingSeconds, 12),
      }));
    }
  }

  function handleRerecordCurrent() {
    const currentPrompt = PART4_SPEAKING_PROMPTS[speakIdx];
    if (!currentPrompt || rerecordedMap[currentPrompt.id]) return;
    stopRecordingCleanup();
    setRecordingSeconds(0);
    setTranscripts((prev) => ({ ...prev, [currentPrompt.id]: "" }));
    setDurations((prev) => ({ ...prev, [currentPrompt.id]: 0 }));
    setRerecordedMap((prev) => ({ ...prev, [currentPrompt.id]: true }));
  }

  async function submitAllAndEvaluate() {
    stopRecordingCleanup();
    stopAudioPlayback();
    setSubmitError(null);
    setIsSubmitting(true);

    const speakingResponses = PART4_SPEAKING_PROMPTS.map((p) => ({
      promptId: p.id,
      promptTitle: p.question,
      transcript: transcripts[p.id] ?? "",
      durationSeconds: durations[p.id] ?? 25,
    }));

    try {
      const res = await fetch("/api/ready-check/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: selectedGoal,
          confidenceScore,
          hardSituations,
          part2Answers,
          part3Answers,
          speakingResponses,
          saveIfLoggedIn: true,
        }),
      });
      const json = await res.json();
      if (res.ok && json.result) {
        try {
          localStorage.setItem(READY_CHECK_STORAGE_KEY, JSON.stringify(json.result));
        } catch {
          // ignore storage quota errors
        }
        setResult(json.result);
        setStage("result");
      } else {
        setSubmitError(json?.error || "Gagal mengevaluasi jawaban. Silakan coba klik sekali lagi.");
      }
    } catch (err) {
      console.error("[Ready Check submit error]:", err);
      setSubmitError("Koneksi terganggu saat menilai hasil. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveResultToAccount(targetResult?: ReadyCheckResult) {
    const active = targetResult ?? result;
    if (!active) return;
    setIsSavingBaseline(true);
    try {
      const res = await fetch("/api/ready-check/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overallScore: active.overallScore,
          levelTitle: active.levelTitle,
          cefrEstimate: active.cefrEstimate,
          dimensions: active.dimensions,
          confidenceIndex: active.confidenceIndex,
          hardestSituations: active.hardestSituations,
          recommendedGoalSlug: active.recommendedGoalSlug,
          feedbackText: active.feedbackText,
          primaryTranscript: active.primaryTranscript,
          durationSeconds: active.durationSeconds,
          corrections: active.corrections,
        }),
      });
      if (res.ok) {
        const updated = { ...active, saved: true };
        setResult(updated);
        try {
          localStorage.setItem(READY_CHECK_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
    } finally {
      setIsSavingBaseline(false);
    }
  }

  function resetAll() {
    stopRecordingCleanup();
    stopAudioPlayback();
    setStage("step1");
    setListenIdx(0);
    setContextIdx(0);
    setSpeakIdx(0);
    setRecordingSeconds(0);
    setSubmitError(null);
    setResult(null);
  }

  if (stage === "result" && result) {
    return (
      <ReadyCheckResultView
        result={result}
        userName={userName}
        isLoggedIn={isLoggedIn}
        isSaving={isSavingBaseline}
        onSaveBaseline={() => saveResultToAccount()}
        onRetake={resetAll}
      />
    );
  }

  // AI Evaluating Fullscreen Overlay
  if (isSubmitting) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FBF6F1] px-4 font-sans text-[#0B2559]">
        <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-[28px] border border-[#E6DED4] bg-white p-8 text-center shadow-[0_12px_40px_rgba(11,37,89,0.08)]">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-[#F26A12]/20" />
            <span className="absolute inset-2 animate-pulse rounded-full bg-[#0073F5]/15" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B2559] shadow-md">
              <EnglishReadyLogo variant="icon" height={34} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="m-0 text-xl font-extrabold tracking-[-0.02em] text-[#0B2559]">
              Menilai Ready Score Kamu...
            </h2>
            <p className="m-0 text-sm leading-relaxed text-[#4A5468]">
              AI Evaluator sedang menganalisis kelancaran, pelafalan, konteks kerja, dan menyusun rekomendasi program terbaikmu.
            </p>
          </div>

          <div className="w-full space-y-2 rounded-2xl bg-[#FBF6F1] p-4 text-left text-xs font-semibold text-[#3D4760]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>Memetakan 5 dimensi kesiapan komunikasi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#0073F5]" />
              <span>Menghitung estimasi level CEFR (A1–C1+)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#F26A12]" />
              <span>Menyiapkan saran frasa &amp; rekomendasi kelas</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // INTRO SCREEN (Responsive 2-Column Split on Desktop, Clean Vertical on Mobile)
  if (stage === "intro") {
    return (
      <div className="flex min-h-screen flex-col bg-[#FBF6F1] font-sans text-[#0B2559]">
        <header className="sticky top-0 z-30 border-b border-[#E6DED4] bg-white/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-2.5">
              <EnglishReadyLogo variant="icon" height={30} />
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-[-0.02em] sm:text-[17px]">
                  Ready Check
                </span>
                <span className="rounded-full bg-[#FFF4EC] px-2.5 py-0.5 text-[11px] font-extrabold text-[#C2530A]">
                  Gratis · 10 Menit
                </span>
              </div>
            </div>
            <Link
              href="/"
              aria-label="Kembali ke beranda"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3 py-2 text-xs font-bold text-[#0B2559] no-underline transition hover:bg-[#F5ECE3]"
            >
              <span>Keluar</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Link>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:py-12">
          {/* Left Hero Column */}
          <div className="space-y-5 lg:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F26A12]/30 bg-[#FFF4EC] px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#C2530A]">
              <span className="h-2 w-2 rounded-full bg-[#F26A12]" />
              Asesmen Kesiapan Bahasa Inggris
            </div>

            <h1 className="m-0 text-3xl font-black leading-[1.12] tracking-[-0.03em] text-[#0B2559] sm:text-4xl">
              10 menit untuk tahu seberapa siap bahasa Inggrismu
            </h1>

            <p className="m-0 text-[15.5px] leading-relaxed text-[#3D4760]">
              Empat bagian singkat berbasis situasi kerja nyata. Tidak ada jawaban yang memalukan—kami hanya ingin memetakan titik awalmu secara akurat.
            </p>

            <div className="space-y-2.5 pt-1 text-sm text-[#3D4760]">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#0073F5]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                  </svg>
                </span>
                <span>Simulasi audio rapat &amp; komunikasi bisnis nyata</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#C2530A]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
                  </svg>
                </span>
                <span>Rekam 2 jawaban singkat + umpan balik AI instan</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Hasil skor 0–100, estimasi CEFR, &amp; rekomendasi kelas</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-2xl border border-[#E6DED4] bg-white/80 px-4 py-3 text-xs font-medium text-[#4A5468]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0073F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Siapkan mikrofon dan tempat yang cukup tenang (opsi ketik tersedia jika tanpa mic).</span>
            </div>
          </div>

          {/* Right Roadmap & Start Card */}
          <div className="rounded-[26px] border border-[#E6DED4] bg-white p-5 shadow-[0_10px_34px_rgba(11,37,89,0.06)] sm:p-7 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="m-0 text-base font-extrabold text-[#0B2559]">Alur 4 Bagian Tes</h2>
              <span className="rounded-lg bg-[#FBF6F1] px-2.5 py-1 text-xs font-bold text-[#4A5468]">
                Total ~10 menit
              </span>
            </div>

            <div className="space-y-2.5">
              {INTRO_ITEMS.map((item) => (
                <div
                  key={item.num}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/70 px-4 py-3.5"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white shadow-2xs ${
                        item.accent ? "bg-[#F26A12]" : "bg-[#0B2559]"
                      }`}
                    >
                      {item.num}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-extrabold text-[#0B2559]">{item.title}</div>
                      <div className="text-xs text-[#4A5468]">{item.desc}</div>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-lg border border-[#E6DED4] bg-white px-2.5 py-1 text-[11px] font-bold text-[#4A5468]">
                    {item.duration}
                  </span>
                </div>
              ))}
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1]/50 p-4 text-xs leading-relaxed text-[#0B2559] transition hover:border-[#0B2559]/30 sm:text-[13px]">
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#0B2559]"
              />
              <span>
                Saya setuju rekaman suara dan jawaban dipakai{" "}
                <strong className="font-extrabold">hanya untuk penilaian Ready Score</strong>. Tidak
                dipublikasikan tanpa izin terpisah.
              </span>
            </label>

            <div className="mt-5 space-y-2.5">
              <button
                type="button"
                disabled={!consentChecked}
                onClick={() => setStage("step1")}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#F26A12] px-5 py-4 text-center text-base font-extrabold text-white shadow-sm transition hover:bg-[#C2530A] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none"
              >
                <span>Mulai Ready Check Sekarang</span>
                <span aria-hidden="true">&rarr;</span>
              </button>
              <p className="m-0 text-center text-xs text-[#4A5468]">
                {isLoggedIn
                  ? "Kamu sudah login · Hasil akan siap disimpan otomatis ke akunmu."
                  : "Bisa langsung tes tanpa login. Login hanya diperlukan jika ingin menyimpan hasil."}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Step calculations for header & 4-segment progress bar
  const stepIndex = stage === "step1" ? 1 : stage === "step2" ? 2 : stage === "step3" ? 3 : 4;
  const stepLabel =
    stage === "step1"
      ? "Profil & Tujuan"
      : stage === "step2"
      ? "Pemahaman Mendengar"
      : stage === "step3"
      ? "Bahasa Konteks Kerja"
      : "Tugas Bicara (AI)";

  const counterText =
    stage === "step1"
      ? "1 / 1"
      : stage === "step2"
      ? `Soal ${listenIdx + 1} / ${PART2_LISTENING_QUESTIONS.length}`
      : stage === "step3"
      ? `Soal ${contextIdx + 1} / ${PART3_CONTEXT_QUESTIONS.length}`
      : `Skenario ${speakIdx + 1} / ${PART4_SPEAKING_PROMPTS.length}`;

  const currentListeningQ = PART2_LISTENING_QUESTIONS[listenIdx];
  const currentContextQ = PART3_CONTEXT_QUESTIONS[contextIdx];
  const currentSpeakingPrompt = PART4_SPEAKING_PROMPTS[speakIdx];

  const handleHeaderBack = () => {
    stopRecordingCleanup();
    stopAudioPlayback();
    setShowTranscriptHelper(false);
    if (stage === "step1") setStage("intro");
    else if (stage === "step2") {
      if (listenIdx > 0) setListenIdx((i) => i - 1);
      else setStage("step1");
    } else if (stage === "step3") {
      if (contextIdx > 0) setContextIdx((i) => i - 1);
      else setStage("step2");
    } else if (stage === "step4") {
      if (speakIdx > 0) setSpeakIdx((i) => i - 1);
      else setStage("step3");
    }
  };

  const formattedTime = `0:${String(recordingSeconds).padStart(2, "0")}`;
  const currentSpeakText = currentSpeakingPrompt ? transcripts[currentSpeakingPrompt.id] ?? "" : "";
  const currentSpeakWordCount = currentSpeakText.trim()
    ? currentSpeakText.trim().split(/\s+/).length
    : 0;
  const recordingPct = currentSpeakingPrompt
    ? Math.min(100, Math.round((recordingSeconds / currentSpeakingPrompt.targetSeconds) * 100))
    : 0;

  const canProceedSpeak = Boolean(
    isRecording ||
      currentSpeakText.trim().length > 0 ||
      (currentSpeakingPrompt && (durations[currentSpeakingPrompt.id] ?? 0) > 0)
  );
  const canSubmitReadyCheck = Boolean(
    canProceedSpeak ||
      Object.values(transcripts).some((t) => t.trim().length > 0) ||
      Object.values(durations).some((d) => d > 0)
  );

  const confidenceMeta = getConfidenceDescriptor(confidenceScore);

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF6F1] font-sans text-[#0B2559]">
      {/* Sticky Top Progress Header with Named 4-Step Stepper */}
      <header className="sticky top-0 z-30 border-b border-[#E6DED4] bg-white/95 px-4 pb-3.5 pt-3 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {/* Top Row */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleHeaderBack}
              aria-label="Kembali"
              className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-xl border border-[#E6DED4] bg-white px-2.5 text-xs font-bold text-[#0B2559] transition hover:bg-[#F5ECE3]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              <span className="hidden sm:inline">Kembali</span>
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.06em] text-[#C2530A] sm:hidden">
                  Bagian {stepIndex}/4
                </span>
                <span className="text-sm font-extrabold text-[#0B2559]">{stepLabel}</span>
              </div>
              <span className="text-[11px] font-semibold text-[#64748B]">{counterText}</span>
            </div>

            <Link
              href="/"
              onClick={() => {
                stopRecordingCleanup();
                stopAudioPlayback();
              }}
              className="inline-flex h-9 items-center justify-center rounded-xl px-2.5 text-xs font-bold text-[#64748B] no-underline transition hover:bg-[#F5ECE3] hover:text-[#0B2559]"
            >
              Keluar
            </Link>
          </div>

          {/* 4-Step Named Stepper + Progress Bar */}
          <div
            className="grid grid-cols-4 gap-2"
            role="progressbar"
            aria-label="Progres Ready Check"
            aria-valuenow={stepIndex * 25}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            {STEPPER_META.map((seg) => {
              const isCompleted = seg.index < stepIndex;
              const isCurrent = seg.index === stepIndex;

              let fillPct = 0;
              if (isCompleted) fillPct = 100;
              else if (isCurrent) {
                if (stage === "step1") fillPct = 60;
                else if (stage === "step2")
                  fillPct = Math.round(((listenIdx + 0.5) / PART2_LISTENING_QUESTIONS.length) * 100);
                else if (stage === "step3")
                  fillPct = Math.round(((contextIdx + 0.5) / PART3_CONTEXT_QUESTIONS.length) * 100);
                else if (stage === "step4")
                  fillPct = Math.round(((speakIdx + 0.5) / PART4_SPEAKING_PROMPTS.length) * 100);
              }

              return (
                <div key={seg.index} className="flex flex-col gap-1.5">
                  <div className="hidden items-center gap-1.5 text-[11px] font-bold sm:flex">
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : isCurrent
                          ? "bg-[#F26A12] text-white"
                          : "bg-[#EFE7DD] text-[#64748B]"
                      }`}
                    >
                      {isCompleted ? "✓" : seg.index}
                    </span>
                    <span
                      className={
                        isCurrent
                          ? "text-[#0B2559]"
                          : isCompleted
                          ? "text-emerald-700"
                          : "text-[#64748B]"
                      }
                    >
                      {seg.short}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#EFE7DD]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isCompleted ? "bg-[#0B2559]" : "bg-[#F26A12]"
                      }`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* ================= STEP 1: PROFIL & PERCAYA DIRI ================= */}
        {stage === "step1" && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#C2530A]">
                Bagian 1 · Profil Awalmu
              </span>
              <h1 className="m-0 text-2xl font-black tracking-[-0.02em] text-[#0B2559] sm:text-[28px]">
                Fokus apa yang paling ingin kamu kejar?
              </h1>
              <p className="m-0 text-sm text-[#4A5468]">
                Pilih satu tujuan utama agar rekomendasi hasilmu benar-benar relevan dengan kebutuhanmu.
              </p>
            </div>

            {/* 2-Column Goal Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PART1_GOAL_OPTIONS.map((opt) => {
                const active = selectedGoal === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedGoal(opt.id)}
                    className={`group flex cursor-pointer flex-col justify-between gap-3 rounded-[20px] border-2 p-4 text-left transition-all sm:p-5 ${
                      active
                        ? "border-[#0073F5] bg-white shadow-[0_6px_20px_rgba(0,115,245,0.1)] ring-2 ring-[#0073F5]/15"
                        : "border-[#E6DED4] bg-white/80 hover:border-[#0B2559]/35 hover:bg-white"
                    }`}
                  >
                    <div className="flex w-full items-start justify-between gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                          active ? "bg-blue-50" : "bg-[#FBF6F1] group-hover:bg-slate-100"
                        }`}
                      >
                        <GoalIcon goalId={opt.id} active={active} />
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition ${
                          active
                            ? "border-[#0073F5] bg-[#0073F5] text-white"
                            : "border-[#D5C9B8] bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[15px] font-extrabold leading-snug text-[#0B2559]">
                        {opt.label}
                      </div>
                      <div className="text-xs leading-relaxed text-[#4A5468]">{opt.hint}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confidence Scale Card */}
            <div className="space-y-4 rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)] sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[15px] font-extrabold text-[#0B2559]">
                    Seberapa percaya diri saat harus un-mute?
                  </div>
                  <div className="text-xs text-[#4A5468]">
                    Geser slider atau ketuk angka 1–5 yang paling menggambarkan kondisimu sekarang
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-extrabold ${confidenceMeta.colorClass}`}
                >
                  <span className="tabular-nums">{confidenceScore.toFixed(1)} / 5</span>
                  <span>·</span>
                  <span>{confidenceMeta.label}</span>
                </span>
              </div>

              {/* 5 Tactile Tap Pills */}
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => {
                  const isNear = Math.round(confidenceScore) === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConfidenceScore(num)}
                      className={`cursor-pointer rounded-xl border-2 py-2.5 text-center text-sm font-black transition ${
                        isNear
                          ? "border-[#F26A12] bg-[#FFF4EC] text-[#C2530A] shadow-2xs"
                          : "border-[#EFE7DD] bg-[#FBF6F1] text-[#4A5468] hover:border-[#0B2559]/30"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <input
                type="range"
                min={1}
                max={5}
                step={0.2}
                value={confidenceScore}
                onChange={(e) => setConfidenceScore(Number(e.target.value))}
                aria-label="Tingkat kepercayaan diri saat berbicara bahasa Inggris"
                className="w-full cursor-pointer accent-[#F26A12]"
              />
              <div className="flex justify-between text-[11px] font-semibold text-[#64748B]">
                <span>1 · Sering freeze</span>
                <span>3 · Tergantung topik</span>
                <span>5 · Sangat yakin</span>
              </div>
            </div>

            {/* Hardest Situations Card */}
            <div className="space-y-3.5 rounded-[22px] border border-[#E6DED4] bg-white p-5 shadow-[0_1px_4px_rgba(11,37,89,0.03)] sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[15px] font-extrabold text-[#0B2559]">
                    Situasi yang paling bikin ragu
                  </div>
                  <div className="text-xs text-[#4A5468]">Pilih maksimal 2 situasi tersulit</div>
                </div>
                <span className="rounded-lg bg-[#FBF6F1] px-2.5 py-1 text-xs font-extrabold text-[#0B2559]">
                  {hardSituations.length}/2 dipilih
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {PART1_SITUATION_OPTIONS.map((s) => {
                  const picked = hardSituations.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSituation(s.id)}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-xs font-bold transition sm:text-[13px] ${
                        picked
                          ? "border-[#F26A12] bg-[#FFF4EC] text-[#C2530A] shadow-2xs"
                          : "border-[#EFE7DD] bg-[#FBF6F1]/70 text-[#0B2559] hover:border-[#0B2559]/30 hover:bg-white"
                      }`}
                    >
                      <span>{s.label}</span>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${
                          picked ? "bg-[#F26A12] text-white" : "border border-[#D5C9B8] bg-white text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 2: LISTENING ================= */}
        {stage === "step2" && currentListeningQ && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0062D1]">
                🎧 Bagian 2 · Pemahaman Mendengar
              </span>
              <div className="flex items-center gap-1.5">
                {PART2_LISTENING_QUESTIONS.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-2 rounded-full transition-all ${
                      i === listenIdx
                        ? "w-6 bg-[#F26A12]"
                        : part2Answers[q.id] !== undefined
                        ? "w-2 bg-[#0B2559]"
                        : "w-2 bg-[#D8CBB8]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5 rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_12px_rgba(11,37,89,0.04)] sm:p-7">
              <p className="m-0 text-sm font-semibold text-[#4A5468]">
                {currentListeningQ.context}
              </p>

              {/* Podcast-style Audio Player */}
              <div className="rounded-2xl bg-gradient-to-br from-[#0B2559] to-[#133575] p-4 text-white shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleListeningClip(currentListeningQ.audioScript)}
                      aria-label={isPlayingAudio ? "Hentikan audio" : "Putar audio"}
                      className={`flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-white shadow-md transition active:scale-95 ${
                        isPlayingAudio
                          ? "bg-white text-[#0B2559]"
                          : "bg-[#F26A12] hover:bg-[#C2530A]"
                      }`}
                    >
                      {isPlayingAudio ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-white sm:text-[15px]">
                        {currentListeningQ.speaker}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-[#AFC4EA]">
                        {isPlayingAudio ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-[#F9B07F]">
                            <span className="h-2 w-2 animate-ping rounded-full bg-[#F26A12]" />
                            Sedang memutar rekaman...
                          </span>
                        ) : (
                          <span>Ketuk tombol putar untuk mendengarkan</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Speed toggle & equalizer */}
                  <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:border-t-0 sm:pt-0">
                    {/* Equalizer visual bars */}
                    <div className="flex h-7 items-center gap-1" aria-hidden="true">
                      {[10, 18, 26, 14, 24, 18, 12, 22, 16, 10].map((barH, idx) => (
                        <span
                          key={idx}
                          className={`w-[3px] rounded-full transition-all duration-300 ${
                            isPlayingAudio ? "animate-pulse bg-[#F26A12]" : "bg-white/30"
                          }`}
                          style={{
                            height: `${isPlayingAudio ? barH : Math.max(6, Math.round(barH * 0.45))}px`,
                            animationDelay: `${idx * 90}ms`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Playback Speed Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextRate = audioRate === 0.96 ? 0.8 : 0.96;
                        setAudioRate(nextRate);
                        if (isPlayingAudio) {
                          toggleListeningClip(currentListeningQ.audioScript, nextRate);
                        }
                      }}
                      className="cursor-pointer rounded-xl border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white transition hover:bg-white/20"
                    >
                      {audioRate === 0.96 ? "1.0x Normal" : "0.8x Lambat"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Transcript Helper Toggle */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTranscriptHelper((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#0062D1] hover:underline"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <span>
                    {showTranscriptHelper
                      ? "Sembunyikan teks audio"
                      : "Audio tidak terdengar? Lihat teks transkrip"}
                  </span>
                </button>

                {showTranscriptHelper && (
                  <div className="mt-2.5 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1] p-4 text-xs italic leading-relaxed text-[#3D4760]">
                    &ldquo;{currentListeningQ.audioScript}&rdquo;
                  </div>
                )}
              </div>

              {/* Question + Lettered Options */}
              <div className="space-y-3 border-t border-[#F0EAE2] pt-4">
                <h2 className="m-0 text-lg font-extrabold leading-snug text-[#0B2559] sm:text-xl">
                  {currentListeningQ.question}
                </h2>

                <div className="space-y-2.5">
                  {currentListeningQ.options.map((opt, idx) => {
                    const chosen = part2Answers[currentListeningQ.id] === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setPart2Answers((prev) => ({ ...prev, [currentListeningQ.id]: idx }))
                        }
                        className={`group flex w-full cursor-pointer items-center gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all sm:p-4 ${
                          chosen
                            ? "border-[#0073F5] bg-blue-50/50 shadow-2xs ring-2 ring-[#0073F5]/10"
                            : "border-[#E6DED4] bg-white hover:border-[#0B2559]/35 hover:bg-[#FBF6F1]/50"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                            chosen
                              ? "bg-[#0073F5] text-white"
                              : "bg-[#FBF6F1] text-[#4A5468] group-hover:bg-[#EFE7DD] group-hover:text-[#0B2559]"
                          }`}
                        >
                          {OPTION_LETTERS[idx] ?? idx + 1}
                        </span>
                        <span
                          className={`flex-1 text-sm leading-relaxed ${
                            chosen ? "font-bold text-[#0B2559]" : "font-semibold text-[#3D4760]"
                          }`}
                        >
                          {opt}
                        </span>
                        {chosen && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0073F5] text-xs font-extrabold text-white">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: WORKPLACE CONTEXT ================= */}
        {stage === "step3" && currentContextQ && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#C2530A]">
                💼{" "}
                {currentContextQ.dimension === "lintasBudaya"
                  ? "Komunikasi Lintas Budaya"
                  : "Ketepatan Bahasa Bisnis"}
              </span>
              <div className="flex items-center gap-1.5">
                {PART3_CONTEXT_QUESTIONS.map((q, i) => (
                  <span
                    key={q.id}
                    className={`h-2 rounded-full transition-all ${
                      i === contextIdx
                        ? "w-6 bg-[#F26A12]"
                        : part3Answers[q.id] !== undefined
                        ? "w-2 bg-[#0B2559]"
                        : "w-2 bg-[#D8CBB8]"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-5 rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_12px_rgba(11,37,89,0.04)] sm:p-7">
              {/* Scenario Callout Box */}
              <div className="rounded-r-2xl border-l-4 border-[#F26A12] bg-[#FBF6F1] px-4 py-3.5 text-sm leading-relaxed text-[#3D4760]">
                <span className="mb-1 block text-[11px] font-extrabold uppercase tracking-wider text-[#C2530A]">
                  Situasi Kerja
                </span>
                {currentContextQ.context}
              </div>

              <h2 className="m-0 text-lg font-extrabold leading-snug text-[#0B2559] sm:text-xl">
                {currentContextQ.prompt}
              </h2>

              <div className="space-y-2.5">
                {currentContextQ.options.map((opt, idx) => {
                  const chosen = part3Answers[currentContextQ.id] === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setPart3Answers((prev) => ({ ...prev, [currentContextQ.id]: idx }))
                      }
                      className={`group flex w-full cursor-pointer items-start gap-3.5 rounded-2xl border-2 p-3.5 text-left transition-all sm:p-4 ${
                        chosen
                          ? "border-[#0073F5] bg-blue-50/50 shadow-2xs ring-2 ring-[#0073F5]/10"
                          : "border-[#E6DED4] bg-white hover:border-[#0B2559]/35 hover:bg-[#FBF6F1]/50"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                          chosen
                            ? "bg-[#0073F5] text-white"
                            : "bg-[#FBF6F1] text-[#4A5468] group-hover:bg-[#EFE7DD] group-hover:text-[#0B2559]"
                        }`}
                      >
                        {OPTION_LETTERS[idx] ?? idx + 1}
                      </span>
                      <span
                        className={`flex-1 text-sm leading-relaxed ${
                          chosen ? "font-bold text-[#0B2559]" : "font-semibold text-[#3D4760]"
                        }`}
                      >
                        {opt}
                      </span>
                      {chosen && (
                        <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0073F5] text-xs font-extrabold text-white">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: SPEAKING AI ================= */}
        {stage === "step4" && currentSpeakingPrompt && (
          <div className="space-y-5">
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#C2530A]">
                🎙️ {currentSpeakingPrompt.eyebrow} · Skenario {speakIdx + 1}/{PART4_SPEAKING_PROMPTS.length}
              </span>
              <span className="rounded-lg border border-[#E6DED4] bg-white px-2.5 py-1 text-xs font-bold text-[#4A5468]">
                Target 20–{currentSpeakingPrompt.targetSeconds} detik
              </span>
            </div>

            {/* Prompt Card */}
            <div className="space-y-4 rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_12px_rgba(11,37,89,0.04)] sm:p-6">
              <div className="text-sm font-semibold text-[#4A5468]">
                {currentSpeakingPrompt.context}
              </div>

              <div className="rounded-2xl border-l-4 border-[#0073F5] bg-[#F4F8FF] p-4 sm:p-5">
                <h1 className="m-0 text-xl font-extrabold leading-[1.35] text-[#0B2559] sm:text-[23px]">
                  {currentSpeakingPrompt.question}
                </h1>
              </div>

              <p className="m-0 text-sm text-[#4A5468]">{currentSpeakingPrompt.instruction}</p>

              {/* Coach Tip Box */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1] px-4 py-3 text-xs leading-relaxed text-[#3D4760] sm:text-[13px]">
                <span className="text-base leading-none shrink-0" aria-hidden="true">
                  💡
                </span>
                <div>
                  <strong className="font-extrabold text-[#0B2559]">Tips Coach: </strong>
                  {currentSpeakingPrompt.tip}
                </div>
              </div>
            </div>

            {/* Studio Voice Recorder Deck */}
            <div className="flex flex-col items-center gap-5 rounded-[24px] border border-[#E6DED4] bg-white p-6 shadow-[0_2px_12px_rgba(11,37,89,0.04)] sm:p-8">
              {/* Status Pill */}
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold ${
                  isRecording
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : currentSpeakText
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-[#E6DED4] bg-[#FBF6F1] text-[#4A5468]"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isRecording
                      ? "animate-ping bg-rose-500"
                      : currentSpeakText
                      ? "bg-emerald-500"
                      : "bg-[#94A3B8]"
                  }`}
                />
                {isRecording
                  ? "Sedang Merekam Suara..."
                  : currentSpeakText
                  ? "Jawaban Berhasil Terekam ✓"
                  : "Siap Merekam Jawaban"}
              </div>

              {/* Animated Studio Waveform */}
              <div className="flex h-12 items-center gap-1.5" aria-hidden="true">
                {WAVEFORM_BASE.map((h, i) => (
                  <div
                    key={i}
                    className={`w-[5px] rounded-full transition-all duration-300 ${
                      isRecording
                        ? "animate-pulse bg-[#F26A12]"
                        : currentSpeakText
                        ? "bg-[#0073F5]"
                        : "bg-[#DFD5C8]"
                    }`}
                    style={{
                      height: `${
                        isRecording
                          ? Math.max(10, h + ((recordingSeconds + i) % 3) * 7)
                          : Math.max(8, Math.round(h * 0.55))
                      }px`,
                      animationDelay: `${i * 55}ms`,
                    }}
                  />
                ))}
              </div>

              {/* Tactile Mic Button with Sonar Rings */}
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <>
                    <span className="pointer-events-none absolute h-32 w-32 animate-ping rounded-full bg-[#F26A12]/20" />
                    <span className="pointer-events-none absolute h-28 w-28 animate-pulse rounded-full bg-[#F26A12]/25" />
                  </>
                )}
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  aria-label={isRecording ? "Hentikan rekaman" : "Mulai rekam suara"}
                  className={`relative z-10 flex h-24 w-24 cursor-pointer items-center justify-center rounded-full border-[6px] transition active:scale-95 ${
                    isRecording
                      ? "border-rose-200 bg-rose-600 shadow-lg hover:bg-rose-700"
                      : "border-[#FDE2CE] bg-[#F26A12] shadow-md hover:bg-[#C2530A]"
                  }`}
                >
                  {isRecording ? (
                    <span className="block h-7 w-7 rounded-[6px] bg-white" />
                  ) : (
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Timer & Target Progress Bar */}
              <div className="w-full max-w-xs space-y-2 text-center">
                <div className="text-base font-extrabold tabular-nums text-[#0B2559]">
                  {isRecording
                    ? `${formattedTime} / 0:${currentSpeakingPrompt.targetSeconds}`
                    : currentSpeakText
                    ? `Durasi ${formattedTime} / 0:${currentSpeakingPrompt.targetSeconds}`
                    : "Ketuk mikrofon untuk mulai bicara"}
                </div>
                {(isRecording || recordingSeconds > 0) && (
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EFE7DD]">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        recordingSeconds >= 15 ? "bg-emerald-500" : "bg-[#F26A12]"
                      }`}
                      style={{ width: `${recordingPct}%` }}
                    />
                  </div>
                )}
              </div>

              {micNote && (
                <div className="w-full max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs font-semibold text-amber-800">
                  {micNote}
                </div>
              )}

              {/* Live Transcript & Manual Fallback Box */}
              {(showTextFallback || currentSpeakText) && (
                <div className="w-full space-y-2 rounded-2xl border border-[#E6DED4] bg-[#FBF6F1]/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[#0B2559]">
                      <span>Transkrip Jawabanmu (English)</span>
                      <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-bold text-[#4A5468]">
                        {currentSpeakWordCount} kata
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setTranscripts((prev) => ({
                          ...prev,
                          [currentSpeakingPrompt.id]: currentSpeakingPrompt.suggestedStarter,
                        }))
                      }
                      className="cursor-pointer font-bold text-[#0062D1] hover:underline"
                    >
                      + Isi contoh kerangka
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={currentSpeakText}
                    onChange={(e) =>
                      setTranscripts((prev) => ({
                        ...prev,
                        [currentSpeakingPrompt.id]: e.target.value,
                      }))
                    }
                    placeholder="Mulai bicara atau ketik jawabanmu dalam bahasa Inggris di sini..."
                    className="w-full resize-none rounded-xl border border-[#E6DED4] bg-white p-3 text-sm leading-relaxed text-[#0B2559] focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  />
                </div>
              )}

              {!showTextFallback && !currentSpeakText && (
                <button
                  type="button"
                  onClick={() => setShowTextFallback(true)}
                  className="cursor-pointer text-xs font-bold text-[#4A5468] underline transition hover:text-[#0B2559]"
                >
                  Mikrofon bermasalah atau di tempat ramai? Ketik jawaban di sini
                </button>
              )}

              {submitError && (
                <div className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-xs font-bold text-rose-700">
                  ⚠️ {submitError}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Action Bar */}
      <footer className="sticky bottom-0 z-30 border-t border-[#E6DED4] bg-white/95 px-4 pb-5 pt-3.5 backdrop-blur-md sm:px-6">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          {stage === "step1" && (
            <button
              type="button"
              onClick={() => setStage("step2")}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#F26A12] px-5 py-3.5 text-center text-[15px] font-extrabold text-white shadow-sm transition hover:bg-[#C2530A] sm:py-4 sm:text-base"
            >
              <span>Lanjut ke Bagian 2 · Mendengar</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          )}

          {stage === "step2" && (
            <button
              type="button"
              disabled={part2Answers[currentListeningQ.id] === undefined}
              onClick={() => {
                stopAudioPlayback();
                setShowTranscriptHelper(false);
                if (listenIdx < PART2_LISTENING_QUESTIONS.length - 1) {
                  setListenIdx((i) => i + 1);
                } else {
                  setStage("step3");
                }
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#F26A12] px-5 py-3.5 text-center text-[15px] font-extrabold text-white shadow-sm transition hover:bg-[#C2530A] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none sm:py-4 sm:text-base"
            >
              <span>
                {part2Answers[currentListeningQ.id] === undefined
                  ? "Pilih salah satu jawaban untuk melanjutkan"
                  : listenIdx < PART2_LISTENING_QUESTIONS.length - 1
                  ? "Pertanyaan Berikutnya →"
                  : "Lanjut ke Bagian 3 · Konteks Kerja →"}
              </span>
            </button>
          )}

          {stage === "step3" && (
            <button
              type="button"
              disabled={part3Answers[currentContextQ.id] === undefined}
              onClick={() => {
                if (contextIdx < PART3_CONTEXT_QUESTIONS.length - 1) {
                  setContextIdx((i) => i + 1);
                } else {
                  setStage("step4");
                }
              }}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-[14px] bg-[#F26A12] px-5 py-3.5 text-center text-[15px] font-extrabold text-white shadow-sm transition hover:bg-[#C2530A] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none sm:py-4 sm:text-base"
            >
              <span>
                {part3Answers[currentContextQ.id] === undefined
                  ? "Pilih jawaban terbaik untuk melanjutkan"
                  : contextIdx < PART3_CONTEXT_QUESTIONS.length - 1
                  ? "Pertanyaan Berikutnya →"
                  : "Lanjut ke Bagian 4 · Tugas Bicara →"}
              </span>
            </button>
          )}

          {stage === "step4" && (
            <>
              <button
                type="button"
                disabled={rerecordedMap[currentSpeakingPrompt.id] || (!currentSpeakText && recordingSeconds === 0)}
                onClick={handleRerecordCurrent}
                className="flex-1 cursor-pointer rounded-[14px] border-2 border-[#0B2559] bg-white px-4 py-3.5 text-center text-sm font-extrabold text-[#0B2559] transition hover:bg-[#F5ECE3] disabled:cursor-not-allowed disabled:opacity-40 sm:text-[15px]"
              >
                {rerecordedMap[currentSpeakingPrompt.id] ? "Sudah diulang" : "Rekam ulang (1x)"}
              </button>

              {speakIdx < PART4_SPEAKING_PROMPTS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canProceedSpeak}
                  onClick={() => {
                    stopRecordingCleanup();
                    setRecordingSeconds(0);
                    setMicNote(null);
                    setSpeakIdx((i) => i + 1);
                  }}
                  className="flex-[1.5] cursor-pointer rounded-[14px] bg-[#F26A12] px-4 py-3.5 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#C2530A] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none sm:text-[15px]"
                >
                  Lanjut Skenario 2/2 &rarr;
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting || !canSubmitReadyCheck}
                  onClick={submitAllAndEvaluate}
                  className="flex-[1.5] cursor-pointer rounded-[14px] bg-[#F26A12] px-4 py-3.5 text-center text-sm font-extrabold text-white shadow-sm transition hover:bg-[#C2530A] disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500 disabled:shadow-none sm:text-[15px]"
                >
                  {isSubmitting ? "Menilai Ready Score..." : "Selesai & Lihat Hasil →"}
                </button>
              )}
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
