import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { createSpeakingSession } from "@/lib/db/speaking.queries";

const SaveSchema = z.object({
  overallScore: z.number().min(0).max(100),
  levelTitle: z.string().min(1),
  cefrEstimate: z.string().default("B1"),
  dimensions: z.object({
    kelancaran: z.number(),
    pelafalan: z.number(),
    mendengar: z.number(),
    ketepatan: z.number(),
    lintasBudaya: z.number(),
  }),
  confidenceIndex: z.number().min(1).max(5).default(2.5),
  hardestSituations: z.array(z.string()).default([]),
  recommendedGoalSlug: z.string().default("ready-for-work"),
  feedbackText: z.string().optional(),
  primaryTranscript: z.string().optional(),
  durationSeconds: z.number().optional(),
  corrections: z
    .array(
      z.object({
        original: z.string(),
        improved: z.string(),
        explanation: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.format() },
      { status: 422 }
    );
  }

  const d = parsed.data;
  await createSpeakingSession({
    userId: Number(session.user.id),
    courseId: null,
    scenarioId: "ready_check_baseline",
    scenarioTitle: "Ready Check Assessment (Baseline)",
    durationSeconds: Math.max(30, d.durationSeconds ?? 45),
    transcriptUser: d.primaryTranscript || "Ready Check Baseline Assessment",
    transcriptAi: JSON.stringify({
      type: "ready_check_v1",
      overallScore: d.overallScore,
      levelTitle: d.levelTitle,
      cefrEstimate: d.cefrEstimate,
      dimensions: d.dimensions,
      confidenceIndex: d.confidenceIndex,
      hardestSituations: d.hardestSituations,
      recommendedGoalSlug: d.recommendedGoalSlug,
    }),
    fluencyScore: Math.round(d.dimensions.kelancaran),
    pronunciationScore: Math.round(d.dimensions.pelafalan),
    grammarScore: Math.round(d.dimensions.ketepatan),
    vocabularyScore: Math.round((d.dimensions.mendengar + d.dimensions.lintasBudaya) / 2),
    overallReadyScore: Math.round(d.overallScore),
    feedbackText: d.feedbackText ?? "Baseline Ready Check berhasil disimpan.",
    correctionsJson: d.corrections ?? [],
    pointsAwarded: 60,
  });

  return NextResponse.json({ success: true, saved: true });
}

