import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getInstructorSlots, addInstructorSlot } from "@/lib/db/private-sessions.queries";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const slots = await getInstructorSlots(Number(session.user.id));
    return NextResponse.json({ data: slots });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "instructor") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { startAt, endAt } = body;

    if (!startAt || !endAt) {
      return NextResponse.json({ error: "Waktu mulai dan selesai harus diisi" }, { status: 400 });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    if (end <= start) {
      return NextResponse.json({ error: "Waktu selesai harus lebih besar dari waktu mulai" }, { status: 400 });
    }
    
    if (start <= new Date()) {
       return NextResponse.json({ error: "Waktu tidak boleh di masa lalu" }, { status: 400 });
    }

    // A more thorough check would also check for overlap with existing slots
    
    const slot = await addInstructorSlot(Number(session.user.id), startAt, endAt);
    return NextResponse.json({ data: slot });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
