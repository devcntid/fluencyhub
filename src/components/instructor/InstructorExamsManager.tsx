import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { DEFAULT_CBT_QUESTIONS } from "@/lib/exams/cbt";
import type { Exam } from "@/types/db";
import type { InstructorSubmissionRow } from "@/components/instructor/InstructorExamReviewWorkbench";

export function InstructorExamsManager({
  courseId,
  courseTitle,
  exam,
  submissions,
}: {
  courseId: number;
  courseTitle: string;
  exam: Exam | null;
  submissions: InstructorSubmissionRow[];
}) {
  const passingScore = exam?.passingScore || 70;
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const passedCount = submissions.filter((s) => s.status === "passed").length;
  const failedCount = submissions.filter((s) => s.status === "failed").length;

  const customMainQuestions = Array.isArray(exam?.content?.cbtQuestions)
    ? exam.content.cbtQuestions
    : [];
  const activeMainQuestions =
    customMainQuestions.length > 0 ? customMainQuestions : DEFAULT_CBT_QUESTIONS;
  const mainTextCount = activeMainQuestions.filter((q) => q.type !== "audio_speaking").length;
  const mainAudioCount = activeMainQuestions.filter((q) => q.type === "audio_speaking").length;
  const mainTotalPoints = activeMainQuestions.reduce((acc, q) => acc + (Number(q.points) || 0), 0);

  const remedialQuestions = Array.isArray(exam?.content?.remedialCbtQuestions)
    ? exam.content.remedialCbtQuestions
    : [];
  const remTextCount = remedialQuestions.filter((q) => q.type !== "audio_speaking").length;
  const remAudioCount = remedialQuestions.filter((q) => q.type === "audio_speaking").length;

  return (
    <div className="space-y-5">
      {/* Top Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border border-[#E6DED4] bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/70 text-[#0073F5]">
            <LandingIcon name="Award" size={20} color="currentColor" />
          </div>
          <div className="min-w-0">
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559] leading-snug">
              Panel Ujian CBT &amp; Penilaian
            </h2>
            <p className="m-0 mt-0.5 text-xs text-zinc-500 leading-relaxed">
              Kelola bank soal CBT (Isian Teks &amp; Audio Speaking) serta nilai hasil ujian untuk{" "}
              <strong className="text-[#0B2559]">{courseTitle}</strong>.
            </p>
          </div>
        </div>

        <Link
          href={`/instructor/exams/review?courseId=${courseId}`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F26A12] hover:bg-[#D65507] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition shrink-0 w-full md:w-auto whitespace-nowrap"
        >
          <LandingIcon name="Award" size={14} color="#fff" />
          <span>Panel Review &amp; Nilai &rarr;</span>
          {pendingCount > 0 && (
            <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>

      {/* 2 Dedicated CBT Question Bank Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5">
        {/* Card 1: Bank Soal Ujian Utama */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E6DED4] bg-white shadow-xs flex flex-col justify-between">
          <div className="h-1 w-full bg-[#0073F5]" />
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B2559]">
                    1. Bank Soal Utama
                  </span>
                  <span className="rounded-md bg-blue-50 border border-blue-200/80 px-2 py-0.5 text-[10px] font-extrabold text-[#0062D1]">
                    Auto-Grade CBT
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                    customMainQuestions.length > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-blue-50 text-[#0062D1] border-blue-200"
                  }`}
                >
                  {customMainQuestions.length > 0
                    ? `✓ ${customMainQuestions.length} Soal Kustom`
                    : `Default (${DEFAULT_CBT_QUESTIONS.length} Soal)`}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/80 text-[#0073F5]">
                  <LandingIcon name="FileText" size={20} color="currentColor" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="m-0 font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559] leading-snug break-words">
                    {exam?.title || `Final Competency Exam (CBT) — ${courseTitle}`}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-[#0B2559]">
                      KKM {passingScore}
                    </span>
                    <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-zinc-600">
                      {mainTextCount} Teks
                    </span>
                    <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-zinc-600">
                      {mainAudioCount} Speaking
                    </span>
                    <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-zinc-600">
                      {mainTotalPoints} Poin
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0EAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="m-0 text-xs text-zinc-600 leading-relaxed flex-1">
                {customMainQuestions.length > 0 ? (
                  <span className="font-semibold text-emerald-700">
                    ✓ Aktif otomatis di ruang ujian siswa (urutan soal diacak per peserta).
                  </span>
                ) : (
                  <>
                    Memakai {DEFAULT_CBT_QUESTIONS.length} soal bawaan English Ready. Kamu bisa
                    menyesuaikan soal kapan saja.
                  </>
                )}
              </p>

              <Link
                href={`/instructor/exams/builder?courseId=${courseId}&tab=main`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition shrink-0 whitespace-nowrap"
              >
                <LandingIcon
                  name={customMainQuestions.length > 0 ? "FileText" : "Plus"}
                  size={13}
                  color="#fff"
                />
                <span>
                  {customMainQuestions.length > 0 ? "Kelola Soal CBT" : "Buat Soal CBT"}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Card 2: Bank Soal Remedial (Set B) */}
        <div className="relative overflow-hidden rounded-2xl border border-[#E6DED4] bg-white shadow-xs flex flex-col justify-between">
          <div className="h-1 w-full bg-[#F26A12]" />
          <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0B2559]">
                    2. Bank Soal Remedial
                  </span>
                  <span className="rounded-md bg-[#FFF4EC] border border-[#F26A12]/25 px-2 py-0.5 text-[10px] font-extrabold text-[#C2530A]">
                    Set B (Opsional)
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                    remedialQuestions.length > 0
                      ? "bg-[#FFF4EC] text-[#C2530A] border-[#F26A12]/30"
                      : "bg-[#FBF6F1] text-zinc-600 border-[#E6DED4]"
                  }`}
                >
                  {remedialQuestions.length > 0
                    ? `Set B Aktif (${remedialQuestions.length} Soal)`
                    : "Sama dengan Utama"}
                </span>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FFF4EC] border border-[#F26A12]/25 text-[#C2530A]">
                  <LandingIcon name="RotateCcw" size={20} color="currentColor" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <h3 className="m-0 font-[family-name:var(--font-heading)] text-sm sm:text-base font-extrabold text-[#0B2559] leading-snug break-words">
                    {remedialQuestions.length > 0
                      ? `Paket Soal Remedial (${remedialQuestions.length} Soal)`
                      : "Default: Mengulang dengan Soal Utama (Acak)"}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                    <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-zinc-600">
                      Untuk nilai &lt; {passingScore}
                    </span>
                    {remedialQuestions.length > 0 && (
                      <>
                        <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-zinc-600">
                          {remTextCount} Teks
                        </span>
                        <span className="rounded-lg bg-[#FBF6F1] border border-[#E6DED4] px-2 py-0.5 text-zinc-600">
                          {remAudioCount} Speaking
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0EAE2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="m-0 text-xs text-zinc-600 leading-relaxed flex-1">
                {remedialQuestions.length > 0 ? (
                  <span className="font-semibold text-[#C2530A]">
                    Siswa yang mengulang ujian otomatis mendapatkan {remedialQuestions.length} soal
                    Set B.
                  </span>
                ) : (
                  <>Opsional: buat paket soal berbeda khusus bagi peserta yang mengulang ujian.</>
                )}
              </p>

              <Link
                href={`/instructor/exams/builder?courseId=${courseId}&tab=remedial`}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-extrabold transition shrink-0 whitespace-nowrap ${
                  remedialQuestions.length > 0
                    ? "border border-[#F26A12]/35 bg-[#FFF4EC] text-[#C2530A] hover:bg-[#FFEAD9]"
                    : "bg-[#F26A12] hover:bg-[#D65507] text-white shadow-xs"
                }`}
              >
                <LandingIcon
                  name={remedialQuestions.length > 0 ? "RotateCcw" : "Plus"}
                  size={13}
                  color="currentColor"
                />
                <span>
                  {remedialQuestions.length > 0 ? "Kelola Soal Remedial" : "Buat Soal Remedial"}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-[#E6DED4] bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
            Total Pengumpulan
          </span>
          <span className="text-2xl font-extrabold text-[#0B2559] font-[family-name:var(--font-heading)] mt-1 block">
            {submissions.length}
          </span>
          <span className="text-[11px] text-zinc-400">Lembar ujian masuk</span>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C2530A] block">
            Perlu Dinilai
          </span>
          <span className="text-2xl font-extrabold text-[#C2530A] font-[family-name:var(--font-heading)] mt-1 block">
            {pendingCount}
          </span>
          <span className="text-[11px] text-zinc-500">Menunggu review trainer</span>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Lulus &amp; Sertifikat
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 font-[family-name:var(--font-heading)] mt-1 block">
            {passedCount}
          </span>
          <span className="text-[11px] text-zinc-500">Nilai &ge; {passingScore} (Lulus)</span>
        </div>

        <div className="rounded-2xl border border-[#E6DED4] bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
            Perlu Remedial
          </span>
          <span className="text-2xl font-extrabold text-zinc-700 font-[family-name:var(--font-heading)] mt-1 block">
            {failedCount}
          </span>
          <span className="text-[11px] text-zinc-400">Nilai &lt; {passingScore} (Ulang)</span>
        </div>
      </div>

      {/* Submissions Table / Mobile Cards */}
      <div className="rounded-2xl sm:rounded-3xl border border-[#E6DED4] bg-white shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EAE2] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559]">
              Daftar Pengumpulan Siswa ({submissions.length})
            </h2>
            <p className="m-0 text-xs text-zinc-500 mt-0.5">
              Klik tombol nilai untuk melihat detail jawaban teks, audio speaking, dan memberi
              feedback.
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="rounded-full bg-[#FFF4EC] border border-[#F26A12]/30 px-3 py-1 text-xs font-extrabold text-[#C2530A]">
              {pendingCount} menunggu penilaian
            </span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="p-10 text-center space-y-2.5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] text-zinc-400">
              <LandingIcon name="FileText" size={22} color="currentColor" />
            </div>
            <p className="m-0 text-sm font-extrabold text-[#0B2559]">
              Belum ada peserta yang mengumpulkan ujian
            </p>
            <p className="m-0 text-xs text-zinc-500 max-w-md mx-auto leading-relaxed">
              Siswa yang menyelesaikan ujian CBT interaktif akan otomatis tampil di daftar ini
              lengkap dengan skor penilaian otomatisnya.
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Cards (< md) */}
            <div className="md:hidden divide-y divide-[#F0EAE2]">
              {submissions.map((s) => (
                <div key={s.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B2559] to-[#0073F5] text-white font-extrabold text-xs">
                        {s.studentName?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div className="min-w-0">
                        <p className="m-0 font-extrabold text-[#0B2559] text-xs truncate">
                          {s.studentName}
                        </p>
                        <p className="m-0 text-[11px] text-zinc-500 truncate">{s.studentEmail}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border shrink-0 ${
                        s.status === "passed"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : s.status === "failed"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {s.status === "passed"
                        ? "Lulus"
                        : s.status === "failed"
                        ? "Remedial"
                        : "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-[#FBF6F1] border border-[#EFE7DC] p-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                        Dikumpulkan
                      </span>
                      <span className="text-[#0B2559] font-semibold text-[11px] block mt-0.5">
                        {new Date(s.submittedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase text-zinc-400 block">
                        Nilai Akhir
                      </span>
                      {s.finalScore !== null ? (
                        <span className="font-extrabold text-[#0062D1] text-xs block mt-0.5">
                          {s.finalScore} / 100
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic text-[11px] block mt-0.5">
                          Belum Dinilai
                        </span>
                      )}
                    </div>
                  </div>

                  {s.answers?.answerFileUrl && (
                    <a
                      href={s.answers.answerFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      download
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-[#0062D1] font-bold text-xs border border-blue-200 hover:bg-blue-100 transition"
                    >
                      <LandingIcon name="Download" size={13} color="currentColor" />
                      <span className="truncate max-w-[220px]">
                        {s.answers.answerFileName || "Lembar_Jawaban.pdf"}
                      </span>
                    </a>
                  )}

                  <Link
                    href={`/instructor/exams/review?courseId=${courseId}&submissionId=${s.id}`}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
                      s.status === "pending"
                        ? "bg-[#F26A12] hover:bg-[#D65507] text-white shadow-xs"
                        : "bg-[#0B2559] hover:bg-[#133882] text-white"
                    }`}
                  >
                    <span>{s.status === "pending" ? "Beri Nilai Sekarang" : "Lihat / Ubah Nilai"}</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              ))}
            </div>

            {/* Desktop Table (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FBF6F1]/80 border-b border-[#F0EAE2] text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    <th className="py-3.5 pl-6 pr-3">Peserta</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Waktu Kumpul</th>
                    <th className="py-3.5 px-3">Format / Hasil</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-3 whitespace-nowrap">Nilai Akhir</th>
                    <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3ECE4]">
                  {submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#FBF6F1]/45 transition-colors">
                      <td className="py-3.5 pl-6 pr-3">
                        <p className="m-0 font-extrabold text-[#0B2559]">{s.studentName}</p>
                        <p className="m-0 text-[11px] text-zinc-500">{s.studentEmail}</p>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-600 whitespace-nowrap">
                        {new Date(s.submittedAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-3">
                        {s.answers?.cbtResults ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-[11px] font-bold text-[#0062D1]">
                            <span>CBT Auto</span>
                            <span className="text-blue-300">&bull;</span>
                            <span>
                              T:{s.answers.cbtResults.readingScore ?? s.readingScore ?? 0}% / S:
                              {s.answers.cbtResults.speakingScore ?? s.speakingScore ?? 0}%
                            </span>
                          </span>
                        ) : s.answers?.answerFileUrl ? (
                          <a
                            href={s.answers.answerFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-bold text-[#0062D1] hover:bg-blue-100 transition"
                          >
                            <LandingIcon name="Download" size={12} color="currentColor" />
                            <span className="truncate max-w-[150px]">
                              {s.answers.answerFileName || "Lembar_Jawaban.pdf"}
                            </span>
                          </a>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">
                            Tanpa lampiran
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold border ${
                            s.status === "passed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : s.status === "failed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {s.status === "passed"
                            ? "Lulus"
                            : s.status === "failed"
                            ? "Remedial"
                            : "Menunggu"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold whitespace-nowrap">
                        {s.finalScore !== null ? (
                          <span className="text-[#0B2559] text-sm">{s.finalScore} / 100</span>
                        ) : (
                          <span className="text-zinc-400 font-medium italic text-[11px]">
                            Belum Dinilai
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                        <Link
                          href={`/instructor/exams/review?courseId=${courseId}&submissionId=${s.id}`}
                          className={`inline-flex items-center gap-1 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                            s.status === "pending"
                              ? "bg-[#F26A12] hover:bg-[#D65507] text-white shadow-xs"
                              : "border border-[#E6DED4] bg-white hover:bg-[#FBF6F1] text-[#0B2559]"
                          }`}
                        >
                          <span>{s.status === "pending" ? "Nilai →" : "Edit Nilai →"}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
