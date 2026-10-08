import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getInstructorPrivateSessions } from "@/lib/db/private-sessions.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await getInstructorPrivateSessions(Number(session.user.id));
    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
