import type { SpeakingCorrection } from "@/types/db";

export interface EvaluationResult {
  fluencyScore: number;
  pronunciationScore: number;
  grammarScore: number;
  vocabularyScore: number;
  overallReadyScore: number;
  feedbackText: string;
  corrections: SpeakingCorrection[];
  pointsAwarded: number;
}

/**
 * Main AI Evaluation function.
 * Uses Google Gemini when GEMINI_API_KEY is available.
 * Gracefully falls back to local linguistic scoring if Gemini is unavailable or times out.
 */
export async function evaluateSpeechTranscript(
  transcript: string,
  durationSeconds: number,
  scenarioId: string,
  scenarioTitle?: string
): Promise<EvaluationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && transcript.trim().length > 5) {
    try {
      const geminiResult = await evaluateWithGemini(
        apiKey,
        transcript,
        durationSeconds,
        scenarioTitle || scenarioId
      );
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn("[Gemini Evaluator fallback triggered]:", err);
    }
  }

  // Graceful Fallback: Local Linguistic Engine
  return evaluateSpeechTranscriptLocal(transcript, durationSeconds, scenarioId);
}

/**
 * Evaluate using Google Gemini 3.1 Flash Lite API with structured JSON output.
 */
async function evaluateWithGemini(
  apiKey: string,
  transcript: string,
  durationSeconds: number,
  scenarioTitle: string
): Promise<EvaluationResult | null> {
  const models = ["gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"];

  const prompt = `You are the executive AI Speaking Coach and Evaluator for "English Ready" platform.
Evaluate the following student's spoken response in an English practice session.

Practice Topic: ${scenarioTitle}
Speaking Duration: ${durationSeconds} seconds
Spoken Transcript: "${transcript}"

Provide a constructive, professional assessment across 4 pillars:
1. Fluency & Pace (0-100)
2. Pronunciation & Articulation Clarity (0-100)
3. Grammar & Sentence Structure (0-100)
4. Vocabulary & Professional Tone (0-100)

Return ONLY valid JSON matching this exact structure:
{
  "fluencyScore": number,
  "pronunciationScore": number,
  "grammarScore": number,
  "vocabularyScore": number,
  "overallReadyScore": number,
  "feedbackText": "2-3 supportive, constructive sentences in Bahasa Indonesia praising what was good and giving 1 practical tip",
  "corrections": [
    {
      "original": "exact quote of phrase needing improvement",
      "improved": "better professional English alternative",
      "explanation": "concise explanation in Bahasa Indonesia"
    }
  ],
  "pointsAwarded": number
}`;

  for (const model of models) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);

      const fluency = clampScore(parsed.fluencyScore, 75);
      const pronunciation = clampScore(parsed.pronunciationScore, 76);
      const grammar = clampScore(parsed.grammarScore, 74);
      const vocabulary = clampScore(parsed.vocabularyScore, 78);
      const overall = clampScore(
        parsed.overallReadyScore,
        Math.round(fluency * 0.3 + pronunciation * 0.25 + grammar * 0.25 + vocabulary * 0.2)
      );

      const corrections: SpeakingCorrection[] = Array.isArray(parsed.corrections)
        ? parsed.corrections.slice(0, 3).map((c: any) => ({
            original: String(c.original || ""),
            improved: String(c.improved || ""),
            explanation: String(c.explanation || ""),
          }))
        : [];

      return {
        fluencyScore: fluency,
        pronunciationScore: pronunciation,
        grammarScore: grammar,
        vocabularyScore: vocabulary,
        overallReadyScore: overall,
        feedbackText: String(parsed.feedbackText || "Latihan yang sangat baik! Terus tingkatkan kelancaran berbicaramu."),
        corrections,
        pointsAwarded: Math.max(30, Math.min(100, Number(parsed.pointsAwarded) || Math.round(overall * 0.6))),
      };
    } catch {
      // Try next model if timeout or rate limit
      continue;
    }
  }

  return null;
}

function clampScore(score: any, fallback: number): number {
  const n = Number(score);
  if (isNaN(n) || n < 10 || n > 100) return fallback;
  return Math.round(n);
}

/**
 * Built-in Linguistic scoring engine (deterministic fallback)
 */
export function evaluateSpeechTranscriptLocal(
  transcript: string,
  durationSeconds: number,
  scenarioId: string
): EvaluationResult {
  const clean = transcript.trim();
  const words = clean ? clean.split(/\s+/) : [];
  const wordCount = words.length;

  // 1. Fluency & Pace calculation
  const wpm = durationSeconds > 0 ? (wordCount / durationSeconds) * 60 : 0;
  let fluencyScore = 75;
  if (wpm >= 90 && wpm <= 160) {
    fluencyScore = Math.min(95, Math.max(82, Math.round(82 + wordCount / 5)));
  } else if (wpm > 50) {
    fluencyScore = Math.min(84, Math.max(72, Math.round(72 + wordCount / 8)));
  } else if (wordCount > 10) {
    fluencyScore = 70;
  } else {
    fluencyScore = 60;
  }

  // 2. Vocabulary Variety & Professional Keywords
  const professionalKeywords = [
    "challenge", "solution", "systematic", "approach", "bottleneck", "stakeholder",
    "optimize", "performance", "scalable", "milestone", "deliverable", "collaborate",
    "implement", "troubleshoot", "priority", "timeline", "efficiency", "impact",
    "strategic", "coordinate", "objective", "resolve", "valuable", "result"
  ];
  const matchedKeywords = words.filter((w) =>
    professionalKeywords.some((kw) => w.toLowerCase().includes(kw))
  );
  let vocabularyScore = 70 + Math.min(25, matchedKeywords.length * 4);
  if (wordCount > 30) vocabularyScore = Math.max(vocabularyScore, 80);

  // 3. Grammar Structure & Cohesion
  const commonFillers = ["um", "uh", "like", "you know", "hmm"];
  const fillerCount = words.filter((w) =>
    commonFillers.includes(w.toLowerCase().replace(/[^a-z]/g, ""))
  ).length;
  let grammarScore = 80 - Math.min(15, fillerCount * 3);
  if (
    clean.includes("because") ||
    clean.includes("therefore") ||
    clean.includes("however") ||
    clean.includes("in order to")
  ) {
    grammarScore += 8;
  }
  grammarScore = Math.min(96, Math.max(68, grammarScore));

  // 4. Pronunciation & Articulation Clarity
  let pronunciationScore = Math.min(
    92,
    Math.max(74, Math.round(fluencyScore * 0.5 + grammarScore * 0.5 + 2))
  );

  // 5. Overall Ready Score (Weighted 4 Pillars)
  const overallReadyScore = Math.round(
    fluencyScore * 0.3 + pronunciationScore * 0.25 + grammarScore * 0.25 + vocabularyScore * 0.2
  );

  // 6. Actionable Corrections
  const corrections: SpeakingCorrection[] = [];
  if (clean.toLowerCase().includes("i am agree")) {
    corrections.push({
      original: "I am agree",
      improved: "I agree / I strongly concur",
      explanation: "Kata 'agree' adalah kata kerja (verb), sehingga tidak membutuhkan to-be 'am'.",
    });
  }
  if (clean.toLowerCase().includes("very difficult")) {
    corrections.push({
      original: "very difficult",
      improved: "challenging / formidable hurdle",
      explanation: "Gunakan kosakata yang lebih profesional untuk konteks kerja.",
    });
  }
  if (clean.toLowerCase().includes("i did not finished")) {
    corrections.push({
      original: "I did not finished",
      improved: "I haven't completed it yet",
      explanation: "Setelah auxiliary verb 'did not', gunakan kata kerja bentuk pertama (bare infinitive).",
    });
  }

  if (corrections.length === 0) {
    corrections.push({
      original: clean.length > 40 ? clean.substring(0, 40) + "..." : "Perhatikan transisi kalimat",
      improved: "In addition to that, we systematically managed the workflow...",
      explanation: "Gunakan transisi penghubung formal antar kalimat untuk memperkuat alur penjelasan.",
    });
  }

  // 7. General Feedback Text
  let feedbackText = "";
  if (overallReadyScore >= 85) {
    feedbackText =
      "Luar biasa! Penyampaian sangat lugas, profesional, dan minim keraguan. Struktur kalimat teratur dengan kosakata kerja yang relevan.";
  } else if (overallReadyScore >= 75) {
    feedbackText =
      "Bagus sekali! Inti pesan tersampaikan dengan jelas. Pertahankan konsistensi tempo bicara dan perbanyak variasi kata hubung formal.";
  } else {
    feedbackText =
      "Awal yang baik! Kamu sudah berani mengutarakan ide secara langsung. Terus biasakan berbicara tanpa jeda hening yang terlalu panjang.";
  }

  const pointsAwarded = Math.max(30, Math.round(overallReadyScore * 0.6));

  return {
    fluencyScore,
    pronunciationScore,
    grammarScore,
    vocabularyScore,
    overallReadyScore,
    feedbackText,
    corrections,
    pointsAwarded,
  };
}
