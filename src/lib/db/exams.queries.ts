import { sql } from "./client";
import type { Exam, ExamContent, ExamSubmission } from "@/types/db";
import { createCertificate, calculateGrade } from "./certificates.queries";

export async function getExamByLessonId(lessonId: number): Promise<Exam | null> {
  const rows = await sql`
    SELECT * FROM exams 
    WHERE lesson_id = ${lessonId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    lessonId: Number(r.lesson_id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    passingScore: Number(r.passing_score),
    durationMinutes: Number(r.duration_minutes),
    content: (r.content as ExamContent) || {},
    speakingPrompt: r.speaking_prompt ? String(r.speaking_prompt) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function getExamById(id: number): Promise<Exam | null> {
  const rows = await sql`
    SELECT * FROM exams 
    WHERE id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    lessonId: Number(r.lesson_id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    passingScore: Number(r.passing_score),
    durationMinutes: Number(r.duration_minutes),
    content: (r.content as ExamContent) || {},
    speakingPrompt: r.speaking_prompt ? String(r.speaking_prompt) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function getExamForCourse(courseId: number): Promise<Exam | null> {
  const rows = await sql`
    SELECT e.* FROM exams e
    JOIN lessons l ON l.id = e.lesson_id
    JOIN sections s ON s.id = l.section_id
    WHERE s.course_id = ${courseId} AND l.deleted_at IS NULL
    ORDER BY e.id DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    lessonId: Number(r.lesson_id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    passingScore: Number(r.passing_score),
    durationMinutes: Number(r.duration_minutes),
    content: (r.content as ExamContent) || {},
    speakingPrompt: r.speaking_prompt ? String(r.speaking_prompt) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function createOrUpdateExam(data: {
  lessonId: number;
  title: string;
  description?: string | null;
  passingScore?: number;
  durationMinutes?: number;
  content: ExamContent;
  speakingPrompt?: string | null;
}): Promise<Exam> {
  const passingScore = data.passingScore ?? 70;
  const durationMinutes = data.durationMinutes ?? 60;
  const contentJson = JSON.stringify(data.content);

  const rows = await sql`
    INSERT INTO exams (
      lesson_id, title, description, passing_score, duration_minutes,
      content, speaking_prompt, created_at, updated_at
    ) VALUES (
      ${data.lessonId}, ${data.title}, ${data.description ?? null},
      ${passingScore}, ${durationMinutes}, ${contentJson}::jsonb,
      ${data.speakingPrompt ?? null}, NOW(), NOW()
    )
    ON CONFLICT (lesson_id) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      passing_score = EXCLUDED.passing_score,
      duration_minutes = EXCLUDED.duration_minutes,
      content = EXCLUDED.content,
      speaking_prompt = EXCLUDED.speaking_prompt,
      updated_at = NOW()
    RETURNING *
  `;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    lessonId: Number(r.lesson_id),
    title: String(r.title),
    description: r.description ? String(r.description) : null,
    passingScore: Number(r.passing_score),
    durationMinutes: Number(r.duration_minutes),
    content: (r.content as ExamContent) || {},
    speakingPrompt: r.speaking_prompt ? String(r.speaking_prompt) : null,
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function createOrUpdateExamForCourse(data: {
  courseId: number;
  title: string;
  description?: string | null;
  passingScore?: number;
  durationMinutes?: number;
  content: ExamContent;
  speakingPrompt?: string | null;
}): Promise<Exam> {
  const existingExam = await getExamForCourse(data.courseId);
  if (existingExam) {
    return createOrUpdateExam({
      lessonId: existingExam.lessonId,
      title: data.title,
      description: data.description,
      passingScore: data.passingScore,
      durationMinutes: data.durationMinutes,
      content: data.content,
      speakingPrompt: data.speakingPrompt,
    });
  }

  let sectionRows = await sql`
    SELECT id FROM sections WHERE course_id = ${data.courseId} ORDER BY sort_order DESC LIMIT 1
  `;
  let sectionId: number;
  if (sectionRows[0]) {
    sectionId = Number(sectionRows[0].id);
  } else {
    const newSec = await sql`
      INSERT INTO sections (course_id, title, sort_order)
      VALUES (${data.courseId}, 'Ujian Akhir & Sertifikasi', 1)
      RETURNING id
    `;
    sectionId = Number(newSec[0].id);
  }

  let lessonRows = await sql`
    SELECT id FROM lessons 
    WHERE section_id = ${sectionId} AND content_type = 'exam' AND deleted_at IS NULL
    LIMIT 1
  `;
  let lessonId: number;
  if (lessonRows[0]) {
    lessonId = Number(lessonRows[0].id);
  } else {
    const newLesson = await sql`
      INSERT INTO lessons (
        section_id, title, content_type, sort_order, created_at, updated_at
      ) VALUES (
        ${sectionId}, ${data.title}, 'exam', 99, NOW(), NOW()
      )
      RETURNING id
    `;
    lessonId = Number(newLesson[0].id);
  }

  return createOrUpdateExam({
    lessonId,
    title: data.title,
    description: data.description,
    passingScore: data.passingScore,
    durationMinutes: data.durationMinutes,
    content: data.content,
    speakingPrompt: data.speakingPrompt,
  });
}

export async function getExamSubmission(examId: number, userId: number): Promise<ExamSubmission | null> {
  const rows = await sql`
    SELECT * FROM exam_submissions
    WHERE exam_id = ${examId} AND user_id = ${userId}
    ORDER BY id DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    examId: Number(r.exam_id),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    answers: (r.answers as Record<string, any>) || {},
    autoScore: Number(r.auto_score),
    manualScore: r.manual_score !== null ? Number(r.manual_score) : null,
    finalScore: r.final_score !== null ? Number(r.final_score) : null,
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
    status: r.status as ExamSubmission["status"],
    instructorFeedback: r.instructor_feedback ? String(r.instructor_feedback) : null,
    gradedBy: r.graded_by ? Number(r.graded_by) : null,
    gradedAt: r.graded_at ? new Date(r.graded_at) : null,
    submittedAt: new Date(r.submitted_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function getExamSubmissionByCourse(courseId: number, userId: number): Promise<ExamSubmission | null> {
  const rows = await sql`
    SELECT * FROM exam_submissions
    WHERE course_id = ${courseId} AND user_id = ${userId}
    ORDER BY id DESC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    examId: Number(r.exam_id),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    answers: (r.answers as Record<string, any>) || {},
    autoScore: Number(r.auto_score),
    manualScore: r.manual_score !== null ? Number(r.manual_score) : null,
    finalScore: r.final_score !== null ? Number(r.final_score) : null,
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
    status: r.status as ExamSubmission["status"],
    instructorFeedback: r.instructor_feedback ? String(r.instructor_feedback) : null,
    gradedBy: r.graded_by ? Number(r.graded_by) : null,
    gradedAt: r.graded_at ? new Date(r.graded_at) : null,
    submittedAt: new Date(r.submitted_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function getExamSubmissionById(id: number): Promise<(ExamSubmission & { studentName: string; studentEmail: string }) | null> {
  const rows = await sql`
    SELECT es.*, u.name as student_name, u.email as student_email
    FROM exam_submissions es
    JOIN users u ON u.id = es.user_id
    WHERE es.id = ${id}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    examId: Number(r.exam_id),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    answers: (r.answers as Record<string, any>) || {},
    autoScore: Number(r.auto_score),
    manualScore: r.manual_score !== null ? Number(r.manual_score) : null,
    finalScore: r.final_score !== null ? Number(r.final_score) : null,
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
    status: r.status as ExamSubmission["status"],
    instructorFeedback: r.instructor_feedback ? String(r.instructor_feedback) : null,
    gradedBy: r.graded_by ? Number(r.graded_by) : null,
    gradedAt: r.graded_at ? new Date(r.graded_at) : null,
    submittedAt: new Date(r.submitted_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    studentName: String(r.student_name || "Siswa"),
    studentEmail: String(r.student_email || ""),
  };
}

export async function listExamSubmissionsForCourse(courseId: number): Promise<Array<ExamSubmission & { studentName: string; studentEmail: string; examTitle: string }>> {
  const rows = await sql`
    SELECT 
      es.*,
      u.name as student_name,
      u.email as student_email,
      e.title as exam_title
    FROM exam_submissions es
    JOIN users u ON u.id = es.user_id
    JOIN exams e ON e.id = es.exam_id
    WHERE es.course_id = ${courseId}
    ORDER BY es.submitted_at DESC
  `;
  return rows.map((r: any) => ({
    id: Number(r.id),
    examId: Number(r.exam_id),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    answers: (r.answers as Record<string, any>) || {},
    autoScore: Number(r.auto_score),
    manualScore: r.manual_score !== null ? Number(r.manual_score) : null,
    finalScore: r.final_score !== null ? Number(r.final_score) : null,
    readingScore: r.reading_score !== null ? Number(r.reading_score) : null,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : null,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : null,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : null,
    youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
    status: r.status as ExamSubmission["status"],
    instructorFeedback: r.instructor_feedback ? String(r.instructor_feedback) : null,
    gradedBy: r.graded_by ? Number(r.graded_by) : null,
    gradedAt: r.graded_at ? new Date(r.graded_at) : null,
    submittedAt: new Date(r.submitted_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
    studentName: String(r.student_name || "Siswa"),
    studentEmail: String(r.student_email || ""),
    examTitle: String(r.exam_title || "Ujian"),
  }));
}

export async function submitExamAnswers(data: {
  examId: number;
  userId: number;
  courseId: number;
  answers: Record<string, any>;
  youtubeUrl?: string | null;
  autoScore: number;
}): Promise<ExamSubmission> {
  const answersJson = JSON.stringify(data.answers);

  // If a pending submission already exists, update it (allows learner to re-upload if wrong file)
  const existingPending = await sql`
    SELECT id FROM exam_submissions
    WHERE exam_id = ${data.examId} AND user_id = ${data.userId} AND status = 'pending'
    ORDER BY id DESC LIMIT 1
  `;

  let rows;
  if (existingPending[0]) {
    rows = await sql`
      UPDATE exam_submissions SET
        answers = ${answersJson}::jsonb,
        auto_score = ${data.autoScore},
        youtube_url = ${data.youtubeUrl ?? null},
        submitted_at = NOW(),
        updated_at = NOW()
      WHERE id = ${existingPending[0].id}
      RETURNING *
    `;
  } else {
    rows = await sql`
      INSERT INTO exam_submissions (
        exam_id, user_id, course_id, answers, auto_score,
        youtube_url, status, submitted_at, created_at, updated_at
      ) VALUES (
        ${data.examId}, ${data.userId}, ${data.courseId},
        ${answersJson}::jsonb, ${data.autoScore},
        ${data.youtubeUrl ?? null}, 'pending', NOW(), NOW(), NOW()
      )
      RETURNING *
    `;
  }
  const r = rows[0] as Record<string, any>;
  return {
    id: Number(r.id),
    examId: Number(r.exam_id),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    answers: (r.answers as Record<string, any>) || {},
    autoScore: Number(r.auto_score),
    manualScore: null,
    finalScore: null,
    readingScore: null,
    listeningScore: null,
    writingScore: null,
    speakingScore: null,
    youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
    status: "pending",
    instructorFeedback: null,
    gradedBy: null,
    gradedAt: null,
    submittedAt: new Date(r.submitted_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };
}

export async function gradeExamSubmission(data: {
  submissionId: number;
  readingScore?: number;
  listeningScore?: number;
  writingScore?: number;
  speakingScore?: number;
  manualScore?: number;
  feedback?: string | null;
  instructorId: number;
}): Promise<{ submission: ExamSubmission; certificateIssued: boolean; certificateCode?: string }> {
  const subRows = await sql`
    SELECT es.*, e.passing_score, e.content
    FROM exam_submissions es
    JOIN exams e ON e.id = es.exam_id
    WHERE es.id = ${data.submissionId}
    LIMIT 1
  `;
  if (!subRows[0]) throw new Error("Submission not found");
  const sub = subRows[0] as Record<string, any>;

  // Input 4 keterampilan bahasa (0 - 100):
  const fallback = Number(data.manualScore ?? 0);
  const readingScore = Math.max(0, Math.min(100, Number(data.readingScore ?? fallback)));
  const listeningScore = Math.max(0, Math.min(100, Number(data.listeningScore ?? fallback)));
  const writingScore = Math.max(0, Math.min(100, Number(data.writingScore ?? fallback)));
  const speakingScore = Math.max(0, Math.min(100, Number(data.speakingScore ?? fallback)));

  // Sistem yang merata-ratakan nilai dari 4 sub-tes:
  const finalScore = Math.round((readingScore + listeningScore + writingScore + speakingScore) / 4);
  const passingScore = Number(sub.passing_score || 70);
  const isPassed = finalScore >= passingScore;
  const status: ExamSubmission["status"] = isPassed ? "passed" : "failed";

  // Wajib periksa apakah instruktur sudah mengunggah tanda tangan di profil sebelum menerbitkan sertifikat
  if (isPassed) {
    const courseInstructor = await sql`
      SELECT u.id, u.name, u.signature_url
      FROM courses co
      LEFT JOIN users u ON u.id = co.instructor_id
      WHERE co.id = ${sub.course_id}
      LIMIT 1
    `;
    const gradingInst = await sql`
      SELECT id, name, signature_url FROM users WHERE id = ${data.instructorId} LIMIT 1
    `;
    const hasSignature = Boolean(courseInstructor[0]?.signature_url || gradingInst[0]?.signature_url);
    if (!hasSignature) {
      const err = new Error(
        "Tanda tangan digital instruktur belum diatur di profil. Harap lengkapi tanda tangan digital di menu Profil Instruktur sebelum menerbitkan sertifikat kelulusan siswa."
      );
      (err as any).code = "INSTRUCTOR_SIGNATURE_REQUIRED";
      throw err;
    }
  }

  const rows = await sql`
    UPDATE exam_submissions SET
      reading_score = ${readingScore},
      listening_score = ${listeningScore},
      writing_score = ${writingScore},
      speaking_score = ${speakingScore},
      manual_score = ${finalScore},
      final_score = ${finalScore},
      status = ${status},
      instructor_feedback = ${data.feedback ?? null},
      graded_by = ${data.instructorId},
      graded_at = NOW(),
      updated_at = NOW()
    WHERE id = ${data.submissionId}
    RETURNING *
  `;
  const r = rows[0] as Record<string, any>;
  const submission: ExamSubmission = {
    id: Number(r.id),
    examId: Number(r.exam_id),
    userId: Number(r.user_id),
    courseId: Number(r.course_id),
    answers: (r.answers as Record<string, any>) || {},
    autoScore: Number(r.auto_score),
    manualScore: Number(r.manual_score),
    finalScore: Number(r.final_score),
    readingScore: r.reading_score !== null ? Number(r.reading_score) : readingScore,
    listeningScore: r.listening_score !== null ? Number(r.listening_score) : listeningScore,
    writingScore: r.writing_score !== null ? Number(r.writing_score) : writingScore,
    speakingScore: r.speaking_score !== null ? Number(r.speaking_score) : speakingScore,
    youtubeUrl: r.youtube_url ? String(r.youtube_url) : null,
    status: r.status as ExamSubmission["status"],
    instructorFeedback: r.instructor_feedback ? String(r.instructor_feedback) : null,
    gradedBy: Number(r.graded_by),
    gradedAt: new Date(r.graded_at),
    submittedAt: new Date(r.submitted_at),
    createdAt: new Date(r.created_at),
    updatedAt: new Date(r.updated_at),
  };

  let certificateIssued = false;
  let certificateCode: string | undefined;

  // Auto issue certificate if passed with the exact 4 skill scores!
  if (isPassed) {
    const cert = await createCertificate({
      userId: submission.userId,
      courseId: submission.courseId,
      submissionId: submission.id,
      finalScore,
      grade: calculateGrade(finalScore),
      readingScore,
      listeningScore,
      writingScore,
      speakingScore,
    });
    certificateIssued = true;
    certificateCode = cert.certificateCode;
  } else {
    // If not passed (e.g. instructor revised score down to remedial < passingScore),
    // revoke/remove any previously issued certificate for this course & user!
    await sql`
      DELETE FROM certificates
      WHERE user_id = ${submission.userId} AND course_id = ${submission.courseId}
    `;
  }

  return { submission, certificateIssued, certificateCode };
}
