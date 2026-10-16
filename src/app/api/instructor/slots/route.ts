import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { getInstructorSlots, addInstructorSlot, checkSlotDuplicateOrOverlap } from "@/lib/db/private-sessions.queries";
import { checkLiveClassDuplicateOrOverlap } from "@/lib/db/lessons.queries";

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

    const instructorId = Number(session.user.id);

    // Cek apakah slot pada waktu yang sama atau tumpang tindih sudah ada
    const check = await checkSlotDuplicateOrOverlap(instructorId, startAt, endAt);
    if (check) {
      if (check.isDuplicate) {
        return NextResponse.json(
          { error: "Jadwal dengan tanggal dan waktu tersebut sudah tersedia" },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: "Jadwal bentrok dengan jadwal yang sudah ada" },
          { status: 400 }
        );
      }
    }

    // Cek apakah bentrok dengan sesi kelas live yang dijadwalkan instruktur
    const liveConflict = await checkLiveClassDuplicateOrOverlap({
      instructorId,
      courseId: 0,
      startAt: start,
      durationMinutes: Math.round((end.getTime() - start.getTime()) / 60000),
    });
    if (liveConflict) {
      return NextResponse.json(
        {
          error: `Jadwal bentrok dengan sesi kelas live Anda (${liveConflict.conflictingLesson.title} pada ${liveConflict.conflictingLesson.formattedTime})`,
        },
        { status: 400 }
      );
    }

    try {
      const slot = await addInstructorSlot(instructorId, startAt, endAt);
      return NextResponse.json({ data: slot });
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      if (errorObj?.code === "23505" || errorObj?.message?.includes("idx_instructor_slots_unique_active")) {
        return NextResponse.json(
          { error: "Jadwal dengan tanggal dan waktu tersebut sudah tersedia" },
          { status: 400 }
        );
      }
      throw err;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
