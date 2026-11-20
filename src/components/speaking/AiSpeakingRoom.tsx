"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { LandingIcon } from "@/components/landing/LandingIcon";
import {
  buildPackageGroupsForStudent,
  type EnrolledPackageInput,
  type PackageScenarioGroup,
  type SpeakingScenario,
} from "@/lib/speaking/scenarios";
import { SpeakingScoreModal } from "./SpeakingScoreModal";
import { EnglishTrainerAvatar, type TrainerPersona } from "./EnglishTrainerAvatar";
import type { EvaluationResult } from "@/lib/speaking/evaluator";

interface ChatMessage {
  sender: "ai" | "user";
  text: string;
  timestamp: string;
}

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

export function AiSpeakingRoom({
  enrolledCourses = [],
  onSessionSaved,
  onSwitchToProgress,
}: {
  enrolledCourses?: EnrolledPackageInput[];
  onSessionSaved?: () => void;
  onSwitchToProgress: () => void;
}) {
  const packageGroups = useMemo(
    () => buildPackageGroupsForStudent(enrolledCourses),
    [enrolledCourses]
  );

  const [selectedGroupKey, setSelectedGroupKey] = useState<string>(
    () => packageGroups[0]?.key ?? ""
  );

  const activeGroup: PackageScenarioGroup = useMemo(
    () => packageGroups.find((g) => g.key === selectedGroupKey) ?? packageGroups[0],
    [packageGroups, selectedGroupKey]
  );

  const [selectedScenario, setSelectedScenario] = useState<SpeakingScenario>(
    () => activeGroup.scenarios[0]
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      sender: "ai",
      text: activeGroup.scenarios[0].initialAiPrompt,
      timestamp: "00:00",
    },
  ]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [totalSessionSeconds, setTotalSessionSeconds] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [micWarning, setMicWarning] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);

  const [viewMode, setViewMode] = useState<"trainer" | "chat">("trainer");
  const [trainerPersona, setTrainerPersona] = useState<TrainerPersona>("rudy");
  const [voiceRate, setVoiceRate] = useState<number>(0.95);
  const [showMobileKeyboard, setShowMobileKeyboard] = useState(false);
  const [showMobileVocab, setShowMobileVocab] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isRecognitionRunningRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const enrolledGroups = useMemo(
    () => packageGroups.filter((g) => g.isEnrolled),
    [packageGroups]
  );
  const catalogGroups = useMemo(
    () => packageGroups.filter((g) => !g.isEnrolled),
    [packageGroups]
  );

  function stopActiveRecognition(abort = false) {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recognitionRef.current && isRecognitionRunningRef.current) {
      try {
        if (abort) recognitionRef.current.abort();
        else recognitionRef.current.stop();
      } catch {
        // ignore if already stopped
      }
      isRecognitionRunningRef.current = false;
    }
  }

  function speakText(text: string, customRate?: number) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = customRate ?? voiceRate;

    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const enVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (trainerPersona === "sarah"
              ? v.name.toLowerCase().includes("female") ||
                v.name.toLowerCase().includes("samantha") ||
                v.name.toLowerCase().includes("zira")
              : v.name.toLowerCase().includes("male") ||
                v.name.toLowerCase().includes("david") ||
                v.name.toLowerCase().includes("george"))
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (enVoice) utterance.voice = enVoice;
    }

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  function handleSelectScenario(sc: SpeakingScenario, autoSpeak = true) {
    stopActiveRecognition(true);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsAiSpeaking(false);
    }
    setSelectedScenario(sc);
    setMessages([
      {
        sender: "ai",
        text: sc.initialAiPrompt,
        timestamp: "00:00",
      },
    ]);
    setRecordingSeconds(0);
    setTotalSessionSeconds(0);
    setIsRecording(false);
    setIsAiGenerating(false);
    setManualInput("");
    setMicWarning(null);

    if (autoSpeak) {
      setTimeout(() => {
        speakText(sc.initialAiPrompt);
      }, 140);
    }
  }

  function handleSelectPackage(groupKey: string) {
    const nextGroup = packageGroups.find((g) => g.key === groupKey);
    if (!nextGroup) return;
    setSelectedGroupKey(groupKey);
    handleSelectScenario(nextGroup.scenarios[0], true);
  }

  // Scroll transcript to bottom on new message
  useEffect(() => {
    if (viewMode === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, viewMode]);

  // Web Speech API setup
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as WindowWithSpeech;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      isRecognitionRunningRef.current = true;
    };
    recognition.onend = () => {
      isRecognitionRunningRef.current = false;
    };
    recognition.onresult = (event: SpeechRecognitionResultEventLike) => {
      let currentTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      if (currentTranscript) {
        setManualInput(currentTranscript);
      }
    };
    recognition.onerror = (e: SpeechRecognitionErrorEventLike) => {
      isRecognitionRunningRef.current = false;
      if (e.error === "not-allowed" || e.error === "audio-capture") {
        setMicWarning(
          "Akses mikrofon diblokir atau tidak ditemukan. Kamu tetap bisa berlatih dengan mengetik jawaban di kolom bawah."
        );
        setShowMobileKeyboard(true);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        // ignore
      }
      isRecognitionRunningRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function toggleRecording() {
    if (!isRecording) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
      }

      setMicWarning(null);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recognitionRef.current) {
        if (isRecognitionRunningRef.current) {
          try {
            recognitionRef.current.abort();
            isRecognitionRunningRef.current = false;
          } catch {
            // ignore
          }
          setTimeout(() => {
            try {
              if (!isRecognitionRunningRef.current) {
                recognitionRef.current?.start();
              }
            } catch {
              // ignore rapid click
            }
          }, 120);
        } else {
          try {
            recognitionRef.current.start();
          } catch {
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch {
                setMicWarning("Mikrofon tidak merespons. Silakan ketik jawabanmu di bawah.");
                setShowMobileKeyboard(true);
              }
            }, 150);
          }
        }
      } else {
        setMicWarning("Browser ini tidak mendukung dikte suara otomatis. Silakan ketik jawabanmu di bawah.");
        setShowMobileKeyboard(true);
      }

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
        setTotalSessionSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setIsRecording(false);
      stopActiveRecognition(false);

      const spoken = manualInput.trim();
      if (spoken) {
        void commitUserMessage(spoken);
      }
    }
  }

  async function commitUserMessage(text: string) {
    const mins = Math.floor(totalSessionSeconds / 60);
    const secs = totalSessionSeconds % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    const newMessages: ChatMessage[] = [
      ...messages,
      {
        sender: "user",
        text,
        timestamp: timeStr,
      },
    ];

    setMessages(newMessages);
    setManualInput("");
    setIsAiGenerating(true);

    let followUp = "";
    try {
      const res = await fetch("/api/speaking/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioTitle: selectedScenario.title,
          packageTitle: activeGroup.packageName,
          moduleLabel: selectedScenario.moduleLabel,
          recommendedVocab: selectedScenario.recommendedVocab,
          recentHistory: newMessages.slice(-4).map((m) => ({ sender: m.sender, text: m.text })),
          userMessage: text,
          trainerPersona,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.reply) {
          followUp = json.reply;
        }
      }
    } catch (e) {
      console.warn("[Trainer respond error, using scenario fallback]:", e);
    }

    if (!followUp) {
      const userCount = newMessages.filter((m) => m.sender === "user").length;
      followUp =
        selectedScenario.followUpQuestions[
          Math.min(userCount - 1, selectedScenario.followUpQuestions.length - 1)
        ] ||
        "That was a very clear point! How would you summarize the key takeaway in one crisp sentence?";
    }

    setIsAiGenerating(false);

    setMessages((prev) => [
      ...prev,
      {
        sender: "ai",
        text: followUp,
        timestamp: timeStr,
      },
    ]);

    speakText(followUp);
  }

  async function handleFinishSession() {
    stopActiveRecognition(true);
    setIsRecording(false);
    setIsSubmitting(true);

    const userUtterances = messages
      .filter((m) => m.sender === "user")
      .map((m) => m.text)
      .join(". ");

    const finalTranscript =
      userUtterances.trim() ||
      manualInput.trim() ||
      "I practiced answering the scenario clearly with structured reasoning.";
    const totalDuration = Math.max(30, totalSessionSeconds || recordingSeconds);

    try {
      const res = await fetch("/api/speaking/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: activeGroup.courseId,
          scenarioId: selectedScenario.id,
          scenarioTitle: `${activeGroup.shortName} — ${selectedScenario.title}`,
          durationSeconds: totalDuration,
          transcriptUser: finalTranscript,
          transcriptAi: messages
            .filter((m) => m.sender === "ai")
            .map((m) => m.text)
            .join(". "),
        }),
      });

      const json = await res.json();
      setIsSubmitting(false);

      if (res.ok && json.evaluation) {
        setEvaluation(json.evaluation);
        setShowScoreModal(true);
        onSessionSaved?.();
      }
    } catch (err) {
      setIsSubmitting(false);
      console.error("[FinishSession Error]:", err);
    }
  }

  const trainerState = isAiSpeaking
    ? "speaking"
    : isRecording
    ? "listening"
    : isAiGenerating
    ? "thinking"
    : "idle";

  const lastAiMessage =
    [...messages].reverse().find((m) => m.sender === "ai")?.text ||
    selectedScenario.initialAiPrompt;

  const userTurns = messages.filter((m) => m.sender === "user").length;
  const lastUserMessage =
    [...messages].reverse().find((m) => m.sender === "user")?.text || "";

  // Live Vocab Mastery Detection (case-insensitive check across user turns + live speech)
  const combinedUserText = useMemo(() => {
    const past = messages
      .filter((m) => m.sender === "user")
      .map((m) => m.text)
      .join(" ");
    return `${past} ${manualInput}`.toLowerCase();
  }, [messages, manualInput]);

  const usedVocabCount = useMemo(
    () =>
      selectedScenario.recommendedVocab.filter((phrase) =>
        combinedUserText.includes(phrase.toLowerCase())
      ).length,
    [selectedScenario.recommendedVocab, combinedUserText]
  );

  const formattedRecordTimer = `0:${String(recordingSeconds).padStart(2, "0")}`;

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
      {/* ==================== LEFT COLUMN: PACKAGE & CURRICULUM SELECTOR (4 COLS) ==================== */}
      <aside className="space-y-4 lg:col-span-4">
        {/* Card 1: Package & Syllabus Selector */}
        <div className="rounded-[22px] border border-[#E6DED4] bg-white p-4 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-5">
          {/* Header */}
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#0B2559]">
              Materi Sesuai Paket
            </span>
            {activeGroup.isEnrolled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10.5px] font-extrabold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Paket Aktifmu
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10.5px] font-bold text-[#0062D1]">
                Mode Eksplorasi
              </span>
            )}
          </div>

          {/* Package Dropdown Selector */}
          <div className="space-y-1.5">
            <label htmlFor="speaking-package-select" className="sr-only">
              Pilih Paket Kelas
            </label>
            <div className="relative">
              <select
                id="speaking-package-select"
                value={activeGroup.key}
                onChange={(e) => handleSelectPackage(e.target.value)}
                className="w-full cursor-pointer appearance-none rounded-xl border border-[#D8CBB8] bg-[#FBF6F1] py-2.5 pl-3.5 pr-9 text-xs font-extrabold text-[#0B2559] transition focus:border-[#0073F5] focus:bg-white focus:outline-none sm:text-[13px]"
              >
                {enrolledGroups.length > 0 && (
                  <optgroup label="✓ Paket Kelas Aktifmu">
                    {enrolledGroups.map((g) => (
                      <option key={g.key} value={g.key}>
                        ★ {g.shortName} ({g.scenarios.length} materi)
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Katalog Paket English Ready">
                  {catalogGroups.map((g) => (
                    <option key={g.key} value={g.key}>
                      {g.shortName} · {g.tierLabel}
                    </option>
                  ))}
                </optgroup>
              </select>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4A5468"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] font-semibold text-[#64748B]">
              <span className="rounded-md bg-[#FBF6F1] px-2 py-0.5 text-[#0B2559]">
                {activeGroup.tierLabel}
              </span>
              <span>·</span>
              <span>{activeGroup.levelLabel}</span>
            </div>
          </div>

          {/* Scenarios List (Horizontal strip on mobile, clean vertical cards on desktop) */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#64748B]">
              <span>Pilih Topik / Modul ({activeGroup.scenarios.length})</span>
              <span className="lg:hidden">Geser →</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0">
              {activeGroup.scenarios.map((sc, idx) => {
                const isSelected = selectedScenario.id === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(sc)}
                    className={`group relative flex w-[235px] shrink-0 cursor-pointer flex-col gap-1.5 rounded-2xl border p-3.5 text-left transition-all duration-200 lg:w-full ${
                      isSelected
                        ? "border-[#0B2559] bg-[#FBF6F1] shadow-2xs"
                        : "border-[#EFE7DD] bg-white hover:border-[#D5C9B8] hover:bg-[#FBF6F1]/50"
                    }`}
                  >
                    {/* Active left bar accent */}
                    {isSelected && (
                      <span
                        className="absolute bottom-3 left-0 top-3 w-1 rounded-r-full bg-[#F26A12]"
                        aria-hidden="true"
                      />
                    )}

                    <div className="flex items-center justify-between gap-2 pl-1">
                      <span
                        className={`truncate text-[10.5px] font-extrabold uppercase tracking-wide ${
                          isSelected ? "text-[#C2530A]" : "text-[#64748B]"
                        }`}
                      >
                        {sc.moduleLabel}
                      </span>
                      <span className="shrink-0 rounded-md bg-white px-1.5 py-0.5 text-[10px] font-bold text-[#4A5468] border border-[#EFE7DD]">
                        ~{sc.estimatedMinutes} mnt
                      </span>
                    </div>

                    <div className="pl-1 text-[13px] font-extrabold leading-snug text-[#0B2559]">
                      {idx + 1}. {sc.title}
                    </div>

                    <p className="m-0 line-clamp-2 pl-1 text-[11.5px] leading-relaxed text-[#4A5468]">
                      {sc.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 2: Interactive Vocabulary & Coaching Tip (Always open on Desktop, toggleable on Mobile) */}
        <div className="rounded-[22px] border border-[#E6DED4] bg-white p-4 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-5">
          <button
            type="button"
            onClick={() => setShowMobileVocab((v) => !v)}
            className="flex w-full cursor-pointer items-center justify-between gap-2 text-left lg:cursor-default"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-[#0B2559]">
                Frasa Kunci Materi
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-extrabold text-emerald-700 border border-emerald-200/80">
                {usedVocabCount}/{selectedScenario.recommendedVocab.length} dipakai
              </span>
            </div>
            <span className="text-xs font-bold text-[#0062D1] lg:hidden">
              {showMobileVocab ? "Tutup" : "Lihat"}
            </span>
          </button>

          <div className={`${showMobileVocab ? "block" : "hidden lg:block"} mt-3 space-y-3.5`}>
            <p className="m-0 text-[11.5px] text-[#64748B]">
              Ketuk frasa untuk mendengar pelafalannya. Gunakan saat bicara agar otomatis tercentang!
            </p>

            <div className="flex flex-wrap gap-1.5">
              {selectedScenario.recommendedVocab.map((phrase) => {
                const isUsed = combinedUserText.includes(phrase.toLowerCase());
                return (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => speakText(phrase, 0.88)}
                    title={`Klik untuk dengar pengucapan "${phrase}"`}
                    className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      isUsed
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] hover:border-[#0073F5] hover:bg-blue-50/50"
                    }`}
                  >
                    {isUsed ? (
                      <span className="text-emerald-600">✓</span>
                    ) : (
                      <span className="text-[10px] opacity-60">🔊</span>
                    )}
                    <span>{phrase}</span>
                  </button>
                );
              })}
            </div>

            {/* Coaching Tip */}
            <div className="rounded-xl border border-[#EFE7DD] bg-[#FBF6F1]/80 p-3 text-xs leading-relaxed text-[#3D4760]">
              <span className="font-extrabold text-[#C2530A]">💡 Tips Materi: </span>
              {selectedScenario.coachingTip}
            </div>
          </div>
        </div>
      </aside>

      {/* ==================== RIGHT COLUMN: UNIFIED AI SPEAKING STUDIO (8 COLS) ==================== */}
      <section className="lg:col-span-8">
        <div className="flex flex-col overflow-hidden rounded-[24px] border border-[#E6DED4] bg-white shadow-[0_8px_30px_rgba(11,37,89,0.06)]">
          {/* Top Studio Toolbar: Breadcrumb + Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EFE7DD] bg-white px-4 py-3 sm:px-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-extrabold text-[#0B2559]">
                  {selectedScenario.title}
                </span>
                <span className="hidden shrink-0 rounded-md bg-[#FFF4EC] px-2 py-0.5 text-[10px] font-extrabold text-[#C2530A] sm:inline-block">
                  {selectedScenario.level}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-[#64748B]">
                <span className="truncate">{activeGroup.shortName}</span>
                <span>·</span>
                <span className="shrink-0 font-semibold text-[#0B2559]">
                  {userTurns} giliran bicara
                </span>
              </div>
            </div>

            {/* Clean Mode Switcher: Studio vs Transcript */}
            <div className="flex shrink-0 items-center rounded-xl border border-[#E6DED4] bg-[#FBF6F1] p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("trainer")}
                className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                  viewMode === "trainer"
                    ? "bg-[#0B2559] text-white shadow-2xs"
                    : "text-[#4A5468] hover:text-[#0B2559]"
                }`}
              >
                Studio
              </button>
              <button
                type="button"
                onClick={() => setViewMode("chat")}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-extrabold transition ${
                  viewMode === "chat"
                    ? "bg-[#0B2559] text-white shadow-2xs"
                    : "text-[#4A5468] hover:text-[#0B2559]"
                }`}
              >
                <span>Transkrip</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    viewMode === "chat"
                      ? "bg-white/20 text-white"
                      : "bg-[#E6DED4] text-[#0B2559]"
                  }`}
                >
                  {messages.length}
                </span>
              </button>
            </div>
          </div>

          {/* Main Stage Content */}
          {viewMode === "trainer" ? (
            <div>
              <EnglishTrainerAvatar
                state={trainerState}
                currentSpeechText={lastAiMessage}
                scenarioTitle={selectedScenario.title}
                moduleLabel={selectedScenario.moduleLabel}
                starterHint={selectedScenario.starterHint}
                activePersona={trainerPersona}
                voiceRate={voiceRate}
                onToggleVoiceRate={() => setVoiceRate((r) => (r < 0.9 ? 0.95 : 0.8))}
                onPersonaChange={(persona) => setTrainerPersona(persona)}
                onReplaySpeech={() => speakText(lastAiMessage)}
              />

              {/* Live User Speech Strip (smooth feedback right below stage) */}
              {(isRecording || lastUserMessage || manualInput) && (
                <div className="border-t border-[#EFE7DD] bg-[#FBF6F1]/70 px-4 py-3 sm:px-5">
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${
                        isRecording ? "bg-emerald-600" : "bg-[#0B2559]"
                      }`}
                    >
                      {isRecording ? "🎙" : "✓"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-extrabold text-[#0B2559]">
                          {isRecording ? "Suaramu sedang ditangkap..." : "Jawaban Terakhirmu"}
                        </span>
                        {isRecording && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 border border-emerald-200">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Live
                          </span>
                        )}
                      </div>
                      <p className="m-0 mt-0.5 text-xs italic leading-relaxed text-[#3D4760] sm:text-[13px]">
                        &ldquo;{manualInput || lastUserMessage || "Mulai berbicara dalam bahasa Inggris..."}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Transcript Thread View */
            <div className="h-[360px] space-y-3.5 overflow-y-auto bg-[#FBF6F1]/60 p-4 sm:h-[410px] sm:p-5">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="mb-1 flex items-center gap-2 text-[11px]">
                    <span className="font-extrabold text-[#4A5468]">
                      {m.sender === "ai"
                        ? trainerPersona === "sarah"
                          ? "Coach Sarah"
                          : "Coach Rudy"
                        : "Kamu"}
                    </span>
                    <span className="text-[#94A3B8] tabular-nums">{m.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-2xs sm:max-w-lg sm:text-[13.5px] ${
                      m.sender === "user"
                        ? "rounded-tr-sm bg-[#0B2559] text-white"
                        : "rounded-tl-sm border border-[#E6DED4] bg-white text-[#0B2559]"
                    }`}
                  >
                    <p className="m-0">{m.text}</p>
                    {m.sender === "ai" && (
                      <button
                        type="button"
                        onClick={() => speakText(m.text)}
                        className="mt-2 inline-flex cursor-pointer items-center gap-1 text-[11px] font-bold text-[#0062D1] hover:underline"
                      >
                        <span>🔊 Putar Ulang Suara</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {isAiGenerating && (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#0073F5]" />
                  <span>{trainerPersona === "sarah" ? "Coach Sarah" : "Coach Rudy"} sedang merespons...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}

          {/* Mic Warning Alert (if browser blocked mic) */}
          {micWarning && (
            <div className="border-t border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 sm:px-5">
              ⚠️ {micWarning}
            </div>
          )}

          {/* Integrated Hybrid Voice & Typing Control Dock */}
          <div className="fixed bottom-16 left-0 right-0 z-40 border-t border-[#E6DED4] bg-white/95 px-3 py-2.5 shadow-[0_-6px_24px_rgba(11,37,89,0.08)] backdrop-blur-md sm:bottom-20 sm:px-4 md:static md:px-5 md:py-4 md:shadow-none">
            {/* Hybrid Text Input (Always visible on md+, toggleable on mobile) */}
            <div
              className={`${
                showMobileKeyboard ? "flex" : "hidden md:flex"
              } mb-3 items-center gap-2`}
            >
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && manualInput.trim() && !isAiGenerating) {
                    void commitUserMessage(manualInput.trim());
                  }
                }}
                placeholder="Atau ketik jawabanmu dalam bahasa Inggris lalu tekan Enter..."
                className="flex-1 rounded-xl border border-[#E6DED4] bg-[#FBF6F1]/70 px-3.5 py-2 text-xs text-[#0B2559] placeholder-[#94A3B8] transition focus:border-[#0073F5] focus:bg-white focus:outline-none sm:text-[13px]"
              />
              {manualInput.trim() && (
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={() => void commitUserMessage(manualInput.trim())}
                  className="shrink-0 cursor-pointer rounded-xl bg-[#0073F5] px-4 py-2 text-xs font-extrabold text-white transition hover:bg-[#0062D1] disabled:opacity-50"
                >
                  Kirim
                </button>
              )}
            </div>

            {/* Balanced 3-Zone Action Bar */}
            <div className="flex items-center justify-between gap-2">
              {/* Left: Mic status + Reset + Mobile Keyboard toggle */}
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectScenario(selectedScenario, false)}
                  title="Ulangi percakapan dari awal"
                  className="hidden h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#E6DED4] bg-[#FBF6F1] text-[#4A5468] transition hover:border-[#0B2559]/40 hover:text-[#0B2559] sm:inline-flex"
                >
                  <LandingIcon name="RotateCcw" size={15} color="currentColor" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        isRecording ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                      }`}
                    />
                    <span className="truncate text-xs font-extrabold tabular-nums text-[#0B2559]">
                      {isRecording ? `Merekam ${formattedRecordTimer}` : "Mikrofon Siap"}
                    </span>
                  </div>
                  <span className="hidden text-[10.5px] font-medium text-[#64748B] sm:block">
                    {isRecording ? "Ketuk lagi untuk mengirim" : "Ketuk mikrofon untuk mulai bicara"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileKeyboard((prev) => !prev)}
                  className={`shrink-0 cursor-pointer rounded-lg border px-2 py-1 text-[10.5px] font-bold transition md:hidden ${
                    showMobileKeyboard
                      ? "border-[#0B2559] bg-[#0B2559] text-white"
                      : "border-[#E6DED4] bg-[#FBF6F1] text-[#4A5468]"
                  }`}
                >
                  ⌨️ {showMobileKeyboard ? "Tutup" : "Ketik"}
                </button>
              </div>

              {/* Center: Tactile Primary Microphone Button */}
              <div className="relative flex shrink-0 items-center justify-center">
                {isRecording && (
                  <span
                    className="pointer-events-none absolute -inset-2 animate-pulse rounded-full bg-rose-500/20"
                    aria-hidden="true"
                  />
                )}
                <button
                  type="button"
                  disabled={isAiGenerating}
                  onClick={toggleRecording}
                  aria-label={isRecording ? "Hentikan & kirim suara" : "Mulai bicara"}
                  className={`relative z-10 flex h-13 w-13 cursor-pointer items-center justify-center rounded-full text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 sm:h-14 sm:w-14 ${
                    isRecording
                      ? "bg-rose-600 ring-4 ring-rose-100 hover:bg-rose-700"
                      : "bg-gradient-to-tr from-[#F26A12] to-[#C2530A] ring-4 ring-[#FFF4EC] hover:shadow-lg"
                  }`}
                >
                  {isRecording ? (
                    <span className="block h-4 w-4 rounded-[4px] bg-white sm:h-5 sm:w-5" />
                  ) : (
                    <LandingIcon name="Mic" size={22} color="#FFFFFF" />
                  )}
                </button>
              </div>

              {/* Right: Finish & Evaluate Button */}
              <div className="flex flex-1 justify-end">
                <button
                  type="button"
                  disabled={isSubmitting || userTurns < 1}
                  onClick={handleFinishSession}
                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition-all sm:px-4 ${
                    userTurns >= 1
                      ? "bg-[#0B2559] text-white shadow-xs hover:bg-[#0073F5]"
                      : "cursor-not-allowed bg-[#EFE7DD] text-[#94A3B8]"
                  }`}
                >
                  <span>{isSubmitting ? "Menilai Skor..." : "Selesai & Nilai"}</span>
                  {!isSubmitting && <span aria-hidden="true">&rarr;</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile spacer for fixed dock */}
        <div className="h-24 md:hidden" />
      </section>

      {/* Evaluation Score Modal */}
      <SpeakingScoreModal
        open={showScoreModal}
        evaluation={evaluation}
        onClose={() => setShowScoreModal(false)}
        onSwitchToProgress={onSwitchToProgress}
      />
    </div>
  );
}
