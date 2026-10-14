"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";

interface CertificateData {
  id: number;
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  finalScore: number;
  grade: string;
  readingScore: number | null;
  listeningScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  issuedAt: string;
  qrDataUrl: string;
}

export function CertificateViewer({
  certificate,
  initialView = "certificate",
}: {
  certificate: CertificateData;
  initialView?: "certificate" | "report";
}) {
  const [view, setView] = useState<"certificate" | "report">(initialView);

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="certificate-page-root min-h-screen bg-slate-900 py-6 px-3 sm:px-6 print:min-h-0 print:bg-white print:p-0 print:m-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden mx-auto max-w-5xl mb-6 flex flex-wrap items-center justify-between gap-4 bg-slate-800/90 border border-slate-700 p-4 rounded-2xl backdrop-blur-md shadow-xl text-white">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
          >
            <LandingIcon name="ChevronLeft" size={20} color="currentColor" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Terverifikasi Resmi
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{certificate.certificateCode}</p>
          </div>
        </div>

        {/* View Switcher & Print Button */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setView("certificate")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                view === "certificate"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sertifikat (Landscape)
            </button>
            <button
              type="button"
              onClick={() => setView("report")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                view === "report"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Rapor Nilai (Portrait)
            </button>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-lg transition"
          >
            <LandingIcon name="Download" size={16} color="white" />
            Cetak / Download PDF
          </button>
        </div>
      </div>

      {/* VIEW A: LANDSCAPE CERTIFICATE */}
      {view === "certificate" && (
        <div className="mx-auto flex justify-center overflow-x-auto pb-8 print:p-0 print:m-0 print:overflow-visible">
          <div className="certificate-container scale-[0.7] sm:scale-[0.85] md:scale-100 origin-top print:scale-100 print:m-0 print:shadow-none">
            <div className="certificate-landscape-card relative w-[1056px] h-[740px] bg-white text-slate-900 shadow-2xl flex flex-col items-center justify-between p-12 overflow-hidden border border-slate-200 print:border-none print:shadow-none">
              {/* Outer Decorative Borders */}
              <div className="absolute inset-4 border-2 border-slate-900 pointer-events-none" />
              <div className="absolute inset-6 border border-[#d4af37] pointer-events-none" />
              <div className="absolute inset-7 border border-slate-200 pointer-events-none" />

              {/* Corner Ornaments */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-slate-950 clip-tl pointer-events-none" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-950 clip-tr pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-slate-950 clip-bl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-slate-950 clip-br pointer-events-none" />

              {/* Certificate Header */}
              <div className="relative z-10 flex flex-col items-center text-center mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-extrabold text-sm">
                    FH
                  </div>
                  <span className="text-sm font-extrabold tracking-widest text-slate-900 uppercase">
                    FluencyHub Academy
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-[0.2em] text-slate-900 uppercase font-[family-name:var(--font-heading)]">
                  Certificate of Completion
                </h1>
                <div className="mt-1 flex items-center gap-3">
                  <div className="h-[1px] w-16 bg-[#d4af37]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#b8860b]">
                    Official Credential
                  </span>
                  <div className="h-[1px] w-16 bg-[#d4af37]" />
                </div>
              </div>

              {/* Recipient Section */}
              <div className="relative z-10 flex flex-col items-center text-center my-auto py-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  This is proudly presented to
                </p>
                <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-heading)] border-b-2 border-slate-900 pb-2 px-12">
                  {certificate.studentName}
                </h2>
                <p className="text-xs text-slate-600 max-w-xl mt-4 leading-relaxed">
                  for successfully completing the comprehensive English proficiency evaluation and demonstrating mastery in professional communication for the accredited course:
                </p>
                <h3 className="text-xl md:text-2xl font-extrabold text-blue-700 mt-2 font-[family-name:var(--font-heading)]">
                  {certificate.courseTitle}
                </h3>
              </div>

              {/* Footer Section: Signatures & QR Code */}
              <div className="relative z-10 w-full flex items-end justify-between px-10 pb-2">
                {/* Instructor Signature */}
                <div className="flex flex-col items-center text-center min-w-[200px]">
                  <div className="font-serif italic text-2xl text-slate-800 font-bold mb-1">
                    {certificate.instructorName}
                  </div>
                  <div className="h-[1.5px] w-48 bg-slate-400 mb-1" />
                  <span className="text-xs font-bold text-slate-900">Lead Course Instructor</span>
                  <span className="text-[10px] text-slate-500">FluencyHub English Program</span>
                </div>

                {/* Gold Seal / Badge */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#f6e05e] via-[#d4af37] to-[#aa7c11] text-slate-950 font-black text-center shadow-lg border-2 border-white">
                    <div className="text-[10px] leading-tight font-extrabold uppercase tracking-tighter">
                      Certified
                      <br />
                      <span className="text-sm font-black">{certificate.grade}</span>
                      <br />
                      Valid
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 mt-1">Grade: {certificate.grade}</span>
                </div>

                {/* QR Code & Code */}
                <div className="flex flex-col items-center text-center min-w-[200px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={certificate.qrDataUrl}
                    alt="Validation QR"
                    className="h-16 w-16 rounded border border-slate-300 p-0.5 bg-white shadow-xs"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-700 mt-1">
                    {certificate.certificateCode}
                  </span>
                  <span className="text-[10px] text-slate-500">Issued: {formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW B: PORTRAIT A4 SCORE REPORT (RAPOR NILAI) */}
      {view === "report" && (
        <div className="mx-auto flex justify-center pb-8 print:p-0 print:m-0">
          <div className="report-portrait-card w-[794px] min-h-[1123px] bg-white text-slate-900 shadow-2xl p-12 flex flex-col justify-between border border-slate-200 print:shadow-none print:m-0 print:border-none">
            <div>
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-extrabold text-sm">
                      FH
                    </div>
                    <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                      FluencyHub
                    </span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 uppercase font-[family-name:var(--font-heading)]">
                    Official Student Score Report
                  </h1>
                  <p className="text-xs text-slate-500">
                    Transkrip Nilai Kecakapan Bahasa Inggris Resmi
                  </p>
                </div>

                <div className="text-right font-mono text-xs text-slate-500 space-y-1">
                  <p><strong>No. Seri:</strong> {certificate.certificateCode}</p>
                  <p><strong>Tanggal Terbit:</strong> {formattedDate}</p>
                  <p><strong>Status:</strong> <span className="text-emerald-700 font-bold">LULUS (PASSED)</span></p>
                </div>
              </div>

              {/* Student Metadata Table */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 mb-8">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Nama Siswa / Candidate:</span>
                    <span className="text-sm font-bold text-slate-900 block">{certificate.studentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Program Kursus / Course:</span>
                    <span className="text-sm font-bold text-slate-900 block">{certificate.courseTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Instruktur Penguji:</span>
                    <span className="text-xs font-bold text-slate-800 block">{certificate.instructorName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5">Predikat Kelulusan:</span>
                    <span className="text-xs font-bold text-emerald-600 block">Grade {certificate.grade} (Lulus)</span>
                  </div>
                </div>
              </div>

              {/* Skills Score Table */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Rincian Penilaian Kompetensi (Skill Breakdown)
                </h3>
                <table className="w-full border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold text-left">
                      <th className="border border-slate-200 p-3">Kompetensi (Skill Area)</th>
                      <th className="border border-slate-200 p-3">Bentuk Penilaian</th>
                      <th className="border border-slate-200 p-3 text-center">Bobot</th>
                      <th className="border border-slate-200 p-3 text-center">Nilai (0-100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold text-slate-900">Reading Comprehension</td>
                      <td className="border border-slate-200 p-3 text-slate-600">Pemahaman teks bacaan profesional & analisis konteks bisnis</td>
                      <td className="border border-slate-200 p-3 text-center font-mono">25%</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-900">{certificate.readingScore ?? 85}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="border border-slate-200 p-3 font-bold text-slate-900">Listening Comprehension</td>
                      <td className="border border-slate-200 p-3 text-slate-600">Pemahaman audio percakapan meeting & instruksi kerja internasional</td>
                      <td className="border border-slate-200 p-3 text-center font-mono">25%</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-900">{certificate.listeningScore ?? 85}</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-200 p-3 font-bold text-slate-900">Writing & Grammar</td>
                      <td className="border border-slate-200 p-3 text-slate-600">Struktur kalimat, tata bahasa kerja, dan ketepatan kosakata</td>
                      <td className="border border-slate-200 p-3 text-center font-mono">25%</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-900">{certificate.writingScore ?? 88}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="border border-slate-200 p-3 font-bold text-slate-900">Speaking & Delivery</td>
                      <td className="border border-slate-200 p-3 text-slate-600">Penilaian rekaman video: artikulasi, kelancaran, dan kejelasan intonasi</td>
                      <td className="border border-slate-200 p-3 text-center font-mono">25%</td>
                      <td className="border border-slate-200 p-3 text-center font-bold text-slate-900">{certificate.speakingScore ?? 90}</td>
                    </tr>
                    <tr className="bg-blue-50/80 font-bold text-slate-900">
                      <td colSpan={3} className="border border-slate-200 p-3 text-right uppercase tracking-wider">
                        Nilai Kumulatif Akhir (Total Score)
                      </td>
                      <td className="border border-slate-200 p-3 text-center text-sm font-extrabold text-blue-700">
                        {certificate.finalScore} / 100
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Grading Scale Explanation */}
              <div className="rounded-xl border border-slate-200 p-4 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block mb-1">Skala Penilaian FluencyHub:</span>
                <p>&bull; <strong>Grade A (90 - 100):</strong> Sangat Baik / Advanced Professional Proficiency</p>
                <p>&bull; <strong>Grade B+ / B (70 - 89):</strong> Baik / Competent Working Proficiency (Passing Grade: 70)</p>
                <p>&bull; <strong>Grade C / D (&lt; 70):</strong> Perlu Pendalaman Materi / Limited Working Proficiency</p>
              </div>
            </div>

            {/* Report Footer */}
            <div className="border-t-2 border-slate-200 pt-6 mt-12 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">FluencyHub Academic Committee</p>
                <p className="text-[10px] text-slate-500">Sistem Evaluasi Terakreditasi Standar Industri</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={certificate.qrDataUrl}
                alt="QR Code Verification"
                className="h-16 w-16 border border-slate-300 p-0.5 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Corner Clips and Print Styles */}
      <style>{`
        .clip-tl { clip-path: polygon(0 0, 100% 0, 0 100%); }
        .clip-tr { clip-path: polygon(0 0, 100% 100%, 100% 0); }
        .clip-bl { clip-path: polygon(0 0, 100% 100%, 0 100%); }
        .clip-br { clip-path: polygon(100% 0, 100% 100%, 0 100%); }

        @page {
          size: ${view === "certificate" ? "A4 landscape" : "A4 portrait"};
          margin: 0mm;
        }

        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .certificate-page-root {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            min-height: auto !important;
            height: auto !important;
          }

          .certificate-container {
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
          }

          .certificate-landscape-card {
            width: 297mm !important;
            height: 209mm !important;
            max-width: 297mm !important;
            max-height: 209mm !important;
            margin: 0 auto !important;
            padding: 38px 46px !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            box-shadow: none !important;
            border: none !important;
            overflow: hidden !important;
          }

          .report-portrait-card {
            width: 210mm !important;
            min-height: 296mm !important;
            max-width: 210mm !important;
            margin: 0 auto !important;
            padding: 40px !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-before: avoid !important;
            break-before: avoid !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
