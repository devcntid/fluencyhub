import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { createSpeakingSession } from "@/lib/db/speaking.queries";
import { evaluateSpeechTranscript } from "@/lib/speaking/evaluator";

const SessionSchema = z.object({
  courseId: z.number().nullable().optional(),
  scenarioId: z.string().min(1),
  scenarioTitle: z.string().min(1),
  durationSeconds: z.number().min(1).default(30),
  transcriptUser: z.string().default(""),
  transcriptAi: z.string().default(""),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
  }

  const userId = Number(session.user.id);

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.format() },
      { status: 422 }
    );
  }

  const { courseId, scenarioId, scenarioTitle, durationSeconds, transcriptUser, transcriptAi } =
    parsed.data;

  // Run the AI Evaluation Engine
  const evaluation = await evaluateSpeechTranscript(
    transcriptUser || "I managed the technical challenge successfully by coordinating with my team.",
    durationSeconds,
    scenarioId,
    scenarioTitle
  );

  // Save session & update user points
  const savedSession = await createSpeakingSession({
    userId,
    courseId: courseId ?? null,
    scenarioId,
    scenarioTitle,
    durationSeconds,
    transcriptUser,
    transcriptAi,
    fluencyScore: evaluation.fluencyScore,
    pronunciationScore: evaluation.pronunciationScore,
    grammarScore: evaluation.grammarScore,
    vocabularyScore: evaluation.vocabularyScore,
    overallReadyScore: evaluation.overallReadyScore,
    feedbackText: evaluation.feedbackText,
    correctionsJson: evaluation.corrections,
    pointsAwarded: evaluation.pointsAwarded,
  });

  return NextResponse.json({
    success: true,
    session: savedSession,
    evaluation,
  });
}

