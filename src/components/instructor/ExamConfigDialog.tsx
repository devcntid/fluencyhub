"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { LandingIcon } from "@/components/landing/LandingIcon";
import {
  DEFAULT_CBT_QUESTIONS,
  type CbtQuestion,
  type CbtQuestionType,
} from "@/lib/exams/cbt";
import type { Exam } from "@/types/db";

const SECTIONS: CbtQuestion["section"][] = [
  "Reading & Grammar",
  "Listening & Speaking",
  "Business English",
];

function createBlankQuestion(type: CbtQuestionType, prefix: string): CbtQuestion {
  const uid = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  if (type === "audio_speaking") {
    return {
      id: uid,
      type: "audio_speaking",
      section: "Listening & Speaking",
      title: "",
      instructions:
        "Dengarkan audio pertanyaan berikut, lalu rekam jawaban lisanmu dalam bahasa Inggris secara jelas dan profesional.",
      audioPrompt: "",
      question: "",
      targetAnswer: "",
      keyPhrases: [],
      timeLimitSeconds: 120,
      points: 20,
    };
  }
  return {
    id: uid,
    type: "text_fill",
    section: "Reading & Grammar",
    title: "",
    instructions:
      "Lengkapi bagian rumpang (_____) pada kalimat berikut dengan kata atau frasa bahasa Inggris yang tepat.",
    passage: "",
    question: "",
    targetAnswer: "",
    acceptableAnswers: [],
    timeLimitSeconds: 90,
    points: 15,
  };
}

function cloneTemplateQuestions(prefix: string): CbtQuestion[] {
  return DEFAULT_CBT_QUESTIONS.map((q, idx) => ({
    ...q,
    id: `${prefix}-q${idx + 1}-${Math.random().toString(36).slice(2, 5)}`,
    acceptableAnswers: q.acceptableAnswers ? [...q.acceptableAnswers] : undefined,
    keyPhrases: q.keyPhrases ? [...q.keyPhrases] : undefined,
  }));
}

export function ExamConfigDialog({
  courseId,
  courseTitle,
  initialExam,
  triggerLabel = "Kelola Soal CBT",
  triggerClassName = "btn btn-secondary btn-sm",
  initialTab = "main",
  iconName = "FileText",
}: {
  courseId: number;
  courseTitle: string;
  initialExam?: Exam | null;
  triggerLabel?: string;
  triggerClassName?: string;
  initialTab?: "main" | "remedial";
  iconName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "remedial">(initialTab);

  const [title, setTitle] = useState(
    initialExam?.title || `Final Competency Exam (CBT) — ${courseTitle}`
  );
  const [passingScore, setPassingScore] = useState<number | string>(
    initialExam?.passingScore || 70
  );
  const [instructions, setInstructions] = useState(
    initialExam?.content?.examInstructions ||
      "Kerjakan seluruh soal ujian CBT secara mandiri. Soal terdiri dari isian teks (auto-grading toleransi typo) dan latihan speaking dengan audio."
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

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [speakingPreviewId, setSpeakingPreviewId] = useState<string | null>(null);

  // Preserve any legacy PDF fields if they existed so nothing is lost on save
  const [legacyFields, setLegacyFields] = useState<{
    questionFileUrl?: string;
    questionFileName?: string;
    remedialFileUrl?: string;
    remedialFileName?: string;
  }>({
    questionFileUrl: initialExam?.content?.questionFileUrl,
    questionFileName: initialExam?.content?.questionFileName,
    remedialFileUrl: initialExam?.content?.remedialFileUrl,
    remedialFileName: initialExam?.content?.remedialFileName,
  });

  // Load latest exam config when dialog opens
  useEffect(() => {
    if (open && courseId) {
      fetch(`/api/instructor/exams/config?courseId=${courseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data) {
            const ex = data.data as Exam;
            if (ex.title) setTitle(ex.title);
            if (ex.passingScore) setPassingScore(ex.passingScore);
            if (ex.content?.examInstructions) setInstructions(ex.content.examInstructions);
            if (ex.content?.remedialInstructions) {
              setRemedialInstructions(ex.content.remedialInstructions);
            }
            if (Array.isArray(ex.content?.cbtQuestions)) {
              setMainQuestions(ex.content.cbtQuestions as CbtQuestion[]);
            }
            if (Array.isArray(ex.content?.remedialCbtQuestions)) {
              setRemedialQuestions(ex.content.remedialCbtQuestions as CbtQuestion[]);
            }
            setLegacyFields({
              questionFileUrl: ex.content?.questionFileUrl,
              questionFileName: ex.content?.questionFileName,
              remedialFileUrl: ex.content?.remedialFileUrl,
              remedialFileName: ex.content?.remedialFileName,
            });
          }
        })
        .catch(() => {});
    }
  }, [open, courseId]);

  const activeList = activeTab === "main" ? mainQuestions : remedialQuestions;
  const setActiveList = activeTab === "main" ? setMainQuestions : setRemedialQuestions;

  const stats = useMemo(() => {
    const textCount = activeList.filter((q) => q.type === "text_fill").length;
    const audioCount = activeList.filter((q) => q.type === "audio_speaking").length;
    const totalPoints = activeList.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    const totalSec = activeList.reduce((acc, q) => acc + (Number(q.timeLimitSeconds) || 0), 0);
    return {
      total: activeList.length,
      textCount,
      audioCount,
      totalPoints,
      totalMinutes: Math.max(1, Math.ceil(totalSec / 60)),
    };
  }, [activeList]);

  function handleAddQuestion(type: CbtQuestionType) {
    const q = createBlankQuestion(type, activeTab === "main" ? "cbt" : "rem");
    setActiveList((prev) => [...prev, q]);
    setExpandedId(q.id);
    setError("");
  }

  function handleLoadTemplate() {
    const prefix = activeTab === "main" ? "cbt" : "rem";
    const cloned = cloneTemplateQuestions(prefix);
    setActiveList(cloned);
    setExpandedId(cloned[0]?.id || null);
    setError("");
  }

  function handleUpdateQuestion(id: string, patch: Partial<CbtQuestion>) {
    setActiveList((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const updated = { ...q, ...patch };
        if (patch.type === "audio_speaking" && q.type !== "audio_speaking") {
          updated.section = "Listening & Speaking";
          updated.timeLimitSeconds = updated.timeLimitSeconds || 120;
        } else if (patch.type === "text_fill" && q.type !== "text_fill") {
          updated.section = "Reading & Grammar";
          updated.timeLimitSeconds = updated.timeLimitSeconds || 90;
        }
        return updated;
      })
    );
  }

  function handleDeleteQuestion(id: string) {
    setActiveList((prev) => prev.filter((q) => q.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function handleDuplicateQuestion(q: CbtQuestion) {
    const copy: CbtQuestion = {
      ...q,
      id: `${activeTab === "main" ? "cbt" : "rem"}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title: q.title ? `${q.title} (Salinan)` : "",
      acceptableAnswers: q.acceptableAnswers ? [...q.acceptableAnswers] : undefined,
      keyPhrases: q.keyPhrases ? [...q.keyPhrases] : undefined,
    };
    setActiveList((prev) => [...prev, copy]);
    setExpandedId(copy.id);
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

  function validateQuestionList(list: CbtQuestion[], label: string): string | null {
    for (let i = 0; i < list.length; i++) {
      const q = list[i];
      const num = i + 1;
      if (!q.title.trim()) return `${label} — Soal #${num}: Judul soal wajib diisi.`;
      if (!q.question.trim()) return `${label} — Soal #${num}: Teks pertanyaan wajib diisi.`;
      if (!q.targetAnswer.trim()) return `${label} — Soal #${num}: Kunci jawaban utama wajib diisi.`;
      if (q.type === "audio_speaking" && !(q.audioPrompt || "").trim()) {
        return `${label} — Soal #${num}: Teks Audio Prompt wajib diisi untuk soal Listening & Speaking.`;
      }
      if (!q.points || Number(q.points) < 1) {
        return `${label} — Soal #${num}: Poin minimal 1.`;
      }
      if (!q.timeLimitSeconds || Number(q.timeLimitSeconds) < 15) {
        return `${label} — Soal #${num}: Batas waktu minimal 15 detik.`;
      }
    }
    return null;
  }

  async function handleSave() {
    if (mainQuestions.length === 0) {
      setActiveTab("main");
      setError("Tambahkan minimal 1 soal CBT utama terlebih dahulu (atau klik 'Muat Template Default').");
      return;
    }

    const mainErr = validateQuestionList(mainQuestions, "Soal Utama");
    if (mainErr) {
      setActiveTab("main");
      setError(mainErr);
      return;
    }

    if (remedialQuestions.length > 0) {
      const remErr = validateQuestionList(remedialQuestions, "Soal Remedial");
      if (remErr) {
        setActiveTab("remedial");
        setError(remErr);
        return;
      }
    }

    const numScore = Number(passingScore);
    if (!passingScore || isNaN(numScore) || numScore < 1 || numScore > 100) {
      setError("Passing Score (KKM) harus antara 1 sampai 100.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const totalMainPoints = mainQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);
    const totalMainSec = mainQuestions.reduce((acc, q) => acc + (Number(q.timeLimitSeconds) || 90), 0);

    try {
      const res = await fetch("/api/instructor/exams/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: title.trim() || `Final Competency Exam (CBT) — ${courseTitle}`,
          passingScore: numScore,
          durationMinutes: Math.max(5, Math.min(300, Math.ceil(totalMainSec / 60))),
          description: instructions.trim(),
          content: {
            ...legacyFields,
            cbtQuestions: mainQuestions.map((q) => ({
              ...q,
              title: q.title.trim(),
              instructions: q.instructions.trim(),
              question: q.question.trim(),
              passage: q.type === "text_fill" ? (q.passage || "").trim() || undefined : undefined,
              audioPrompt: q.type === "audio_speaking" ? (q.audioPrompt || "").trim() : undefined,
              targetAnswer: q.targetAnswer.trim(),
              acceptableAnswers:
                q.type === "text_fill"
                  ? (q.acceptableAnswers || []).map((s) => s.trim()).filter(Boolean)
                  : undefined,
              keyPhrases:
                q.type === "audio_speaking"
                  ? (q.keyPhrases || []).map((s) => s.trim()).filter(Boolean)
                  : undefined,
              timeLimitSeconds: Math.max(15, Number(q.timeLimitSeconds) || 90),
              points: Math.max(1, Number(q.points) || 15),
            })),
            remedialCbtQuestions:
              remedialQuestions.length > 0
                ? remedialQuestions.map((q) => ({
                    ...q,
                    title: q.title.trim(),
                    instructions: q.instructions.trim(),
                    question: q.question.trim(),
                    passage: q.type === "text_fill" ? (q.passage || "").trim() || undefined : undefined,
                    audioPrompt: q.type === "audio_speaking" ? (q.audioPrompt || "").trim() : undefined,
                    targetAnswer: q.targetAnswer.trim(),
                    acceptableAnswers:
                      q.type === "text_fill"
                        ? (q.acceptableAnswers || []).map((s) => s.trim()).filter(Boolean)
                        : undefined,
                    keyPhrases:
                      q.type === "audio_speaking"
                        ? (q.keyPhrases || []).map((s) => s.trim()).filter(Boolean)
                        : undefined,
                    timeLimitSeconds: Math.max(15, Number(q.timeLimitSeconds) || 90),
                    points: Math.max(1, Number(q.points) || 15),
                  }))
                : undefined,
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
      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan konfigurasi ujian.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-1.5 text-center cursor-pointer ${triggerClassName || "btn btn-secondary btn-sm"}`}
        onClick={() => {
          setActiveTab(initialTab);
          setOpen(true);
          setError("");
          setSuccess("");
        }}
      >
        {iconName && (
          <LandingIcon name={iconName} size={14} color="currentColor" className="shrink-0" />
        )}
        <span className="leading-none">{triggerLabel}</span>
      </button>

      <AdminFormDialog
        title={`Kelola Bank Soal Ujian CBT — ${courseTitle}`}
        open={open}
        onClose={() => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          setSpeakingPreviewId(null);
          setOpen(false);
        }}
        maxWidth="min(860px, 96vw)"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {success}
            </div>
          )}

          {/* Tabs: Main CBT Bank vs Remedial Set B */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200">
            <button
              type="button"
              onClick={() => {
                setActiveTab("main");
                setExpandedId(null);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "main"
                  ? "bg-white text-blue-700 shadow-sm border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
            >
              <LandingIcon
                name="FileText"
                size={15}
                color={activeTab === "main" ? "#2563eb" : "currentColor"}
              />
              <span>1. Soal Ujian Utama</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  mainQuestions.length > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {mainQuestions.length > 0 ? `${mainQuestions.length} Soal` : "Default"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("remedial");
                setExpandedId(null);
                setError("");
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "remedial"
                  ? "bg-white text-amber-800 shadow-sm border border-amber-300"
                  : "text-zinc-600 hover:text-amber-900 hover:bg-amber-100/50"
              }`}
            >
              <LandingIcon
                name="RotateCcw"
                size={15}
                color={activeTab === "remedial" ? "#d97706" : "currentColor"}
              />
              <span>2. Soal Remedial (Set B)</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  remedialQuestions.length > 0
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-zinc-200 text-zinc-600"
                }`}
              >
                {remedialQuestions.length > 0 ? `${remedialQuestions.length} Soal` : "Opsional"}
              </span>
            </button>
          </div>

          {/* General Settings (Main Tab) */}
          {activeTab === "main" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Judul Ujian CBT
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Final Competency Exam — Ready for Work"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Passing Score / KKM (1–100)
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-bold text-zinc-900 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                  Petunjuk Ujian (Tampil di Lobby Siswa)
                </label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Tulis instruksi singkat pengerjaan ujian CBT..."
                  className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <p className="text-xs text-amber-950 font-semibold">
                Soal Remedial (Set B) bersifat opsional. Jika diisi, siswa yang nilainya belum mencapai KKM (&lt; {passingScore}) akan otomatis mendapatkan paket soal ini saat mengulang ujian.
              </p>
              <div>
                <label className="block text-[11px] font-bold text-amber-900 mb-1">
                  Catatan Khusus Remedial (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={remedialInstructions}
                  onChange={(e) => setRemedialInstructions(e.target.value)}
                  placeholder="Contoh: Fokus perbaiki kelancaran speaking dan struktur past tense pada percobaan remedial ini."
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-zinc-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Toolbar & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-3.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-800">
                Total: {stats.total} Soal
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                ✍️ {stats.textCount} Teks Isian
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
                🎙️ {stats.audioCount} Audio Speaking
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                {stats.totalPoints} Poin • ~{stats.totalMinutes} mnt
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddQuestion("text_fill")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#F26A12] hover:bg-[#D65507] text-white text-[11px] font-bold shadow-2xs cursor-pointer"
              >
                <span>+ Soal Teks</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddQuestion("audio_speaking")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold shadow-2xs cursor-pointer"
              >
                <span>+ Soal Audio Speaking</span>
              </button>
              <button
                type="button"
                onClick={handleLoadTemplate}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-300 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 text-[11px] font-bold cursor-pointer"
                title="Muat 8 soal contoh bawaan English Ready yang bisa langsung diedit"
              >
                <span>Template (8 Soal)</span>
              </button>
            </div>
          </div>

          {/* Question Bank List */}
          {activeList.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/70 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-zinc-800">
                {activeTab === "main"
                  ? "Belum Ada Soal CBT Khusus untuk Kelas Ini"
                  : "Belum Ada Soal Remedial (Set B)"}
              </p>
              <p className="text-xs text-zinc-500 max-w-md mx-auto">
                {activeTab === "main"
                  ? "Tambahkan soal isian teks atau audio speaking baru, atau klik tombol Template untuk memuat 8 soal standar English Ready lalu sesuaikan."
                  : "Jika dibiarkan kosong, siswa remedial akan otomatis mengerjakan ulang soal ujian utama dengan urutan acak."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleLoadTemplate}
                  className="px-3.5 py-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  ✨ Muat Template 8 Soal Default
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion("text_fill")}
                  className="px-3.5 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold cursor-pointer"
                >
                  + Buat Soal dari Awal
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {activeList.map((q, index) => {
                const isOpen = expandedId === q.id;
                const isAudio = q.type === "audio_speaking";

                return (
                  <div
                    key={q.id}
                    className={`rounded-2xl border transition ${
                      isOpen
                        ? isAudio
                          ? "border-purple-300 bg-purple-50/20 shadow-xs"
                          : "border-blue-300 bg-blue-50/20 shadow-xs"
                        : "border-zinc-200 bg-white hover:border-zinc-300"
                    }`}
                  >
                    {/* Accordion Header */}
                    <div className="flex items-center justify-between gap-2 p-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : q.id)}
                        className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            isAudio
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-900 truncate max-w-[260px] sm:max-w-[380px]">
                              {q.title || "(Judul soal belum diisi)"}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isAudio
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {isAudio ? "🎙️ Audio Speaking" : "✍️ Teks Isian"}
                            </span>
                            <span className="text-[10px] font-semibold text-zinc-500">
                              {q.points} poin • {q.timeLimitSeconds}d
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                            {q.question || "Klik untuk mengisi pertanyaan & kunci jawaban..."}
                          </p>
                        </div>
                      </button>

                      {/* Row Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, -1)}
                          disabled={index === 0}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 text-[10px] font-bold cursor-pointer"
                          title="Pindah ke atas"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveQuestion(index, 1)}
                          disabled={index === activeList.length - 1}
                          className="p-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 text-[10px] font-bold cursor-pointer"
                          title="Pindah ke bawah"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateQuestion(q)}
                          className="px-2 py-1.5 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 text-[10px] font-bold cursor-pointer"
                          title="Duplikat soal"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="px-2 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-[10px] font-bold cursor-pointer"
                          title="Hapus soal"
                        >
                          Hapus
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : q.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-zinc-900 text-white text-[10px] font-bold cursor-pointer"
                        >
                          {isOpen ? "Tutup" : "Edit"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Editor Form */}
                    {isOpen && (
                      <div className="border-t border-zinc-200/80 p-4 space-y-3 bg-white rounded-b-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                              Tipe Soal
                            </label>
                            <select
                              value={q.type}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, {
                                  type: e.target.value as CbtQuestionType,
                                })
                              }
                              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900"
                            >
                              <option value="text_fill">
                                ✍️ Teks Isian (Fill-in-the-blank + Typo Grading)
                              </option>
                              <option value="audio_speaking">
                                🎙️ Audio Listening & Speaking (Voice Recognition)
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                              Kategori / Section
                            </label>
                            <select
                              value={q.section}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, {
                                  section: e.target.value as CbtQuestion["section"],
                                })
                              }
                              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900"
                            >
                              {SECTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Poin
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={q.points}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, {
                                    points: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full rounded-xl border border-zinc-300 px-2.5 py-2 text-xs font-bold"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Waktu (dtk)
                              </label>
                              <input
                                type="number"
                                min={15}
                                max={600}
                                value={q.timeLimitSeconds}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, {
                                    timeLimitSeconds: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full rounded-xl border border-zinc-300 px-2.5 py-2 text-xs font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                              Judul Soal *
                            </label>
                            <input
                              type="text"
                              value={q.title}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { title: e.target.value })
                              }
                              placeholder="Contoh: Past Tense in Business Reporting"
                              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                              Instruksi Pengerjaan
                            </label>
                            <input
                              type="text"
                              value={q.instructions}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { instructions: e.target.value })
                              }
                              placeholder="Arahan singkat untuk siswa..."
                              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs"
                            />
                          </div>
                        </div>

                        {isAudio ? (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold text-purple-800">
                                Teks Audio Prompt (Dibacakan Otomatis Bahasa Inggris) *
                              </label>
                              <button
                                type="button"
                                onClick={() => previewAudioPrompt(q)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-900 text-[10px] font-bold cursor-pointer"
                              >
                                <span>
                                  {speakingPreviewId === q.id
                                    ? "⏹ Stop Preview"
                                    : "🔊 Preview Suara"}
                                </span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={q.audioPrompt || ""}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { audioPrompt: e.target.value })
                              }
                              placeholder="Contoh: Could you please explain why our team needs two more days for quality assurance?"
                              className="w-full rounded-xl border border-purple-200 bg-purple-50/30 px-3 py-2 text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                              Konteks / Bacaan Singkat (Opsional)
                            </label>
                            <textarea
                              rows={2}
                              value={q.passage || ""}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { passage: e.target.value })
                              }
                              placeholder="Paragraf konteks tambahan jika diperlukan..."
                              className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs"
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                            Pertanyaan Utama *
                          </label>
                          <textarea
                            rows={2}
                            value={q.question}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { question: e.target.value })
                            }
                            placeholder={
                              isAudio
                                ? "Contoh: Jawab secara lisan: Jelaskan alasan teknis secara sopan..."
                                : "Contoh: Yesterday, the marketing committee _____ (hold) an evaluation meeting."
                            }
                            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-emerald-800 mb-1">
                              {isAudio
                                ? "Contoh Jawaban Ideal (Target Answer) *"
                                : "Kunci Jawaban Utama *"}
                            </label>
                            <input
                              type="text"
                              value={q.targetAnswer}
                              onChange={(e) =>
                                handleUpdateQuestion(q.id, { targetAnswer: e.target.value })
                              }
                              placeholder={
                                isAudio
                                  ? "We need sufficient time for testing and QA..."
                                  : "Contoh: held"
                              }
                              className="w-full rounded-xl border border-emerald-300 bg-emerald-50/30 px-3 py-2 text-xs font-semibold"
                            />
                          </div>

                          {isAudio ? (
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Kata Kunci Penilaian Speaking (pisahkan koma)
                              </label>
                              <input
                                type="text"
                                value={(q.keyPhrases || []).join(", ")}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, {
                                    keyPhrases: e.target.value
                                      .split(",")
                                      .map((s) => s.replace(/^\s+/, "")),
                                  })
                                }
                                placeholder="testing, quality assurance, schedule, client"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[11px] font-bold text-zinc-700 mb-1">
                                Alternatif Jawaban Benar (opsional, pisahkan koma)
                              </label>
                              <input
                                type="text"
                                value={(q.acceptableAnswers || []).join(", ")}
                                onChange={(e) =>
                                  handleUpdateQuestion(q.id, {
                                    acceptableAnswers: e.target.value
                                      .split(",")
                                      .map((s) => s.replace(/^\s+/, "")),
                                  })
                                }
                                placeholder="hearing, hearing back"
                                className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Save Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-200">
            <p className="text-[11px] text-zinc-500">
              Urutan soal otomatis diacak per siswa saat ujian dimulai.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] disabled:opacity-50 text-white text-xs font-extrabold shadow-xs cursor-pointer"
              >
                {saving ? "Menyimpan..." : "Simpan & Terbitkan Soal CBT"}
              </button>
            </div>
          </div>
        </div>
      </AdminFormDialog>
    </>
  );
}
