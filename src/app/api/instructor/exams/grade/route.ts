import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { gradeExamSubmission } from "@/lib/db/exams.queries";

const GradeSchema = z.object({
  submissionId: z.number().int().positive(),
  finalScore: z.number().min(0).max(100).optional(),
  readingScore: z.number().min(0).max(100).optional(),
  listeningScore: z.number().min(0).max(100).optional(),
  writingScore: z.number().min(0).max(100).optional(),
  speakingScore: z.number().min(0).max(100).optional(),
  manualScore: z.number().min(0).max(100).optional(),
  cbtResults: z.record(z.string(), z.any()).nullable().optional(),
  feedback: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Hanya instruktur atau admin yang dapat menilai ujian." }, { status: 403 });
  }

  const instructorId = Number(session.user.id);
  const body = await req.json().catch(() => null);
  const parsed = GradeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  try {
    const result = await gradeExamSubmission({
      submissionId: parsed.data.submissionId,
      finalScore: parsed.data.finalScore,
      readingScore: parsed.data.readingScore,
      listeningScore: parsed.data.listeningScore,
      writingScore: parsed.data.writingScore,
      speakingScore: parsed.data.speakingScore,
      manualScore: parsed.data.manualScore,
      cbtResults: parsed.data.cbtResults ?? null,
      feedback: parsed.data.feedback || null,
      instructorId,
    });

    return NextResponse.json({
      data: result.submission,
      certificateIssued: result.certificateIssued,
      certificateCode: result.certificateCode,
      message: result.certificateIssued 
        ? "Nilai berhasil disimpan! Siswa dinyatakan Lulus dan Sertifikat resmi telah otomatis diterbitkan."
        : "Nilai berhasil disimpan. Siswa belum mencapai nilai kelulusan.",
    });
  } catch (err: unknown) {
    const errObj = err as { code?: string; message?: string } | null;
    if (errObj?.code === "INSTRUCTOR_SIGNATURE_REQUIRED") {
      return NextResponse.json(
        {
          error: errObj.message,
          requiresSignature: true,
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: errObj?.message || "Gagal menyimpan penilaian." }, { status: 500 });
  }
}
