import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { getLevelMeta } from "@/lib/ready-check/scoring";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ latest: null });
  }

  const userId = Number(session.user.id);
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
    let parsedMeta: Record<string, unknown> | null = null;
    try {
      if (typeof r.transcript_ai === "string" && r.transcript_ai.startsWith("{")) {
        parsedMeta = JSON.parse(r.transcript_ai);
      }
    } catch {
      parsedMeta = null;
    }

    const levelMeta = getLevelMeta(score);
    return NextResponse.json({
      latest: {
        overallScore: score,
        levelTitle: String(parsedMeta?.levelTitle ?? levelMeta.levelTitle),
        targetProgramSlug: String(parsedMeta?.recommendedGoalSlug ?? "ready-for-work"),
        createdAt: String(r.created_at),
      },
    });
  }

  return NextResponse.json({ latest: null });
}

