import type { ProgramGoalSlug } from "@/lib/ready-check/types";
import type { PublishedCourseCard } from "@/types/db";

export interface ProgramTrackOption {
  id: string;
  label: string;
  shortDesc: string;
  preferredSlugs: string[];
  preferredCategoryIds: number[];
  keywords: string[];
  supportVideos: string[];
}

export interface ProgramGoalSpec {
  slug: ProgramGoalSlug;
  eyebrow: string;
  title: string;
  cardDescription: string;
  startFrom: string;
  featured?: boolean;
  cohortEyebrow: string;
  targetLevelLabel: string;
  heroDescription: string;
  stats: {
    duration: string;
    format: string;
    liveRoleplay: string;
    quota: string;
  };
  defaultTrackId: string;
  tracks: ProgramTrackOption[];
  outcomesTitle: string;
  outcomes: string[];
  dimensions: Array<{ label: string; pct: number; accent?: boolean }>;
  syllabusTitle: string;
  syllabus: Array<{
    week: string;
    focus: string;
    liveRoleplay: string;
    measure: string;
    highlight?: boolean;
  }>;
  coachBioFallback: string;
  cohortChecklist: string[];
  pricingNote: string;
}

export const PROGRAM_GOALS: ProgramGoalSpec[] = [
  {
    slug: "ready-to-speak",
    eyebrow: "Speak",
    title: "Ready to Speak",
    cardDescription: "Berani bicara dan lancar di percakapan sehari-hari dan kerja sederhana.",
    startFrom: "Mulai dari: Starter–Warming Up",
    featured: false,
    cohortEyebrow: "Speak · Mandiri + AI & Latihan Harian",
    targetLevelLabel: "Ready to Speak",
    heroDescription:
      "Empat hingga enam minggu membangun refleks bicara tanpa menerjemahkan kata per kata di kepala, lewat latihan terarah 15 menit per hari dan simulasi AI 24/7.",
    stats: {
      duration: "4–6 minggu",
      format: "Self-Paced AI",
      liveRoleplay: "AI 24/7 + Forum",
      quota: "Akses instan",
    },
    defaultTrackId: "daily-habit",
    tracks: [
      {
        id: "daily-habit",
        label: "Daily Habit & AI Partner",
        shortDesc: "Biasakan otak merespons cepat dalam bahasa Inggris untuk percakapan kerja harian.",
        preferredSlugs: ["ready-daily", "ready-coach-1on1", "essential-skills-development"],
        preferredCategoryIds: [2, 3],
        keywords: ["daily", "ai speaking", "essential", "grow"],
        supportVideos: [
          "Berhenti Menerjemahkan Kata per Kata",
          "Small Talk Sebelum Meeting Dimulai",
          "Menyampaikan Update Harian dalam 60 Detik",
          "Pelafalan Jelas Tanpa Menghilangkan Aksen Alami",
        ],
      },
      {
        id: "zero-to-confident",
        label: "Public Speaking Basics",
        shortDesc: "Mengatasi demam panggung dan berbicara lebih runtut di depan tim.",
        preferredSlugs: ["public-speaking-english-zero-confident", "ready-daily"],
        preferredCategoryIds: [3],
        keywords: ["public speaking", "confident", "grow your knowledge"],
        supportVideos: [
          "Teknik Mengatur Napas & Intonasi Saat Gugup",
          "Kerangka 3 Poin Untuk Jawaban Spontan",
          "Mengganti Filler 'Uh / Eee' Menjadi Jeda Elegan",
          "Mempresentasikan Ide Sederhana ke Rekan Kerja",
        ],
      },
    ],
    outcomesTitle: "Setelah 4–6 minggu, kamu bisa",
    outcomes: [
      "Merespons pertanyaan ringan saat check-in atau meeting tanpa freeze lebih dari 3 detik",
      "Membangun kebiasaan bicara bahasa Inggris 10–15 menit setiap hari bersama AI Coach",
      "Memperkenalkan peran kerja dan tanggung jawabmu secara jelas",
      "Menggunakan kalimat transisi yang natural saat masih menyusun ide",
      "Meningkatkan skor kelancaran dan pelafalan terukur lewat Ready Points",
    ],
    dimensions: [
      { label: "Kelancaran & keberanian", pct: 92, accent: true },
      { label: "Pelafalan & kejelasan", pct: 78 },
      { label: "Pemahaman mendengar", pct: 65 },
      { label: "Ketepatan bahasa", pct: 55 },
      { label: "Komunikasi lintas budaya", pct: 45 },
    ],
    syllabusTitle: "Alur 4 minggu pembiasaan bicara",
    syllabus: [
      { week: "0", focus: "Ready Check & target suara", liveRoleplay: "Kalibrasi AI Partner", measure: "Baseline", highlight: true },
      { week: "1", focus: "Membuka suara & daily standup", liveRoleplay: "AI Standup Drill", measure: "Ready Points" },
      { week: "2", focus: "Opini singkat & klarifikasi", liveRoleplay: "AI Q&A Office", measure: "Ready Pulse" },
      { week: "3", focus: "Cerita pengalaman kerja", liveRoleplay: "AI Mini Presentation", measure: "Ready Pulse" },
      { week: "4", focus: "Evaluasi kelancaran mandiri", liveRoleplay: "Simulasi Rapat Tim", measure: "Skor Akhir + Sertifikat", highlight: true },
    ],
    coachBioFallback: "Spesialis pembiasaan refleks bicara & pengurangan kecemasan berbicara untuk penutur Indonesia.",
    cohortChecklist: [
      "AI Speaking Partner 24/7 dengan evaluasi instan",
      "Akses penuh modul video self-paced",
      "Daily speaking challenge & pelacakan Ready Points",
      "Grup komunitas WhatsApp harian",
    ],
    pricingNote: "Aktif seketika via QRIS, transfer bank, atau e-wallet.",
  },
  {
    slug: "ready-for-work",
    eyebrow: "Connect",
    title: "Ready for Work",
    cardDescription:
      "Wawancara, rapat, email, dan presentasi. Jalur: Interview Prep, Business English, STEM.",
    startFrom: "Mulai dari: Ready to Speak",
    featured: true,
    cohortEyebrow: "Connect · Cohort Aktif",
    targetLevelLabel: "Ready to Connect",
    heroDescription:
      "Enam minggu untuk siap wawancara, rapat, email, dan presentasi dalam bahasa Inggris, bersama satu angkatan dan coach yang memahami kebiasaan penutur Indonesia.",
    stats: {
      duration: "6 minggu",
      format: "Hybrid",
      liveRoleplay: "1x / minggu",
      quota: "Maks. 12 peserta",
    },
    defaultTrackId: "interview-prep",
    tracks: [
      {
        id: "interview-prep",
        label: "Interview Prep",
        shortDesc: "Wawancara HRD, user teknis, STAR stories, dan negosiasi tawaran kerja.",
        preferredSlugs: ["cohort-ready-for-work", "ready-coach-1on1", "english-interview-prep-tech"],
        preferredCategoryIds: [5, 2],
        keywords: ["interview", "cohort", "ready for work"],
        supportVideos: [
          "HRD Interview Preparation",
          "User / Hiring Manager Rounds",
          "Behavioral STAR Stories",
          "Offer & Follow-up",
        ],
      },
      {
        id: "business-english",
        label: "Business English",
        shortDesc: "Rapat lintas negara, negosiasi, menyampaikan keberatan dengan sopan, & email bisnis.",
        preferredSlugs: ["business-english-masterclass", "cohort-ready-for-work", "professional-learning-development"],
        preferredCategoryIds: [2, 3],
        keywords: ["business", "negotiation", "meeting", "cohort"],
        supportVideos: [
          "Memimpin & Membuka Rapat Regional",
          "Menyatakan Ketidaksetujuan Secara Diplomatis",
          "Negosiasi Kontrak & Ekspektasi Klien",
          "Email Follow-Up & Ringkasan Keputusan",
        ],
      },
      {
        id: "english-for-stem",
        label: "English for STEM",
        shortDesc: "Menjelaskan arsitektur, data, trade-off teknis, dan riset kepada audiens global.",
        preferredSlugs: ["applied-english-stem-professionals", "cohort-ready-for-work"],
        preferredCategoryIds: [1, 4],
        keywords: ["stem", "technical", "applied", "tech"],
        supportVideos: [
          "Menjelaskan Arsitektur & Trade-off Teknis",
          "Presentasi Data & Metrik ke Non-Teknis",
          "Incident Postmortem & Root-Cause Sync",
          "Code & Design Review Bahasa Inggris",
        ],
      },
    ],
    outcomesTitle: "Setelah 6 minggu, kamu bisa",
    outcomes: [
      "Memperkenalkan diri dalam 90 detik dengan percaya diri",
      "Menjawab pertanyaan perilaku dengan metode STAR tanpa terdengar menghafal",
      "Menyampaikan pendapat dan menolak dengan sopan di rapat",
      "Menulis email follow-up yang jelas dan profesional",
      "Menjelaskan proyekmu ke manajer dari negara lain",
    ],
    dimensions: [
      { label: "Kelancaran & keberanian", pct: 95, accent: true },
      { label: "Komunikasi lintas budaya", pct: 75 },
      { label: "Ketepatan bahasa", pct: 60 },
      { label: "Pelafalan & kejelasan", pct: 50 },
      { label: "Pemahaman mendengar", pct: 40 },
    ],
    syllabusTitle: "Alur 6 minggu",
    syllabus: [
      { week: "0", focus: "Onboarding", liveRoleplay: "Kenalan dengan cohort", measure: "Baseline", highlight: true },
      { week: "1", focus: "Perkenalan diri 90 detik", liveRoleplay: "HRD interview", measure: "Ready Pulse" },
      { week: "2", focus: "Menjelaskan proyek", liveRoleplay: "User interview", measure: "Ready Pulse" },
      { week: "3", focus: "Cerita STAR", liveRoleplay: "Mock panel", measure: "Cek tengah program" },
      { week: "4", focus: "Rapat dan pendapat", liveRoleplay: "Rapat lintas negara", measure: "Ready Pulse" },
      { week: "5", focus: "Email dan negosiasi", liveRoleplay: "Negosiasi tawaran", measure: "Ready Pulse" },
      { week: "6", focus: "Presentasi akhir", liveRoleplay: "Graduation", measure: "Exit + sertifikat", highlight: true },
    ],
    coachBioFallback: "Coach berpengalaman membimbing profesional teknologi & korporasi menghadapi rapat dan wawancara internasional.",
    cohortChecklist: [
      "Tes Baseline dan Exit + Ready Certificate",
      "Ready Pulse mingguan",
      "Grup WhatsApp cohort + English Coffee",
      "Akses perpustakaan video + AI Partner 24/7",
    ],
    pricingNote: "Bayar dengan QRIS, transfer bank, atau e-wallet. Tersedia opsi Cohort & 1-on-1.",
  },
  {
    slug: "ready-to-go",
    eyebrow: "Connect",
    title: "Ready to Go",
    cardDescription: "Persiapan beasiswa, IELTS, dan wawancara studi ke luar negeri.",
    startFrom: "Mulai dari: Ready to Speak",
    featured: false,
    cohortEyebrow: "Connect · Persiapan Studi & Beasiswa",
    targetLevelLabel: "Ready to Connect",
    heroDescription:
      "Program terstruktur 6 minggu untuk pelamar beasiswa (LPDP, Chevening, AAS) dan universitas luar negeri: latih argumen akademik, wawancara panel, dan IELTS Speaking.",
    stats: {
      duration: "6 minggu",
      format: "Online Cohort",
      liveRoleplay: "1–2x / minggu",
      quota: "Maks. 10 peserta",
    },
    defaultTrackId: "scholarship-interview",
    tracks: [
      {
        id: "scholarship-interview",
        label: "Scholarship Interview",
        shortDesc: "Simulasi tanya-jawab panel beasiswa: rencana studi, kontribusi, dan kepemimpinan.",
        preferredSlugs: ["ready-to-go-ielts-track", "english-interview-prep-tech", "cohort-ready-for-work"],
        preferredCategoryIds: [5, 6],
        keywords: ["interview", "scholarship", "academic", "cohort"],
        supportVideos: [
          "Menjawab 'Why This Program & Why You'",
          "Menjelaskan Rencana Kontribusi Pasca Studi",
          "Menghadapi Pertanyaan Kritis Panelis Beasiswa",
          "Mengaitkan Riset dengan Kebutuhan Industri",
        ],
      },
      {
        id: "academic-ielts",
        label: "IELTS & Academic Prep",
        shortDesc: "Struktur argumen IELTS Speaking Part 1–3 serta diskusi riset dan STEM.",
        preferredSlugs: ["ready-to-go-ielts-track", "applied-english-stem-professionals", "public-speaking-english-zero-confident", "ready-daily"],
        preferredCategoryIds: [6, 1, 3],
        keywords: ["academic", "stem", "speaking", "ielts"],
        supportVideos: [
          "IELTS Speaking Part 2: Storytelling 2 Menit",
          "IELTS Part 3: Opini Abstrak & Analisis",
          "Presentasi Proposal Riset & Metodologi",
          "Kosakata Akademik yang Natural & Tidak Kaku",
        ],
      },
    ],
    outcomesTitle: "Setelah 6 minggu, kamu bisa",
    outcomes: [
      "Menjawab pertanyaan wawancara beasiswa dengan alur logis tanpa menghafal skrip kaku",
      "Memaparkan latar belakang riset dan dampak studi dalam bahasa Inggris yang meyakinkan",
      "Meningkatkan koherensi jawaban IELTS Speaking Part 2 dan Part 3",
      "Menyusun esai motivasi dan korespondensi dengan dosen pembimbing luar negeri",
      "Tetap tenang ketika dicecar pertanyaan lanjutan oleh pewawancara",
    ],
    dimensions: [
      { label: "Ketepatan bahasa & struktur", pct: 90, accent: true },
      { label: "Kelancaran & keberanian", pct: 85 },
      { label: "Komunikasi lintas budaya", pct: 70 },
      { label: "Pemahaman mendengar", pct: 70 },
      { label: "Pelafalan & kejelasan", pct: 60 },
    ],
    syllabusTitle: "Alur 6 minggu persiapan studi & beasiswa",
    syllabus: [
      { week: "0", focus: "Diagnostik & target kampus", liveRoleplay: "Audit profil & tujuan", measure: "Baseline", highlight: true },
      { week: "1", focus: "Narasi personal & tujuan studi", liveRoleplay: "1-min Elevator Academic Pitch", measure: "Ready Pulse" },
      { week: "2", focus: "Argumentasi & data riset", liveRoleplay: "Diskusi kasus akademik", measure: "Ready Pulse" },
      { week: "3", focus: "IELTS Speaking Part 2–3 Drill", liveRoleplay: "Simulasi Ex-Examiner style", measure: "Cek tengah program" },
      { week: "4", focus: "Dampak & kepemimpinan", liveRoleplay: "Mock panel beasiswa", measure: "Ready Pulse" },
      { week: "5", focus: "Tanya-jawab spontan & stres tes", liveRoleplay: "Panel Lintas Negara", measure: "Ready Pulse" },
      { week: "6", focus: "Final Mock Interview", liveRoleplay: "Simulasi Panel Penuh", measure: "Exit + sertifikat", highlight: true },
    ],
    coachBioFallback: "Alumni program internasional & mentor persiapan wawancara beasiswa dan studi lanjut luar negeri.",
    cohortChecklist: [
      "Simulasi panel wawancara dengan umpan balik terstruktur",
      "Tes Baseline & Exit untuk mengukur kenaikan skor",
      "Latihan mandiri 24/7 dengan AI Speaking Partner",
      "Akses penuh modul pendukung presentasi & wawancara",
    ],
    pricingNote: "Bayar dengan QRIS, transfer bank, atau e-wallet.",
  },
  {
    slug: "ready-for-the-world",
    eyebrow: "Contribute",
    title: "Ready for the World",
    cardDescription:
      "Komunikasi lintas budaya, menyampaikan pendapat, dan memimpin diskusi global.",
    startFrom: "Mulai dari: Ready to Connect",
    featured: false,
    cohortEyebrow: "Contribute · Executive & Global Leadership",
    targetLevelLabel: "Ready to Contribute",
    heroDescription:
      "Pendampingan eksekutif & pemimpin tim lintas negara untuk menguasai diplomasi bisnis, moderasi rapat multikultural, serta pitching berisiko tinggi (termasuk sesi 1-on-1 privat).",
    stats: {
      duration: "6–8 minggu",
      format: "1-on-1 / Hybrid",
      liveRoleplay: "Privat + Panel",
      quota: "Eksklusif privat",
    },
    defaultTrackId: "executive-1on1",
    tracks: [
      {
        id: "executive-1on1",
        label: "Executive 1-on-1 Coaching",
        shortDesc: "Mentoring privat tatap muka (offline di kafe/coworking) atau Zoom sesuai jadwal sibukmu.",
        preferredSlugs: ["ready-path-executive", "ready-coach-1on1", "ready-holiday-camp", "Leadership & Self-Development"],
        preferredCategoryIds: [2, 3],
        keywords: ["executive", "offline", "leadership", "1-on-1"],
        supportVideos: [
          "Executive Presence dalam Rapat Direksi",
          "Mengelola Konflik & Feedback Lintas Budaya",
          "Storytelling Strategis untuk Stakeholder Global",
          "Review Slide Deck & Naskah Pidato Bisnis",
        ],
      },
      {
        id: "global-negotiation",
        label: "Global Pitch & Negotiation",
        shortDesc: "Presentasi investor/klien internasional dan memimpin diskusi antar negara.",
        preferredSlugs: ["cohort-ready-for-the-world", "business-english-masterclass", "ready-holiday-camp", "ready-path-executive"],
        preferredCategoryIds: [2, 5],
        keywords: ["negotiation", "business", "leadership", "interview"],
        supportVideos: [
          "High-Stakes Q&A Handling",
          "Cross-Cultural Framing: APAC, US & Europe",
          "Value Proposition & ROI Pitching",
          "Closing Agreement dengan Percaya Diri",
        ],
      },
    ],
    outcomesTitle: "Setelah menyelesaikan program, kamu bisa",
    outcomes: [
      "Memimpin rapat strategis multikultural dengan otoritas suara yang tenang",
      "Menyesuaikan gaya komunikasi langsung vs diplomatis untuk mitra APAC, Eropa, atau AS",
      "Menyampaikan presentasi eksekutif dan menjawab pertanyaan kritis secara real-time",
      "Melakukan review dokumen penting (deck, proposal, CV eksekutif) bersama coach privat",
      "Menjaga konsistensi komunikasi tingkat C1 pada skenario kerja nyata",
    ],
    dimensions: [
      { label: "Komunikasi lintas budaya", pct: 95, accent: true },
      { label: "Kelancaran & executive framing", pct: 90 },
      { label: "Ketepatan bahasa strategis", pct: 80 },
      { label: "Pelafalan & kejelasan vokal", pct: 70 },
      { label: "Pemahaman mendengar nuansa", pct: 75 },
    ],
    syllabusTitle: "Alur pendampingan eksekutif 6 minggu",
    syllabus: [
      { week: "0", focus: "Audit dokumen & peta stakeholder", liveRoleplay: "1-on-1 Assessment", measure: "Baseline", highlight: true },
      { week: "1", focus: "Executive framing & opening", liveRoleplay: "Townhall Opening", measure: "Feedback Coach" },
      { week: "2", focus: "Diplomasi & penolakan elegan", liveRoleplay: "Regional Alignment", measure: "Ready Pulse" },
      { week: "3", focus: "Pitch & mempertahankan ROI", liveRoleplay: "Client / Board Pitch", measure: "Cek tengah program" },
      { week: "4", focus: "Navigasi budaya APAC / Barat", liveRoleplay: "Cross-Cultural Crisis", measure: "Ready Pulse" },
      { week: "5", focus: "Simulasi kasus spesifik kantormu", liveRoleplay: "Custom 1-on-1 Offline/Zoom", measure: "Review Deck" },
      { week: "6", focus: "Capstone Executive Defense", liveRoleplay: "Panel Simulasi Global", measure: "Exit + Sertifikat", highlight: true },
    ],
    coachBioFallback: "Mentor senior dengan jam terbang tinggi mendampingi manajer, founder, dan pemimpin lintas negara.",
    cohortChecklist: [
      "Sesi privat 1-on-1 (Offline Tatap Muka / Online Zoom) bersama Coach",
      "Bebas atur lokasi temu (Coworking, Kafe, atau Kantor)",
      "Review slide deck, proposal, & naskah presentasi nyata",
      "Akses penuh perpustakaan video + Cohort + AI Partner 24/7",
    ],
    pricingNote: "Termasuk akses AI Partner, Cohort, & bimbingan privat prioritas.",
  },
];

export function getProgramGoal(slug?: string | null): ProgramGoalSpec | null {
  if (!slug) return null;
  return PROGRAM_GOALS.find((g) => g.slug === slug) ?? null;
}

const QA_TITLE_OR_SLUG_PATTERN =
  /^(test|coba|qa\b|tess+|dsada|ui\/ux|daffa)/i;

export function isPublicCatalogCourse(course: PublishedCourseCard): boolean {
  if (QA_TITLE_OR_SLUG_PATTERN.test(course.title.trim())) return false;
  if (course.slug.includes("-deleted-") || course.slug.startsWith("qa-")) return false;
  if (Number(course.price) <= 0 && !course.isFree) return false;
  return true;
}

export function scoreCourseMatch(
  course: PublishedCourseCard,
  goal: ProgramGoalSpec,
  track?: ProgramTrackOption
): number {
  let score = 0;
  const hay = `${course.title} ${course.slug} ${course.shortDescription ?? ""}`.toLowerCase();

  if (track) {
    const slugIdx = track.preferredSlugs.indexOf(course.slug);
    if (slugIdx !== -1) score += 100 - slugIdx * 10;
    if (course.categoryId && track.preferredCategoryIds.includes(course.categoryId)) {
      score += 35;
    }
    for (const kw of track.keywords) {
      if (hay.includes(kw.toLowerCase())) score += 15;
    }
  }

  for (const t of goal.tracks) {
    if (t.preferredSlugs.includes(course.slug)) score += 30;
    if (course.categoryId && t.preferredCategoryIds.includes(course.categoryId)) score += 12;
  }

  // Goal-specific tier alignment
  if (goal.slug === "ready-to-speak" && course.tier === "tier_bawah") score += 25;
  if (goal.slug === "ready-for-work" && course.tier === "tier_menengah") score += 25;
  if (goal.slug === "ready-to-go" && (course.tier === "tier_menengah" || course.categoryId === 6 || course.categoryId === 5)) score += 20;
  if (goal.slug === "ready-for-the-world" && course.tier === "tier_tinggi") score += 30;

  return score;
}

export function getCoursesForProgramGoal(
  allCourses: PublishedCourseCard[],
  goalSlug: ProgramGoalSlug,
  trackId?: string
): PublishedCourseCard[] {
  const goal = getProgramGoal(goalSlug);
  const clean = allCourses.filter(isPublicCatalogCourse);
  if (!goal) return clean;

  const track = goal.tracks.find((t) => t.id === trackId) ?? goal.tracks[0];
  const preferredSlugsAcrossGoal = new Set(goal.tracks.flatMap((t) => t.preferredSlugs));

  // First match courses relevant to this goal
  const scored = clean
    .map((course) => ({
      course,
      score: scoreCourseMatch(course, goal, track),
      inGoal:
        preferredSlugsAcrossGoal.has(course.slug) ||
        scoreCourseMatch(course, goal, track) >= 25,
    }))
    .filter((x) => x.inGoal)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0) {
    return scored.map((s) => s.course);
  }

  return clean;
}

