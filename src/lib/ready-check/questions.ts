import type { ProgramGoalSlug } from "./types";

export const PART1_GOAL_OPTIONS: Array<{
  id: ProgramGoalSlug;
  label: string;
  hint: string;
}> = [
  {
    id: "ready-to-speak",
    label: "Berani bicara di percakapan kerja sehari-hari",
    hint: "Mengatasi rasa grogi dan membiasakan alur pikir bahasa Inggris",
  },
  {
    id: "ready-for-work",
    label: "Wawancara kerja, rapat global & presentasi kantor",
    hint: "Fokus karier profesional, STAR interview, dan komunikasi tim",
  },
  {
    id: "ready-to-go",
    label: "Persiapan beasiswa, IELTS & kuliah luar negeri",
    hint: "Latihan wawancara beasiswa dan diskusi akademik terstruktur",
  },
  {
    id: "ready-for-the-world",
    label: "Memimpin rapat & kolaborasi lintas negara",
    hint: "Nuansa eksekutif, negosiasi tingkat lanjut, dan kepemimpinan",
  },
];

export const PART1_SITUATION_OPTIONS: Array<{
  id: string;
  label: string;
}> = [
  { id: "wawancara", label: "Wawancara kerja (HR / User)" },
  { id: "rapat", label: "Rapat online lintas negara" },
  { id: "presentasi", label: "Presentasi proyek / pitching" },
  { id: "email", label: "Menulis email & chat formal" },
];

export interface ListeningQuestion {
  id: string;
  speaker: string;
  context: string;
  audioScript: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export const PART2_LISTENING_QUESTIONS: ListeningQuestion[] = [
  {
    id: "listen_timeline",
    speaker: "Rachel · Regional Product Lead",
    context: "Potongan rekaman rapat sinkronisasi tim produk:",
    audioScript:
      "Hi team, thanks for jumping on this call. Because QA found two edge cases on checkout, we're moving the release freeze from Wednesday to Friday morning. Please share your updated estimates in Slack before 4 PM today so we can align with Singapore.",
    question: "Apa yang diminta pembicara kepada tim hari ini?",
    options: [
      "Merilis fitur checkout langsung pada hari Rabu pagi",
      "Mengirim pembaruan estimasi waktu di Slack sebelum jam 4 sore",
      "Menunda seluruh proyek selama dua minggu penuh",
      "Menghubungi tim QA untuk menghentikan pengujian",
    ],
    correctIndex: 1,
  },
  {
    id: "listen_tradeoff",
    speaker: "Daniel · Engineering Manager",
    context: "Potongan diskusi prioritas fitur dengan tim:",
    audioScript:
      "We can launch the new dashboard tomorrow with partial metrics, or take two extra days to include customer cohort filtering. Given the leadership review is next Monday, waiting until Thursday gives us much stronger data without hurting the deadline.",
    question: "Mengapa pembicara menyarankan menunggu dua hari lagi?",
    options: [
      "Agar data cohort pelanggan lebih kuat untuk presentasi Senin",
      "Karena server dashboard belum selesai dipasang",
      "Supaya tim bisa libur lebih awal minggu ini",
      "Karena fitur metrik parsial tidak disetujui klien",
    ],
    correctIndex: 0,
  },
  {
    id: "listen_client",
    speaker: "Mei · Enterprise Client",
    context: "Potongan panggilan onboarding klien regional:",
    audioScript:
      "Overall the platform looks intuitive, and our managers are excited. Our only concern is whether our regional staff can complete the baseline setup before next month's audit without dedicated IT support.",
    question: "Apa kekhawatiran utama yang disampaikan klien?",
    options: [
      "Harga langganan platform dianggap terlalu mahal",
      "Tampilan platform terasa terlalu rumit untuk manajer",
      "Apakah staf daerah bisa menyelesaikan setup sebelum audit bulan depan tanpa tim IT khusus",
      "Audit perusahaan dimajukan menjadi minggu depan",
    ],
    correctIndex: 2,
  },
];

export interface WorkplaceContextQuestion {
  id: string;
  dimension: "ketepatan" | "lintasBudaya";
  context: string;
  prompt: string;
  options: string[];
  correctIndex: number;
}

export const PART3_CONTEXT_QUESTIONS: WorkplaceContextQuestion[] = [
  {
    id: "ctx_disagree",
    dimension: "lintasBudaya",
    context: "Di rapat regional, manajer mengusulkan tenggat 2 hari yang menurutmu berisiko.",
    prompt: "Kalimat mana yang paling profesional dan sopan untuk menyampaikan keberatan?",
    options: [
      "No, that is impossible. You don't understand how long our work takes.",
      "I see why Friday works well for the launch. To keep quality safe, could we review which scope should go in phase one?",
      "Maybe yes, maybe no, I will just try whatever you say.",
      "Sorry I am very bad at fast work, please don't give 2 days.",
    ],
    correctIndex: 1,
  },
  {
    id: "ctx_buytime",
    dimension: "lintasBudaya",
    context: "Namamu tiba-tiba dipanggil: “What's your take on this?” dan kamu butuh 5 detik menata ide.",
    prompt: "Kalimat pembuka mana yang paling natural agar tidak terdengar panik atau freeze?",
    options: [
      "Wait, wait, don't ask me first, I am translating in my head.",
      "Uh… no, all good from my side.",
      "That's a great question. From my side, the key priority is balancing timeline and stability—let me break down why.",
      "Silent until someone else speaks.",
    ],
    correctIndex: 2,
  },
  {
    id: "ctx_followup",
    dimension: "ketepatan",
    context: "Setelah rapat selesai, kamu ingin mengirim ringkasan tindak lanjut via email.",
    prompt: "Kalimat mana yang paling tepat secara tata bahasa & ringkas untuk bisnis?",
    options: [
      "Following up on our call, I've attached the revised timeline and highlighted two action items for Thursday's review.",
      "After finish meeting, I am attach the timeline and please you see two items.",
      "I following up our meeting already, here is timeline revised for we look.",
      "Please find attachedly the revision timeline that we talk before.",
    ],
    correctIndex: 0,
  },
];

export interface SpeakingPromptTask {
  id: string;
  eyebrow: string;
  context: string;
  question: string;
  instruction: string;
  tip: string;
  targetSeconds: number;
  suggestedStarter: string;
}

export const PART4_SPEAKING_PROMPTS: SpeakingPromptTask[] = [
  {
    id: "rc_standup_intro",
    eyebrow: "Skenario harian",
    context: "Saat weekly check-in tim, rekan kerja dari kantor lain bertanya:",
    question: "“Could you walk us through what you focused on this week and one challenge you solved?”",
    instruction: "Jawab singkat dalam bahasa Inggris selama 20–45 detik. Ceritakan fokus dan langkahmu.",
    tip: "Mulai dengan satu kalimat ringkas: “This week, I focused on… One challenge we faced was… so we…”",
    targetSeconds: 45,
    suggestedStarter:
      "This week, I focused on preparing our team's sprint deliverables and coordinating with stakeholders...",
  },
  {
    id: "rc_meeting_timeline",
    eyebrow: "Skenario rapat",
    context: "Di rapat online, manajer dari kantor regional bertanya padamu:",
    question: "“What do you think about the new project timeline?”",
    instruction: "Jawab dalam bahasa Inggris selama 30–45 detik. Sampaikan pendapat dan satu alasan.",
    tip: "Tidak perlu sempurna. Yang dinilai: kelancaran, kejelasan, dan cara menyampaikan pendapat dengan sopan.",
    targetSeconds: 45,
    suggestedStarter:
      "I think the new timeline is achievable if we prioritize the core deliverables first and add a small buffer for testing...",
  },
];

