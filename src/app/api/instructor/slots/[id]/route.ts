import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { deleteInstructorSlot } from "@/lib/db/private-sessions.queries";

export async function DELETE(request: Request, context: any) {
  const params = await context.params;
  const { id } = params;

  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deleted = await deleteInstructorSlot(Number(id), Number(session.user.id));
    if (!deleted) {
      return NextResponse.json({ error: "Slot tidak ditemukan atau sudah dibooking" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
