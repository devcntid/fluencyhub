import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { updateZoomLink, getInstructorZoomLink } from "@/lib/db/private-sessions.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const link = await getInstructorZoomLink(Number(session.user.id));
    return NextResponse.json({ data: link });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { link } = body;

    if (typeof link !== "string" && link !== null) {
      return NextResponse.json({ error: "Invalid link format" }, { status: 400 });
    }

    await updateZoomLink(Number(session.user.id), link);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
