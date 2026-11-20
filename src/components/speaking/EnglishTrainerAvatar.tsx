"use client";

import React, { useState, useEffect } from "react";
import { LandingIcon } from "@/components/landing/LandingIcon";

export type TrainerState = "idle" | "listening" | "thinking" | "speaking";
export type TrainerPersona = "rudy" | "sarah";

interface EnglishTrainerAvatarProps {
  state: TrainerState;
  currentSpeechText?: string;
  scenarioTitle?: string;
  moduleLabel?: string;
  starterHint?: string;
  activePersona?: TrainerPersona;
  voiceRate?: number;
  onToggleVoiceRate?: () => void;
  onPersonaChange?: (persona: TrainerPersona) => void;
  onReplaySpeech?: () => void;
}

export function EnglishTrainerAvatar({
  state,
  currentSpeechText = "",
  moduleLabel,
  starterHint,
  activePersona = "rudy",
  voiceRate = 0.95,
  onToggleVoiceRate,
  onPersonaChange,
  onReplaySpeech,
}: EnglishTrainerAvatarProps) {
  const [localPersona, setLocalPersona] = useState<TrainerPersona>(activePersona);
  const selectedPersona = onPersonaChange ? activePersona : localPersona;

  const [typedState, setTypedState] = useState<{ source: string; count: number }>({
    source: currentSpeechText,
    count: currentSpeechText.length,
  });
  const [hintState, setHintState] = useState<{ forText: string; open: boolean }>({
    forText: "",
    open: false,
  });

  const showHint = hintState.open && hintState.forText === currentSpeechText;
  const displayedText =
    typedState.source === currentSpeechText
      ? currentSpeechText.slice(0, typedState.count)
      : "";
  const isTyping = Boolean(currentSpeechText) && displayedText.length < currentSpeechText.length;

  // Smooth, readable typewriter reveal (only updates state asynchronously inside interval callback)
  useEffect(() => {
    if (!currentSpeechText) return;

    let charIndex = 0;
    const fullText = currentSpeechText;
    const speed = Math.max(12, Math.min(24, Math.floor(1400 / fullText.length)));

    const interval = setInterval(() => {
      charIndex++;
      setTypedState({ source: fullText, count: charIndex });
      if (charIndex >= fullText.length) {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [currentSpeechText]);

  const handleSwitchPersona = (persona: TrainerPersona) => {
    setLocalPersona(persona);
    onPersonaChange?.(persona);
  };

  const isRudy = selectedPersona === "rudy";

  const trainerInfo = isRudy
    ? {
        name: "Coach Rudy",
        title: "Senior Workplace Trainer · CELTA",
      }
    : {
        name: "Coach Sarah",
        title: "Executive & Global Coach · TESOL",
      };

  const statusMeta =
    state === "speaking"
      ? {
          label: `${trainerInfo.name} sedang berbicara`,
          dot: "bg-[#F26A12]",
          pill: "bg-[#F26A12]/20 text-[#FFD0AE] border-[#F26A12]/40",
        }
      : state === "listening"
      ? {
          label: "Menyimak suaramu...",
          dot: "bg-emerald-400",
          pill: "bg-emerald-500/20 text-emerald-200 border-emerald-400/40",
        }
      : state === "thinking"
      ? {
          label: "Menyusun respons...",
          dot: "bg-blue-400",
          pill: "bg-blue-500/20 text-blue-100 border-blue-400/40",
        }
      : {
          label: "Siap melatih · Giliranmu bicara",
          dot: "bg-emerald-400",
          pill: "bg-white/10 text-white/90 border-white/15",
        };

  return (
    <div className="relative flex w-full flex-col overflow-hidden bg-[#0B2559] select-none">
      {/* Subtle Architectural Studio Lighting (calm, no flashing blobs) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 18%, rgba(0,115,245,0.24) 0%, rgba(11,37,89,0.92) 60%, #07193D 100%)",
        }}
      />

      {/* Compact Studio Coach Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-4 py-2.5 backdrop-blur-md sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full transition-colors ${statusMeta.dot}`} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-xs font-extrabold tracking-tight text-white sm:text-sm">
                {trainerInfo.name}
              </span>
              {moduleLabel && (
                <span className="hidden max-w-[200px] truncate rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-blue-100/90 md:inline-block">
                  {moduleLabel}
                </span>
              )}
            </div>
            <p className="m-0 truncate text-[10px] font-medium text-blue-200/75 sm:text-[11px]">
              {trainerInfo.title}
            </p>
          </div>
        </div>

        {/* Right Controls: Voice Speed + Persona Switcher */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleVoiceRate && (
            <button
              type="button"
              onClick={onToggleVoiceRate}
              title="Ubah kecepatan bicara Coach"
              className="cursor-pointer rounded-lg border border-white/15 bg-white/8 px-2 py-1 text-[10.5px] font-bold text-blue-100 transition hover:bg-white/15"
            >
              {voiceRate < 0.9 ? "0.8x" : "1.0x"}
            </button>
          )}

          <div className="flex items-center rounded-xl border border-white/15 bg-white/8 p-0.5">
            <button
              type="button"
              onClick={() => handleSwitchPersona("rudy")}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                selectedPersona === "rudy"
                  ? "bg-[#F26A12] text-white shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Rudy
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPersona("sarah")}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all ${
                selectedPersona === "sarah"
                  ? "bg-[#F26A12] text-white shadow-xs"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Sarah
            </button>
          </div>
        </div>
      </div>

      {/* Center Stage: Sleek Portrait + Calm Acoustic Wave */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
        <div className="relative flex items-center justify-center">
          {/* Calm Acoustic Breathing Ring (only active while speaking/listening) */}
          {(state === "speaking" || state === "listening") && (
            <div
              className={`gentle-ring pointer-events-none absolute -inset-3 rounded-full border ${
                state === "speaking" ? "border-[#F26A12]/45" : "border-emerald-400/45"
              }`}
            />
          )}

          {/* Avatar Portrait Ring */}
          <div
            className={`relative h-28 w-28 rounded-full p-1 transition-all duration-500 sm:h-36 sm:w-36 ${
              state === "speaking"
                ? "ring-2 ring-[#F26A12] shadow-[0_0_28px_rgba(242,106,18,0.28)]"
                : state === "listening"
                ? "ring-2 ring-emerald-400 shadow-[0_0_26px_rgba(52,211,153,0.25)]"
                : state === "thinking"
                ? "ring-2 ring-[#0073F5] shadow-[0_0_22px_rgba(0,115,245,0.25)]"
                : "ring-1 ring-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
            }`}
          >
            <svg
              viewBox="0 0 240 240"
              className="h-full w-full overflow-hidden rounded-full bg-gradient-to-b from-[#173A7A] via-[#0E2758] to-[#081736]"
            >
              <defs>
                <linearGradient id="sarahSkin" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFE7D6" />
                  <stop offset="60%" stopColor="#F9CFB2" />
                  <stop offset="100%" stopColor="#EAA988" />
                </linearGradient>
                <linearGradient id="rudySkin" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FCE0CA" />
                  <stop offset="60%" stopColor="#EFC4A4" />
                  <stop offset="100%" stopColor="#D89D77" />
                </linearGradient>
                <linearGradient id="sarahHair" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#633924" />
                  <stop offset="40%" stopColor="#4A2615" />
                  <stop offset="100%" stopColor="#2D150B" />
                </linearGradient>
                <linearGradient id="rudyHair" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#303846" />
                  <stop offset="50%" stopColor="#1E232D" />
                  <stop offset="100%" stopColor="#10141B" />
                </linearGradient>
                <linearGradient id="suitGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#193874" />
                  <stop offset="100%" stopColor="#0B1C3E" />
                </linearGradient>
                <linearGradient id="sarahBlazer" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#C2530A" />
                  <stop offset="100%" stopColor="#8A3403" />
                </linearGradient>
                <linearGradient id="headsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4B5563" />
                  <stop offset="50%" stopColor="#1F2937" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
              </defs>

              <circle cx="120" cy="120" r="112" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />

              <g
                className={`character-body ${
                  state === "speaking"
                    ? "character-speaking"
                    : state === "listening"
                    ? "character-listening"
                    : "character-idle"
                }`}
              >
                {isRudy ? (
                  <g>
                    <path
                      d="M 32 240 C 38 185, 78 165, 120 165 C 162 165, 202 185, 208 240 Z"
                      fill="url(#suitGrad)"
                      stroke="#08142B"
                      strokeWidth="2.5"
                    />
                    <polygon points="120,165 98,188 120,208 142,188" fill="#FFFFFF" />
                    <polygon points="116,192 124,192 127,240 120,240 113,240" fill="#F26A12" />
                    <path d="M 68 182 L 102 215 L 94 240" fill="none" stroke="#254F9E" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 172 182 L 138 215 L 146 240" fill="none" stroke="#254F9E" strokeWidth="3" strokeLinecap="round" />
                    <rect x="162" y="200" width="18" height="6" rx="2" fill="#F26A12" />
                  </g>
                ) : (
                  <g>
                    <path d="M 50 110 C 36 150, 40 210, 56 240 L 76 240 C 64 210, 60 160, 70 120 Z" fill="url(#sarahHair)" />
                    <path d="M 190 110 C 204 150, 200 210, 184 240 L 164 240 C 176 210, 180 160, 170 120 Z" fill="url(#sarahHair)" />
                    <path
                      d="M 34 240 C 40 185, 78 165, 120 165 C 162 165, 200 185, 206 240 Z"
                      fill="url(#sarahBlazer)"
                      stroke="#5C2203"
                      strokeWidth="2"
                    />
                    <polygon points="120,165 100,186 120,214 140,186" fill="#FBF6F1" />
                    <path d="M 108 184 Q 120 198 132 184" fill="none" stroke="#FBBF24" strokeWidth="2" />
                    <circle cx="120" cy="196" r="3" fill="#F59E0B" />
                    <path d="M 72 180 L 105 218 L 98 240" fill="none" stroke="#E0681B" strokeWidth="3" strokeLinecap="round" />
                    <path d="M 168 180 L 135 218 L 142 240" fill="none" stroke="#E0681B" strokeWidth="3" strokeLinecap="round" />
                  </g>
                )}

                <rect
                  x="106"
                  y="136"
                  width="28"
                  height="34"
                  rx="8"
                  fill={isRudy ? "url(#rudySkin)" : "url(#sarahSkin)"}
                />
                <path d="M 106 148 Q 120 156 134 148 L 134 156 Q 120 164 106 156 Z" fill="rgba(0,0,0,0.12)" />

                <g className="character-head">
                  <ellipse
                    cx="120"
                    cy="110"
                    rx={isRudy ? 48 : 45}
                    ry={isRudy ? 54 : 52}
                    fill={isRudy ? "url(#rudySkin)" : "url(#sarahSkin)"}
                  />
                  <circle cx="88" cy="122" r="10" fill="#F43F5E" opacity={isRudy ? "0.08" : "0.18"} />
                  <circle cx="152" cy="122" r="10" fill="#F43F5E" opacity={isRudy ? "0.08" : "0.18"} />

                  {isRudy ? (
                    <g>
                      <path
                        d="M 68 96 C 66 58, 98 42, 134 44 C 170 46, 174 74, 170 94 C 160 74, 132 62, 114 65 C 92 68, 76 80, 68 96 Z"
                        fill="url(#rudyHair)"
                      />
                      <path d="M 72 94 L 72 118 L 76 118 L 76 98 Z" fill="#1E232D" />
                      <path d="M 168 94 L 168 118 L 164 118 L 164 98 Z" fill="#1E232D" />
                    </g>
                  ) : (
                    <g>
                      <path
                        d="M 62 104 C 58 54, 94 38, 140 40 C 180 42, 182 80, 176 106 C 168 76, 134 60, 114 62 C 90 64, 74 84, 62 104 Z"
                        fill="url(#sarahHair)"
                      />
                      <path d="M 66 102 C 60 125, 64 150, 72 165 C 76 145, 74 125, 72 104 Z" fill="#3D1D0F" />
                      <path d="M 174 102 C 180 125, 176 150, 168 165 C 164 145, 166 125, 168 104 Z" fill="#3D1D0F" />
                      <path d="M 95 48 Q 124 50 148 58" fill="none" stroke="#8B4E31" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />
                    </g>
                  )}

                  <g>
                    <path
                      d={
                        state === "listening"
                          ? "M 90 90 Q 102 86 114 91"
                          : state === "thinking"
                          ? "M 90 88 Q 102 91 114 93"
                          : "M 90 90 Q 102 87 114 91"
                      }
                      stroke={isRudy ? "#111827" : "#381E12"}
                      strokeWidth={isRudy ? "3" : "2.5"}
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d={
                        state === "listening"
                          ? "M 126 91 Q 138 86 150 90"
                          : state === "thinking"
                          ? "M 126 88 Q 138 85 150 88"
                          : "M 126 91 Q 138 87 150 90"
                      }
                      stroke={isRudy ? "#111827" : "#381E12"}
                      strokeWidth={isRudy ? "3" : "2.5"}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>

                  <g className="character-eyes">
                    <g>
                      <ellipse cx="102" cy="102" rx="6.5" ry="6.5" fill="#FFFFFF" />
                      <ellipse cx="103" cy="102" rx="4" ry="4.2" fill={isRudy ? "#1E293B" : "#4A2810"} />
                      <circle cx="104.5" cy="100.5" r="1.5" fill="#FFFFFF" />
                      {!isRudy && <path d="M 94 99 Q 102 95 110 99" stroke="#1F2937" strokeWidth="2" fill="none" />}
                    </g>
                    <g>
                      <ellipse cx="138" cy="102" rx="6.5" ry="6.5" fill="#FFFFFF" />
                      <ellipse cx="139" cy="102" rx="4" ry="4.2" fill={isRudy ? "#1E293B" : "#4A2810"} />
                      <circle cx="140.5" cy="100.5" r="1.5" fill="#FFFFFF" />
                      {!isRudy && <path d="M 130 99 Q 138 95 146 99" stroke="#1F2937" strokeWidth="2" fill="none" />}
                    </g>
                  </g>

                  {isRudy && (
                    <g stroke="#1F2937" strokeWidth="2.2" fill="none">
                      <rect x="88" y="93" width="26" height="19" rx="5" stroke="#334155" fill="rgba(255,255,255,0.14)" />
                      <rect x="126" y="93" width="26" height="19" rx="5" stroke="#334155" fill="rgba(255,255,255,0.14)" />
                      <line x1="114" y1="100" x2="126" y2="100" stroke="#334155" strokeWidth="2.5" />
                      <line x1="82" y1="98" x2="88" y2="98" stroke="#334155" strokeWidth="2" />
                      <line x1="152" y1="98" x2="158" y2="98" stroke="#334155" strokeWidth="2" />
                    </g>
                  )}

                  {!isRudy && (
                    <g>
                      <circle cx="72" cy="120" r="3.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                      <circle cx="168" cy="120" r="3.5" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
                    </g>
                  )}

                  <path d="M 120 104 L 118 119 L 124 119" stroke="#D97736" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.85" />

                  {state === "speaking" ? (
                    <g className="animated-speech-mouth">
                      <path d="M 108 134 Q 120 148 132 134 Q 120 130 108 134 Z" fill="#881B1B" stroke="#5A0E0E" strokeWidth="1.8" />
                      <path d="M 112 134 Q 120 138 128 134" fill="#FFFFFF" />
                      <ellipse cx="120" cy="141" rx="4.5" ry="2.5" fill="#E15B5B" />
                    </g>
                  ) : state === "thinking" ? (
                    <path d="M 112 136 Q 121 133 129 137" stroke="#8B3D1B" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  ) : (
                    <path d="M 109 135 Q 120 144 131 135" stroke="#8B3D1B" strokeWidth="2.8" strokeLinecap="round" fill="none" />
                  )}
                </g>

                <g>
                  <path d="M 64 110 C 62 58, 178 58, 176 110" fill="none" stroke="url(#headsetGrad)" strokeWidth="5.5" strokeLinecap="round" />
                  <rect x="60" y="96" width="9" height="28" rx="4.5" fill="#1F2937" stroke="#374151" strokeWidth="1.5" />
                  <rect x="171" y="96" width="9" height="28" rx="4.5" fill="#1F2937" stroke="#374151" strokeWidth="1.5" />
                  <path d="M 66 116 Q 76 144 104 144" fill="none" stroke="#1F2937" strokeWidth="3.5" strokeLinecap="round" />
                  <ellipse cx="106" cy="144" rx="5.5" ry="4" fill="#0F172A" />
                  <circle
                    cx="109"
                    cy="144"
                    r="2.5"
                    fill={
                      state === "speaking"
                        ? "#F26A12"
                        : state === "listening"
                        ? "#10B981"
                        : state === "thinking"
                        ? "#3B82F6"
                        : "#64748B"
                    }
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>

        {/* Status Pill + Calm Acoustic Bars */}
        <div className="mt-3.5 flex items-center gap-2.5">
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-bold backdrop-blur-md transition-colors ${statusMeta.pill}`}
          >
            {state === "thinking" ? (
              <span className="flex items-center gap-0.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300 [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-300 [animation-delay:300ms]" />
              </span>
            ) : (
              <span className={`h-2 w-2 rounded-full ${statusMeta.dot}`} />
            )}
            <span>{statusMeta.label}</span>
          </div>

          {(state === "speaking" || state === "listening") && (
            <div className="flex h-5 items-center gap-[3px]" aria-hidden="true">
              {[0, 1, 2, 3, 4, 5].map((bar) => (
                <span
                  key={bar}
                  className={`calm-wave-bar w-[3px] rounded-full ${
                    state === "speaking" ? "bg-[#F26A12]" : "bg-emerald-400"
                  }`}
                  style={{ animationDelay: `${bar * 110}ms` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Crisp Glass Subtitle Prompt Card */}
      {currentSpeechText && (
        <div className="relative z-20 px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3.5 text-white backdrop-blur-md sm:p-4">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.08em] text-[#FFB07A]">
                {trainerInfo.name} · Pertanyaan
              </span>

              <div className="flex items-center gap-2">
                {starterHint && (
                  <button
                    type="button"
                    onClick={() =>
                      setHintState({ forText: currentSpeechText, open: !showHint })
                    }
                    className={`cursor-pointer rounded-lg px-2 py-0.5 text-[11px] font-bold transition ${
                      showHint
                        ? "bg-[#F26A12] text-white"
                        : "bg-white/10 text-blue-100 hover:bg-white/20"
                    }`}
                  >
                    {showHint ? "Tutup Bantuan" : "💡 Contoh Pembuka"}
                  </button>
                )}
                {onReplaySpeech && (
                  <button
                    type="button"
                    onClick={onReplaySpeech}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-[11px] font-bold text-blue-100 transition hover:bg-white/20 hover:text-white"
                  >
                    <LandingIcon name="RotateCcw" size={11} color="currentColor" />
                    <span>Putar Ulang</span>
                  </button>
                )}
              </div>
            </div>

            <p className="m-0 text-sm font-medium leading-relaxed text-white sm:text-[15px]">
              &ldquo;{displayedText}&rdquo;
              {isTyping && (
                <span className="ml-1 inline-block h-3.5 w-[2px] animate-pulse bg-[#F26A12] align-middle" />
              )}
            </p>

            {/* Collapsible Starter Hint */}
            {showHint && starterHint && (
              <div className="mt-3 rounded-xl border border-amber-300/30 bg-black/25 px-3 py-2 text-xs leading-relaxed text-amber-100">
                <span className="font-bold text-[#FFB07A]">Coba mulai dengan: </span>
                <span className="italic">&ldquo;{starterHint}&rdquo;</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subtle, Refined Keyframes */}
      <style jsx>{`
        @keyframes organicBreathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.5px); }
        }
        @keyframes speechLipSync {
          0%, 100% { transform: scaleY(1); }
          35% { transform: scaleY(1.32) translateY(0.8px); }
          65% { transform: scaleY(0.75); }
        }
        @keyframes speechBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-1.5px) rotate(0.6deg); }
        }
        @keyframes naturalBlink {
          0%, 92%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.08); }
          98% { transform: scaleY(1); }
        }
        @keyframes gentleRing {
          0% { transform: scale(0.96); opacity: 0.55; }
          60% { transform: scale(1.07); opacity: 0.15; }
          100% { transform: scale(0.96); opacity: 0.55; }
        }
        @keyframes calmWave {
          0%, 100% { height: 5px; opacity: 0.55; }
          50% { height: 18px; opacity: 1; }
        }

        .character-idle { animation: organicBreathe 4.2s ease-in-out infinite; }
        .character-speaking { animation: speechBob 2.2s ease-in-out infinite; }
        .character-listening { transform: translateY(-1.5px); transition: transform 0.35s ease; }
        .character-eyes { transform-origin: 120px 102px; animation: naturalBlink 4.6s infinite ease-in-out; }
        .animated-speech-mouth { transform-origin: 120px 135px; animation: speechLipSync 0.32s infinite ease-in-out; }
        .gentle-ring { animation: gentleRing 2.6s ease-in-out infinite; }
        .calm-wave-bar { animation: calmWave 0.95s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
