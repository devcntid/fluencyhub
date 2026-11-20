import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { createSpeakingSession } from "@/lib/db/speaking.queries";
import { evaluateReadyCheckSubmission } from "@/lib/ready-check/scoring";

const EvaluateSchema = z.object({
  goal: z
    .enum(["ready-to-speak", "ready-for-work", "ready-to-go", "ready-for-the-world"])
    .optional(),
  confidenceScore: z.number().min(1).max(5).optional(),
  hardSituations: z.array(z.string()).optional(),
  part2Answers: z.record(z.string(), z.number()).optional(),
  part3Answers: z.record(z.string(), z.number()).optional(),
  speakingResponses: z
    .array(
      z.object({
        promptId: z.string(),
        promptTitle: z.string(),
        transcript: z.string(),
        durationSeconds: z.number().min(0).default(30),
      })
    )
    .optional(),
  saveIfLoggedIn: z.boolean().optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const parsed = EvaluateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.format() },
      { status: 422 }
    );
  }

  const result = await evaluateReadyCheckSubmission(parsed.data);

  const session = await auth();
  if (session?.user?.id && parsed.data.saveIfLoggedIn !== false) {
    try {
      await createSpeakingSession({
        userId: Number(session.user.id),
        courseId: null,
        scenarioId: "ready_check_baseline",
        scenarioTitle: "Ready Check Assessment (Baseline)",
        durationSeconds: Math.max(30, result.durationSeconds ?? 45),
        transcriptUser: result.primaryTranscript || "Completed 4-part Ready Check assessment.",
        transcriptAi: JSON.stringify({
          type: "ready_check_v1",
          overallScore: result.overallScore,
          levelTitle: result.levelTitle,
          cefrEstimate: result.cefrEstimate,
          dimensions: result.dimensions,
          confidenceIndex: result.confidenceIndex,
          hardestSituations: result.hardestSituations,
          recommendedGoalSlug: result.recommendedGoalSlug,
        }),
        fluencyScore: result.dimensions.kelancaran,
        pronunciationScore: result.dimensions.pelafalan,
        grammarScore: result.dimensions.ketepatan,
        vocabularyScore: Math.round(
          (result.dimensions.mendengar + result.dimensions.lintasBudaya) / 2
        ),
        overallReadyScore: result.overallScore,
        feedbackText: result.feedbackText,
        correctionsJson: result.corrections,
        pointsAwarded: 60,
      });
      result.saved = true;
    } catch (err) {
      console.warn("[Ready Check save warning]:", err);
    }
  }

  return NextResponse.json({
    success: true,
    result,
  });
}

