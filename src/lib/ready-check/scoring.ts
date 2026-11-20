import { evaluateSpeechTranscript } from "@/lib/speaking/evaluator";
import {
  PART2_LISTENING_QUESTIONS,
  PART3_CONTEXT_QUESTIONS,
  PART1_SITUATION_OPTIONS,
} from "./questions";
import type {
  ProgramGoalSlug,
  ReadyCheckDimensions,
  ReadyCheckResult,
  ReadyLevelTitle,
} from "./types";

export interface ReadyCheckSubmissionPayload {
  goal?: ProgramGoalSlug;
  confidenceScore?: number;
  hardSituations?: string[];
  part2Answers?: Record<string, number>;
  part3Answers?: Record<string, number>;
  speakingResponses?: Array<{
    promptId: string;
    promptTitle: string;
    transcript: string;
    durationSeconds: number;
  }>;
}

export function getLevelMeta(score: number): {
  levelTitle: ReadyLevelTitle;
  cefrEstimate: "A1" | "A2" | "B1" | "B2" | "C1";
  nextLevelTitle: ReadyLevelTitle | null;
  pointsToNextLevel: number;
} {
  if (score <= 20) {
    return {
      levelTitle: "Starter",
      cefrEstimate: "A1",
      nextLevelTitle: "Warming Up",
      pointsToNextLevel: Math.max(1, 21 - score),
    };
  }
  if (score <= 40) {
    return {
      levelTitle: "Warming Up",
      cefrEstimate: "A2",
      nextLevelTitle: "Ready to Speak",
      pointsToNextLevel: Math.max(1, 41 - score),
    };
  }
  if (score <= 60) {
    return {
      levelTitle: "Ready to Speak",
      cefrEstimate: "B1",
      nextLevelTitle: "Ready to Connect",
      pointsToNextLevel: Math.max(1, 61 - score),
    };
  }
  if (score <= 80) {
    return {
      levelTitle: "Ready to Connect",
      cefrEstimate: "B2",
      nextLevelTitle: "Ready to Contribute",
      pointsToNextLevel: Math.max(1, 81 - score),
    };
  }
  return {
    levelTitle: "Ready to Contribute",
    cefrEstimate: "C1",
    nextLevelTitle: null,
    pointsToNextLevel: 0,
  };
}

function clampDim(val: number): number {
  return Math.max(20, Math.min(98, Math.round(val)));
}

export async function evaluateReadyCheckSubmission(
  payload: ReadyCheckSubmissionPayload
): Promise<ReadyCheckResult> {
  const part2Answers = payload.part2Answers ?? {};
  const part3Answers = payload.part3Answers ?? {};
  const speakingResponses = payload.speakingResponses ?? [];

  // 1. Score Part 2 (Listening Comprehension)
  let listeningCorrect = 0;
  for (const q of PART2_LISTENING_QUESTIONS) {
    if (part2Answers[q.id] === q.correctIndex) {
      listeningCorrect++;
    }
  }
  const listeningRatio = listeningCorrect / PART2_LISTENING_QUESTIONS.length;
  const mendengar = clampDim(38 + listeningRatio * 54);

  // 2. Score Part 3 (Workplace Language & Cross-Cultural)
  let ketepatanRight = 0;
  let ketepatanTotal = 0;
  let lintasRight = 0;
  let lintasTotal = 0;

  for (const q of PART3_CONTEXT_QUESTIONS) {
    const isCorrect = part3Answers[q.id] === q.correctIndex;
    if (q.dimension === "ketepatan") {
      ketepatanTotal++;
      if (isCorrect) ketepatanRight++;
    } else {
      lintasTotal++;
      if (isCorrect) lintasRight++;
    }
  }

  // 3. Evaluate Part 4 (Spoken Responses via Gemini/Local Evaluator)
  const combinedTranscript = speakingResponses
    .map((r) => r.transcript.trim())
    .filter(Boolean)
    .join(" ");

  const totalDuration = speakingResponses.reduce(
    (sum, r) => sum + Math.max(10, Number(r.durationSeconds || 25)),
    0
  );

  const wordCount = combinedTranscript ? combinedTranscript.split(/\s+/).length : 0;

  let speechEval;
  if (wordCount >= 6) {
    speechEval = await evaluateSpeechTranscript(
      combinedTranscript,
      Math.max(25, totalDuration),
      "ready_check_assessment",
      "Ready Check Diagnostic: Standup & Project Timeline"
    );
  } else {
    speechEval = {
      fluencyScore: 38,
      pronunciationScore: 42,
      grammarScore: 44,
      vocabularyScore: 40,
      overallReadyScore: 41,
      feedbackText:
        "Jawaban bicaramu masih sangat singkat. Mulailah dengan 2–3 kalimat terstruktur (opini + satu alasan) agar penilaian lebih optimal.",
      corrections: [],
      pointsAwarded: 40,
    };
  }

  // Modulate speaking scores gently when transcript is short (<25 words across 2 prompts)
  const lengthBoost = wordCount >= 45 ? 4 : wordCount >= 25 ? 0 : wordCount >= 12 ? -10 : -22;

  const kelancaran = clampDim(speechEval.fluencyScore + lengthBoost);
  const pelafalan = clampDim(speechEval.pronunciationScore + Math.round(lengthBoost * 0.6));

  const part3KetepatanScore = ketepatanTotal > 0 ? 40 + (ketepatanRight / ketepatanTotal) * 52 : 55;
  const part3LintasScore = lintasTotal > 0 ? 38 + (lintasRight / lintasTotal) * 54 : 52;

  const ketepatan = clampDim(part3KetepatanScore * 0.45 + speechEval.grammarScore * 0.55);
  const lintasBudaya = clampDim(part3LintasScore * 0.6 + speechEval.vocabularyScore * 0.4);

  const dimensions: ReadyCheckDimensions = {
    kelancaran,
    pelafalan,
    mendengar,
    ketepatan,
    lintasBudaya,
  };

  const overallScore = Math.max(
    18,
    Math.min(
      98,
      Math.round(
        kelancaran * 0.25 +
          pelafalan * 0.2 +
          mendengar * 0.2 +
          ketepatan * 0.2 +
          lintasBudaya * 0.15
      )
    )
  );

  const meta = getLevelMeta(overallScore);

  // Determine strongest & weakest dimension
  const dimEntries: Array<{ key: keyof ReadyCheckDimensions; score: number; strong: string; focus: string }> = [
    {
      key: "mendengar",
      score: mendengar,
      strong: "Pemahaman mendengarmu sudah kuat",
      focus: "Latih pemahaman poin penting dari aksen cepat",
    },
    {
      key: "kelancaran",
      score: kelancaran,
      strong: "Alur bicaramu sudah mengalir spontan",
      focus: "Kelancaran bicara masih tertahan saat merangkai kalimat",
    },
    {
      key: "pelafalan",
      score: pelafalan,
      strong: "Artikulasi dan pelafalanmu terdengar jelas",
      focus: "Perjelas penekanan kata kunci saat presentasi",
    },
    {
      key: "ketepatan",
      score: ketepatan,
      strong: "Struktur kalimatmu sudah rapi untuk konteks kerja",
      focus: "Rapikan ketepatan struktur kalimat & pilihan kata formal",
    },
    {
      key: "lintasBudaya",
      score: lintasBudaya,
      strong: "Pembawaanmu dalam situasi lintas budaya sudah tepat",
      focus: "Perkaya frasa sopan untuk berbeda pendapat & membeli waktu",
    },
  ];

  const sorted = [...dimEntries].sort((a, b) => b.score - a.score);
  const strengthTitle = sorted[0].strong;
  const focusTitle = sorted[sorted.length - 1].focus;

  const confidenceIndex = Math.max(
    1,
    Math.min(5, Number((payload.confidenceScore ?? 2.4).toFixed(1)))
  );

  const situationLabels = (payload.hardSituations ?? ["wawancara", "rapat"]).map((id) => {
    const found = PART1_SITUATION_OPTIONS.find((s) => s.id === id);
    return found ? found.label.split(" ")[0].toLowerCase() : id;
  });

  // Program recommendation based on score + chosen goal
  let recommendedGoalSlug: ProgramGoalSlug = "ready-for-work";
  let recommendedGoalTitle = "Ready for Work";
  let recommendedDescription =
    "Peserta dengan profil seperti kamu biasanya mulai di sini. Target: naik ke Ready to Connect dalam 6 minggu.";

  if (payload.goal === "ready-to-go") {
    recommendedGoalSlug = "ready-to-go";
    recommendedGoalTitle = "Ready to Go";
    recommendedDescription =
      "Cocok untuk persiapan beasiswa, IELTS Speaking, dan wawancara universitas luar negeri dalam 6 minggu terstruktur.";
  } else if (overallScore <= 40 || payload.goal === "ready-to-speak") {
    recommendedGoalSlug = "ready-to-speak";
    recommendedGoalTitle = "Ready to Speak";
    recommendedDescription =
      "Bangun refleks bicara dan keberanian un-mute setiap hari lewat latihan AI 24/7 sebelum masuk ke cohort intensif.";
  } else if (overallScore >= 81 || (payload.goal === "ready-for-the-world" && overallScore >= 61)) {
    recommendedGoalSlug = "ready-for-the-world";
    recommendedGoalTitle = "Ready for the World";
    recommendedDescription =
      "Skormu sudah siap untuk pendampingan eksekutif 1-on-1 dan komunikasi kepemimpinan lintas negara.";
  }

  return {
    overallScore,
    uncertaintyMargin: 4,
    levelTitle: meta.levelTitle,
    cefrEstimate: meta.cefrEstimate,
    nextLevelTitle: meta.nextLevelTitle,
    pointsToNextLevel: meta.pointsToNextLevel,
    dimensions,
    confidenceIndex,
    hardestSituations: situationLabels,
    strengthTitle,
    focusTitle,
    recommendedGoalSlug,
    recommendedGoalTitle,
    recommendedDescription,
    feedbackText: speechEval.feedbackText,
    corrections: speechEval.corrections,
    saved: false,
    createdAt: new Date().toISOString(),
    primaryTranscript: combinedTranscript,
    durationSeconds: totalDuration,
  };
}
