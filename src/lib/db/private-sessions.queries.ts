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
    ORDER BY start_at ASC
  `;
  return rows;
}

export async function addInstructorSlot(instructorId: number, startAt: string, endAt: string) {
  const rows = await sql`
    INSERT INTO instructor_slots (instructor_id, start_at, end_at, status)
    VALUES (${instructorId}, ${startAt}::timestamp, ${endAt}::timestamp, 'available')
    RETURNING *
  `;
  return rows[0];
}

export async function deleteInstructorSlot(slotId: number, instructorId: number) {
  // Hapus riwayat sesi yang terkait dengan slot ini (yang sudah dibatalkan/ditolak)
  // agar tidak terbentur constraint foreign key saat menghapus slot
  await sql`DELETE FROM private_sessions WHERE slot_id = ${slotId}`;

  const rows = await sql`
    DELETE FROM instructor_slots
    WHERE id = ${slotId} AND instructor_id = ${instructorId} AND status = 'available'
    RETURNING id
  `;
  return rows[0];
}

export async function updateZoomLink(instructorId: number, link: string) {
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
      ps.status,
      ps.confirmed_at as "confirmedAt",
      s.start_at as "startAt",
      s.end_at as "endAt",
      c.title as "courseTitle",
      u.name as "instructorName",
      u.avatar_url as "instructorAvatar",
      ui.zoom_link as "instructorZoomLink"
    FROM private_sessions ps
    JOIN instructor_slots s ON ps.slot_id = s.id
    JOIN courses c ON ps.course_id = c.id
    JOIN users u ON ps.instructor_id = u.id
    LEFT JOIN users ui ON ps.instructor_id = ui.id
    WHERE ps.learner_id = ${learnerId}
    ORDER BY s.start_at DESC
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
      ps.status,
      ps.confirmed_at as "confirmedAt",
      s.start_at as "startAt",
      s.end_at as "endAt",
      c.title as "courseTitle",
      u.name as "learnerName",
      u.avatar_url as "learnerAvatar",
      ui.zoom_link as "instructorZoomLink"
    FROM private_sessions ps
    JOIN instructor_slots s ON ps.slot_id = s.id
    JOIN courses c ON ps.course_id = c.id
    JOIN users u ON ps.learner_id = u.id
    LEFT JOIN users ui ON ps.instructor_id = ui.id
    WHERE ps.instructor_id = ${instructorId}
    ORDER BY s.start_at DESC
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
  topic: string
) {
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
      WHERE id = ${slotId} AND instructor_id = ${instructorId} AND status = 'available'
      RETURNING id
    )
    INSERT INTO private_sessions (slot_id, learner_id, instructor_id, course_id, topic, status)
    SELECT id, ${learnerId}, ${instructorId}, ${courseId}, ${topic}, 'pending'
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
  } else if (status === 'rejected') {
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

  if (status === 'rejected' || status === 'cancelled' || status === 'completed' || status === 'no_show') {
    await sql`
      UPDATE instructor_slots 
      SET status = 'available', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${slotId}
    `;
  } else if (status === 'confirmed') {
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
    WHERE e.user_id = ${learnerId} AND e.status = 'active'
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
    ORDER BY s.start_at ASC
  `;
  return rows;
}
