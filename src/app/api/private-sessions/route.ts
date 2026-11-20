import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { sql } from "@/lib/db/client";
import { getLearnerPrivateSessions, createPrivateSession } from "@/lib/db/private-sessions.queries";
import { getUserById } from "@/lib/db/users.queries";
import { notifyZoomSessionRequested } from "@/lib/notifications";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sessions = await getLearnerPrivateSessions(Number(session.user.id));
    return NextResponse.json({ data: sessions });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      slotId,
      instructorId,
      courseId,
      topic,
      sessionType = "online",
      locationName,
      locationAddress,
      locationMapsUrl,
      locationNotes,
    } = body;

    if (!slotId || !instructorId || !courseId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const mode: "online" | "offline" = sessionType === "offline" ? "offline" : "online";

    // Server-side tier enforcement for Offline Tatap Muka & Online Mentoring
    const courseRows = await sql`
      SELECT c.id, c.tier, c.speaking_partner_type, c.offline_sessions_count
      FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.user_id = ${Number(session.user.id)}
        AND e.course_id = ${Number(courseId)}
        AND e.status = 'active'
      LIMIT 1
    `;

    if (courseRows.length === 0) {
      return NextResponse.json(
        { error: "Anda tidak terdaftar pada kursus yang dipilih." },
        { status: 403 }
      );
    }

    const course = courseRows[0];
    if (course.tier !== "tier_tinggi" && course.speaking_partner_type !== "trainer_offline") {
      return NextResponse.json(
        {
          error:
            course.tier === "tier_menengah"
              ? "Paket Menengah mendapatkan kelas kelompok Live Zoom di menu Classroom → Live Zoom. Menu Private Sessions (1-on-1 Ready Coach) khusus untuk Paket Tinggi (Ready Path Executive)."
              : "Paket Bawah hanya mencakup AI Speaking Partner 24/7. Silakan upgrade ke Paket Tinggi untuk sesi privat 1-on-1 dengan Trainer.",
        },
        { status: 403 }
      );
    }

    const maxQuota =
      Number(course.offline_sessions_count) > 0 ? Number(course.offline_sessions_count) : 4;

    const quotaRows = await sql`
      SELECT COUNT(*)::int AS used_count
      FROM private_sessions
      WHERE learner_id = ${Number(session.user.id)}
        AND course_id = ${Number(courseId)}
        AND status IN ('pending', 'confirmed', 'completed')
    `;
    const usedCount = Number(quotaRows[0]?.used_count ?? 0);

    if (usedCount >= maxQuota) {
      return NextResponse.json(
        {
          error: `Kuota tiket sesi privat 1-on-1 untuk program ini sudah habis (${usedCount}/${maxQuota} tiket terpakai).`,
        },
        { status: 403 }
      );
    }

    if (mode === "offline") {
      if (!locationName || !String(locationName).trim() || !locationAddress || !String(locationAddress).trim()) {
        return NextResponse.json(
          { error: "Nama tempat dan alamat lengkap wajib diisi untuk sesi Tatap Muka Offline." },
          { status: 400 }
        );
      }
    }

    const cleanLocationName = mode === "offline" ? String(locationName).trim() : null;
    const cleanLocationAddress = mode === "offline" ? String(locationAddress).trim() : null;
    const cleanLocationNotes = mode === "offline" && locationNotes ? String(locationNotes).trim() : null;
    const cleanMapsUrl =
      mode === "offline"
        ? (locationMapsUrl && String(locationMapsUrl).trim()) ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${cleanLocationName} ${cleanLocationAddress}`
          )}`
        : null;

    const created = await createPrivateSession(
      Number(slotId),
      Number(session.user.id),
      Number(instructorId),
      Number(courseId),
      topic || "",
      {
        sessionType: mode,
        locationName: cleanLocationName,
        locationAddress: cleanLocationAddress,
        locationMapsUrl: cleanMapsUrl,
        locationNotes: cleanLocationNotes,
      }
    );

    const [learner, instructor] = await Promise.all([
      getUserById(Number(session.user.id)),
      getUserById(Number(instructorId))
    ]);

    if (instructor && learner) {
      const topicWithMode =
        mode === "offline"
          ? `[OFFLINE TATAP MUKA @ ${cleanLocationName}] ${topic || ""}`
          : topic || "";
      await notifyZoomSessionRequested(instructor, learner, new Date(), topicWithMode);
    }

    return NextResponse.json({ data: created });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 400 });
  }
}
