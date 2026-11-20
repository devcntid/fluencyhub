export interface SpeakingScenario {
  id: string;
  title: string;
  shortTitle?: string;
  moduleLabel: string;
  category: string;
  badge: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimatedMinutes: number;
  description: string;
  initialAiPrompt: string;
  followUpQuestions: string[];
  recommendedVocab: string[];
  starterHint: string;
  coachingTip: string;
}

export interface EnrolledPackageInput {
  courseId: number;
  slug: string;
  title: string;
  tier: string;
  level: string;
  shortDescription?: string | null;
  lessons: string[];
}

export interface PackageScenarioGroup {
  key: string;
  courseId: number | null;
  slug: string;
  packageName: string;
  shortName: string;
  tierLabel: string;
  tierAccent: "bawah" | "menengah" | "tinggi";
  levelLabel: string;
  isEnrolled: boolean;
  scenarios: SpeakingScenario[];
}

function tierDisplay(tier: string): { label: string; accent: "bawah" | "menengah" | "tinggi" } {
  if (tier === "tier_bawah") return { label: "Mandiri · AI 24/7", accent: "bawah" };
  if (tier === "tier_tinggi") return { label: "Eksekutif / 1-on-1", accent: "tinggi" };
  return { label: "Live Cohort", accent: "menengah" };
}

function normalizeLevel(lvl?: string): "Beginner" | "Intermediate" | "Advanced" {
  const s = (lvl || "").toLowerCase();
  if (s.includes("adv")) return "Advanced";
  if (s.includes("beg")) return "Beginner";
  return "Intermediate";
}

/**
 * Authentic syllabus-aligned speaking scenarios mapped directly to each English Ready package.
 */
const PACKAGE_SCENARIO_BANK: Record<
  string,
  {
    packageName: string;
    shortName: string;
    tier: string;
    levelLabel: string;
    scenarios: SpeakingScenario[];
  }
> = {
  "ready-daily": {
    packageName: "Ready Daily: Latihan Mandiri & AI Speaking Partner",
    shortName: "Ready Daily",
    tier: "tier_bawah",
    levelLabel: "Beginner · A1–B1",
    scenarios: [
      {
        id: "rd_office_smalltalk",
        title: "Office Small Talk & Update Harian 60 Detik",
        shortTitle: "Office Small Talk",
        moduleLabel: "Minggu 1–2 · Percakapan Kantor",
        category: "Ready Daily",
        badge: "Harian",
        level: "Beginner",
        estimatedMinutes: 3,
        description:
          "Berlatih membuka percakapan santai di kantor dan menyampaikan prioritas harian dengan jelas sejak kalimat pertama.",
        initialAiPrompt:
          "Good morning! Hope your week is going smoothly. Before we dive into tasks, what's the main priority you're focusing on today?",
        followUpQuestions: [
          "That sounds like a solid focus. Do you need any support or quick feedback from teammates to finish it today?",
          "Great! Once you wrap that up, what will be your next step tomorrow morning?",
        ],
        recommendedVocab: ["main priority", "on track", "wrap up", "quick sync", "follow up", "smoothly"],
        starterHint: "Good morning! Today my main priority is..., and so far everything is on track.",
        coachingTip: "Gunakan struktur singkat: Sapaan → 1 prioritas utama → status terkini.",
      },
      {
        id: "rd_anti_freeze",
        title: "Drill 12 Kalimat Transisi Anti-Freeze",
        shortTitle: "Transisi Anti-Freeze",
        moduleLabel: "Minggu 1–2 · Drill Mandiri",
        category: "Ready Daily",
        badge: "Anti-Grogi",
        level: "Beginner",
        estimatedMinutes: 3,
        description:
          "Latihan merespons pertanyaan dadakan menggunakan frasa transisi alami agar tidak panik atau terdiam lama.",
        initialAiPrompt:
          "Hey, sorry to put you on the spot—what's your take on moving our weekly team check-in from Monday morning to Tuesday afternoon?",
        followUpQuestions: [
          "Good point! How would that schedule change affect your own deliverables during the week?",
          "If someone in the team prefers Monday, how would you politely suggest trying Tuesday for one sprint first?",
        ],
        recommendedVocab: [
          "that's a great question",
          "from my perspective",
          "give me a moment",
          "works better",
          "compromise",
          "on board",
        ],
        starterHint: "That's a great question. From my perspective, Tuesday afternoon works better because...",
        coachingTip: "Awali dengan kalimat pengulur waktu natural seperti 'That's a great question' untuk menata ide.",
      },
      {
        id: "rd_think_fast",
        title: "Think Fast, Talk Smart: Jawaban Spontan",
        shortTitle: "Jawaban Spontan",
        moduleLabel: "Minggu 3–4 · Ready Pulse",
        category: "Ready Daily",
        badge: "Spontan",
        level: "Beginner",
        estimatedMinutes: 4,
        description:
          "Menerapkan kerangka PREP (Point–Reason–Example–Point) untuk menjawab pertanyaan spontan secara terstruktur.",
        initialAiPrompt:
          "Let's practice spontaneous speaking! Could you share one daily habit or digital tool that has helped you work or learn smarter recently?",
        followUpQuestions: [
          "Interesting choice! Could you give me one concrete example of how it saved you time this past week?",
          "Would you recommend that same habit to a colleague who feels overwhelmed, and why?",
        ],
        recommendedVocab: [
          "in particular",
          "the main reason",
          "for instance",
          "stay consistent",
          "huge difference",
          "overall",
        ],
        starterHint: "One habit that made a huge difference for me is... The main reason is... For instance,...",
        coachingTip: "Pakai alur PREP: sebutkan poin utama, 1 alasan singkat, dan 1 contoh nyata.",
      },
    ],
  },

  "cohort-ready-for-work": {
    packageName: "Cohort Ready for Work: 6-Week Live Online Mentoring",
    shortName: "Ready for Work",
    tier: "tier_menengah",
    levelLabel: "Intermediate · B1–B2",
    scenarios: [
      {
        id: "rfw_tell_me_about_yourself",
        title: "Tell Me About Yourself (Formula 90 Detik)",
        shortTitle: "Intro HRD 90 Detik",
        moduleLabel: "Minggu 1 · Wawancara HRD",
        category: "Cohort Ready for Work",
        badge: "Wajib HRD",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Simulasi wawancara HRD menggunakan formula Present–Past–Future untuk memperkenalkan profil profesional secara meyakinkan.",
        initialAiPrompt:
          "Welcome to our interview! Thanks for joining today. To start us off, could you tell me about yourself and what sparked your interest in this role?",
        followUpQuestions: [
          "Great background. Which specific achievement from your past experience makes you confident you can thrive here?",
          "Where do you see yourself adding the most value during your first 90 days on the team?",
        ],
        recommendedVocab: [
          "currently focused on",
          "hands-on experience",
          "key achievement",
          "cross-functional",
          "aligned with",
          "add value",
        ],
        starterHint: "Currently, I'm focused on... Previously, I gained hands-on experience in... Looking ahead, I'm excited to...",
        coachingTip: "Ikuti alur Present (sekarang) → Past (pengalaman inti) → Future (kenapa tertarik posisi ini).",
      },
      {
        id: "rfw_star_story",
        title: "Behavioral STAR Story & Bedah Proyek",
        shortTitle: "STAR Story Proyek",
        moduleLabel: "Minggu 2–3 · User Interview",
        category: "Cohort Ready for Work",
        badge: "STAR Method",
        level: "Intermediate",
        estimatedMinutes: 5,
        description:
          "Menjelaskan proyek kerja dan tantangan nyata menggunakan kerangka Situation–Task–Action–Result tanpa terdengar dihafal.",
        initialAiPrompt:
          "Let's dive into your project experience. Walk me through a challenging obstacle you faced recently—what actions did you take, and what was the measurable outcome?",
        followUpQuestions: [
          "That's a strong breakdown. How did you keep stakeholders updated while resolving that blocker?",
          "Looking back, what is one thing you would refine if a similar challenge came up again?",
        ],
        recommendedVocab: [
          "root cause",
          "took ownership",
          "bottleneck",
          "stakeholders",
          "measurable impact",
          "mitigate risk",
        ],
        starterHint: "In a recent project, we faced a bottleneck where... I took ownership by... As a result, we achieved...",
        coachingTip: "Fokuskan 60% waktu pada bagian Action (langkah spesifikmu) dan Result (dampak terukur).",
      },
      {
        id: "rfw_diplomatic_pushback",
        title: "Rapat Regional & Pushback Diplomatis",
        shortTitle: "Pushback Rapat",
        moduleLabel: "Minggu 4 · Rapat Lintas Negara",
        category: "Cohort Ready for Work",
        badge: "Roleplay Rapat",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Mengambil giliran bicara, menyela secara sopan, dan menolak tenggat terlalu mepet dengan solusi konstruktif.",
        initialAiPrompt:
          "Our regional stakeholders are asking if we can pull the product launch forward by two weeks. What's your honest assessment of that timeline?",
        followUpQuestions: [
          "I appreciate the candor. If we keep the earlier date, which scope would you propose moving to phase two?",
          "How should we frame that trade-off so leadership feels confident about our quality standards?",
        ],
        recommendedVocab: [
          "tight deadline",
          "buffer time",
          "phase one",
          "trade-off",
          "protect quality",
          "realistic scope",
        ],
        starterHint: "I see why launching earlier helps the business. To protect quality, could we split the deliverables into phase one and phase two?",
        coachingTip: "Validasi dulu tujuan lawan bicara, baru tawarkan opsi kompromi (Acknowledge → Propose).",
      },
      {
        id: "rfw_salary_negotiation",
        title: "Negosiasi Tawaran Kerja & Follow-Up",
        shortTitle: "Negosiasi Offer",
        moduleLabel: "Minggu 5 · Negosiasi Tawaran",
        category: "Cohort Ready for Work",
        badge: "Offer Stage",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Menggunakan bahasa negosiasi profesional untuk mendiskusikan paket kompensasi dan ekspektasi secara elegan.",
        initialAiPrompt:
          "We're thrilled to extend an offer for you to join our team! We sent over the compensation details—how are you feeling about the proposed package?",
        followUpQuestions: [
          "Thank you for sharing your expectations clearly. Aside from base salary, are there other components like learning budget or flexibility that matter to you?",
          "If we meet closer to your range, when would be the earliest date you could onboard?",
        ],
        recommendedVocab: [
          "truly excited",
          "market benchmark",
          "total compensation",
          "flexibility",
          "mutual fit",
          "explore options",
        ],
        starterHint: "Thank you so much—I'm truly excited about the role. Based on the scope and market benchmark, I was hoping we could explore...",
        coachingTip: "Selalu tunjukkan antusiasme dulu, lalu kaitkan ekspektasimu dengan nilai kontribusi & riset pasar.",
      },
    ],
  },

  "ready-to-go-ielts-track": {
    packageName: "Ready to Go: 6-Week IELTS & Scholarship Track",
    shortName: "Ready to Go (IELTS)",
    tier: "tier_menengah",
    levelLabel: "Intermediate · Band 6.5–7.5+",
    scenarios: [
      {
        id: "ielts_study_pitch",
        title: "Elevator Pitch Rencana Studi & Beasiswa",
        shortTitle: "Pitch Rencana Studi",
        moduleLabel: "Minggu 1 · Diagnostik & Narasi",
        category: "IELTS & Scholarship",
        badge: "Beasiswa",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Menyampaikan alasan pemilihan jurusan, kampus tujuan, dan relevansinya dengan kontribusi masa depan secara ringkas.",
        initialAiPrompt:
          "Welcome to the scholarship pre-screening. In about 45 seconds, why did you choose this particular master's program and university for your next step?",
        followUpQuestions: [
          "That's a coherent study plan. Which specific module or research lab at that university aligns best with your career background?",
          "Why is now the right moment in your career to pursue this postgraduate degree?",
        ],
        recommendedVocab: [
          "interdisciplinary",
          "academic rigor",
          "bridge the gap",
          "aligns directly",
          "tangible impact",
          "long-term vision",
        ],
        starterHint: "I chose this program because its interdisciplinary curriculum will help me bridge the gap between...",
        coachingTip: "Hubungkan 3 titik: Masalah yang kamu temui → Ilmu spesifik di kampus → Dampak yang akan kamu bangun.",
      },
      {
        id: "ielts_cue_card",
        title: "IELTS Speaking Part 2: 2-Minute Cue Card",
        shortTitle: "IELTS Part 2 Cue Card",
        moduleLabel: "Minggu 2 · Storytelling 2 Menit",
        category: "IELTS & Scholarship",
        badge: "Cue Card",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Latihan berbicara terstruktur tanpa kehabisan ide untuk IELTS Speaking Part 2 dengan lexical resource kaya.",
        initialAiPrompt:
          "Here is your IELTS Part 2 cue card: Describe a mentor, book, or project that strongly shaped your academic or career direction. Say what it was, when you encountered it, and why it left a lasting impression.",
        followUpQuestions: [
          "Thank you. Just a quick rounding-off question: have you shared what you learned from that experience with others?",
          "Do you think self-guided learning or structured mentorship has a bigger influence on young adults?",
        ],
        recommendedVocab: [
          "turning point",
          "lasting impression",
          "broadened my perspective",
          "in retrospect",
          "pivotal role",
          "inspired me to",
        ],
        starterHint: "A real turning point in my journey was... I first encountered it when... Looking back, it broadened my perspective because...",
        coachingTip: "Bagi jawaban menjadi 3 bab: Konteks awal → Cerita inti → Refleksi dampaknya sampai sekarang.",
      },
      {
        id: "ielts_part3_abstract",
        title: "IELTS Speaking Part 3: Argumen Abstrak & Kritis",
        shortTitle: "IELTS Part 3 Analitis",
        moduleLabel: "Minggu 3 · Argumen Akademik",
        category: "IELTS & Scholarship",
        badge: "Band 7.5+",
        level: "Advanced",
        estimatedMinutes: 5,
        description:
          "Menjawab pertanyaan analitis & kritis dengan sudut pandang berimbang, kohesi logis, dan kosakata akademik.",
        initialAiPrompt:
          "Let's move into IELTS Part 3. Do you believe rapid advances in AI and online education will narrow or widen inequality in developing countries? Please explain your reasoning.",
        followUpQuestions: [
          "That's a nuanced argument. What role should governments play in ensuring equitable access to digital learning tools?",
          "On the other hand, could over-reliance on automated tools reduce critical thinking skills among university students?",
        ],
        recommendedVocab: [
          "double-edged sword",
          "equitable access",
          "to a large extent",
          "digital divide",
          "conversely",
          "long-term policy",
        ],
        starterHint: "To a large extent, I see it as a double-edged sword. On one hand... Conversely, without equitable access...",
        coachingTip: "Pakai keseimbangan perspektif ('On one hand... Conversely...') untuk mendongkrak skor Coherence & Lexical Resource.",
      },
      {
        id: "ielts_scholarship_panel",
        title: "Mock Panel Beasiswa (LPDP / Chevening Stress Test)",
        shortTitle: "Panel Beasiswa",
        moduleLabel: "Minggu 5–6 · Mock Panel",
        category: "IELTS & Scholarship",
        badge: "Stress Test",
        level: "Advanced",
        estimatedMinutes: 5,
        description:
          "Menghadapi pertanyaan kritis panelis beasiswa tentang rencana kontribusi nyata pasca lulus.",
        initialAiPrompt:
          "Many talented graduates struggle to implement their ideas after returning home due to bureaucracy or limited funding. What concrete roadmap guarantees your post-study contribution will actually happen?",
        followUpQuestions: [
          "You mentioned collaboration—who are the specific local institutions or communities you plan to partner with first?",
          "How will you measure the success of your contribution three years after graduation?",
        ],
        recommendedVocab: [
          "concrete roadmap",
          "measurable outcome",
          "pilot initiative",
          "grassroots collaboration",
          "sustainable model",
          "accountability",
        ],
        starterHint: "That's a very valid concern. Rather than waiting for ideal conditions, my concrete roadmap starts with a small pilot initiative...",
        coachingTip: "Tetap tenang saat di-stress-test; jawab berbasis bukti nyata, mitra konkret, dan target terukur.",
      },
    ],
  },

  "cohort-ready-for-the-world": {
    packageName: "Cohort Ready for the World: 6-Week Global Communication",
    shortName: "Ready for the World",
    tier: "tier_menengah",
    levelLabel: "Intermediate · Global Fluency",
    scenarios: [
      {
        id: "rfw_cross_cultural_feedback",
        title: "Cross-Cultural Framing & Diplomatic Feedback",
        shortTitle: "Feedback Lintas Budaya",
        moduleLabel: "Minggu 1–2 · High vs Low Context",
        category: "Global Communication",
        badge: "Cross-Culture",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Memberikan masukan yang jelas namun tetap empatik kepada rekan kerja dari budaya komunikasi yang berbeda.",
        initialAiPrompt:
          "Imagine a teammate from Europe submitted a draft deck that skipped key local context for our Asian partners. How would you open a constructive feedback conversation with them?",
        followUpQuestions: [
          "Well-framed! What if they respond quite directly and defend their original version—how do you stay diplomatic while holding your point?",
          "How do you wrap up the conversation so both sides leave energized and aligned?",
        ],
        recommendedVocab: [
          "appreciate the effort",
          "local nuance",
          "constructive lens",
          "shared objective",
          "align expectations",
          "build on",
        ],
        starterHint: "First, I really appreciate the clarity of your deck. To help it resonate with our regional partners, could we add a bit of local nuance around...",
        coachingTip: "Seimbangkan kejelasan (Low Context) dengan penghormatan relasi (High Context).",
      },
      {
        id: "rfw_global_panel",
        title: "Panel Diskusi Isu Global & Moderasi",
        shortTitle: "Panel Forum Global",
        moduleLabel: "Minggu 3–4 · Forum Internasional",
        category: "Global Communication",
        badge: "Opini Global",
        level: "Intermediate",
        estimatedMinutes: 5,
        description:
          "Menyampaikan opini tegas, memoderasi diskusi, dan menjawab pertanyaan kritis di forum internasional terbuka.",
        initialAiPrompt:
          "Welcome to our international roundtable! Today's topic is Southeast Asia's voice in global innovation. What unique perspective do Indonesian professionals bring to global teams?",
        followUpQuestions: [
          "Fascinating point. If an audience member challenges that idea as overly optimistic, how would you respond with an example?",
          "How would you politely invite a quieter panelist from another country to share their perspective?",
        ],
        recommendedVocab: [
          "unique vantage point",
          "resilience",
          "diverse markets",
          "bridge perspectives",
          "bring to the table",
          "build consensus",
        ],
        starterHint: "Thank you for having me. One unique vantage point Indonesian professionals bring to the table is...",
        coachingTip: "Gunakan struktur 1 gagasan tajam + 1 bukti lokal agar suaramu langsung didengar di forum global.",
      },
      {
        id: "rfw_indonesia_storytelling",
        title: "Storytelling Indonesia di Panggung Dunia",
        shortTitle: "Global Storytelling",
        moduleLabel: "Minggu 5–6 · Global Showcase",
        category: "Global Communication",
        badge: "Showcase",
        level: "Intermediate",
        estimatedMinutes: 5,
        description:
          "Membangun narasi otentik tentang inovasi atau budaya Indonesia untuk memikat audiens internasional.",
        initialAiPrompt:
          "You have the opening spotlight at a global summit. Share one inspiring story, innovation, or lesson from Indonesia that you believe deserves worldwide attention.",
        followUpQuestions: [
          "That's a compelling story! What universal takeaway can people from any country apply from that example?",
          "How would you close your keynote with a memorable call to action?",
        ],
        recommendedVocab: [
          "authentic story",
          "community-driven",
          "universal lesson",
          "grassroots innovation",
          "resonates globally",
          "call to action",
        ],
        starterHint: "When people think of Indonesia, they often picture islands—but today I want to share a story of grassroots innovation that resonates globally...",
        coachingTip: "Mulai dengan hook visual/cerita konkret, lalu tarik ke pelajaran universal bagi audiens dunia.",
      },
    ],
  },

  "ready-path-executive": {
    packageName: "Ready Path: 12-Week Executive Bundle",
    shortName: "Ready Path Executive",
    tier: "tier_tinggi",
    levelLabel: "Advanced · B2–C1",
    scenarios: [
      {
        id: "rpe_boardroom_why",
        title: "Executive Presence & Boardroom Alignment",
        shortTitle: "Boardroom Alignment",
        moduleLabel: "Fase 1 · Strategic Leadership",
        category: "Ready Path Executive",
        badge: "Executive",
        level: "Advanced",
        estimatedMinutes: 5,
        description:
          "Memimpin narasi dengan kerangka 'Start With Why' dan menyatukan perbedaan prioritas antar divisi.",
        initialAiPrompt:
          "Welcome to the quarterly executive review. Operations wants to cut costs by 15%, while Growth wants to double acquisition spend. How do you frame a unified strategic direction?",
        followUpQuestions: [
          "Strong executive framing. How will you handle pushback from the division lead whose budget gets trimmed first?",
          "What single North Star KPI will you put on the board deck to keep everyone accountable?",
        ],
        recommendedVocab: [
          "strategic alignment",
          "north star metric",
          "capital efficiency",
          "sustainable growth",
          "executive buy-in",
          "decisive trade-off",
        ],
        starterHint: "Before debating budget lines, let's anchor on our shared North Star metric. To achieve sustainable growth with capital efficiency, I propose...",
        coachingTip: "Buka dengan tujuan strategis bersama sebelum masuk ke angka dan kompromi taktis.",
      },
      {
        id: "rpe_high_stakes_deal",
        title: "High-Stakes Negotiation & Deal-Making",
        shortTitle: "Negosiasi Kontrak",
        moduleLabel: "Fase 2 · Executive Pitching",
        category: "Ready Path Executive",
        badge: "Deal-Making",
        level: "Advanced",
        estimatedMinutes: 6,
        description:
          "Menjawab keberatan harga klien korporat, menjaga BATNA, dan memaparkan ROI secara meyakinkan.",
        initialAiPrompt:
          "We're impressed with your team's capabilities, but your annual contract sits 20% above our procurement cap. Why shouldn't we go with a lower-cost vendor?",
        followUpQuestions: [
          "Good point on total cost of ownership. Could we structure a 90-day performance milestone before unlocking the full rollout?",
          "What concrete ROI guarantee can I present to our CFO tomorrow morning?",
        ],
        recommendedVocab: [
          "return on investment",
          "total cost of ownership",
          "value proposition",
          "win-win structure",
          "phased rollout",
          "risk mitigation",
        ],
        starterHint: "I appreciate your transparency on budget. When evaluating total cost of ownership, our value proposition saves... To make this a win-win structure...",
        coachingTip: "Alihkan diskusi dari 'harga murah' ke 'Total Cost of Ownership' dan 'mitigasi risiko'.",
      },
      {
        id: "rpe_capstone_defense",
        title: "Executive Capstone Defense & Q&A",
        shortTitle: "Capstone Defense",
        moduleLabel: "Fase 3 · 1-on-1 Defense",
        category: "Ready Path Executive",
        badge: "Capstone",
        level: "Advanced",
        estimatedMinutes: 6,
        description:
          "Mempertahankan roadmap transformasi 12 bulan di hadapan direksi dengan ketenangan dan presisi tinggi.",
        initialAiPrompt:
          "You have the floor for your capstone defense. Summarize your 12-month strategic roadmap and identify the single biggest execution risk we must prepare for.",
        followUpQuestions: [
          "Clear and structured. If market conditions shift unexpectedly in Q2, what is your contingency trigger?",
          "In one closing sentence, why should the board greenlight this initiative today?",
        ],
        recommendedVocab: [
          "transformation roadmap",
          "execution risk",
          "contingency plan",
          "measurable milestones",
          "competitive moat",
          "greenlight",
        ],
        starterHint: "Our 12-month transformation roadmap centers on three measurable milestones. The biggest execution risk is..., which we address through...",
        coachingTip: "Tunjukkan ketenangan eksekutif: sebutkan risiko secara jujur sekaligus langsung pasangkan rencana mitigasinya.",
      },
    ],
  },

  "ready-coach-1on1": {
    packageName: "Ready Coach: 4 Sesi Privat 1-on-1 Coaching",
    shortName: "Ready Coach 1-on-1",
    tier: "tier_tinggi",
    levelLabel: "All Levels · Personal Drill",
    scenarios: [
      {
        id: "rc_vocal_clarity",
        title: "Audit Suara, Pelafalan & Intonasi 1-on-1",
        shortTitle: "Audit Pelafalan",
        moduleLabel: "Sesi 1–2 · Vocal Clarity",
        category: "Ready Coach 1-on-1",
        badge: "1-on-1 Drill",
        level: "Intermediate",
        estimatedMinutes: 3,
        description:
          "Melatih kejelasan vokal, jeda strategis (pausing), dan penekanan kata kunci saat perkenalan profesional.",
        initialAiPrompt:
          "Welcome to your 1-on-1 vocal drill! Slow your pace down by 10% and introduce your role plus your proudest recent achievement in three crisp, confident sentences.",
        followUpQuestions: [
          "Nice control! Now try rephrasing that last sentence with stronger emphasis on the impact number.",
          "How did that slower, intentional pacing feel compared to your usual speaking speed?",
        ],
        recommendedVocab: [
          "specialize in",
          "proudest milestone",
          "spearheaded",
          "delivered measurable",
          "clear takeaway",
          "confident pace",
        ],
        starterHint: "I specialize in... Recently, I spearheaded a project that delivered measurable results in...",
        coachingTip: "Jangan terburu-buru: berhenti 0,5 detik di setiap tanda koma/titik membuat pelafalan terdengar jauh lebih berwibawa.",
      },
      {
        id: "rc_bluf_argument",
        title: "Argumen Singkat & Tegas (BLUF Method)",
        shortTitle: "BLUF Method",
        moduleLabel: "Sesi 2–3 · Tegas Tanpa Berbelit",
        category: "Ready Coach 1-on-1",
        badge: "BLUF",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Menyampaikan kesimpulan di awal kalimat (Bottom Line Up Front) diikuti 2 alasan pendukung yang tajam.",
        initialAiPrompt:
          "Let's drill the BLUF method—Bottom Line Up Front! Should your team adopt a 3-day hybrid work model next quarter? State your recommendation in sentence one, then give two crisp reasons.",
        followUpQuestions: [
          "Sharp opening! Now anticipate one objection from a manager who prefers full onsite work, and answer it in two sentences.",
          "Great structure. Can you summarize your final takeaway in under 15 words?",
        ],
        recommendedVocab: [
          "bottom line",
          "my recommendation is",
          "two key reasons",
          "deep focus",
          "team cohesion",
          "trial period",
        ],
        starterHint: "My recommendation is that we adopt a 3-day hybrid model for two key reasons: first..., and second...",
        coachingTip: "Langsung tembak rekomendasi di kalimat pertama, hindari pembukaan berputar-putar.",
      },
      {
        id: "rc_pressure_mock",
        title: "Final Mock Pressure Interview",
        shortTitle: "Pressure Interview",
        moduleLabel: "Sesi 4 · Final Mock",
        category: "Ready Coach 1-on-1",
        badge: "Simulasi Ketat",
        level: "Advanced",
        estimatedMinutes: 5,
        description:
          "Simulasi tanya-jawab menantang tentang kegagalan, konflik tim, atau kelemahan diri tanpa kehilangan kendali.",
        initialAiPrompt:
          "Ready for a real pressure question? Tell me about a time you made a wrong call or missed a target. What happened, and what did you change afterward?",
        followUpQuestions: [
          "I respect that accountability. How did you rebuild trust with your manager or client right after?",
          "What concrete safeguard exists in your workflow today because of that lesson?",
        ],
        recommendedVocab: [
          "took full accountability",
          "misjudged",
          "transparently communicated",
          "corrective action",
          "safeguard",
          "turned into a lesson",
        ],
        starterHint: "Earlier in my role, I misjudged the timeline for... I took full accountability, transparently communicated the gap, and implemented...",
        coachingTip: "Jangan menyalahkan orang lain—tunjukkan kepemilikan (ownership) dan sistem perbaikan konkret yang kamu buat.",
      },
    ],
  },

  "ready-holiday-camp": {
    packageName: "Ready Holiday Camp: 3D2N English Immersion",
    shortName: "Holiday Camp",
    tier: "tier_tinggi",
    levelLabel: "All Levels · Immersion",
    scenarios: [
      {
        id: "rhc_field_icebreaker",
        title: "Misi Lapangan: Menyapa & Icebreaking Asing",
        shortTitle: "Misi Icebreaking",
        moduleLabel: "Tahap 1 · Pre-Camp Briefing",
        category: "Ready Holiday Camp",
        badge: "Misi Lapangan",
        level: "Beginner",
        estimatedMinutes: 3,
        description:
          "Mengatasi rasa malu dan menyapa narasumber internasional dengan ramah dan sopan untuk misi proyek lapangan.",
        initialAiPrompt:
          "Pretend you just met me at a scenic café in Lembang! Approach me naturally, introduce your immersion project, and ask if I have two minutes for a quick chat.",
        followUpQuestions: [
          "Of course, happy to help! What kind of project are you and your team working on during this camp?",
          "That sounds fun! What's one local place or dish in Bandung you think I must try?",
        ],
        recommendedVocab: [
          "excuse me",
          "immersion project",
          "mind if I ask",
          "local highlight",
          "appreciate your time",
          "nice meeting you",
        ],
        starterHint: "Excuse me, hi! I'm part of an English immersion project here in Lembang. Would you mind if I ask you two quick questions?",
        coachingTip: "Senyum dalam suara (warm tone) dan minta izin dengan sopan membuat orang asing langsung nyaman mengobrol.",
      },
      {
        id: "rhc_mini_podcast",
        title: "Wawancara Narasumber & Mini Podcast",
        shortTitle: "Host Mini Podcast",
        moduleLabel: "Tahap 2 · Proyek 3D2N",
        category: "Ready Holiday Camp",
        badge: "Podcast",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Berlatih menjadi host mini podcast: mengajukan pertanyaan lanjutan yang hangat dan mendengar aktif.",
        initialAiPrompt:
          "Lights, camera, mic on! You're hosting your camp's Mini Podcast and I'm your guest traveler. Open the episode and ask me about my most memorable experience visiting Indonesia.",
        followUpQuestions: [
          "Honestly, the warmth of people in Bandung amazed me—even when we barely shared a language! What follow-up question would you ask me next?",
          "Now wrap up our 2-minute podcast segment and thank the listeners enthusiastically!",
        ],
        recommendedVocab: [
          "welcome back to",
          "memorable moment",
          "cultural insight",
          "that's fascinating",
          "tell us more",
          "thanks for tuning in",
        ],
        starterHint: "Welcome back to our English Ready Mini Podcast! Today I'm joined by a special guest—could you share your most memorable moment in Indonesia?",
        coachingTip: "Tunjukkan active listening dengan merespons jawaban tamu ('That's fascinating!') sebelum masuk ke pertanyaan berikutnya.",
      },
      {
        id: "rhc_portfolio_showcase",
        title: "Presentasi Portofolio & Refleksi Camp",
        shortTitle: "Showcase Portofolio",
        moduleLabel: "Tahap 3 · Post-Camp Showcase",
        category: "Ready Holiday Camp",
        badge: "Portofolio",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Mempresentasikan hasil misi lapangan 3D2N dan perubahan kepercayaan diri di hadapan coach & orang tua.",
        initialAiPrompt:
          "Welcome to the Graduation Showcase! Tell the audience about your favorite field mission during the 3D2N camp and one speaking breakthrough you're proud of.",
        followUpQuestions: [
          "Wonderful reflection! What was the scariest moment at the start, and how did you push past it?",
          "How will you keep practicing your English speaking once you return to daily school or work?",
        ],
        recommendedVocab: [
          "stepping out of my comfort zone",
          "highlight of the camp",
          "speaking breakthrough",
          "more confident",
          "real-world practice",
          "keep the momentum",
        ],
        starterHint: "The highlight of the camp for me was stepping out of my comfort zone during... My biggest speaking breakthrough was...",
        coachingTip: "Ceritakan kontras sebelum vs sesudah camp agar progres kepercayaan dirimu terasa kuat.",
      },
    ],
  },

  "applied-english-stem-professionals": {
    packageName: "Applied English for STEM Professionals",
    shortName: "STEM English",
    tier: "tier_menengah",
    levelLabel: "Intermediate · STEM & Data",
    scenarios: [
      {
        id: "stem_dashboard_narration",
        title: "Narrating a Data Dashboard in 3 Minutes",
        shortTitle: "Narasi Dashboard",
        moduleLabel: "Module 2 · Technical Presentation",
        category: "STEM English",
        badge: "Data Talk",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Menjelaskan tren data, anomali metrik, dan rekomendasi teknis ke audiens non-teknis tanpa terjebak 'translator English'.",
        initialAiPrompt:
          "You're sharing your analytics dashboard with regional directors. Walk me through one surprising metric spike or drop and what technical takeaway matters most.",
        followUpQuestions: [
          "Very clear! If a non-technical director asks whether that anomaly impacts revenue, how do you translate the technical root cause simply?",
          "What next experiment or instrumentation will your team run this sprint?",
        ],
        recommendedVocab: [
          "key trend",
          "anomaly",
          "statistically significant",
          "root-cause analysis",
          "actionable insight",
          "trade-off",
        ],
        starterHint: "If we look at the Q3 trend, there's a notable anomaly in... The actionable insight for the team is...",
        coachingTip: "Sebutkan insight bisnisnya dulu, baru tunjukkan angkanya.",
      },
      {
        id: "stem_peer_review",
        title: "Constructive Peer Review & Async Slack Pushback",
        shortTitle: "Peer Review Sopan",
        moduleLabel: "Module 4–5 · Remote STEM Teams",
        category: "STEM English",
        badge: "Cross-Border",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Menyampaikan koreksi kode, arsitektur, atau metodologi riset secara objektif tanpa terdengar kasar.",
        initialAiPrompt:
          "A senior engineer proposed an architecture that introduces high latency under peak load. How do you raise your concern diplomatically during the design review?",
        followUpQuestions: [
          "Great diplomacy! How would you suggest benchmarking both designs before locking the decision?",
          "Could you summarize the agreed action items for our remote Slack thread?",
        ],
        recommendedVocab: [
          "edge case",
          "scalability",
          "latency bottleneck",
          "benchmark",
          "alternative approach",
          "align on",
        ],
        starterHint: "I really like how clean this design is. One edge case I'd love us to benchmark is potential latency under peak load...",
        coachingTip: "Kritik sistem atau idenya, bukan orangnya ('this design' bukan 'your mistake').",
      },
    ],
  },

  "business-english-masterclass": {
    packageName: "Business English Masterclass: Negotiation & Meetings",
    shortName: "Business Masterclass",
    tier: "tier_menengah",
    levelLabel: "Intermediate · Boardroom",
    scenarios: [
      {
        id: "bem_framing_meeting",
        title: "Opening, Turn-Taking & Closing with Action Items",
        shortTitle: "Memimpin Rapat",
        moduleLabel: "Module 1 · Business Meetings",
        category: "Business English",
        badge: "Meeting Pro",
        level: "Intermediate",
        estimatedMinutes: 4,
        description:
          "Membuka rapat internasional dengan agenda jelas, menyela sopan, dan menutup dengan komitmen aksi terukur.",
        initialAiPrompt:
          "You're chairing today's stakeholder alignment call and we only have 20 minutes. Open the meeting, frame the main objective, and set clear expectations.",
        followUpQuestions: [
          "Strong opening! Mid-meeting, two stakeholders start going off-topic—how do you politely steer the discussion back?",
          "Now close the call by recapping two owners and deadlines.",
        ],
        recommendedVocab: [
          "kick things off",
          "stay mindful of time",
          "parking lot",
          "circle back",
          "key deliverables",
          "next actions",
        ],
        starterHint: "Thanks everyone for joining. To kick things off and stay mindful of time, our goal in the next 20 minutes is to decide...",
        coachingTip: "Gunakan kalimat penanda waktu ('stay mindful of time') untuk menjaga rapat tetap fokus.",
      },
      {
        id: "bem_supplier_negotiation",
        title: "BATNA, Anchoring & Counter-Offer Negotiation",
        shortTitle: "Negosiasi Supplier",
        moduleLabel: "Module 2 · Negotiation Language",
        category: "Business English",
        badge: "BATNA",
        level: "Advanced",
        estimatedMinutes: 5,
        description:
          "Mengajukan anchoring, merespons harga tinggi, dan membuat counter-offer berbasis kepentingan bersama.",
        initialAiPrompt:
          "As your regional supplier, our standard unit price is $45 with a 30-day delivery lead time. What counter-proposal would you like to put on the table?",
        followUpQuestions: [
          "If we lower the unit price to $39, would you commit to a 12-month volume agreement?",
          "How do we handle penalty clauses if a shipment misses the agreed SLA?",
        ],
        recommendedVocab: [
          "counter-offer",
          "volume commitment",
          "mutually beneficial",
          "lead time",
          "flexible terms",
          "meet in the middle",
        ],
        starterHint: "We value a long-term partnership. If we commit to a higher quarterly volume, could we explore a mutually beneficial rate closer to...",
        coachingTip: "Selalu pasangkan permintaanmu dengan konsesi ('If we commit to X, could you offer Y?').",
      },
    ],
  },

  "public-speaking-english-zero-confident": {
    packageName: "Public Speaking in English: Zero to Confident",
    shortName: "Public Speaking",
    tier: "tier_bawah",
    levelLabel: "Beginner · Stage Confidence",
    scenarios: [
      {
        id: "ps_hook_map_landing",
        title: "Hook, Map & Landing: Pembukaan 30 Detik Memukau",
        shortTitle: "Hook & Opening",
        moduleLabel: "Part 2 · Structure of a Great Talk",
        category: "Public Speaking",
        badge: "Stage Hook",
        level: "Beginner",
        estimatedMinutes: 3,
        description:
          "Membuka presentasi bahasa Inggris dengan hook yang menarik perhatian audiens dan peta alur bicara yang jernih.",
        initialAiPrompt:
          "Imagine you just walked onto the stage in front of 50 colleagues. Deliver a 25-second Hook and Map introducing a topic you genuinely care about!",
        followUpQuestions: [
          "Awesome hook! Now deliver your 'Landing'—one memorable closing sentence you want the audience to remember tomorrow.",
          "Where would you insert a 2-second pause to let your main idea sink in?",
        ],
        recommendedVocab: [
          "imagine for a moment",
          "here is the big question",
          "today we'll explore",
          "takeaway",
          "to wrap up",
          "leave you with",
        ],
        starterHint: "Imagine for a moment that... Today, we'll explore three simple ideas that will help you...",
        coachingTip: "Hindari membuka dengan 'Good morning, today I will present about...'. Langsung masuk ke pertanyaan atau cerita!",
      },
    ],
  },

  "english-interview-prep-tech": {
    packageName: "English Interview Prep: Tech & Multinational Companies",
    shortName: "Tech Interview Prep",
    tier: "tier_tinggi",
    levelLabel: "All Levels · Tech & MNC",
    scenarios: [
      {
        id: "eip_system_design",
        title: "Walk Me Through Your Architecture & Trade-offs",
        shortTitle: "Tech System Design",
        moduleLabel: "Module 2 · Hiring Manager Round",
        category: "Tech Interview",
        badge: "Tech Round",
        level: "Advanced",
        estimatedMinutes: 5,
        description:
          "Menjelaskan keputusan teknis, skalabilitas, dan trade-off sistem secara runtut kepada Engineering Manager asing.",
        initialAiPrompt:
          "Thanks for joining the technical hiring round! Walk me through one system or feature you built recently—why did you choose that architecture, and what trade-offs did you accept?",
        followUpQuestions: [
          "Solid reasoning. What would break first if traffic suddenly grew 10x overnight, and how would you scale it?",
          "How did you collaborate with product and QA to ship it reliably?",
        ],
        recommendedVocab: [
          "architecture trade-off",
          "scalability",
          "single point of failure",
          "observability",
          "latency",
          "iterative rollout",
        ],
        starterHint: "We built this feature to solve... We chose this architecture because of scalability, accepting the trade-off that...",
        coachingTip: "Jelaskan konteks masalah → opsi yang dibandingkan → alasan memilih solusi final.",
      },
    ],
  },
};

/**
 * Generates syllabus-aligned scenarios dynamically if a student enrolls in a custom instructor course
 * that is not in the static official package bank.
 */
function buildDynamicCourseScenarios(course: EnrolledPackageInput): SpeakingScenario[] {
  const cleanLessons = course.lessons
    .map((l) => l.trim())
    .filter((l) => l.length > 3 && !/\btest\b/i.test(l) && !/coba/i.test(l) && !/final exam/i.test(l));

  const level = normalizeLevel(course.level);
  const pickedLessons = cleanLessons.slice(0, 3);

  if (pickedLessons.length === 0) {
    return [
      {
        id: `custom_${course.courseId}_overview`,
        title: `Diskusi Materi: ${course.title}`,
        shortTitle: course.title.slice(0, 26),
        moduleLabel: "Materi Kelasmu",
        category: course.title,
        badge: "Kelas Aktif",
        level,
        estimatedMinutes: 4,
        description:
          course.shortDescription ||
          `Latihan berbicara bahasa Inggris seputar topik inti dari kelas ${course.title}.`,
        initialAiPrompt: `Welcome to your practice session for ${course.title}! What key concept from this program are you most excited to apply in real life, and why?`,
        followUpQuestions: [
          "That's a practical goal! Could you walk me through a real situation where you'd use that skill this week?",
          "What part of speaking about this topic still feels challenging, so we can drill it together?",
        ],
        recommendedVocab: ["key takeaway", "real-world scenario", "confident", "apply directly", "next step"],
        starterHint: `From ${course.title}, the main skill I want to apply is... because in my daily work...`,
        coachingTip: "Kaitkan materi yang sedang kamu pelajari dengan contoh situasi nyata di aktivitasmu.",
      },
    ];
  }

  return pickedLessons.map((lessonTitle, idx) => ({
    id: `custom_${course.courseId}_m${idx + 1}`,
    title: lessonTitle,
    shortTitle: lessonTitle.length > 28 ? `${lessonTitle.slice(0, 26)}…` : lessonTitle,
    moduleLabel: `Materi ${idx + 1} · ${course.title.split(":")[0]}`,
    category: course.title,
    badge: "Sesuai Silabus",
    level,
    estimatedMinutes: 4,
    description: `Latihan berbicara langsung berdasarkan modul "${lessonTitle}" pada kelas ${course.title}.`,
    initialAiPrompt: `Let's practice what you learned in "${lessonTitle}"! In your own words, how would you explain or apply this topic during a real English conversation?`,
    followUpQuestions: [
      `Great explanation! Can you give me a specific example of how you'd phrase this in a workplace or global setting?`,
      `Nice! If someone asked a tough follow-up question on "${lessonTitle}", how would you respond calmly?`,
    ],
    recommendedVocab: ["in practice", "for instance", "key point", "my perspective", "clear structure", "outcome"],
    starterHint: `Regarding ${lessonTitle}, the key point I apply in practice is... For instance,...`,
    coachingTip: "Fokus gunakan kalimat aktif yang jelas dan contoh singkat dari pengalamanmu sendiri.",
  }));
}

/**
 * Builds ordered PackageScenarioGroup list:
 * 1. User's actual enrolled courses FIRST (marked isEnrolled = true)
 * 2. Official English Ready catalog packages right after for exploration
 */
export function buildPackageGroupsForStudent(
  enrolledCourses: EnrolledPackageInput[] = []
): PackageScenarioGroup[] {
  const groups: PackageScenarioGroup[] = [];
  const addedSlugs = new Set<string>();

  // 1. User's enrolled packages first — official syllabus packages ordered ahead of generic/test courses
  const sortedEnrolled = [...enrolledCourses].sort((a, b) => {
    const aOfficial = PACKAGE_SCENARIO_BANK[a.slug] ? 0 : 1;
    const bOfficial = PACKAGE_SCENARIO_BANK[b.slug] ? 0 : 1;
    return aOfficial - bOfficial;
  });

  for (const course of sortedEnrolled) {
    if (addedSlugs.has(course.slug)) continue;
    addedSlugs.add(course.slug);

    const bankEntry = PACKAGE_SCENARIO_BANK[course.slug];
    const td = tierDisplay(course.tier);

    if (bankEntry) {
      groups.push({
        key: `enrolled_${course.courseId}`,
        courseId: course.courseId,
        slug: course.slug,
        packageName: course.title || bankEntry.packageName,
        shortName: bankEntry.shortName,
        tierLabel: td.label,
        tierAccent: td.accent,
        levelLabel: bankEntry.levelLabel,
        isEnrolled: true,
        scenarios: bankEntry.scenarios,
      });
    } else {
      groups.push({
        key: `enrolled_${course.courseId}`,
        courseId: course.courseId,
        slug: course.slug,
        packageName: course.title,
        shortName: course.title.split(":")[0].trim(),
        tierLabel: td.label,
        tierAccent: td.accent,
        levelLabel: normalizeLevel(course.level),
        isEnrolled: true,
        scenarios: buildDynamicCourseScenarios(course),
      });
    }
  }

  // 2. Official 7 English Ready packages for exploration (excluding duplicates)
  const officialOrder = [
    "ready-daily",
    "cohort-ready-for-work",
    "ready-to-go-ielts-track",
    "cohort-ready-for-the-world",
    "ready-path-executive",
    "ready-coach-1on1",
    "ready-holiday-camp",
  ];

  for (const slug of officialOrder) {
    if (addedSlugs.has(slug)) continue;
    const bankEntry = PACKAGE_SCENARIO_BANK[slug];
    if (!bankEntry) continue;
    addedSlugs.add(slug);

    const td = tierDisplay(bankEntry.tier);
    groups.push({
      key: `pkg_${slug}`,
      courseId: null,
      slug,
      packageName: bankEntry.packageName,
      shortName: bankEntry.shortName,
      tierLabel: td.label,
      tierAccent: td.accent,
      levelLabel: bankEntry.levelLabel,
      isEnrolled: false,
      scenarios: bankEntry.scenarios,
    });
  }

  return groups;
}

// Backward-compatible flat export
export const SPEAKING_SCENARIOS: SpeakingScenario[] = [
  ...PACKAGE_SCENARIO_BANK["cohort-ready-for-work"].scenarios,
  ...PACKAGE_SCENARIO_BANK["ready-daily"].scenarios,
];
