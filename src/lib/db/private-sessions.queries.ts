import { sql } from "./client";

export async function getInstructorSlots(instructorId: number): Promise<any[]> {
  const rows = await sql`
    SELECT 
      id,
      instructor_id as "instructorId",
      start_at as "startAt",
      end_at as "endAt",
      status
    FROM instructor_slots
    WHERE instructor_id = ${instructorId}
      AND status != 'cancelled'
      AND end_at > CURRENT_TIMESTAMP
    ORDER BY start_at ASC
  `;
  return rows;
}

export async function checkSlotDuplicateOrOverlap(
  instructorId: number,
  startAt: string,
  endAt: string
): Promise<{ isDuplicate: boolean; isOverlap: boolean } | null> {
  const rows = await sql`
    SELECT id, start_at, end_at
    FROM instructor_slots
    WHERE instructor_id = ${instructorId}
      AND status != 'cancelled'
      AND (
        (start_at = ${startAt}::timestamptz AND end_at = ${endAt}::timestamptz)
        OR (start_at < ${endAt}::timestamptz AND end_at > ${startAt}::timestamptz)
      )
    LIMIT 1
  `;

  if (rows.length === 0) return null;

  const r = rows[0];
  const isDup =
    new Date(r.start_at).getTime() === new Date(startAt).getTime() &&
    new Date(r.end_at).getTime() === new Date(endAt).getTime();

  return {
    isDuplicate: isDup,
    isOverlap: !isDup,
  };
}

export async function addInstructorSlot(instructorId: number, startAt: string, endAt: string) {
  const rows = await sql`
    INSERT INTO instructor_slots (instructor_id, start_at, end_at, status)
    VALUES (${instructorId}, ${startAt}::timestamptz, ${endAt}::timestamptz, 'available')
    RETURNING *
  `;
  return rows[0];
}

export async function deleteInstructorSlot(slotId: number, instructorId: number, reason?: string) {
  // 1. Cek apakah ada sesi aktif (pending atau confirmed) yang terhubung dengan slot ini
  const activeSessions = await sql`
    SELECT ps.id, ps.learner_id, ps.status, s.start_at
    FROM private_sessions ps
    JOIN instructor_slots s ON ps.slot_id = s.id
    WHERE ps.slot_id = ${slotId} 
      AND ps.instructor_id = ${instructorId}
      AND ps.status IN ('pending', 'confirmed')
  `;

  if (activeSessions.length > 0) {
    if (!reason || !reason.trim()) {
      throw new Error("Alasan pembatalan harus diisi karena jadwal ini sudah dibooking");
    }

    // Batalkan sesi aktif siswa dan simpan alasannya
    await sql`
      UPDATE private_sessions
      SET status = 'cancelled', 
          reject_reason = ${reason.trim()}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE slot_id = ${slotId} 
        AND instructor_id = ${instructorId}
        AND status IN ('pending', 'confirmed')
    `;

    // Ubah status slot menjadi 'cancelled'
    const updatedSlot = await sql`
      UPDATE instructor_slots
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${slotId} AND instructor_id = ${instructorId}
      RETURNING id, start_at
    `;

    return { 
      success: true, 
      slot: updatedSlot[0], 
      cancelledSessions: activeSessions,
      cancellationReason: reason.trim()
    };
  }

  // 2. Jika tidak ada sesi aktif, periksa apakah ada riwayat sesi lampau (selesai, ditolak, dibatalkan)
  const sessionCount = await sql`
    SELECT COUNT(*)::int as count 
    FROM private_sessions 
    WHERE slot_id = ${slotId}
  `;

  const hasHistory = (sessionCount[0]?.count || 0) > 0;

  if (hasHistory) {
    // JANGAN hapus riwayat private_sessions agar data riwayat murid & instruktur tetap tampil!
    // Cukup ubah status slot menjadi 'cancelled' agar slot ketersediaan hilang dari kalender instruktur.
    const rows = await sql`
      UPDATE instructor_slots
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${slotId} AND instructor_id = ${instructorId}
      RETURNING id, start_at
    `;
    return { success: true, slot: rows[0], cancelledSessions: [] };
  } else {
    // Jika tidak ada riwayat sesi terkait sama sekali, slot aman dihapus permanen dari database
    const rows = await sql`
      DELETE FROM instructor_slots
      WHERE id = ${slotId} AND instructor_id = ${instructorId}
      RETURNING id, start_at
    `;
    return { success: true, slot: rows[0], cancelledSessions: [] };
  }
}

export async function updateZoomLink(instructorId: number, link: string | null) {
  await sql`
    UPDATE users
    SET zoom_link = ${link}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${instructorId}
  `;
}

export async function getInstructorZoomLink(instructorId: number): Promise<string | null> {
  const rows = await sql`
    SELECT zoom_link FROM users WHERE id = ${instructorId}
  `;
  return rows[0]?.zoom_link as string | null || null;
}

export async function getLearnerPrivateSessions(learnerId: number): Promise<any[]> {
  const rows = await sql`
    SELECT 
      ps.id,
      ps.slot_id as "slotId",
      ps.learner_id as "learnerId",
      ps.instructor_id as "instructorId",
      ps.course_id as "courseId",
      ps.topic,
      ps.instructor_notes as "instructorNotes",
      ps.reject_reason as "rejectReason",
      ps.zoom_link as "zoomLink",
      ps.session_type as "sessionType",
      ps.location_name as "locationName",
      ps.location_address as "locationAddress",
      ps.location_maps_url as "locationMapsUrl",
      ps.location_notes as "locationNotes",
      ps.status,
      ps.confirmed_at as "confirmedAt",
      s.start_at as "startAt",
      s.end_at as "endAt",
      c.title as "courseTitle",
      c.tier as "courseTier",
      u.name as "instructorName",
      u.avatar_url as "instructorAvatar",
      ui.zoom_link as "instructorZoomLink"
    FROM private_sessions ps
    LEFT JOIN instructor_slots s ON ps.slot_id = s.id
    JOIN courses c ON ps.course_id = c.id
    JOIN users u ON ps.instructor_id = u.id
    LEFT JOIN users ui ON ps.instructor_id = ui.id
    WHERE ps.learner_id = ${learnerId}
    ORDER BY 
      CASE 
        WHEN ps.status = 'confirmed' THEN 1
        WHEN ps.status = 'pending' THEN 2
        WHEN ps.status = 'completed' THEN 3
        ELSE 4
      END ASC,
      CASE 
        WHEN ps.status = 'confirmed' AND s.start_at >= CURRENT_TIMESTAMP THEN s.start_at
        ELSE NULL
      END ASC NULLS LAST,
      COALESCE(s.start_at, ps.created_at) DESC
  `;
  return rows;
}

export async function getInstructorPrivateSessions(instructorId: number): Promise<any[]> {
  const rows = await sql`
    SELECT 
      ps.id,
      ps.slot_id as "slotId",
      ps.learner_id as "learnerId",
      ps.instructor_id as "instructorId",
      ps.course_id as "courseId",
      ps.topic,
      ps.instructor_notes as "instructorNotes",
      ps.reject_reason as "rejectReason",
      ps.zoom_link as "zoomLink",
      ps.session_type as "sessionType",
      ps.location_name as "locationName",
      ps.location_address as "locationAddress",
      ps.location_maps_url as "locationMapsUrl",
      ps.location_notes as "locationNotes",
      ps.status,
      ps.confirmed_at as "confirmedAt",
      s.start_at as "startAt",
      s.end_at as "endAt",
      c.title as "courseTitle",
      c.tier as "courseTier",
      u.name as "learnerName",
      u.avatar_url as "learnerAvatar",
      ui.zoom_link as "instructorZoomLink"
    FROM private_sessions ps
    LEFT JOIN instructor_slots s ON ps.slot_id = s.id
    JOIN courses c ON ps.course_id = c.id
    JOIN users u ON ps.learner_id = u.id
    LEFT JOIN users ui ON ps.instructor_id = ui.id
    WHERE ps.instructor_id = ${instructorId}
    ORDER BY COALESCE(s.start_at, ps.created_at) DESC
  `;
  return rows;
}

export async function getInstructorAvailableSlots(instructorId: number): Promise<any[]> {
  const rows = await sql`
    SELECT 
      id,
      instructor_id as "instructorId",
      start_at as "startAt",
      end_at as "endAt",
      status
    FROM instructor_slots
    WHERE instructor_id = ${instructorId} 
      AND status = 'available'
      AND start_at > CURRENT_TIMESTAMP
    ORDER BY start_at ASC
  `;
  return rows;
}

export async function createPrivateSession(
  slotId: number, 
  learnerId: number, 
  instructorId: number, 
  courseId: number, 
  topic: string,
  options?: {
    sessionType?: "online" | "offline";
    locationName?: string | null;
    locationAddress?: string | null;
    locationMapsUrl?: string | null;
    locationNotes?: string | null;
  }
) {
  const sessionType = options?.sessionType === "offline" ? "offline" : "online";
  const locationName = options?.locationName || null;
  const locationAddress = options?.locationAddress || null;
  const locationMapsUrl = options?.locationMapsUrl || null;
  const locationNotes = options?.locationNotes || null;

  const courseRows = await sql`
    SELECT c.id, c.tier, c.speaking_partner_type, c.offline_sessions_count
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    WHERE e.user_id = ${learnerId}
      AND e.course_id = ${courseId}
      AND e.status = 'active'
    LIMIT 1
  `;

  if (courseRows.length === 0) {
    throw new Error("Anda tidak terdaftar pada kursus yang dipilih.");
  }

  const course = courseRows[0];
  if (course.tier !== "tier_tinggi" && course.speaking_partner_type !== "trainer_offline") {
    throw new Error(
      "Sesi privat 1-on-1 (Zoom / Offline Tatap Muka) hanya tersedia untuk Paket Tinggi (Ready Path)."
    );
  }

  const maxQuota =
    Number(course.offline_sessions_count) > 0 ? Number(course.offline_sessions_count) : 4;

  const usedRows = await sql`
    SELECT COUNT(*)::int AS used_count
    FROM private_sessions
    WHERE learner_id = ${learnerId}
      AND course_id = ${courseId}
      AND status IN ('pending', 'confirmed', 'completed')
  `;
  const usedCount = Number(usedRows[0]?.used_count ?? 0);

  if (usedCount >= maxQuota) {
    throw new Error(
      `Kuota tiket sesi privat 1-on-1 untuk program ini sudah habis (${usedCount}/${maxQuota} tiket terpakai).`
    );
  }

  const existingActive = await sql`
    SELECT id FROM private_sessions 
    WHERE learner_id = ${learnerId} 
      AND instructor_id = ${instructorId} 
      AND status IN ('pending', 'confirmed')
  `;

  if (existingActive.length > 0) {
    throw new Error("Kamu sudah memiliki sesi aktif dengan instruktur ini");
  }

  const result = await sql`
    WITH updated_slot AS (
      UPDATE instructor_slots
      SET status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = ${slotId}
        AND instructor_id = ${instructorId}
        AND status = 'available'
        AND (
          SELECT COUNT(*)::int
          FROM private_sessions
          WHERE learner_id = ${learnerId}
            AND course_id = ${courseId}
            AND status IN ('pending', 'confirmed', 'completed')
        ) < ${maxQuota}
      RETURNING id
    )
    INSERT INTO private_sessions (
      slot_id, learner_id, instructor_id, course_id, topic,
      session_type, location_name, location_address, location_maps_url, location_notes,
      status
    )
    SELECT 
      id, ${learnerId}, ${instructorId}, ${courseId}, ${topic},
      ${sessionType}, ${locationName}, ${locationAddress}, ${locationMapsUrl}, ${locationNotes},
      'pending'
    FROM updated_slot
    RETURNING *;
  `;

  if (result.length === 0) {
    throw new Error("Slot ini sudah tidak tersedia");
  }

  return result[0];
}

export async function updateSessionStatus(
  sessionId: number,
  instructorId: number,
  status: string,
  notesOrReason?: string,
  overrideLink?: string
) {
  const sessions = await sql`
    SELECT slot_id, status FROM private_sessions 
    WHERE id = ${sessionId} AND instructor_id = ${instructorId}
  `;
  if (sessions.length === 0) throw new Error("Sesi tidak ditemukan");
  
  const session = sessions[0] as Record<string, unknown>;
  const slotId = session.slot_id as number;

  if (status === 'confirmed') {
    await sql`
      UPDATE private_sessions 
      SET status = ${status}, 
          zoom_link = ${overrideLink || null},
          confirmed_at = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
    `;
  } else if (status === 'rejected' || status === 'cancelled') {
    await sql`
      UPDATE private_sessions 
      SET status = ${status}, reject_reason = ${notesOrReason || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
    `;
  } else if (status === 'completed' || status === 'no_show') {
    await sql`
      UPDATE private_sessions 
      SET status = ${status}, instructor_notes = ${notesOrReason || null}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
    `;
  } else {
    await sql`
      UPDATE private_sessions 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${sessionId}
    `;
  }

  if (status === 'rejected' || status === 'cancelled') {
    await sql`
      UPDATE instructor_slots 
      SET status = 'available', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${slotId}
    `;
  } else if (status === 'confirmed' || status === 'completed' || status === 'no_show') {
    await sql`
      UPDATE instructor_slots 
      SET status = 'booked', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${slotId}
    `;
  }

  return { success: true };
}

export async function cancelSessionByLearner(sessionId: number, learnerId: number) {
  const sessions = await sql`
    SELECT ps.slot_id, ps.status, s.start_at 
    FROM private_sessions ps
    JOIN instructor_slots s ON ps.slot_id = s.id
    WHERE ps.id = ${sessionId} AND ps.learner_id = ${learnerId}
  `;
  
  if (sessions.length === 0) throw new Error("Sesi tidak ditemukan");
  
  const session = sessions[0] as Record<string, unknown>;
  const slotId = session.slot_id as number;
  const status = session.status as string;
  const startAt = session.start_at as Date;

  if (status === 'completed' || status === 'no_show' || status === 'rejected' || status === 'cancelled') {
    throw new Error("Sesi tidak dapat dibatalkan dalam status saat ini");
  }

  if (status === 'confirmed') {
    const timeDiff = startAt.getTime() - new Date().getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    if (hoursDiff < 24) {
      throw new Error("Sesi yang sudah dikonfirmasi hanya dapat dibatalkan minimal 24 jam sebelum waktu mulai");
    }
  }

  await sql`
    UPDATE private_sessions 
    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
    WHERE id = ${sessionId}
  `;

  await sql`
    UPDATE instructor_slots 
    SET status = 'available', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ${slotId}
  `;

  return { success: true };
}

export async function getEligibleInstructorsForLearner(learnerId: number): Promise<any[]> {
  const rows = await sql`
    SELECT DISTINCT
      u.id as "instructorId",
      u.name as "instructorName",
      u.avatar_url as "instructorAvatar"
    FROM enrollments e
    JOIN courses c ON e.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    WHERE e.user_id = ${learnerId}
      AND e.status = 'active'
      AND (c.tier = 'tier_tinggi' OR c.speaking_partner_type = 'trainer_offline')
  `;
  return rows;
}

export async function getStudentAvailableSlotsAll(learnerId: number): Promise<any[]> {
  const rows = await sql`
    SELECT 
      s.id,
      s.instructor_id as "instructorId",
      s.start_at as "startAt",
      s.end_at as "endAt",
      s.status,
      u.name as "instructorName",
      u.avatar_url as "instructorAvatar"
    FROM instructor_slots s
    JOIN users u ON s.instructor_id = u.id
    WHERE s.status = 'available'
      AND s.start_at > CURRENT_TIMESTAMP
      AND s.instructor_id IN (
        SELECT c.instructor_id
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        WHERE e.user_id = ${learnerId}
          AND e.status = 'active'
          AND (c.tier = 'tier_tinggi' OR c.speaking_partner_type = 'trainer_offline')
      )
    ORDER BY s.start_at ASC
  `;
  return rows;
}
