import { sql } from "@/lib/db/client";
import type { SpeakingSession, StudentProgressSummary, SpeakingCorrection } from "@/types/db";

export interface CreateSpeakingSessionInput {
  userId: number;
  courseId?: number | null;
  scenarioId: string;
  scenarioTitle: string;
  durationSeconds: number;
  transcriptUser?: string | null;
  transcriptAi?: string | null;
  fluencyScore: number;
  pronunciationScore: number;
  grammarScore: number;
  vocabularyScore: number;
  overallReadyScore: number;
  feedbackText?: string | null;
  correctionsJson?: SpeakingCorrection[];
  pointsAwarded?: number;
}

export async function createSpeakingSession(
  input: CreateSpeakingSessionInput
): Promise<SpeakingSession> {
  const points = input.pointsAwarded ?? 50;
  const corrections = JSON.stringify(input.correctionsJson ?? []);

  // 1. Insert session
  const rows = await sql`
    INSERT INTO speaking_sessions (
      user_id, course_id, scenario_id, scenario_title,
      duration_seconds, transcript_user, transcript_ai,
      fluency_score, pronunciation_score, grammar_score,
      vocabulary_score, overall_ready_score, feedback_text,
      corrections_json, points_awarded, created_at
    ) VALUES (
      ${input.userId}, ${input.courseId ?? null}, ${input.scenarioId}, ${input.scenarioTitle},
      ${input.durationSeconds}, ${input.transcriptUser ?? null}, ${input.transcriptAi ?? null},
      ${input.fluencyScore}, ${input.pronunciationScore}, ${input.grammarScore},
      ${input.vocabularyScore}, ${input.overallReadyScore}, ${input.feedbackText ?? null},
      ${corrections}::jsonb, ${points}, NOW()
    )
    RETURNING *
  `;

  // 2. Update user Ready Points, Ready Score, and Streak
  await sql`
    UPDATE users
    SET 
      total_ready_points = COALESCE(total_ready_points, 0) + ${points},
      current_ready_score = CASE
        WHEN current_ready_score IS NULL OR current_ready_score = 0 THEN ${input.overallReadyScore}
        ELSE ROUND((current_ready_score * 0.4) + (${input.overallReadyScore} * 0.6))
      END,
      speaking_streak_days = CASE
        WHEN last_practice_date = CURRENT_DATE THEN COALESCE(speaking_streak_days, 1)
        WHEN last_practice_date = CURRENT_DATE - INTERVAL '1 day' THEN COALESCE(speaking_streak_days, 0) + 1
        ELSE 1
      END,
      last_practice_date = CURRENT_DATE
    WHERE id = ${input.userId}
  `;

  const r = rows[0] as Record<string, unknown>;
  return mapSpeakingSession(r);
}

export async function getSpeakingSessionsByUser(
  userId: number,
  limit = 20
): Promise<SpeakingSession[]> {
  const rows = await sql`
    SELECT * FROM speaking_sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => mapSpeakingSession(r as Record<string, unknown>));
}

export async function getStudentProgressSummary(
  userId: number
): Promise<StudentProgressSummary> {
  // 1. Get user profile stats
  const userRows = await sql`
    SELECT 
      COALESCE(current_ready_score, 0) AS current_score,
      COALESCE(total_ready_points, 0) AS total_points,
      COALESCE(speaking_streak_days, 0) AS streak_days
    FROM users
    WHERE id = ${userId}
  `;

  const u = userRows[0] as { current_score: number; total_points: number; streak_days: number } | undefined;
  const readyScore = u ? Number(u.current_score) : 0;
  const totalPoints = u ? Number(u.total_points) : 0;
  const streakDays = u ? Number(u.streak_days) : 0;

  // 2. Aggregate statistics across speaking sessions
  const statsRows = await sql`
    SELECT 
      COUNT(*) AS total_sessions,
      AVG(fluency_score) AS avg_fluency,
      AVG(pronunciation_score) AS avg_pronunciation,
      AVG(grammar_score) AS avg_grammar,
      AVG(vocabulary_score) AS avg_vocabulary
    FROM speaking_sessions
    WHERE user_id = ${userId}
  `;

  const s = statsRows[0] as Record<string, unknown>;
  const sessionsCount = Number(s?.total_sessions ?? 0);
  const fluencyAvg = s?.avg_fluency != null ? Math.round(Number(s.avg_fluency)) : 0;
  const pronunciationAvg = s?.avg_pronunciation != null ? Math.round(Number(s.avg_pronunciation)) : 0;
  const grammarAvg = s?.avg_grammar != null ? Math.round(Number(s.avg_grammar)) : 0;
  const vocabularyAvg = s?.avg_vocabulary != null ? Math.round(Number(s.avg_vocabulary)) : 0;

  // 3. Get recent 10 sessions
  const recentSessions = await getSpeakingSessionsByUser(userId, 10);

  // 4. Calculate weekly trend (only if sessions exist)
  let weeklyTrend: Array<{ label: string; score: number }> = [];
  if (recentSessions.length > 0) {
    const reversed = [...recentSessions].reverse();
    weeklyTrend = reversed.map((sess, idx) => ({
      label: `Sesi ${idx + 1}`,
      score: sess.overallReadyScore,
    }));
  }

  return {
    readyScore,
    totalPoints,
    streakDays,
    sessionsCount,
    fluencyAvg,
    pronunciationAvg,
    grammarAvg,
    vocabularyAvg,
    weeklyTrend,
    recentSessions,
  };
}

function mapSpeakingSession(r: Record<string, unknown>): SpeakingSession {
  let corrections: SpeakingCorrection[] = [];
  try {
    if (typeof r.corrections_json === "string") {
      corrections = JSON.parse(r.corrections_json);
    } else if (Array.isArray(r.corrections_json)) {
      corrections = r.corrections_json as SpeakingCorrection[];
    }
  } catch {
    corrections = [];
  }

  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    courseId: r.course_id ? Number(r.course_id) : null,
    scenarioId: String(r.scenario_id || "general"),
    scenarioTitle: String(r.scenario_title || "General Speaking"),
    durationSeconds: Number(r.duration_seconds || 0),
    transcriptUser: r.transcript_user ? String(r.transcript_user) : null,
    transcriptAi: r.transcript_ai ? String(r.transcript_ai) : null,
    fluencyScore: Number(r.fluency_score || 75),
    pronunciationScore: Number(r.pronunciation_score || 75),
    grammarScore: Number(r.grammar_score || 75),
    vocabularyScore: Number(r.vocabulary_score || 75),
    overallReadyScore: Number(r.overall_ready_score || 75),
    feedbackText: r.feedback_text ? String(r.feedback_text) : null,
    correctionsJson: corrections,
    pointsAwarded: Number(r.points_awarded || 50),
    createdAt: new Date(String(r.created_at)),
  };
}

export async function getLatestReadyCheckSummaryForUser(userId: number): Promise<{
  overallScore: number;
  levelTitle: string;
  cefrEstimate?: string;
  dimensions?: {
    kelancaran: number;
    pelafalan: number;
    mendengar: number;
    ketepatan: number;
    lintasBudaya: number;
  } | null;
  targetProgramSlug: string;
  createdAt: string;
} | null> {
  try {
    const rows = await sql`
      SELECT overall_ready_score, transcript_ai, created_at
      FROM speaking_sessions
      WHERE user_id = ${userId} AND scenario_id = 'ready_check_baseline'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (rows.length > 0) {
      const r = rows[0] as Record<string, unknown>;
      const score = Number(r.overall_ready_score ?? 0);
      let parsed: Record<string, unknown> | null = null;
      try {
        if (typeof r.transcript_ai === "string" && r.transcript_ai.startsWith("{")) {
          parsed = JSON.parse(r.transcript_ai);
        }
      } catch {
        parsed = null;
      }

      const fallbackLevel =
        score <= 20
          ? "Starter"
          : score <= 40
          ? "Warming Up"
          : score <= 60
          ? "Ready to Speak"
          : score <= 80
          ? "Ready to Connect"
          : "Ready to Contribute";

      const fallbackCefr =
        score <= 20 ? "A1" : score <= 40 ? "A2" : score <= 60 ? "B1" : score <= 80 ? "B2" : "C1";

      const rawDims = parsed?.dimensions as Record<string, number> | undefined;
      const dimensions = rawDims
        ? {
            kelancaran: Number(rawDims.kelancaran ?? score),
            pelafalan: Number(rawDims.pelafalan ?? score),
            mendengar: Number(rawDims.mendengar ?? score),
            ketepatan: Number(rawDims.ketepatan ?? score),
            lintasBudaya: Number(rawDims.lintasBudaya ?? score),
          }
        : {
            kelancaran: Math.max(10, score - 5),
            pelafalan: Math.min(100, score + 4),
            mendengar: Math.min(100, score + 8),
            ketepatan: Math.max(10, score - 2),
            lintasBudaya: score,
          };

      return {
        overallScore: score,
        levelTitle: String(parsed?.levelTitle ?? fallbackLevel),
        cefrEstimate: String(parsed?.cefrEstimate ?? fallbackCefr),
        dimensions,
        targetProgramSlug: String(parsed?.recommendedGoalSlug ?? "ready-for-work"),
        createdAt: String(r.created_at),
      };
    }

    // Fallback: Check if user has current_ready_score > 0 in users table
    const uRows = await sql`
      SELECT current_ready_score, created_at FROM users WHERE id = ${userId}
    `;
    if (uRows.length > 0 && Number(uRows[0].current_ready_score) > 0) {
      const score = Number(uRows[0].current_ready_score);
      const fallbackLevel =
        score <= 20
          ? "Starter"
          : score <= 40
          ? "Warming Up"
          : score <= 60
          ? "Ready to Speak"
          : score <= 80
          ? "Ready to Connect"
          : "Ready to Contribute";

      const fallbackCefr =
        score <= 20 ? "A1" : score <= 40 ? "A2" : score <= 60 ? "B1" : score <= 80 ? "B2" : "C1";

      return {
        overallScore: score,
        levelTitle: fallbackLevel,
        cefrEstimate: fallbackCefr,
        dimensions: {
          kelancaran: Math.max(10, score - 5),
          pelafalan: Math.min(100, score + 4),
          mendengar: Math.min(100, score + 8),
          ketepatan: Math.max(10, score - 2),
          lintasBudaya: score,
        },
        targetProgramSlug: "ready-for-work",
        createdAt: String(uRows[0].created_at),
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function listEnrolledPackagesForSpeaking(userId: number): Promise<
  Array<{
    courseId: number;
    slug: string;
    title: string;
    tier: string;
    level: string;
    shortDescription: string | null;
    lessons: string[];
  }>
> {
  try {
    const courses = await sql`
      SELECT c.id, c.slug, c.title, c.tier, c.level, c.short_description
      FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = ${userId} AND e.status = 'active' AND c.deleted_at IS NULL
      ORDER BY e.enrolled_at DESC
    `;

    if (!courses || courses.length === 0) return [];

    const courseIds = courses.map((c) => Number((c as Record<string, unknown>).id));
    const lessonRows = await sql`
      SELECT s.course_id, l.title
      FROM sections s
      JOIN lessons l ON l.section_id = s.id AND l.deleted_at IS NULL
      WHERE s.course_id = ANY(${courseIds})
      ORDER BY s.sort_order ASC, l.sort_order ASC
    `;

    const lessonsByCourse = new Map<number, string[]>();
    for (const row of lessonRows) {
      const r = row as Record<string, unknown>;
      const cid = Number(r.course_id);
      const list = lessonsByCourse.get(cid) ?? [];
      if (r.title) list.push(String(r.title));
      lessonsByCourse.set(cid, list);
    }

    return courses.map((row) => {
      const r = row as Record<string, unknown>;
      const cid = Number(r.id);
      return {
        courseId: cid,
        slug: String(r.slug ?? ""),
        title: String(r.title ?? ""),
        tier: String(r.tier ?? "tier_menengah"),
        level: String(r.level ?? "intermediate"),
        shortDescription: r.short_description ? String(r.short_description) : null,
        lessons: lessonsByCourse.get(cid) ?? [],
      };
    });
  } catch (err) {
    console.warn("[listEnrolledPackagesForSpeaking error]:", err);
    return [];
  }
}


