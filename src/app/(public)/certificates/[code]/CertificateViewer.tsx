"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";

export interface CertificateData {
  id: number;
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  instructorSignatureUrl?: string | null;
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

  const cleanStudent = certificate.studentName.replace(/[/\\?%*:|"<>]/g, "").trim();
  const cleanCourse = certificate.courseTitle.replace(/[/\\?%*:|"<>]/g, "").trim();

  // Synchronize document.title with active view so browser PDF download uses distinct file names
  useEffect(() => {
    if (view === "certificate") {
      document.title = `Sertifikat - ${cleanStudent} - ${cleanCourse}`;
    } else {
      document.title = `Rapor Nilai - ${cleanStudent} - ${cleanCourse}`;
    }
  }, [view, cleanStudent, cleanCourse]);

  function handlePrint(targetView: "certificate" | "report") {
    const targetTitle =
      targetView === "certificate"
        ? `Sertifikat - ${cleanStudent} - ${cleanCourse}`
        : `Rapor Nilai - ${cleanStudent} - ${cleanCourse}`;
    document.title = targetTitle;

    if (view !== targetView) {
      setView(targetView);
      setTimeout(() => {
        window.print();
      }, 150);
    } else {
      window.print();
    }
  }

  const formattedDate = new Date(certificate.issuedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedDateEn = new Date(certificate.issuedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="certificate-page-root min-h-screen bg-slate-950 py-8 px-3 sm:px-6 print:min-h-0 print:bg-white print:p-0 print:m-0">
      {/* Top Action Bar (Hidden when printing) */}
      <div className="print:hidden mx-auto max-w-5xl mb-8 flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-2xl backdrop-blur-md shadow-2xl text-white">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            title="Kembali ke Dashboard"
          >
            <LandingIcon name="ChevronLeft" size={20} color="currentColor" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Akreditasi Resmi FluencyHub
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Serial ID: <strong className="text-slate-200">{certificate.certificateCode}</strong>
            </p>
          </div>
        </div>

        {/* View Switcher & Print Button */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setView("certificate");
                document.title = `Sertifikat - ${cleanStudent} - ${cleanCourse}`;
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === "certificate"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sertifikat Kehormatan (Landscape)
            </button>
            <button
              type="button"
              onClick={() => {
                setView("report");
                document.title = `Rapor Nilai - ${cleanStudent} - ${cleanCourse}`;
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                view === "report"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Transkrip Rapor (Portrait A4)
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePrint(view)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer active:scale-95"
            title={view === "certificate" ? "Unduh Sertifikat PDF Resmi" : "Unduh Rapor Nilai PDF"}
          >
            <LandingIcon name="Download" size={16} color="white" />
            <span>{view === "certificate" ? "Unduh Sertifikat (PDF)" : "Unduh Rapor (PDF)"}</span>
          </button>
        </div>
      </div>

      {/* VIEW A: LANDSCAPE CERTIFICATE (LUXURY EDITION) */}
      {view === "certificate" && (
        <div className="mx-auto flex justify-center overflow-x-auto pb-12 print:p-0 print:m-0 print:overflow-visible">
          <div className="certificate-container scale-[0.62] sm:scale-[0.8] md:scale-[0.92] lg:scale-100 origin-top print:scale-100 print:m-0 print:shadow-none transition-all">
            <div className="certificate-landscape-card relative w-[1100px] h-[770px] bg-[#fbf9f5] text-slate-900 shadow-2xl flex flex-col items-center justify-between p-10 overflow-hidden rounded-sm print:rounded-none border border-amber-900/20 print:border-none print:shadow-none">
              
              {/* ================= BACKGROUND GUILLOCHE & SECURITY PATTERNS ================= */}
              {/* Guilloche Fine Wavy Security Waves */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.035]"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
              >
                <defs>
                  <pattern id="guillochePattern" width="60" height="60" patternUnits="userSpaceOnUse">
                    <circle cx="30" cy="30" r="28" fill="none" stroke="#0f172a" strokeWidth="0.75" />
                    <circle cx="30" cy="30" r="20" fill="none" stroke="#d4af37" strokeWidth="0.75" />
                    <circle cx="30" cy="30" r="12" fill="none" stroke="#0f172a" strokeWidth="0.5" />
                    <path d="M 0 30 Q 15 10 30 30 T 60 30" fill="none" stroke="#b8860b" strokeWidth="0.5" />
                    <path d="M 30 0 Q 10 15 30 30 T 30 60" fill="none" stroke="#b8860b" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#guillochePattern)" />
              </svg>

              {/* Central Security Rosette Watermark */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.045] flex items-center justify-center select-none">
                <svg width="520" height="520" viewBox="0 0 200 200" className="text-slate-900">
                  <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
                  <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="100" cy="100" r="76" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <path
                    d="M100,10 L108,30 L128,30 L112,42 L118,62 L100,50 L82,62 L88,42 L72,30 L92,30 Z"
                    fill="currentColor"
                  />
                  <g transform="translate(100,100)">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <ellipse
                        key={i}
                        cx="0"
                        cy="45"
                        rx="14"
                        ry="42"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="0.6"
                        transform={`rotate(${i * 15})`}
                      />
                    ))}
                  </g>
                  <text
                    x="100"
                    y="105"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="currentColor"
                    letterSpacing="4"
                  >
                    FLUENCYHUB ACADEMY
                  </text>
                </svg>
              </div>

              {/* ================= LUXURY MULTI-LAYERED BORDERS ================= */}
              {/* Outer Deep Navy Border */}
              <div className="absolute inset-4 border-[3px] border-[#0e172a] pointer-events-none" />
              {/* Thin Inner Inset */}
              <div className="absolute inset-5 border border-[#0e172a]/30 pointer-events-none" />
              {/* Primary Metallic Gold Filigree Border */}
              <div className="absolute inset-7 border-[2px] border-[#c29837] pointer-events-none" />
              {/* Inner Dotted Security Line */}
              <div className="absolute inset-9 border border-dashed border-[#b8860b]/40 pointer-events-none" />

              {/* ================= ORNATE CORNER FLOURISHES ================= */}
              {/* Top-Left Corner */}
              <div className="absolute top-4 left-4 w-28 h-28 pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#c29837]">
                  <path d="M 0 0 L 100 0 C 40 5 15 40 0 100 Z" fill="#0e172a" />
                  <path d="M 6 6 L 90 6 C 35 12 12 35 6 90 Z" fill="none" stroke="#e6c46e" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="5" fill="#e6c46e" />
                  <circle cx="20" cy="20" r="2.5" fill="#0e172a" />
                  <path d="M 12 40 Q 24 24 40 12" fill="none" stroke="#e6c46e" strokeWidth="1" />
                </svg>
              </div>

              {/* Top-Right Corner */}
              <div className="absolute top-4 right-4 w-28 h-28 pointer-events-none rotate-90">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#c29837]">
                  <path d="M 0 0 L 100 0 C 40 5 15 40 0 100 Z" fill="#0e172a" />
                  <path d="M 6 6 L 90 6 C 35 12 12 35 6 90 Z" fill="none" stroke="#e6c46e" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="5" fill="#e6c46e" />
                  <circle cx="20" cy="20" r="2.5" fill="#0e172a" />
                  <path d="M 12 40 Q 24 24 40 12" fill="none" stroke="#e6c46e" strokeWidth="1" />
                </svg>
              </div>

              {/* Bottom-Left Corner */}
              <div className="absolute bottom-4 left-4 w-28 h-28 pointer-events-none -rotate-90">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#c29837]">
                  <path d="M 0 0 L 100 0 C 40 5 15 40 0 100 Z" fill="#0e172a" />
                  <path d="M 6 6 L 90 6 C 35 12 12 35 6 90 Z" fill="none" stroke="#e6c46e" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="5" fill="#e6c46e" />
                  <circle cx="20" cy="20" r="2.5" fill="#0e172a" />
                  <path d="M 12 40 Q 24 24 40 12" fill="none" stroke="#e6c46e" strokeWidth="1" />
                </svg>
              </div>

              {/* Bottom-Right Corner */}
              <div className="absolute bottom-4 right-4 w-28 h-28 pointer-events-none rotate-180">
                <svg viewBox="0 0 100 100" className="w-full h-full text-[#c29837]">
                  <path d="M 0 0 L 100 0 C 40 5 15 40 0 100 Z" fill="#0e172a" />
                  <path d="M 6 6 L 90 6 C 35 12 12 35 6 90 Z" fill="none" stroke="#e6c46e" strokeWidth="1.5" />
                  <circle cx="20" cy="20" r="5" fill="#e6c46e" />
                  <circle cx="20" cy="20" r="2.5" fill="#0e172a" />
                  <path d="M 12 40 Q 24 24 40 12" fill="none" stroke="#e6c46e" strokeWidth="1" />
                </svg>
              </div>

              {/* ================= CERTIFICATE HEADER ================= */}
              <div className="relative z-10 flex flex-col items-center text-center mt-3">
                {/* Official Crest Badge */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-[#f59e0b] shadow-md border-2 border-[#d4af37]">
                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-[13px] font-black tracking-[0.28em] text-[#0f172a] uppercase font-serif">
                      FluencyHub Academy
                    </span>
                    <span className="block text-[9px] font-bold tracking-[0.2em] text-[#b8860b] uppercase">
                      Institute of English Proficiency & Global Communication
                    </span>
                  </div>
                </div>

                {/* Main Heading */}
                <h1 className="text-[34px] font-extrabold tracking-[0.18em] text-[#0f172a] uppercase font-serif mt-2">
                  Certificate of Achievement
                </h1>

                {/* Subtitle with Ornamental Dividers */}
                <div className="mt-1 flex items-center justify-center gap-3">
                  <div className="h-[1.5px] w-20 bg-gradient-to-r from-transparent via-[#c29837] to-[#c29837]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#9a7415]">
                    ★ Duly Accredited Academic Credential ★
                  </span>
                  <div className="h-[1.5px] w-20 bg-gradient-to-l from-transparent via-[#c29837] to-[#c29837]" />
                </div>
              </div>

              {/* ================= RECIPIENT & COURSE SECTION ================= */}
              <div className="relative z-10 flex flex-col items-center text-center my-auto py-1 max-w-3xl">
                <p className="text-[11px] font-serif italic text-slate-600 tracking-wide mb-1">
                  This credential is proudly awarded and presented in recognition of distinguished merit to:
                </p>

                {/* Student Name */}
                <div className="relative py-1 px-8">
                  <h2 className="text-4xl sm:text-[46px] font-serif font-black text-[#0a1128] tracking-tight border-b-[2.5px] border-[#c29837] pb-2 px-10">
                    {certificate.studentName}
                  </h2>
                </div>

                {/* Body Text */}
                <p className="text-[12px] text-slate-700 max-w-2xl mt-3 leading-relaxed font-sans">
                  for successfully satisfying all academic requirements, comprehensive modular assessments, and demonstrating professional mastery in fluent English communication for the accredited course:
                </p>

                {/* Course Title Badge Banner */}
                <div className="mt-3 px-6 py-1.5 rounded-full bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 border border-[#e5c058]/80 text-[#fbf9f5] shadow-md flex items-center gap-2.5">
                  <span className="text-[#f59e0b] text-xs">✦</span>
                  <h3 className="text-lg sm:text-xl font-extrabold tracking-wide font-serif text-white uppercase">
                    {certificate.courseTitle}
                  </h3>
                  <span className="text-[#f59e0b] text-xs">✦</span>
                </div>

                <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
                  <span>Cumulative Score: <strong className="text-slate-900">{certificate.finalScore}/100</strong></span>
                  <span>•</span>
                  <span>Honors Classification: <strong className="text-blue-900 font-bold">Grade {certificate.grade}</strong></span>
                </div>
              </div>

              {/* ================= FOOTER: SIGNATURES, SEAL & QR ================= */}
              <div className="relative z-10 w-full flex items-end justify-between px-8 pb-3">
                
                {/* 1. Lead Instructor Signature */}
                <div className="flex flex-col items-center text-center min-w-[220px]">
                  <div className="h-16 flex items-end justify-center mb-1">
                    {certificate.instructorSignatureUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={certificate.instructorSignatureUrl}
                        alt="Tanda Tangan Instruktur"
                        className="max-h-16 max-w-[200px] object-contain filter drop-shadow-sm select-none"
                      />
                    ) : (
                      /* Fallback elegant cursive script signature */
                      <div className="font-serif italic text-2xl text-slate-800 font-bold tracking-tight select-none pb-1">
                        {certificate.instructorName}
                      </div>
                    )}
                  </div>
                  <div className="h-[1.5px] w-52 bg-[#0e172a] mb-1" />
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    {certificate.instructorName}
                  </span>
                  <span className="text-[10px] font-semibold text-[#b8860b] uppercase tracking-wider">
                    Lead Course Instructor
                  </span>
                </div>

                {/* 2. Official 3D Embossed Gold Seal with Hanging Ribbons */}
                <div className="relative flex flex-col items-center justify-center -mb-2">
                  {/* Seal Ribbons */}
                  <div className="absolute top-12 flex gap-1 pointer-events-none">
                    {/* Left Ribbon Tail (Navy) */}
                    <div
                      className="w-4 h-12 bg-[#0e172a] shadow-md -rotate-6"
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)" }}
                    />
                    {/* Right Ribbon Tail (Gold) */}
                    <div
                      className="w-4 h-12 bg-[#c29837] shadow-md rotate-6"
                      style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)" }}
                    />
                  </div>

                  {/* Circular Embossed Medal */}
                  <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-[#9a7415] via-[#f7e089] to-[#d4af37] text-slate-950 font-black text-center shadow-xl border-[3px] border-[#fffefc] ring-2 ring-[#c29837]">
                    <div className="flex h-[82px] w-[82px] items-center justify-center rounded-full border border-dashed border-[#805d09] bg-gradient-to-b from-[#f3db7a] to-[#d4af37] p-1 shadow-inner">
                      <div className="text-[9px] leading-tight font-black uppercase tracking-tighter text-[#4a3504]">
                        <span className="text-[8px] tracking-widest block font-bold text-[#6d4d03]">SEAL OF</span>
                        <span className="text-sm font-black text-[#2e1d00] block my-0.5">EXCELLENCE</span>
                        <span className="text-[8px] font-extrabold tracking-wider block text-[#503b07]">FLUENCYHUB</span>
                      </div>
                    </div>
                  </div>

                  <span className="relative z-10 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mt-1">
                    VERIFIED • GRADE {certificate.grade}
                  </span>
                </div>

                {/* 3. Official FluencyHub Digital Signature (Verified QR Code) */}
                <div className="flex flex-col items-center text-center min-w-[220px]">
                  <div className="h-16 flex items-end justify-center mb-1">
                    <div className="p-0.5 bg-white rounded-lg border border-slate-300 shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={certificate.qrDataUrl}
                        alt="Official QR Digital Signature"
                        className="h-14 w-14 object-contain select-none"
                      />
                    </div>
                  </div>
                  <div className="h-[1.5px] w-52 bg-[#0e172a] mb-1" />
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    FluencyHub Academic Board
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold text-[#b8860b] uppercase tracking-wider">
                      Certified Digital Signature
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[9px] font-mono text-slate-500">
                      {certificate.certificateCode}
                    </span>
                  </div>
                  <span className="text-[9px] text-slate-400 font-medium">
                    Issued: {formattedDateEn}
                  </span>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* VIEW B: PORTRAIT A4 SCORE REPORT (RAPOR NILAI MAHASISWA RESMI) */}
      {view === "report" && (
        <div className="mx-auto flex justify-center pb-12 print:p-0 print:m-0">
          <div className="report-portrait-card w-[820px] min-h-[1140px] bg-white text-slate-900 shadow-2xl p-12 flex flex-col justify-between border border-slate-200 print:shadow-none print:m-0 print:border-none">
            <div>
              {/* Report Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-[#f59e0b] font-black text-xl border-2 border-[#d4af37]">
                    FH
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight font-serif uppercase">
                      FluencyHub Academy
                    </h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                      Official Student Competency & Transcript Report
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Transkrip Penilaian Kompetensi Standar Kerangka Kerja CEFR / TOEFL Equivalent
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <p><strong>No. Sertifikat:</strong> <span className="text-slate-900 font-bold">{certificate.certificateCode}</span></p>
                  <p><strong>Tanggal Terbit:</strong> {formattedDate}</p>
                  <p><strong>Status Kelulusan:</strong> <span className="text-emerald-700 font-bold">LULUS (PASSED)</span></p>
                </div>
              </div>

              {/* Student Metadata Table */}
              <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/30 border border-slate-200 p-6 mb-8">
                <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5 uppercase tracking-wider text-[10px]">
                      Nama Siswa / Candidate Name
                    </span>
                    <span className="text-base font-extrabold text-slate-900 block font-serif">
                      {certificate.studentName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5 uppercase tracking-wider text-[10px]">
                      Program Kursus / Course Enrolled
                    </span>
                    <span className="text-base font-extrabold text-blue-900 block font-serif">
                      {certificate.courseTitle}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5 uppercase tracking-wider text-[10px]">
                      Lead Course Instructor
                    </span>
                    <span className="text-xs font-bold text-slate-800 block">
                      {certificate.instructorName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold mb-0.5 uppercase tracking-wider text-[10px]">
                      Predikat & Nilai Akhir
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
                      Grade {certificate.grade} ({certificate.finalScore} / 100)
                    </span>
                  </div>
                </div>
              </div>

              {/* Skills Score Table */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Rincian Penilaian Kompetensi Terpadu (4 Skill Areas)
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">Passing Standard: Minimum 70/100</span>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-extrabold text-left">
                      <th className="border border-slate-300 p-3.5">Area Kompetensi (Competency Domain)</th>
                      <th className="border border-slate-300 p-3.5">Metodologi & Parameter Penilaian</th>
                      <th className="border border-slate-300 p-3.5 text-center">Bobot</th>
                      <th className="border border-slate-300 p-3.5 text-center">Nilai (0-100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-3.5 font-bold text-slate-900">
                        1. Reading Comprehension
                      </td>
                      <td className="border border-slate-300 p-3.5 text-slate-600">
                        Pemahaman teks profesional, analisis konteks bisnis, & sintesis literatur
                      </td>
                      <td className="border border-slate-300 p-3.5 text-center font-mono">25%</td>
                      <td className="border border-slate-300 p-3.5 text-center font-bold text-slate-900 text-sm">
                        {certificate.readingScore ?? 85}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="border border-slate-300 p-3.5 font-bold text-slate-900">
                        2. Listening Comprehension
                      </td>
                      <td className="border border-slate-300 p-3.5 text-slate-600">
                        Pemahaman audio rapat kerja, instruksi operasional, & percakapan aksen global
                      </td>
                      <td className="border border-slate-300 p-3.5 text-center font-mono">25%</td>
                      <td className="border border-slate-300 p-3.5 text-center font-bold text-slate-900 text-sm">
                        {certificate.listeningScore ?? 85}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-3.5 font-bold text-slate-900">
                        3. Writing & Grammar Mastery
                      </td>
                      <td className="border border-slate-300 p-3.5 text-slate-600">
                        Koherensi esai, sintaksis formal, ketepatan diksi bisnis, & tata bahasa
                      </td>
                      <td className="border border-slate-300 p-3.5 text-center font-mono">25%</td>
                      <td className="border border-slate-300 p-3.5 text-center font-bold text-slate-900 text-sm">
                        {certificate.writingScore ?? 88}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/60">
                      <td className="border border-slate-300 p-3.5 font-bold text-slate-900">
                        4. Speaking & Articulation
                      </td>
                      <td className="border border-slate-300 p-3.5 text-slate-600">
                        Kelancaran presentasi lisan, ketepatan intonasi, artikulasi, dan kejelasan ide
                      </td>
                      <td className="border border-slate-300 p-3.5 text-center font-mono">25%</td>
                      <td className="border border-slate-300 p-3.5 text-center font-bold text-slate-900 text-sm">
                        {certificate.speakingScore ?? 90}
                      </td>
                    </tr>
                    <tr className="bg-gradient-to-r from-blue-50 to-indigo-50 font-bold text-slate-900">
                      <td colSpan={3} className="border border-slate-300 p-3.5 text-right uppercase tracking-wider text-xs">
                        Nilai Kumulatif Akhir (Cumulative Final Score)
                      </td>
                      <td className="border border-slate-300 p-3.5 text-center text-base font-black text-blue-900">
                        {certificate.finalScore} / 100
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Grading Scale Explanation */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-900 block mb-1 uppercase tracking-wider text-[10px]">
                  Skala Penilaian Akademik FluencyHub:
                </span>
                <p>&bull; <strong>Grade A (90 - 100):</strong> Sangat Baik / Advanced Professional Proficiency (Distinction)</p>
                <p>&bull; <strong>Grade B+ / B (70 - 89):</strong> Baik / Competent Working Proficiency (Passing Grade: 70)</p>
                <p>&bull; <strong>Grade C / D (&lt; 70):</strong> Belum Memenuhi Kriteria Kelulusan Minimal</p>
              </div>
            </div>

            {/* Report Footer with Signatures & QR */}
            <div className="border-t-2 border-slate-900 pt-6 mt-8 flex items-end justify-between">
              {/* Instructor Sign */}
              <div className="flex flex-col items-center text-center min-w-[180px]">
                <div className="h-14 flex items-end justify-center mb-1">
                  {certificate.instructorSignatureUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={certificate.instructorSignatureUrl}
                      alt="Tanda Tangan Instruktur"
                      className="max-h-14 max-w-[170px] object-contain filter drop-shadow-sm select-none"
                    />
                  ) : (
                    <div className="font-serif italic text-lg text-slate-800 font-bold tracking-tight select-none pb-1">
                      {certificate.instructorName}
                    </div>
                  )}
                </div>
                <div className="h-[1px] w-44 bg-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-900">{certificate.instructorName}</span>
                <span className="text-[10px] text-slate-500 font-semibold">Lead Course Instructor</span>
              </div>

              {/* Committee Stamp */}
              <div className="text-center px-4">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full border border-blue-900 bg-blue-50 text-blue-900 mb-1">
                  <span className="text-[10px] font-black tracking-tighter">VERIFIED</span>
                </div>
                <p className="text-[11px] font-bold text-slate-900">FluencyHub Academic Board</p>
                <p className="text-[10px] text-slate-500">Divisi Penjaminan Mutu & Sertifikasi</p>
              </div>

              {/* QR Verification */}
              <div className="flex flex-col items-center text-center min-w-[180px]">
                <div className="h-14 flex items-end justify-center mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={certificate.qrDataUrl}
                    alt="Digital Signature QR Verification"
                    className="h-14 w-14 border border-slate-300 p-0.5 rounded shadow-xs bg-white"
                  />
                </div>
                <div className="h-[1px] w-44 bg-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-900">Certified Digital Signature</span>
                <span className="text-[10px] text-slate-500 font-semibold">{certificate.certificateCode}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Exact Print Formatting */}
      <style>{`
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
            padding: 30px 42px !important;
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
            background-color: #fbf9f5 !important;
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
