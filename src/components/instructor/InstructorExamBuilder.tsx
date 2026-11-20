"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import {
  CBT_EXAM_PRESETS,
  OFFICIAL_SPEAKING_RUBRIC,
  type CbtQuestion,
  type CbtQuestionType,
  type CbtSectionName,
} from "@/lib/exams/cbt";
import type { Exam } from "@/types/db";

const SECTIONS: CbtSectionName[] = [
  "Vocabulary & Matching",
  "Complete the Sentences",
  "Translate into English",
  "Grammar & 10 Tenses",
  "WH-Questions Interview",
  "Speaking Level A1–A3",
  "Reading & Grammar",
  "Listening & Speaking",
  "Business English",
];

const QUESTION_TYPE_META: Record<
  CbtQuestionType,
  { label: string; shortLabel: string; icon: string; badgeCls: string; activeCls: string }
> = {
  vocab_match: {
    label: "Vocab Matching (Pilihan Arti A–D)",
    shortLabel: "Vocab A–D",
    icon: "🔤",
    badgeCls: "bg-teal-100 text-teal-800",
    activeCls: "border-teal-500 bg-teal-50/70 ring-1 ring-teal-300/60",
  },
  text_fill: {
    label: "Lengkapi Kalimat (Complete Sentences)",
    shortLabel: "Isian",
    icon: "✍️",
    badgeCls: "bg-blue-100 text-blue-800",
    activeCls: "border-blue-500 bg-blue-50/70 ring-1 ring-blue-300/60",
  },
  translate: {
    label: "Terjemahkan (ID → EN)",
    shortLabel: "Translate",
    icon: "🌐",
    badgeCls: "bg-amber-100 text-amber-900",
    activeCls: "border-amber-500 bg-amber-50/70 ring-1 ring-amber-300/60",
  },
  audio_speaking: {
    label: "Speaking Interview (Audio + Suara)",
    shortLabel: "Speaking",
    icon: "🎙️",
    badgeCls: "bg-purple-100 text-purple-800",
    activeCls: "border-purple-400 bg-purple-50/70 ring-1 ring-purple-300/60",
  },
};

const PRESET_CARDS_META: Record<
  string,
  {
    level: string;
    levelBg: string;
    levelColor: string;
    icon: string;
    title: string;
    chips: string[];
    accentBorder: string;
  }
> = {
  a1_daily: {
    level: "A1 Beginner",
    levelBg: "bg-emerald-50 border-emerald-200",
    levelColor: "text-emerald-700",
    icon: "🌱",
    title: "A1 · Daily Conversation",
    chips: ["8 Soal", "Vocab Match", "Speaking A1"],
    accentBorder: "hover:border-emerald-400 hover:ring-1 hover:ring-emerald-200",
  },
  a2_school_daily: {
    level: "A2 Elementary",
    levelBg: "bg-blue-50 border-blue-200",
    levelColor: "text-blue-700",
    icon: "📘",
    title: "A2 · School & Daily Life",
    chips: ["8 Soal", "Pertemuan 3", "Speaking A2"],
    accentBorder: "hover:border-blue-400 hover:ring-1 hover:ring-blue-200",
  },
  a3_tenses: {
    level: "A3 Bridge to B1",
    levelBg: "bg-indigo-50 border-indigo-200",
    levelColor: "text-indigo-700",
    icon: "⚡",
    title: "A3 · 10 Tenses & Modals",
    chips: ["8 Soal", "10 Tenses", "Speaking A3"],
    accentBorder: "hover:border-indigo-400 hover:ring-1 hover:ring-indigo-200",
  },
  wh_interview: {
    level: "Workplace",
    levelBg: "bg-amber-50 border-amber-200",
    levelColor: "text-amber-800",
    icon: "💼",
    title: "WH-Questions Interview",
    chips: ["8 Soal", "Interview Kerja", "Daily Tasks"],
    accentBorder: "hover:border-amber-400 hover:ring-1 hover:ring-amber-200",
  },
};

function createBlankQuestion(type: CbtQuestionType, prefix: string): CbtQuestion {
  const uid = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === "vocab_match") {
    return {
      id: uid,
      type: "vocab_match",
      section: "Vocabulary & Matching",
      title: "",
      instructions: "Pilih arti Bahasa Indonesia yang paling tepat untuk kata bahasa Inggris berikut.",
      question: "",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      targetAnswer: "",
      timeLimitSeconds: 60,
      points: 10,
    };
  }
  if (type === "translate") {
    return {
      id: uid,
      type: "translate",
      section: "Translate into English",
      title: "",
      instructions: "Terjemahkan kalimat Bahasa Indonesia berikut ke dalam bahasa Inggris yang tepat.",
      question: "",
      targetAnswer: "",
      acceptableAnswers: [],
      keyPhrases: [],
      timeLimitSeconds: 90,
      points: 15,
    };
  }
  if (type === "audio_speaking") {
    return {
      id: uid,
      type: "audio_speaking",
      section: "Speaking Level A1–A3",
      title: "",
      instructions:
        "Dengarkan pertanyaan audio, lalu jawab dalam kalimat bahasa Inggris yang lengkap dan natural menggunakan mikrofon.",
      audioPrompt: "",
      question: "",
      targetAnswer: "",
      keyPhrases: [],
      timeLimitSeconds: 120,
      points: 15,
    };
  }
  return {
    id: uid,
    type: "text_fill",
    section: "Complete the Sentences",
    title: "",
    instructions:
      "Lengkapi bagian rumpang (_____) pada kalimat berikut dengan satu kata atau frasa yang tepat.",
    passage: "",
    question: "",
    targetAnswer: "",
    acceptableAnswers: [],
    timeLimitSeconds: 75,
    points: 10,
  };
}

function clonePresetQuestions(presetId: string, prefix: string): {
  questions: CbtQuestion[];
  instructions: string;
} {
  const preset = CBT_EXAM_PRESETS.find((p) => p.id === presetId) || CBT_EXAM_PRESETS[0];
  return {
    instructions: preset.instructions,
    questions: preset.questions.map((q, idx) => ({
      ...q,
      id: `${prefix}-${preset.id}-q${idx + 1}-${Math.random().toString(36).slice(2, 5)}`,
      options: q.options ? [...q.options] : undefined,
      acceptableAnswers: q.acceptableAnswers ? [...q.acceptableAnswers] : undefined,
      keyPhrases: q.keyPhrases ? [...q.keyPhrases] : undefined,
    })),
  };
}

export function InstructorExamBuilder({
  course,
  initialExam,
  initialTab = "main",
}: {
  course: { id: number; title: string };
  initialExam: Exam | null;
  initialTab?: "main" | "remedial";
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"main" | "remedial">(initialTab);
  const [showSettings, setShowSettings] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);

  const [title, setTitle] = useState(
    initialExam?.title || `Final Competency Exam (CBT) — ${course.title}`
  );
  const [passingScore, setPassingScore] = useState<number | string>(
    initialExam?.passingScore || 70
  );
  const [instructions, setInstructions] = useState(
    initialExam?.content?.examInstructions ||
      "Ujian Paket Jago Bahasa Inggris (A1–A3). Kerjakan tahap tertulis (Vocabulary Matching, Complete the Sentences, Translate) lalu lanjut ke Speaking Interview Test."
  );
  const [remedialInstructions, setRemedialInstructions] = useState(
    initialExam?.content?.remedialInstructions || ""
  );

  const [mainQuestions, setMainQuestions] = useState<CbtQuestion[]>(
    () => (initialExam?.content?.cbtQuestions as CbtQuestion[] | undefined) || []
  );
  const [remedialQuestions, setRemedialQuestions] = useState<CbtQuestion[]>(
    () => (initialExam?.content?.remedialCbtQuestions as CbtQuestion[] | undefined) || []
  );

  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initialList =
      initialTab === "remedial"
        ? (initialExam?.content?.remedialCbtQuestions as CbtQuestion[] | undefined) || []
        : (initialExam?.content?.cbtQuestions as CbtQuestion[] | undefined) || [];
    return initialList[0]?.id ?? null;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [speakingPreviewId, setSpeakingPreviewId] = useState<string | null>(null);

  const legacyFields = useMemo(
    () => ({
      questionFileUrl: initialExam?.content?.questionFileUrl,
      questionFileName: initialExam?.content?.questionFileName,
      remedialFileUrl: initialExam?.content?.remedialFileUrl,
      remedialFileName: initialExam?.content?.remedialFileName,
    }),
    [initialExam]
  );

  const activeList = activeTab === "main" ? mainQuestions : remedialQuestions;
  const setActiveList = activeTab === "main" ? setMainQuestions : setRemedialQuestions;

  useEffect(() => {
    if (activeList.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }
    if (!selectedId || !activeList.some((q) => q.id === selectedId)) {
      setSelectedId(activeList[0].id);
    }
  }, [activeList, selectedId]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const selectedIndex = activeList.findIndex((q) => q.id === selectedId);
  const selectedQ = selectedIndex >= 0 ? activeList[selectedIndex] : null;

  const stats = useMemo(() => {
    const vocabCount = activeList.filter((q) => q.type === "vocab_match").length;
    const fillCount = activeList.filter((q) => q.type === "text_fill").length;
    const translateCount = activeList.filter((q) => q.type === "translate").length;
    const audioCount = activeList.filter((q) => q.type === "audio_speaking").length;
    const totalPoints = activeList.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    const totalSec = activeList.reduce((acc, q) => acc + (Number(q.timeLimitSeconds) || 0), 0);
    return {
      total: activeList.length,
      writtenCount: vocabCount + fillCount + translateCount,
      vocabCount,
      fillCount,
      translateCount,
      audioCount,
      totalPoints,
      totalMinutes: Math.max(1, Math.ceil(totalSec / 60)),
    };
  }, [activeList]);

  function switchTab(nextTab: "main" | "remedial") {
    setActiveTab(nextTab);
    const nextList = nextTab === "main" ? mainQuestions : remedialQuestions;
    setSelectedId(nextList[0]?.id ?? null);
    setError("");
  }

  function handleAddQuestion(type: CbtQuestionType) {
    const q = createBlankQuestion(type, activeTab === "main" ? "cbt" : "rem");
    setActiveList((prev) => [...prev, q]);
    setSelectedId(q.id);
    setError("");
    setSuccess("");
  }

  function handleApplyPreset(presetId: string) {
    const prefix = activeTab === "main" ? "cbt" : "rem";
    const { questions, instructions: presetInstr } = clonePresetQuestions(presetId, prefix);
    setActiveList(questions);
    setSelectedId(questions[0]?.id ?? null);
    if (activeTab === "main") setInstructions(presetInstr);
    else setRemedialInstructions(presetInstr);
    setShowPresetModal(false);
    setError("");
    setSuccess("");
  }

  function handleUpdateQuestion(id: string, patch: Partial<CbtQuestion>) {
    setActiveList((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...patch };
        if (patch.type && patch.type !== q.type) {
          if (patch.type === "vocab_match") {
            updated.section = "Vocabulary & Matching";
            updated.options =
              updated.options && updated.options.length >= 2
                ? updated.options
                : ["", "", "", ""];
            updated.correctOptionIndex = updated.correctOptionIndex ?? 0;
            updated.timeLimitSeconds = 60;
          } else if (patch.type === "translate") {
            updated.section = "Translate into English";
            updated.timeLimitSeconds = 90;
          } else if (patch.type === "audio_speaking") {
            updated.section = "Speaking Level A1–A3";
            updated.timeLimitSeconds = 120;
          } else {
            updated.section = "Complete the Sentences";
            updated.timeLimitSeconds = 75;
          }
        }
        return updated;
      })
    );
  }

  function handleOptionChange(q: CbtQuestion, optIdx: number, value: string) {
    const nextOpts = [...(q.options || ["", "", "", ""])];
    nextOpts[optIdx] = value;
    const patch: Partial<CbtQuestion> = { options: nextOpts };
    if ((q.correctOptionIndex ?? 0) === optIdx) {
      patch.targetAnswer = value;
    }
    handleUpdateQuestion(q.id, patch);
  }

  function handleSelectCorrectOption(q: CbtQuestion, optIdx: number) {
    const opts = q.options || ["", "", "", ""];
    handleUpdateQuestion(q.id, {
      correctOptionIndex: optIdx,
      targetAnswer: opts[optIdx] || "",
    });
  }

  function handleDeleteQuestion(id: string) {
    const idx = activeList.findIndex((q) => q.id === id);
    const nextList = activeList.filter((q) => q.id !== id);
    setActiveList(nextList);
    if (nextList.length === 0) {
      setSelectedId(null);
    } else {
      setSelectedId(nextList[Math.min(idx, nextList.length - 1)].id);
    }
  }

  function handleDuplicateQuestion(q: CbtQuestion) {
    const copy: CbtQuestion = {
      ...q,
      id: `${activeTab === "main" ? "cbt" : "rem"}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: q.title ? `${q.title} (Salinan)` : "",
      options: q.options ? [...q.options] : undefined,
      acceptableAnswers: q.acceptableAnswers ? [...q.acceptableAnswers] : undefined,
      keyPhrases: q.keyPhrases ? [...q.keyPhrases] : undefined,
    };
    setActiveList((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  }

  function handleMoveQuestion(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= activeList.length) return;
    setActiveList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  function previewAudioPrompt(q: CbtQuestion) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const text = (q.audioPrompt || q.question || "").trim();
    if (!text) return;

    window.speechSynthesis.cancel();
    if (speakingPreviewId === q.id) {
      setSpeakingPreviewId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.92;
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find((v) => v.lang.startsWith("en"));
    if (enVoice) utterance.voice = enVoice;

    utterance.onstart = () => setSpeakingPreviewId(q.id);
    utterance.onend = () => setSpeakingPreviewId(null);
    utterance.onerror = () => setSpeakingPreviewId(null);
    window.speechSynthesis.speak(utterance);
  }

  function validateQuestionList(
    list: CbtQuestion[],
    label: string
  ): { msg: string; id: string } | null {
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      const num = i + 1;
      if (!q.title.trim()) return { msg: `${label} — Soal #${num}: Judul soal wajib diisi.`, id: q.id };
      if (!q.question.trim()) return { msg: `${label} — Soal #${num}: Teks pertanyaan wajib diisi.`, id: q.id };

      if (q.type === "vocab_match") {
        const cleanOpts = (q.options || []).map((o) => o.trim()).filter(Boolean);
        if (cleanOpts.length < 2) {
          return { msg: `${label} — Soal #${num}: Isi minimal 2 pilihan jawaban A–D.`, id: q.id };
        }
        const correctIdx = q.correctOptionIndex ?? 0;
        if (!(q.options?.[correctIdx] || "").trim()) {
          return { msg: `${label} — Soal #${num}: Pilihan jawaban yang ditandai benar masih kosong.`, id: q.id };
        }
      } else {
        if (!q.targetAnswer.trim()) {
          return { msg: `${label} — Soal #${num}: Kunci jawaban utama wajib diisi.`, id: q.id };
        }
      }

      if (q.type === "audio_speaking" && !(q.audioPrompt || "").trim()) {
        return { msg: `${label} — Soal #${num}: Teks Audio Prompt wajib diisi untuk soal Speaking.`, id: q.id };
      }
      if (!q.points || Number(q.points) < 1) {
        return { msg: `${label} — Soal #${num}: Poin minimal 1.`, id: q.id };
      }
      if (!q.timeLimitSeconds || Number(q.timeLimitSeconds) < 15) {
        return { msg: `${label} — Soal #${num}: Batas waktu minimal 15 detik.`, id: q.id };
      }
    }
    return null;
  }

  async function handleSave() {
    if (mainQuestions.length === 0) {
      setActiveTab("main");
      setError("Tambahkan minimal 1 soal CBT utama terlebih dahulu (atau pilih salah satu Template Paket Resmi).");
      return;
    }

    const mainErr = validateQuestionList(mainQuestions, "Soal Utama");
    if (mainErr) {
      setActiveTab("main");
      setSelectedId(mainErr.id);
      setError(mainErr.msg);
      return;
    }

    if (remedialQuestions.length > 0) {
      const remErr = validateQuestionList(remedialQuestions, "Soal Remedial");
      if (remErr) {
        setActiveTab("remedial");
        setSelectedId(remErr.id);
        setError(remErr.msg);
        return;
      }
    }

    const numScore = Number(passingScore);
    if (!passingScore || isNaN(numScore) || numScore < 1 || numScore > 100) {
      setShowSettings(true);
      setError("Passing Score (KKM) harus antara 1 sampai 100.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const sanitize = (list: CbtQuestion[]): CbtQuestion[] =>
      list.map((q) => {
        const cleanOpts =
          q.type === "vocab_match"
            ? (q.options || []).map((o) => o.trim()).filter(Boolean)
            : undefined;
        const correctIdx =
          q.type === "vocab_match"
            ? Math.min(q.correctOptionIndex ?? 0, Math.max(0, (cleanOpts?.length || 1) - 1))
            : undefined;
        const resolvedTarget =
          q.type === "vocab_match" && cleanOpts
            ? cleanOpts[correctIdx ?? 0] || q.targetAnswer.trim()
            : q.targetAnswer.trim();

        return {
          ...q,
          title: q.title.trim(),
          instructions: q.instructions.trim(),
          question: q.question.trim(),
          passage: q.type === "text_fill" ? (q.passage || "").trim() || undefined : undefined,
          audioPrompt: q.type === "audio_speaking" ? (q.audioPrompt || "").trim() : undefined,
          options: cleanOpts,
          correctOptionIndex: correctIdx,
          targetAnswer: resolvedTarget,
          acceptableAnswers:
            q.type === "text_fill" || q.type === "translate"
              ? (q.acceptableAnswers || []).map((s) => s.trim()).filter(Boolean)
              : undefined,
          keyPhrases:
            q.type === "audio_speaking" || q.type === "translate"
              ? (q.keyPhrases || []).map((s) => s.trim()).filter(Boolean)
              : undefined,
          timeLimitSeconds: Math.max(15, Number(q.timeLimitSeconds) || 90),
          points: Math.max(1, Number(q.points) || 10),
        };
      });

    const totalMainPoints = mainQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    const totalMainSec = mainQuestions.reduce((acc, q) => acc + (Number(q.timeLimitSeconds) || 90), 0);

    try {
      const res = await fetch("/api/instructor/exams/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          title: title.trim() || `Final Competency Exam (CBT) — ${course.title}`,
          passingScore: numScore,
          durationMinutes: Math.max(5, Math.min(300, Math.ceil(totalMainSec / 60))),
          description: instructions.trim(),
          content: {
            ...legacyFields,
            cbtQuestions: sanitize(mainQuestions),
            remedialCbtQuestions:
              remedialQuestions.length > 0 ? sanitize(remedialQuestions) : undefined,
            examInstructions: instructions.trim(),
            remedialInstructions: remedialInstructions.trim() || undefined,
            totalPoints: totalMainPoints,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan bank soal CBT.");
      }

      setSuccess("Bank soal ujian CBT berhasil disimpan dan langsung aktif untuk siswa!");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan konfigurasi ujian.");
    } finally {
      setSaving(false);
    }
  }

  const LETTERS = ["A", "B", "C", "D"];

  return (
    <div className="mx-auto max-w-[1360px] space-y-5 pb-12">
      {/* Top Sticky Action Header */}
      <div className="sticky top-0 z-20 rounded-2xl border border-zinc-200/90 bg-white/95 backdrop-blur px-4 py-3.5 sm:px-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-xs font-bold text-zinc-700 transition shrink-0"
            >
              <LandingIcon name="ArrowLeft" size={14} color="currentColor" />
              <span>Kembali</span>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                  CBT Exam Builder &bull; Paket Jago Bahasa Inggris
                </span>
                <span className="text-xs text-zinc-400 hidden sm:inline">&bull;</span>
                <span className="text-xs font-semibold text-zinc-500 truncate hidden sm:inline">
                  {course.title}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-black text-zinc-900 truncate mt-0.5 font-[family-name:var(--font-heading)]">
                {title || `Final Competency Exam — ${course.title}`}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowPresetModal((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                showPresetModal
                  ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                  : "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-800"
              }`}
            >
              <LandingIcon name="BookOpen" size={14} color="currentColor" />
              <span>Template Paket A1–A3</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                showSettings
                  ? "border-blue-300 bg-blue-50 text-blue-800"
                  : "border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700"
              }`}
            >
              <LandingIcon name="Target" size={14} color="currentColor" />
              <span>Pengaturan &amp; KKM ({passingScore})</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] disabled:opacity-50 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
            >
              <LandingIcon name="Check" size={14} color="#fff" />
              <span>{saving ? "Menyimpan..." : "Simpan & Terbitkan Soal"}</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher + Breakdown Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-100">
          <div className="inline-flex p-1 bg-zinc-100 rounded-xl border border-zinc-200/80 self-start">
            <button
              type="button"
              onClick={() => switchTab("main")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                activeTab === "main"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <LandingIcon name="FileText" size={14} color="currentColor" />
              <span>1. Soal Ujian Utama</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  mainQuestions.length > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {mainQuestions.length} Soal
              </span>
            </button>

            <button
              type="button"
              onClick={() => switchTab("remedial")}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                activeTab === "remedial"
                  ? "bg-white text-amber-800 shadow-2xs"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <LandingIcon name="RotateCcw" size={14} color="currentColor" />
              <span>2. Soal Remedial (Set B)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  remedialQuestions.length > 0
                    ? "bg-amber-100 text-amber-900"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {remedialQuestions.length > 0 ? `${remedialQuestions.length} Soal` : "Opsional"}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <span className="px-2 py-1 rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
              🔤 {stats.vocabCount} Vocab
            </span>
            <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
              ✍️ {stats.fillCount} Isian
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-100">
              🌐 {stats.translateCount} Translate
            </span>
            <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
              🎙️ {stats.audioCount} Speaking
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              {stats.totalPoints} Poin &bull; ~{stats.totalMinutes} mnt
            </span>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-800 text-xs font-black cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 flex flex-wrap items-center justify-between gap-3">
          <span>✓ {success}</span>
          <Link
            href={`/instructor/curriculum?tab=exams&courseId=${course.id}`}
            className="underline font-extrabold text-emerald-900"
          >
            Kembali ke Panel Ujian &rarr;
          </Link>
        </div>
      )}

      {/* Official Paket Jago Bahasa Inggris Template Picker Panel - Concise UI/UX */}
      {showPresetModal && (
        <div className="rounded-2xl border border-[#0073F5]/25 bg-gradient-to-br from-blue-50/40 via-white to-white p-4 sm:p-5 shadow-sm space-y-3.5 transition-all animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0073F5]/10 text-[#0062D1] text-sm">
                ✨
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-extrabold text-[#0B2559]">
                  Template Soal Siap Pakai
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Pilih paket kurikulum untuk mengisi 8 soal {activeTab === "main" ? "Ujian Utama" : "Remedial"} secara instan, lalu bebas diedit.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPresetModal(false)}
              className="text-xs font-bold text-zinc-400 hover:text-zinc-700 px-2 py-1 rounded-lg hover:bg-zinc-100 cursor-pointer transition"
            >
              Tutup ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CBT_EXAM_PRESETS.map((preset) => {
              const meta = PRESET_CARDS_META[preset.id] || {
                level: preset.levelBadge,
                levelBg: "bg-zinc-50 border-zinc-200",
                levelColor: "text-zinc-700",
                icon: "📝",
                title: preset.shortLabel,
                chips: ["8 Soal", "Standar Kurikulum"],
                accentBorder: "hover:border-[#0073F5]",
              };

              return (
                <div
                  key={preset.id}
                  className={`rounded-xl border border-zinc-200/90 bg-white p-3.5 flex flex-col justify-between gap-3 transition-all ${meta.accentBorder} hover:shadow-xs group`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${meta.levelBg} ${meta.levelColor}`}
                      >
                        {meta.level}
                      </span>
                      <span className="text-base select-none">{meta.icon}</span>
                    </div>

                    <h3 className="text-xs font-extrabold text-zinc-900 group-hover:text-[#0073F5] transition-colors leading-snug">
                      {meta.title}
                    </h3>

                    {/* Chips - Concise instead of long paragraphs */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {meta.chips.map((chip) => (
                        <span
                          key={chip}
                          className="text-[9.5px] font-semibold text-zinc-600 bg-zinc-100 px-1.5 py-0.5 rounded"
                        >
                          {chip}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(preset.id)}
                    className="w-full py-2 px-3 rounded-xl bg-[#0B2559] hover:bg-[#0073F5] text-white text-[11px] font-extrabold transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
                  >
                    <span>Gunakan Template</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Collapsible Exam Settings Card */}
      {showSettings && (
        <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div>
              <h2 className="text-sm font-black text-zinc-900">Pengaturan Umum Ujian CBT</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Atur judul ujian, batas kelulusan (KKM), dan instruksi yang tampil di lobby siswa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-900 cursor-pointer"
            >
              Sembunyikan ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Judul Ujian CBT
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Final Competency Exam (CBT)"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Passing Score / KKM (1–100)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-extrabold text-zinc-900 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                Instruksi Ujian Utama
              </label>
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-amber-900 mb-1.5">
                Instruksi Khusus Remedial Set B (Opsional)
              </label>
              <textarea
                rows={3}
                value={remedialInstructions}
                onChange={(e) => setRemedialInstructions(e.target.value)}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/30 px-3.5 py-2.5 text-xs text-zinc-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Question Navigator Sidebar - Redesigned UI/UX */}
        <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden lg:sticky lg:top-[142px]">
          {/* Header */}
          <div className="p-3.5 border-b border-zinc-100 bg-zinc-50/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black uppercase tracking-wider text-[#0B2559]">
                  Daftar Soal
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0073F5]/10 text-[#0062D1]">
                  {activeList.length} Soal
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetModal((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0062D1] hover:text-[#0B2559] hover:underline cursor-pointer transition"
              >
                <span>✨ Template</span>
              </button>
            </div>

            {/* Clean Segmented Quick Add Bar */}
            <div>
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                + Tambah Bentuk Soal:
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                {(["vocab_match", "text_fill", "translate", "audio_speaking"] as CbtQuestionType[]).map((t) => {
                  const meta = QUESTION_TYPE_META[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleAddQuestion(t)}
                      title={`Tambah ${meta.label}`}
                      className="py-1.5 px-0.5 rounded-lg bg-white hover:bg-blue-50 text-zinc-700 hover:text-[#0062D1] border border-zinc-200/80 hover:border-[#0073F5]/40 text-[10.5px] font-bold shadow-2xs transition flex flex-col items-center justify-center gap-0.5 cursor-pointer active:scale-95"
                    >
                      <span className="text-xs">{meta.icon}</span>
                      <span className="truncate max-w-full text-[9.5px]">{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* List of Questions */}
          <div className="p-2 space-y-1.5 max-h-[520px] overflow-y-auto no-scrollbar">
            {activeList.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="text-2xl">📝</div>
                <div className="text-xs font-bold text-zinc-500">Belum ada soal di daftar ini.</div>
                <button
                  type="button"
                  onClick={() => setShowPresetModal(true)}
                  className="text-xs font-bold text-[#0073F5] underline cursor-pointer"
                >
                  Pilih Template Siap Pakai &rarr;
                </button>
              </div>
            ) : (
              activeList.map((q, idx) => {
                const isSelected = q.id === selectedId;
                const meta = QUESTION_TYPE_META[q.type] || QUESTION_TYPE_META.text_fill;
                const isIncomplete =
                  !q.title.trim() ||
                  !q.question.trim() ||
                  (q.type === "vocab_match"
                    ? !(q.options?.[q.correctOptionIndex ?? 0] || "").trim()
                    : !q.targetAnswer.trim()) ||
                  (q.type === "audio_speaking" && !(q.audioPrompt || "").trim());

                // Smart display title: If empty, preview the question text or a clean descriptive fallback
                const displayTitle = q.title.trim()
                  ? q.title.trim()
                  : q.question.trim()
                  ? q.question.trim().slice(0, 32) + (q.question.length > 32 ? "..." : "")
                  : `Soal ${idx + 1} (${meta.shortLabel})`;

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedId(q.id)}
                    className={`group relative rounded-xl border transition-all cursor-pointer p-2.5 ${
                      isSelected
                        ? "border-[#0073F5] bg-blue-50/40 ring-1 ring-[#0073F5]/30 shadow-xs"
                        : "border-zinc-200/80 bg-white hover:border-zinc-300 hover:bg-zinc-50/70"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {/* Number Badge */}
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black mt-0.5 transition ${
                          isSelected
                            ? "bg-[#0073F5] text-white shadow-2xs"
                            : "bg-zinc-100 text-zinc-600 group-hover:bg-zinc-200"
                        }`}
                      >
                        {idx + 1}
                      </span>

                      <div className="min-w-0 flex-1">
                        {/* Title & Warning */}
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-bold truncate ${
                              isSelected ? "text-[#0B2559]" : "text-zinc-800"
                            }`}
                          >
                            {displayTitle}
                          </span>
                          {isIncomplete && (
                            <span
                              className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-full shrink-0"
                              title="Ada kolom wajib yang belum diisi"
                            >
                              <span>⚠️</span>
                              <span className="hidden xl:inline">Lengkapi</span>
                            </span>
                          )}
                        </div>

                        {/* Meta Tags Row */}
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-500 font-semibold">
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-zinc-100 text-zinc-700">
                            <span>{meta.icon}</span>
                            <span>{meta.shortLabel}</span>
                          </span>
                          <span>&bull;</span>
                          <span className="text-zinc-600 font-bold">{q.points} Pts</span>
                          <span>&bull;</span>
                          <span className="text-zinc-400">{q.timeLimitSeconds}s</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Inline Actions (Visible when selected or hover) */}
                    <div
                      className={`mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between transition-opacity ${
                        isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveQuestion(idx, -1)}
                          title="Geser ke atas"
                          className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 disabled:opacity-20 text-[10px] font-bold cursor-pointer"
                        >
                          ▲ Naik
                        </button>
                        <button
                          type="button"
                          disabled={idx === activeList.length - 1}
                          onClick={() => handleMoveQuestion(idx, 1)}
                          title="Geser ke bawah"
                          className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 disabled:opacity-20 text-[10px] font-bold cursor-pointer"
                        >
                          ▼ Turun
                        </button>
                        <span className="text-[10px] text-zinc-300">|</span>
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(q)}
                          title="Duplikat soal ini"
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200/60 cursor-pointer"
                        >
                          Duplikat
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        title="Hapus soal ini"
                        className="px-1.5 py-0.5 rounded text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                      >
                        Hapus ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Sticky Summary Footer */}
          <div className="p-3 border-t border-zinc-100 bg-zinc-50/80 flex items-center justify-between text-[11px] font-bold text-zinc-600">
            <span>Total: {stats.total} Soal</span>
            <span className="text-[#0062D1] font-extrabold">{stats.totalPoints} Poin &bull; ~{stats.totalMinutes} Mnt</span>
          </div>
        </aside>

        {/* RIGHT COLUMN: Spacious Selected Question Editor */}
        <section className="lg:col-span-8 xl:col-span-9 space-y-5">
          {!selectedQ ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-white p-8 sm:p-12 text-center space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0073F5] border border-blue-100">
                <LandingIcon name="BookOpen" size={28} color="currentColor" />
              </div>
              <div className="max-w-lg mx-auto space-y-1.5">
                <h2 className="text-base font-extrabold text-[#0B2559]">
                  {activeTab === "main"
                    ? "Pilih Template Siap Pakai atau Buat Soal Baru"
                    : "Paket Soal Remedial (Set B) Masih Kosong"}
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Mendukung 4 format standar: <strong>Vocabulary Matching (A–D)</strong>, <strong>Complete the Sentences</strong>, <strong>Translate into English</strong>, dan <strong>Speaking Interview</strong>.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 max-w-3xl mx-auto pt-1">
                {CBT_EXAM_PRESETS.map((preset) => {
                  const meta = PRESET_CARDS_META[preset.id] || {
                    level: preset.levelBadge,
                    levelBg: "bg-zinc-50 border-zinc-200",
                    levelColor: "text-zinc-700",
                    icon: "📝",
                    title: preset.shortLabel,
                    chips: ["8 Soal", "Standar Kurikulum"],
                    accentBorder: "hover:border-[#0073F5]",
                  };
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className={`text-left p-3 rounded-xl border border-zinc-200 bg-white hover:bg-blue-50/40 transition-all cursor-pointer ${meta.accentBorder} flex flex-col justify-between gap-2 shadow-2xs group`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${meta.levelBg} ${meta.levelColor}`}
                          >
                            {meta.level}
                          </span>
                          <span className="text-sm">{meta.icon}</span>
                        </div>
                        <span className="text-xs font-bold text-zinc-900 group-hover:text-[#0073F5] block mt-0.5">
                          {meta.title}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-[#0062D1]">
                        Pakai Template &rarr;
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
              {/* Editor Card Header */}
              <div className="px-5 py-4 border-b border-zinc-100 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${
                      (QUESTION_TYPE_META[selectedQ.type] || QUESTION_TYPE_META.text_fill).badgeCls
                    }`}
                  >
                    #{selectedIndex + 1}
                  </span>
                  <div>
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Soal {selectedIndex + 1} dari {activeList.length} &bull; {selectedQ.section}
                    </span>
                    <h3 className="text-sm font-black text-zinc-900">
                      {selectedQ.title || "Soal Baru"}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMoveQuestion(selectedIndex, -1)}
                    disabled={selectedIndex === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-35 text-xs font-bold cursor-pointer"
                  >
                    ↑ Naik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveQuestion(selectedIndex, 1)}
                    disabled={selectedIndex === activeList.length - 1}
                    className="px-2.5 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-35 text-xs font-bold cursor-pointer"
                  >
                    ↓ Turun
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicateQuestion(selectedQ)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 text-xs font-bold cursor-pointer"
                  >
                    Duplikat
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(selectedQ.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>

              {/* Editor Form Body */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* 4-Way Question Type Selector - Modern Segmented */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700">
                      Bentuk Soal
                    </label>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Format Standar Kurikulum
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-zinc-100 rounded-xl border border-zinc-200">
                    {(
                      ["vocab_match", "text_fill", "translate", "audio_speaking"] as CbtQuestionType[]
                    ).map((t) => {
                      const meta = QUESTION_TYPE_META[t];
                      const active = selectedQ.type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => handleUpdateQuestion(selectedQ.id, { type: t })}
                          className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                            active
                              ? "bg-[#0B2559] text-white shadow-xs font-extrabold"
                              : "text-zinc-600 hover:text-zinc-900 hover:bg-white/60"
                          }`}
                        >
                          <span>{meta.icon}</span>
                          <span>{meta.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Meta Row: Section, Poin, Waktu */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Kategori / Bagian Materi
                    </label>
                    <select
                      value={selectedQ.section}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, {
                          section: e.target.value as CbtSectionName,
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-900 focus:border-blue-500 focus:outline-none"
                    >
                      {SECTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Bobot Poin
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={selectedQ.points}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, {
                          points: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-extrabold text-zinc-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Batas Waktu (detik)
                    </label>
                    <input
                      type="number"
                      min={15}
                      max={600}
                      value={selectedQ.timeLimitSeconds}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, {
                          timeLimitSeconds: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-xs font-extrabold text-zinc-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Judul & Instruksi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Judul Soal <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedQ.title}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, { title: e.target.value })
                      }
                      placeholder="Contoh: Vocabulary Pertemuan 3 — Meeting the Teacher"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Instruksi Pengerjaan
                    </label>
                    <input
                      type="text"
                      value={selectedQ.instructions}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, { instructions: e.target.value })
                      }
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Type-specific Context / Audio Prompt */}
                {selectedQ.type === "audio_speaking" && (
                  <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label className="text-xs font-extrabold text-purple-900 block">
                          Teks Audio Prompt (Dibacakan Bahasa Inggris) <span className="text-red-500">*</span>
                        </label>
                        <p className="text-[11px] text-purple-700/80">
                          Contoh: pertanyaan Interview WH-Questions, Modal CAN, atau Speaking Level A1–A3.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => previewAudioPrompt(selectedQ)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                      >
                        <span>
                          {speakingPreviewId === selectedQ.id
                            ? "⏹ Stop Preview"
                            : "🔊 Preview Suara Audio"}
                        </span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={selectedQ.audioPrompt || ""}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, { audioPrompt: e.target.value })
                      }
                      placeholder="Contoh: What do you do for a living, and what are your main responsibilities at work?"
                      className="w-full rounded-xl border border-purple-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                )}

                {selectedQ.type === "text_fill" && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                      Pilihan Kata (Word Bank) / Catatan Grammar (Opsional)
                    </label>
                    <input
                      type="text"
                      value={selectedQ.passage || ""}
                      onChange={(e) =>
                        handleUpdateQuestion(selectedQ.id, { passage: e.target.value })
                      }
                      placeholder="Contoh: Pilihan kata: teacher, school, homework, progress, friendly, classroom, grades"
                      className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}

                {/* Pertanyaan Utama */}
                <div>
                  <label className="block text-xs font-bold text-zinc-700 mb-1.5">
                    {selectedQ.type === "translate"
                      ? "Kalimat Bahasa Indonesia yang Harus Diterjemahkan *"
                      : selectedQ.type === "vocab_match"
                      ? "Pertanyaan Kosakata / Arti Kata *"
                      : "Pertanyaan Utama *"}
                  </label>
                  <textarea
                    rows={2}
                    value={selectedQ.question}
                    onChange={(e) =>
                      handleUpdateQuestion(selectedQ.id, { question: e.target.value })
                    }
                    placeholder={
                      selectedQ.type === "vocab_match"
                        ? "Contoh: Apa arti dari kata 'Progress'?"
                        : selectedQ.type === "translate"
                        ? "Contoh: Saya ingin bertanya tentang perkembangan anak saya."
                        : selectedQ.type === "audio_speaking"
                        ? "Contoh: Jawab secara lisan dengan kalimat lengkap (sebutkan nama, tempat tinggal, dan kegiatan)."
                        : "Contoh: My child has to finish his _____ before watching television."
                    }
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Answer Key Section — tailored to each of the 4 formats */}
                {selectedQ.type === "vocab_match" ? (
                  <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-teal-900">
                        Pilihan Jawaban (A–D) — Klik Lingkaran untuk Menandai Jawaban Benar
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {LETTERS.map((letter, idx) => {
                        const isCorrect = (selectedQ.correctOptionIndex ?? 0) === idx;
                        const optVal = selectedQ.options?.[idx] ?? "";
                        return (
                          <div
                            key={letter}
                            className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition ${
                              isCorrect
                                ? "border-emerald-400 bg-emerald-50/80 ring-1 ring-emerald-300/60"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectCorrectOption(selectedQ, idx)}
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition cursor-pointer ${
                                isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                              }`}
                              title="Tandai sebagai jawaban benar"
                            >
                              {isCorrect ? "✓" : letter}
                            </button>
                            <input
                              type="text"
                              value={optVal}
                              onChange={(e) => handleOptionChange(selectedQ, idx, e.target.value)}
                              placeholder={`Pilihan ${letter}...`}
                              className="w-full bg-transparent text-xs font-semibold text-zinc-900 focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <LandingIcon name="CheckCircle" size={16} color="#059669" />
                      <h4 className="text-xs font-extrabold text-emerald-900">
                        Kunci Jawaban &amp; Parameter Auto-Grading
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                          {selectedQ.type === "audio_speaking"
                            ? "Contoh Jawaban Ideal (Example Answer) *"
                            : selectedQ.type === "translate"
                            ? "Terjemahan Bahasa Inggris Utama *"
                            : "Kunci Jawaban Utama *"}
                        </label>
                        <input
                          type="text"
                          value={selectedQ.targetAnswer}
                          onChange={(e) =>
                            handleUpdateQuestion(selectedQ.id, {
                              targetAnswer: e.target.value,
                            })
                          }
                          placeholder={
                            selectedQ.type === "translate"
                              ? "I want to ask about my child's progress."
                              : selectedQ.type === "audio_speaking"
                              ? "I work as an administrative staff member..."
                              : "homework"
                          }
                          className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-900 focus:border-emerald-500 focus:outline-none"
                        />
                      </div>

                      {selectedQ.type === "audio_speaking" ? (
                        <div>
                          <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                            Kata Kunci Penilaian Speaking (pisahkan koma)
                          </label>
                          <input
                            type="text"
                            value={(selectedQ.keyPhrases || []).join(", ")}
                            onChange={(e) =>
                              handleUpdateQuestion(selectedQ.id, {
                                keyPhrases: e.target.value
                                  .split(",")
                                  .map((s) => s.replace(/^\s+/, "")),
                              })
                            }
                            placeholder="progress, grades, school, child"
                            className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-bold text-emerald-900 mb-1.5">
                            Alternatif Jawaban Diterima (opsional, pisahkan koma)
                          </label>
                          <input
                            type="text"
                            value={(selectedQ.acceptableAnswers || []).join(", ")}
                            onChange={(e) =>
                              handleUpdateQuestion(selectedQ.id, {
                                acceptableAnswers: e.target.value
                                  .split(",")
                                  .map((s) => s.replace(/^\s+/, "")),
                              })
                            }
                            placeholder="I'd like to ask about my child's progress, ..."
                            className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Official 5-Aspect Speaking Rubric Reference for Audio Speaking questions */}
                    {selectedQ.type === "audio_speaking" && (
                      <div className="rounded-xl border border-purple-200 bg-white p-3.5 space-y-2">
                        <span className="text-[11px] font-black text-purple-900 uppercase tracking-wider block">
                          Acuan Rubrik Penilaian Speaking Resmi (Total 100 Poin)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                          {OFFICIAL_SPEAKING_RUBRIC.map((r) => (
                            <div
                              key={r.aspect}
                              className="rounded-lg bg-purple-50/60 border border-purple-100 p-2 text-[10px]"
                            >
                              <div className="font-extrabold text-purple-950">
                                {r.aspect} ({r.maxScore})
                              </div>
                              <p className="text-zinc-600 mt-0.5 leading-snug">{r.criteria}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Prev / Next Navigation Footer */}
              <div className="px-5 py-3.5 border-t border-zinc-100 bg-zinc-50/70 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={selectedIndex <= 0}
                  onClick={() => setSelectedId(activeList[selectedIndex - 1]?.id ?? null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  &larr; Soal Sebelumnya
                </button>

                <span className="text-[11px] font-semibold text-zinc-400">
                  Urutan soal tertulis (Tahap 1) &rarr; speaking (Tahap 2) diacak unik per siswa
                </span>

                <button
                  type="button"
                  disabled={selectedIndex < 0 || selectedIndex >= activeList.length - 1}
                  onClick={() => setSelectedId(activeList[selectedIndex + 1]?.id ?? null)}
                  className="px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-100 disabled:opacity-40 text-xs font-bold text-zinc-700 cursor-pointer"
                >
                  Soal Berikutnya &rarr;
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
