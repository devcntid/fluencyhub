import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getEligibleInstructorsForLearner } from "@/lib/db/private-sessions.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const instructors = await getEligibleInstructorsForLearner(Number(session.user.id));
    return NextResponse.json({ data: instructors });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
