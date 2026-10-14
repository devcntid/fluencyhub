"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { Exam, ExamSubmission, Certificate } from "@/types/db";

export function ExamPortal({
  courseId,
  courseTitle,
  exam,
  submission,
  certificate,
  user,
}: {
  courseId: number;
  courseTitle: string;
  exam?: Exam | null;
  submission?: ExamSubmission | null;
  certificate?: Certificate | null;
  user: { id: number; name: string; email: string };
}) {
  const router = useRouter();

  // State for Answer File Upload & Submission
  const [answerFile, setAnswerFile] = useState<File | null>(null);
  const [answerFileUrl, setAnswerFileUrl] = useState("");
  const [answerFileName, setAnswerFileName] = useState("");
  const [studentNotes, setStudentNotes] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isEditingSubmission, setIsEditingSubmission] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check whether instructor has actually submitted the exam to the database
  const hasInstructorSubmittedExam = Boolean(exam && exam.content?.questionFileUrl);

  const examTitle = exam?.title || `Ujian Akhir — ${courseTitle}`;
  const passingScore = exam?.passingScore || 70;
  const questionFileUrl = exam?.content?.questionFileUrl || "";
  const questionFileName = exam?.content?.questionFileName || "Lembar_Soal_Ujian.pdf";
  const instructions =
    exam?.content?.examInstructions ||
    exam?.description ||
    "Petunjuk pengerjaan tertera pada lembar soal ujian.";

  const isFailed = submission?.status === "failed";
  const hasRemedialFile = Boolean(isFailed && exam?.content?.remedialFileUrl);

  const activeQuestionFileUrl = hasRemedialFile
    ? exam!.content!.remedialFileUrl!
    : questionFileUrl;
  const activeQuestionFileName = hasRemedialFile
    ? exam?.content?.remedialFileName || "Lembar_Soal_Remedial.pdf"
    : questionFileName;
  const activeInstructions = hasRemedialFile
    ? exam?.content?.remedialInstructions || instructions
    : instructions;

  // Handle uploading the student's answer file
  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnswerFile(file);
    setUploading(true);
    setUploadProgress("Mengunggah lembar jawaban ke server...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "exam-answers");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengunggah file lembar jawaban.");
      }

      setAnswerFileUrl(json.data.url);
      setAnswerFileName(file.name);
      setUploadProgress("Lembar jawaban siap dikirim!");
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah file. Silakan coba lagi.");
      setAnswerFile(null);
      setAnswerFileUrl("");
      setAnswerFileName("");
    } finally {
      setUploading(false);
    }
  }

  // Handle final submission of student's answers
  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();

    if (!hasInstructorSubmittedExam || !exam?.id) {
      setError("Instruktur belum mengunggah lembar soal ujian untuk kelas ini.");
      return;
    }

    if (!answerFileUrl) {
      setError("Silakan unggah file lembar jawaban Anda (PDF/DOC) terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          examId: exam.id,
          courseId,
          answers: {
            answerFileUrl,
            answerFileName: answerFileName || answerFile?.name || "Lembar_Jawaban.pdf",
            studentNotes: studentNotes.trim(),
            submittedAt: new Date().toISOString(),
          },
          youtubeUrl: youtubeUrl.trim() || null,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gagal mengirimkan lembar jawaban ujian.");
      }

      setSuccess(
        isEditingSubmission
          ? "Lembar jawaban berhasil diperbarui! Menunggu penilaian instruktur."
          : "Lembar jawaban ujian berhasil dikirim! Menunggu pemeriksaan dari instruktur."
      );
      setIsEditingSubmission(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat mengirim jawaban.");
    } finally {
      setSubmitting(false);
    }
  }

  const isPending = submission?.status === "pending";
  const isPassed = submission ? submission.status === "passed" : Boolean(certificate);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Banner Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[var(--brand)] border border-blue-100">
                <LandingIcon name="Award" size={13} color="currentColor" /> Evaluasi Kompetensi & Sertifikasi
              </span>
              <span className="text-zinc-300">•</span>
              <span className="text-xs text-zinc-500 font-medium">{courseTitle}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
              {examTitle}
            </h2>
          </div>

          <div>
            {isPassed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
                <LandingIcon name="Check" size={14} color="currentColor" /> Lulus & Bersertifikat
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
                <LandingIcon name="Clock" size={14} color="currentColor" /> Menunggu Penilaian Instruktur
              </span>
            ) : isFailed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <LandingIcon name="X" size={14} color="currentColor" /> Belum Lulus (Bisa Kirim Ulang)
              </span>
            ) : hasInstructorSubmittedExam ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                <LandingIcon name="FileText" size={14} color="currentColor" /> Soal Siap Dikerjakan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                <LandingIcon name="Clock" size={14} color="currentColor" /> Menunggu Soal dari Instruktur
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Batas Kelulusan:</span>
            <span className="text-sm font-bold text-zinc-900">{passingScore} / 100 Poin</span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Status Soal Ujian:</span>
            <span className={`text-sm font-bold ${hasInstructorSubmittedExam ? "text-emerald-600" : "text-amber-600"}`}>
              {hasInstructorSubmittedExam ? "Tersedia & Siap Diunduh" : "Belum Diunggah Instruktur"}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
            <span className="text-zinc-400 block font-medium">Sertifikat Resmi:</span>
            <span className="text-sm font-bold text-blue-600">Terbit Otomatis Setelah Dinilai</span>
          </div>
        </div>
      </div>

      {/* CASE 1: SISWA TELAH LULUS (TAMPILKAN HASIL NILAI & SERTIFIKAT) */}
      {isPassed && certificate && (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-50/50 via-white to-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <LandingIcon name="Award" size={32} color="#fff" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Official Completion Credential
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                Selamat, Anda Telah Dinyatakan Lulus!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                Sertifikat kelulusan dan transkrip rapor nilai resmi Anda telah diterbitkan dan dapat diunduh atau diverifikasi secara publik.
              </p>
            </div>
          </div>

          {/* Nilai & Feedback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">Nilai Akhir Ujian:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-black text-emerald-600">
                  {submission?.finalScore ?? certificate.finalScore}
                </span>
                <span className="text-xs text-zinc-400 font-bold">/ 100</span>
                <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-extrabold text-emerald-800">
                  Grade {certificate.grade}
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
              <span className="text-xs font-semibold text-zinc-500 block">Evaluasi Instruktur:</span>
              <p className="text-xs text-zinc-700 font-medium italic mt-1 leading-relaxed">
                &ldquo;{submission?.instructorFeedback || "Kualitas pengerjaan sangat baik dan memenuhi standar kecakapan internasional."}&rdquo;
              </p>
            </div>
          </div>

          {/* Rincian 4 Aspek Kemahiran */}
          <div className="rounded-xl border border-emerald-200/80 bg-white p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <LandingIcon name="Award" size={14} color="#059669" />
                Rincian Skor 4 Aspek Kemahiran
              </span>
              <span className="text-[11px] text-zinc-400 font-semibold">Skala 0 - 100</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-blue-50/60 border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-blue-900 block">Reading</span>
                <span className="text-lg font-black text-blue-700">
                  {submission?.readingScore ?? certificate.readingScore ?? "-"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-100 text-center">
                <span className="text-[10px] font-bold text-indigo-900 block">Listening</span>
                <span className="text-lg font-black text-indigo-700">
                  {submission?.listeningScore ?? certificate.listeningScore ?? "-"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-violet-50/60 border border-violet-100 text-center">
                <span className="text-[10px] font-bold text-violet-900 block">Writing</span>
                <span className="text-lg font-black text-violet-700">
                  {submission?.writingScore ?? certificate.writingScore ?? "-"}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-900 block">Speaking</span>
                <span className="text-lg font-black text-emerald-700">
                  {submission?.speakingScore ?? certificate.speakingScore ?? "-"}
                </span>
              </div>
            </div>
          </div>

          {/* Action Button: Lihat Sertifikat & Transkrip Nilai */}
          <div className="pt-2">
            <Link
              href={`/certificates/${certificate.certificateCode}`}
              target="_blank"
              className="btn btn-primary btn-default inline-flex items-center gap-2 font-bold shadow-sm"
            >
              <LandingIcon name="Award" size={16} color="#fff" />
              <span>Lihat Sertifikat & Transkrip Nilai &rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* CASE 2: JAWABAN SUDAH DIKIRIM & MENUNGGU PENILAIAN */}
      {isPending && !isEditingSubmission && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 sm:p-8 space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <LandingIcon name="Clock" size={24} color="currentColor" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-zinc-900">
                Lembar Jawaban Sedang Dikoreksi Instruktur
              </h3>
              <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
                Jawaban ujian Anda telah berhasil kami terima pada sistem. Instruktur akan mengoreksi lembar jawaban Anda dan memberikan nilai evaluasi.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200/80 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-100">
                PDF
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-900 truncate">
                  {submission?.answers?.answerFileName || "Lembar_Jawaban_Ujian.pdf"}
                </p>
                <p suppressHydrationWarning className="text-[11px] text-zinc-400">
                  Waktu Kirim: {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Baru saja"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {submission?.answers?.answerFileUrl && (
                <a
                  href={submission.answers.answerFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="btn btn-secondary btn-sm shrink-0 flex items-center gap-1.5 text-xs font-semibold"
                >
                  <LandingIcon name="Download" size={13} color="currentColor" />
                  <span>Cek Berkas</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsEditingSubmission(true);
                  if (submission?.answers?.answerFileUrl) {
                    setAnswerFileUrl(submission.answers.answerFileUrl);
                    setAnswerFileName(submission.answers.answerFileName || "");
                    setStudentNotes(submission.answers.studentNotes || "");
                    setYoutubeUrl(submission.youtubeUrl || "");
                  }
                }}
                className="btn btn-secondary btn-sm shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                <LandingIcon name="RotateCcw" size={13} color="currentColor" />
                <span>Ganti / Upload Ulang Berkas</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 bg-white/70 rounded-lg p-2.5 border border-amber-200/60 flex items-center gap-2">
            <LandingIcon name="AlertCircle" size={13} color="#d97706" />
            <span>Salah kirim berkas? Anda dapat klik <strong>&ldquo;Ganti / Upload Ulang Berkas&rdquo;</strong> di atas untuk memperbarui dokumen sebelum dinilai oleh instruktur.</span>
          </div>
        </div>
      )}

      {/* CASE 3: BELUM MENGERJAKAN ATAU INGIN MENGUNGGAH JAWABAN (TERMASUK REMEDIAL JIKA BELUM LULUS ATAU EDIT PENDING) */}
      {(!isPassed && (!isPending || isEditingSubmission)) && (
        hasInstructorSubmittedExam ? (
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700">
                {success}
              </div>
            )}

            {/* Banner Mode Edit Berkas Saat Pending */}
            {isEditingSubmission && (
              <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-800 mt-0.5">
                    <LandingIcon name="RotateCcw" size={18} color="currentColor" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-amber-950">Mode Perbarui / Ganti Berkas Jawaban</h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Silakan pilih file jawaban baru Anda. Dokumen sebelumnya akan digantikan dan instruktur akan mengoreksi berkas terbaru ini.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingSubmission(false)}
                  className="btn btn-secondary btn-sm text-xs font-bold shrink-0 self-end sm:self-center"
                >
                  Batal Mengganti
                </button>
              </div>
            )}

            {/* KARTU HASIL EVALUASI REMEDIAL (JIKA STATUS FAILED) */}
            {isFailed && submission && !isEditingSubmission && (
              <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50/80 via-white to-white p-6 sm:p-7 shadow-xs space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
                      <LandingIcon name="AlertCircle" size={26} color="currentColor" />
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                        Status: Belum Lulus (Remedial Terbuka)
                      </span>
                      <h3 className="text-lg font-black text-zinc-900 mt-1">
                        Hasil Ujian Anda: {submission.finalScore ?? submission.manualScore} / 100
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-500 block">Batas Minimal Kelulusan:</span>
                    <span className="text-sm font-bold text-amber-800">{passingScore} Poin</span>
                  </div>
                </div>

                {/* Skor 4 Aspek Kemahiran Sebelumnya */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-white border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-zinc-500 block">Reading</span>
                    <span className="text-base font-black text-zinc-900">
                      {submission.readingScore ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-zinc-500 block">Listening</span>
                    <span className="text-base font-black text-zinc-900">
                      {submission.listeningScore ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-zinc-500 block">Writing</span>
                    <span className="text-base font-black text-zinc-900">
                      {submission.writingScore ?? "-"}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-amber-200 text-center shadow-2xs">
                    <span className="text-[10px] font-bold text-zinc-500 block">Speaking</span>
                    <span className="text-base font-black text-zinc-900">
                      {submission.speakingScore ?? "-"}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-white p-4 space-y-1.5 shadow-2xs">
                  <span className="text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                    <LandingIcon name="MessageSquare" size={14} color="var(--brand)" />
                    Catatan & Evaluasi dari Instruktur:
                  </span>
                  <p className="text-xs text-zinc-700 leading-relaxed italic bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                    &ldquo;{submission.instructorFeedback || "Nilai belum mencapai standar kelulusan. Pelajari kembali materi dan perbaiki lembar jawaban Anda."}&rdquo;
                  </p>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-amber-900 font-medium bg-amber-100/60 p-3 rounded-xl border border-amber-200/60">
                  <LandingIcon name="RotateCcw" size={15} color="currentColor" />
                  <span>
                    <strong>Kesempatan Remedial:</strong> Anda dapat mengunduh ulang soal dan mengirimkan lembar jawaban perbaikan melalui formulir di bawah ini.
                  </span>
                </div>
              </div>
            )}

            {/* LANGKAH 1: DOWNLOAD SOAL UJIAN (PDF) */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold ${hasRemedialFile ? "bg-amber-600" : "bg-blue-600"}`}>
                    1
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-heading)]">
                    {hasRemedialFile
                      ? "Unduh Lembar Soal Khusus Remedial (PDF)"
                      : isFailed
                      ? "Unduh Lembar Soal Ujian untuk Perbaikan (PDF)"
                      : "Unduh Lembar Soal Ujian (PDF)"}
                  </h3>
                </div>

                {hasRemedialFile ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 self-start sm:self-auto">
                    <LandingIcon name="RotateCcw" size={11} color="currentColor" />
                    Paket Soal Khusus Remedial
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
                    Revisi Berdasarkan Feedback
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-zinc-500 whitespace-pre-line leading-relaxed bg-zinc-50 p-3.5 rounded-xl border border-zinc-100">
                {activeInstructions}
              </p>

              <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border ${hasRemedialFile ? "border-amber-200 bg-amber-50/50" : "border-blue-100 bg-blue-50/40"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-sm shadow-xs ${hasRemedialFile ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-red-100 text-red-600"}`}>
                    PDF
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-900 truncate">
                      {activeQuestionFileName}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {hasRemedialFile
                        ? "File Soal Khusus Remedial • FluencyHub Examination"
                        : "File Soal Resmi • FluencyHub Examination"}
                    </p>
                  </div>
                </div>

                <a
                  href={activeQuestionFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  download={activeQuestionFileName}
                  className={`btn btn-sm flex items-center gap-2 font-bold shadow-xs shrink-0 ${hasRemedialFile ? "bg-amber-600 hover:bg-amber-700 text-white" : "btn-primary"}`}
                >
                  <LandingIcon name="Download" size={15} color="#fff" />
                  <span>
                    {hasRemedialFile
                      ? "Download Soal Remedial (PDF) \u2192"
                      : "Download File Soal (PDF) \u2192"}
                  </span>
                </a>
              </div>
            </div>

            {/* LANGKAH 2: UPLOAD JAWABAN UJIAN */}
            <form onSubmit={handleSubmitAnswer} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                  2
                </span>
                <h3 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-heading)]">
                  {isEditingSubmission
                    ? "Perbarui Lembar Jawaban Ujian"
                    : isFailed
                    ? "Kirim Lembar Jawaban Remedial (Perbaikan)"
                    : "Kirim Lembar Jawaban Ujian"}
                </h3>
              </div>

              <p className="text-xs text-zinc-500">
                {isEditingSubmission
                  ? "Pilih file lembar jawaban baru yang ingin Anda unggah untuk menggantikan dokumen sebelumnya."
                  : isFailed
                  ? "Unggah dokumen perbaikan jawaban Anda yang telah disesuaikan dengan masukan instruktur dalam format PDF atau Word (DOCX)."
                  : "Setelah selesai mengerjakan, simpan dokumen jawaban Anda dalam format PDF atau Word (DOCX), kemudian unggah melalui form di bawah ini."}
              </p>

              {/* Dropzone Upload Lembar Jawaban */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-800 block">
                  Unggah File Lembar Jawaban <span className="text-red-500">*</span>
                </label>

                {answerFileUrl ? (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs">
                        <LandingIcon name="Check" size={18} color="currentColor" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {answerFileName}
                        </p>
                        <p className="text-[11px] text-emerald-700 font-medium">
                          File berhasil diunggah dan siap dikirim ke instruktur.
                        </p>
                      </div>
                    </div>

                    <label className="btn btn-secondary btn-sm cursor-pointer text-xs shrink-0">
                      <span>Ganti File</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileSelected}
                        disabled={uploading || submitting}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-50/50 hover:bg-zinc-100/50 hover:border-blue-400 cursor-pointer transition text-center">
                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-[var(--brand)] flex items-center justify-center mb-2 shadow-xs">
                      <LandingIcon name="FileText" size={24} color="currentColor" />
                    </div>
                    <span className="text-sm font-bold text-zinc-800">
                      {uploading ? "Sedang Mengunggah File..." : "Klik untuk Pilih File Lembar Jawaban (PDF / DOCX)"}
                    </span>
                    <span className="text-xs text-zinc-400 mt-1">
                      Format didukung: PDF, Word (DOC/DOCX). Maksimal 20MB.
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileSelected}
                      disabled={uploading || submitting}
                    />
                  </label>
                )}

                {uploadProgress && (
                  <p className="text-xs font-bold text-blue-600 animate-pulse">{uploadProgress}</p>
                )}
              </div>

              {/* Catatan Tambahan Siswa (Opsional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  Catatan Tambahan untuk Instruktur <span className="text-zinc-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={studentNotes}
                  onChange={(e) => setStudentNotes(e.target.value)}
                  placeholder="Tuliskan catatan, rangkuman, atau pesan khusus terkait pengerjaan ujian Anda..."
                  className="input input-default w-full text-xs font-medium leading-relaxed"
                  disabled={submitting}
                />
              </div>

              {/* Link YouTube Speaking Video (Opsional) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-800 block">
                  Link Video Speaking YouTube <span className="text-zinc-400 font-normal">(Opsional — jika terdapat tugas berbicara)</span>
                </label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="input input-default w-full text-xs font-medium"
                  disabled={submitting}
                />
              </div>

              {/* Tombol Submit */}
              <div className="flex justify-end pt-2 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={submitting || uploading || !answerFileUrl}
                  className="btn btn-primary btn-default flex items-center gap-2 font-bold px-6 shadow-sm"
                >
                  <LandingIcon name="CheckCircle" size={16} color="#fff" />
                  <span>
                    {submitting
                      ? "Mengirimkan Jawaban..."
                      : isEditingSubmission
                      ? "Perbarui & Simpan Berkas Jawaban \u2192"
                      : isFailed
                      ? "Kirim Jawaban Remedial ke Instruktur \u2192"
                      : "Kirim Lembar Jawaban Ujian \u2192"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-xs space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
              <LandingIcon name="Clock" size={32} color="currentColor" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                Menunggu Soal dari Instruktur
              </span>
              <h3 className="text-xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
                Soal Ujian Belum Tersedia
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
                Instruktur kelas belum mengunggah lembar soal ujian untuk kelas <strong>{courseTitle}</strong>. Ujian akhir dan formulir pengumpulan jawaban akan otomatis muncul begitu instruktur mempublikasikan lembar soal ujian ke sistem.
              </p>
            </div>

            {/* Timeline Guide */}
            <div className="mx-auto max-w-xl pt-4 border-t border-zinc-100">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
                Alur Sertifikasi Kelas Ini
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold">1</span>
                    <span className="text-xs font-bold text-amber-900">Upload Soal</span>
                  </div>
                  <p className="text-[11px] text-zinc-600">Instruktur mengunggah dokumen lembar soal PDF ke sistem.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 opacity-70">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-zinc-700 text-[10px] font-bold">2</span>
                    <span className="text-xs font-bold text-zinc-700">Kerjakan Soal</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Siswa mendownload soal & mengirimkan lembar jawaban.</p>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 bg-zinc-50 opacity-70">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-300 text-zinc-700 text-[10px] font-bold">3</span>
                    <span className="text-xs font-bold text-zinc-700">Nilai & Sertifikat</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Instruktur menilai jawaban, sertifikat resmi diterbitkan.</p>
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
