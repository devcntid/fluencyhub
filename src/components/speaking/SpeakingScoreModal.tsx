"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { EvaluationResult } from "@/lib/speaking/evaluator";

export function SpeakingScoreModal({
  open,
  evaluation,
  onClose,
  onSwitchToProgress,
}: {
  open: boolean;
  evaluation: EvaluationResult | null;
  onClose: () => void;
  onSwitchToProgress: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted || !open || !evaluation) return null;

  const score = evaluation.overallReadyScore;
  const levelInfo =
    score >= 85
      ? { title: "Ready for Work (CEFR C1)", badgeBg: "bg-emerald-100 text-emerald-800 border-emerald-200" }
      : score >= 70
      ? { title: "Ready to Connect (CEFR B2)", badgeBg: "bg-blue-100 text-blue-800 border-blue-200" }
      : score >= 50
      ? { title: "Ready to Speak (CEFR B1)", badgeBg: "bg-amber-100 text-amber-800 border-amber-200" }
      : score >= 30
      ? { title: "Foundational Speaker (CEFR A2)", badgeBg: "bg-orange-100 text-orange-800 border-orange-200" }
      : { title: "Early Starter (Perlu Latihan Lagi)", badgeBg: "bg-rose-100 text-rose-800 border-rose-200" };

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const pillars = [
    { label: "Kelancaran (Fluency & Pace)", score: evaluation.fluencyScore },
    { label: "Pelafalan (Pronunciation)", score: evaluation.pronunciationScore },
    { label: "Ketepatan Bahasa (Grammar)", score: evaluation.grammarScore },
    { label: "Kosakata Kerja (Vocabulary)", score: evaluation.vocabularyScore },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5">
      {/* Main Modal Box: Flex-col with sticky Header & Footer so nothing ever gets clipped */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#FBF6F1] shadow-2xl border border-[#E6DED4] text-[#0B2559] overflow-hidden">
        
        {/* 1. Sticky Top Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-[#E6DED4] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#C2530A] to-[#F26A12] text-white shadow-xs">
              <LandingIcon name="Sparkles" size={16} color="#FFFFFF" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B2559] leading-tight">
                Hasil Evaluasi Ready Score
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Analisis AI Coach terhadap performa bicaramu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#4A5468] hover:bg-[#EFE7DD] transition cursor-pointer"
            aria-label="Tutup"
          >
            <LandingIcon name="X" size={18} color="currentColor" />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Top Grid: Score Ring (Left) + 4 Pillars Breakdown (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
            
            {/* Score Hero Card */}
            <div className="md:col-span-5 bg-white rounded-2xl p-5 flex flex-col items-center justify-center text-center border border-[#E6DED4] shadow-2xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Skor Keseluruhan
              </span>

              {/* SVG Radial Score Ring */}
              <div className="relative my-1 flex items-center justify-center">
                <svg width="128" height="128" viewBox="0 0 116 116" className="transform -rotate-90">
                  <circle
                    cx="58"
                    cy="58"
                    r={radius}
                    fill="none"
                    stroke="#EFE7DD"
                    strokeWidth="10"
                  />
                  <circle
                    cx="58"
                    cy="58"
                    r={radius}
                    fill="none"
                    stroke={score >= 70 ? "#16A34A" : score >= 50 ? "#0B2559" : "#F26A12"}
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-extrabold text-[#0B2559] leading-none">{score}</span>
                  <span className="text-[10px] font-semibold text-[#4A5468] mt-1">dari 100</span>
                </div>
              </div>

              <span className={`mt-2.5 px-3 py-1 rounded-full text-[11px] font-extrabold border ${levelInfo.badgeBg}`}>
                {levelInfo.title}
              </span>

              <div className="mt-2.5 text-[11px] text-[#C2530A] font-bold bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">
                🎉 +{evaluation.pointsAwarded} Ready Points
              </div>
            </div>

            {/* 4 Pillars Breakdown */}
            <div className="md:col-span-7 bg-white rounded-2xl p-5 border border-[#E6DED4] shadow-2xs flex flex-col justify-center space-y-3.5">
              <div className="text-xs sm:text-sm font-extrabold text-[#0B2559] flex items-center gap-1.5">
                <span>📊</span> Empat Dimensi Kesiapanmu
              </div>

              <div className="space-y-3">
                {pillars.map((p) => {
                  const barColor =
                    p.score >= 80
                      ? "bg-emerald-600"
                      : p.score >= 60
                      ? "bg-[#0B2559]"
                      : "bg-[#F26A12]";
                  return (
                    <div key={p.label}>
                      <div className="flex items-center justify-between text-xs font-bold mb-1 text-[#3D4760]">
                        <span>{p.label}</span>
                        <span className="text-[#0B2559] font-extrabold">{p.score} / 100</span>
                      </div>
                      <div className="h-2 w-full bg-[#EFE7DD] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                          style={{ width: `${p.score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Feedback & Actionable Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Evaluasi Coach */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6DED4] shadow-2xs flex flex-col gap-1.5">
              <div className="text-[11px] font-extrabold tracking-wider uppercase text-[#0B2559] flex items-center gap-1.5">
                <span>💡</span> Catatan &amp; Kekuatanmu
              </div>
              <p className="text-xs sm:text-[13px] font-medium text-[#3D4760] leading-relaxed">
                {evaluation.feedbackText}
              </p>
            </div>

            {/* Fokus Utama & Saran Perbaikan */}
            <div className="bg-gradient-to-br from-orange-50/70 to-white rounded-2xl p-4 sm:p-5 border border-orange-200 shadow-2xs flex flex-col gap-2">
              <div className="text-[11px] font-extrabold tracking-wider uppercase text-[#C2530A] flex items-center gap-1.5">
                <span>🎯</span> Fokus Perbaikan Utama
              </div>
              {evaluation.corrections.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs sm:text-[13px] font-medium text-[#3D4760] leading-relaxed">
                    {evaluation.corrections[0].explanation}
                  </p>
                  {evaluation.corrections[0].original && evaluation.corrections[0].improved && (
                    <div className="p-2.5 rounded-xl bg-white border border-orange-100 text-[11px] space-y-1">
                      <div className="text-rose-600 line-through">
                        &ldquo;{evaluation.corrections[0].original}&rdquo;
                      </div>
                      <div className="text-emerald-700 font-bold">
                        ✓ &ldquo;{evaluation.corrections[0].improved}&rdquo;
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs sm:text-[13px] font-medium text-[#3D4760] leading-relaxed">
                  Pertahankan konsistensi tempo bicara dan gunakan kalimat lengkap agar penilaian lebih maksimal.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 3. Sticky Bottom Footer Buttons */}
        <div className="px-5 py-3.5 bg-white border-t border-[#E6DED4] flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-white text-[#0B2559] font-extrabold text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl border border-[#E6DED4] hover:bg-[#EFE7DD] transition text-center cursor-pointer"
          >
            🔄 Latihan Lagi
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchToProgress();
            }}
            className="flex-[1.4] bg-[#C2530A] text-white font-extrabold text-xs sm:text-sm py-2.5 sm:py-3 px-4 rounded-xl hover:bg-[#a64508] transition text-center shadow-sm cursor-pointer"
          >
            📊 Buka Grafik Progres
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}
