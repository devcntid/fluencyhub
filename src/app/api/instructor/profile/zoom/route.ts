import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { updateZoomLink, getInstructorZoomLink } from "@/lib/db/private-sessions.queries";
import { validateZoomLink } from "@/lib/utils/zoom";

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

    // Allow explicitly clearing the link
    if (link === null || link === "") {
      await updateZoomLink(Number(session.user.id), null);
      return NextResponse.json({ success: true, data: null });
    }

    if (typeof link !== "string") {
      return NextResponse.json({ error: "Format link tidak valid" }, { status: 400 });
    }

    // Validate Zoom URL format and domain
    const validation = validateZoomLink(link);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Tautan Zoom tidak valid" },
        { status: 400 }
      );
    }

    await updateZoomLink(Number(session.user.id), validation.normalizedUrl);
    return NextResponse.json({ success: true, data: validation.normalizedUrl });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
