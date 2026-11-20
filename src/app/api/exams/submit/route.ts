import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { getExamById, getExamForCourse, createOrUpdateExamForCourse, submitExamAnswers, getExamSubmission } from "@/lib/db/exams.queries";
import { listCoursePlayerCurriculum } from "@/lib/db/lessons.queries";

const SubmitSchema = z.object({
  examId: z.number().int().min(0).default(0),
  courseId: z.number().int().positive(),
  answers: z.record(z.string(), z.any()),
  youtubeUrl: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const body = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { examId, courseId, answers, youtubeUrl } = parsed.data;

  // Validate that learner has completed 100% of course lessons before submitting exam (skip for admin testers)
  const curriculum = await listCoursePlayerCurriculum(courseId, userId);
  const allLessons = curriculum.flatMap((s) => s.lessons);
  const totalLessons = allLessons.length;
  const completedLessons = allLessons.filter((l) => l.isCompleted).length;
  if (session.user.role !== "admin" && totalLessons > 0 && completedLessons < totalLessons) {
    const pct = Math.round((completedLessons / totalLessons) * 100);
    return NextResponse.json({
      error: `Ujian akhir belum dapat dikirimkan. Anda baru menyelesaikan ${completedLessons} dari ${totalLessons} materi (${pct}%). Harap selesaikan 100% materi terlebih dahulu.`
    }, { status: 403 });
  }

  let exam = examId > 0 ? await getExamById(examId) : null;
  if (!exam) {
    exam = await getExamForCourse(courseId);
  }

  const isCbt = Boolean(answers && answers.cbtResults);

  // If no exam record exists yet in the database, automatically provision one for CBT
  if (!exam) {
    if (isCbt) {
      exam = await createOrUpdateExamForCourse({
        courseId,
        title: "English Ready Interactive CBT Final Exam",
        passingScore: 70,
        durationMinutes: 120,
        content: {
          examInstructions: "Ujian CBT interaktif dengan soal teks isian dan soal audio-speaking.",
        },
      });
    } else {
      return NextResponse.json({ 
        error: "Instruktur belum mengunggah lembar soal ujian untuk kelas ini. Pengumpulan jawaban belum dapat dilakukan." 
      }, { status: 400 });
    }
  } else if (!isCbt && !exam.content?.questionFileUrl) {
    return NextResponse.json({ 
      error: "Instruktur belum mengunggah lembar soal ujian untuk kelas ini. Pengumpulan jawaban belum dapat dilakukan." 
    }, { status: 400 });
  }

  // Check if already passed
  const existing = await getExamSubmission(exam.id, userId);
  if (existing && existing.status === "passed") {
    return NextResponse.json({ 
      error: "Kamu sudah lulus ujian ini!" 
    }, { status: 400 });
  }

  let autoScore = 0;
  let readingScore: number | null = null;
  let speakingScore: number | null = null;
  let finalScore: number | null = null;
  let status: "pending" | "passed" | "failed" = "pending";

  if (isCbt) {
    const cbt = answers.cbtResults;
    autoScore = Math.max(0, Math.min(100, Math.round(Number(cbt.finalPercentage ?? 0))));
    readingScore = Math.max(0, Math.min(100, Math.round(Number(cbt.readingScore ?? autoScore))));
    speakingScore = Math.max(0, Math.min(100, Math.round(Number(cbt.speakingScore ?? autoScore))));
    finalScore = autoScore;
    const passingScore = exam.passingScore || 70;
    status = autoScore >= passingScore ? "passed" : "failed";
  } else {
    // Legacy Auto-scoring logic for Reading & Listening multiple choice questions:
    let earnedPoints = 0;
    let totalPossible = 0;

    const readingQuestions = exam.content?.readingQuestions || [];
    const listeningQuestions = exam.content?.listeningQuestions || [];
    const allQuestions = [...readingQuestions, ...listeningQuestions];

    if (allQuestions.length > 0) {
      for (const q of allQuestions) {
        const qPts = q.points || 5;
        totalPossible += qPts;
        const userAns = answers[q.id];
        if (typeof q.correctAnswer === "number" && Number(userAns) === q.correctAnswer) {
          earnedPoints += qPts;
        }
      }
    }

    autoScore = totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 50) : 0;
  }

  const submission = await submitExamAnswers({
    examId: exam.id,
    userId,
    courseId,
    answers,
    youtubeUrl: youtubeUrl?.trim() || null,
    autoScore,
    readingScore,
    listeningScore: isCbt ? readingScore : null,
    writingScore: isCbt ? readingScore : null,
    speakingScore,
    finalScore,
    status,
  });

  const responseMsg = isCbt
    ? status === "passed"
      ? `Selamat! Kamu LULUS ujian CBT dengan nilai ${autoScore} (Passing Score: ${exam.passingScore || 70}).`
      : `Hasil ujian CBT tersimpan. Nilai kamu ${autoScore} (Passing Score: ${exam.passingScore || 70}). Silakan lakukan remedial jika diperlukan.`
    : "Lembar jawaban ujian berhasil dikirim! Menunggu pemeriksaan dari instruktur.";

  return NextResponse.json({
    data: submission,
    message: responseMsg,
  }, { status: 201 });
}
