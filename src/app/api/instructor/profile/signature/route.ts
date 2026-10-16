import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getUserById, updateUserSignature } from "@/lib/db/users.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await getUserById(Number(session.user.id));
    return NextResponse.json({ signatureUrl: user?.signatureUrl ?? null });
  } catch (error) {
    console.error("GET signature error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || (session.user.role !== "instructor" && session.user.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { signatureUrl } = body;

    let finalUrl: string | null = null;
    if (signatureUrl && typeof signatureUrl === "string") {
      finalUrl = signatureUrl.trim();
    }

    const updatedUser = await updateUserSignature(Number(session.user.id), finalUrl);
    return NextResponse.json({ success: true, signatureUrl: updatedUser.signatureUrl });
  } catch (error) {
    console.error("PATCH signature error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
