import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getStudentProgressSummary } from "@/lib/db/speaking.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const summary = await getStudentProgressSummary(userId);

  return NextResponse.json({
    success: true,
    data: summary,
  });
}

