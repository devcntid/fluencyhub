import { sql } from "./client";
import type { Certificate } from "@/types/db";

export function generateCertificateCode(): string {
  const dateStr = new Date().toISOString().slice(0, 7).replace("-", "");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CERT-FH-${dateStr}-${rand}`;
}

export function calculateGrade(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export async function getCertificateByCode(certificateCode: string): Promise<(Certificate & { studentName: string; courseTitle: string; instructorName: string }) | null> {
  const rows = await sql`
    SELECT 
      c.*,
      u.name as student_name,
      co.title as course_title,
      inst.name as instructor_name
    FROM certificates c
    JOIN users u ON u.id = c.user_id
    JOIN courses co ON co.id = c.course_id
    JOIN users inst ON inst.id = co.instructor_id
    WHERE c.certificate_code = ${certificateCode}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    certificateCode: String(r.certificate_code),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    submissionId: r.submission_id ? Number(r.submission_id) : null,
    finalScore: Number(r.final_score),
    grade: String(r.grade),
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    issuedAt: new Date(r.issued_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    studentName: String(r.student_name || "Siswa FluencyHub"),
    courseTitle: String(r.course_title || "Program Kursus"),
    instructorName: String(r.instructor_name || "Instruktur FluencyHub"),
  };
}

export async function getUserCertificateForCourse(userId: number, courseId: number): Promise<Certificate | null> {
  const rows = await sql`
    SELECT * FROM certificates 
    WHERE user_id = ${userId} AND course_id = ${courseId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    certificateCode: String(r.certificate_code),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    submissionId: r.submission_id ? Number(r.submission_id) : null,
    finalScore: Number(r.final_score),
    grade: String(r.grade),
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    issuedAt: new Date(r.issued_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function listUserCertificates(userId: number): Promise<Array<Certificate & { courseTitle: string; courseSlug: string }>> {
  const rows = await sql`
    SELECT 
      c.*,
      co.title as course_title,
      co.slug as course_slug
    FROM certificates c
    JOIN courses co ON co.id = c.course_id
    WHERE c.user_id = ${userId}
    ORDER BY c.issued_at DESC
  `;
  return rows.map((r: any) => ({
    id: Number(r.id),
    certificateCode: String(r.certificate_code),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    submissionId: r.submission_id ? Number(r.submission_id) : null,
    finalScore: Number(r.final_score),
    grade: String(r.grade),
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    issuedAt: new Date(r.issued_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    courseTitle: String(r.course_title),
    courseSlug: String(r.course_slug),
  }));
}

export async function createCertificate(data: {
  userId: number;
  courseId: number;
  submissionId?: number | null;
  finalScore: number;
  grade?: string;
  readingScore?: number | null;
  listeningScore?: number | null;
  writingScore?: number | null;
  speakingScore?: number | null;
}): Promise<Certificate> {
  const grade = data.grade || calculateGrade(data.finalScore);
  const code = generateCertificateCode();

  // Upsert so if certificate already exists for this course & user, update it
  const rows = await sql`
    INSERT INTO certificates (
      certificate_code, user_id, course_id, submission_id,
      final_score, grade, reading_score, listening_score,
      writing_score, speaking_score, issued_at, created_at, updated_at
    ) VALUES (
      ${code}, ${data.userId}, ${data.courseId}, ${data.submissionId ?? null},
      ${data.finalScore}, ${grade}, ${data.readingScore ?? null}, ${data.listeningScore ?? null},
      ${data.writingScore ?? null}, ${data.speakingScore ?? null}, NOW(), NOW(), NOW()
    )
    ON CONFLICT (user_id, course_id) DO UPDATE SET
      final_score = EXCLUDED.final_score,
      grade = EXCLUDED.grade,
      reading_score = EXCLUDED.reading_score,
      listening_score = EXCLUDED.listening_score,
      writing_score = EXCLUDED.writing_score,
      speaking_score = EXCLUDED.speaking_score,
      submission_id = COALESCE(EXCLUDED.submission_id, certificates.submission_id),
      updated_at = NOW()
    RETURNING *
  `;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    certificateCode: String(r.certificate_code),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    submissionId: r.submission_id ? Number(r.submission_id) : null,
    finalScore: Number(r.final_score),
    grade: String(r.grade),
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    issuedAt: new Date(r.issued_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}
