/**
 * CBT (Computer-Based Test) Exam Engine for English Ready
 * Aligned with Official "Paket Jago Bahasa Inggris (A1–A3 & Daily English Conversation)":
 * 1. vocab_match     — Vocabulary Matching / Pilihan Arti (A/B/C/D)
 * 2. text_fill       — Complete the Sentences (Levenshtein Typo Fuzzy Scoring)
 * 3. translate       — Translate into English (Fuzzy + Key-Phrase Scoring)
 * 4. audio_speaking  — Speaking Interview Test (Level A1/A2/A3, Can, 10 Tenses, WH-Questions)
 */

export type CbtQuestionType =
  | "vocab_match"
  | "text_fill"
  | "translate"
  | "audio_speaking";

export type CbtSectionName =
  | "Vocabulary & Matching"
  | "Complete the Sentences"
  | "Translate into English"
  | "Grammar & 10 Tenses"
  | "WH-Questions Interview"
  | "Speaking Level A1–A3"
  | "Reading & Grammar"
  | "Listening & Speaking"
  | "Business English";

export interface CbtQuestion {
  id: string;
  type: CbtQuestionType;
  section: CbtSectionName;
  title: string;
  instructions: string;
  question: string;
  passage?: string;
  audioPrompt?: string;
  options?: string[];
  correctOptionIndex?: number;
  targetAnswer: string;
  acceptableAnswers?: string[];
  keyPhrases?: string[];
  timeLimitSeconds: number;
  points: number;
}

export interface CbtUserAnswer {
  questionId: string;
  type: CbtQuestionType;
  userResponse: string;
  secondsTaken: number;
  earnedPoints: number;
  maxPoints: number;
  similarity: number;
  feedback: string;
  status: "answered" | "timed_out" | "skipped";
}

export interface CbtExamResult {
  totalEarnedPoints: number;
  totalPossiblePoints: number;
  finalPercentage: number;
  passingScore: number;
  passed: boolean;
  readingScore: number;
  speakingScore: number;
  answers: Record<string, CbtUserAnswer>;
  completedAt: string;
}

export interface CbtExamPreset {
  id: string;
  label: string;
  shortLabel: string;
  levelBadge: string;
  description: string;
  instructions: string;
  questions: CbtQuestion[];
}

/**
 * Official 5-Aspect Speaking Test Rubric (Total 100)
 * From "Kompilasi Lengkap Paket Jago Bahasa Inggris A1–A3" Bagian 7
 */
export const OFFICIAL_SPEAKING_RUBRIC = [
  { aspect: "Grammar Accuracy", maxScore: 20, criteria: "Ketepatan struktur kalimat, tenses, dan penggunaan modal." },
  { aspect: "Vocabulary", maxScore: 20, criteria: "Ketepatan pilihan kata, variasi kosakata, dan kesesuaian konteks." },
  { aspect: "Pronunciation", maxScore: 20, criteria: "Kejelasan pengucapan, tekanan kata, dan intonasi." },
  { aspect: "Fluency", maxScore: 20, criteria: "Kelancaran berbicara, kesinambungan ide, dan jeda yang wajar." },
  { aspect: "Confidence & Communication", maxScore: 20, criteria: "Keberanian, interaksi, dan kesiapan menjawab secara natural." },
] as const;

export function getOfficialGradeLabel(score: number): string {
  if (score >= 86) return "Sangat Baik (86–100)";
  if (score >= 71) return "Baik (71–85)";
  if (score >= 56) return "Cukup (56–70)";
  return "Perlu Bimbingan (0–55)";
}

/**
 * Preset 1: Level A1 — Beginner & Daily English Conversation
 */
const PRESET_A1_DAILY: CbtQuestion[] = [
  {
    id: "a1-q1",
    type: "vocab_match",
    section: "Vocabulary & Matching",
    title: "Kosakata Dasar: Greetings & Self-Introduction",
    instructions: "Pilih arti Bahasa Indonesia yang paling tepat untuk kata bahasa Inggris berikut.",
    question: "Apa arti dari kata 'Friendly'?",
    options: ["Pendiam", "Ramah", "Sibuk", "Tepat waktu"],
    correctOptionIndex: 1,
    targetAnswer: "Ramah",
    timeLimitSeconds: 60,
    points: 10,
  },
  {
    id: "a1-q2",
    type: "vocab_match",
    section: "Vocabulary & Matching",
    title: "Kosakata Dasar: Daily Morning Routine",
    instructions: "Pilih arti Bahasa Indonesia yang paling tepat untuk kata kerja berikut.",
    question: "Apa arti dari kata 'Prepare'?",
    options: ["Menyiapkan", "Meninggalkan", "Mencuci", "Beristirahat"],
    correctOptionIndex: 0,
    targetAnswer: "Menyiapkan",
    timeLimitSeconds: 60,
    points: 10,
  },
  {
    id: "a1-q3",
    type: "text_fill",
    section: "Complete the Sentences",
    title: "Daily Morning Routine (Simple Present)",
    instructions: "Lengkapi kalimat rutinitas pagi berikut dengan kata yang tepat.",
    passage: "Pilihan kata: wake up, breakfast, shower, school",
    question: "Every morning, I usually _____ at five o'clock and pray.",
    targetAnswer: "wake up",
    acceptableAnswers: ["wake up", "get up"],
    timeLimitSeconds: 75,
    points: 10,
  },
  {
    id: "a1-q4",
    type: "text_fill",
    section: "Complete the Sentences",
    title: "Family Members — Counting People",
    instructions: "Lengkapi kalimat perkenalan keluarga berikut dengan kata yang tepat.",
    passage: "Pilihan kata: family, teacher, office, friendly",
    question: "There are four people in my _____. We support and help one another.",
    targetAnswer: "family",
    acceptableAnswers: ["family"],
    timeLimitSeconds: 75,
    points: 10,
  },
  {
    id: "a1-q5",
    type: "translate",
    section: "Translate into English",
    title: "Terjemahan: Perkenalan Diri",
    instructions: "Terjemahkan kalimat Bahasa Indonesia berikut ke dalam bahasa Inggris yang baik dan benar.",
    question: "Senang bertemu dengan Anda.",
    targetAnswer: "Nice to meet you.",
    acceptableAnswers: ["Nice to meet you", "Nice to meet you.", "Pleased to meet you", "Glad to meet you"],
    timeLimitSeconds: 90,
    points: 15,
  },
  {
    id: "a1-q6",
    type: "translate",
    section: "Translate into English",
    title: "Terjemahan: Rutinitas Pagi",
    instructions: "Terjemahkan kalimat Bahasa Indonesia berikut ke dalam bahasa Inggris.",
    question: "Saya mandi dan sarapan setiap pagi.",
    targetAnswer: "I take a shower and have breakfast every morning.",
    acceptableAnswers: [
      "I take a shower and have breakfast every morning",
      "I take a bath and have breakfast every morning",
      "I take a shower and eat breakfast every morning",
    ],
    keyPhrases: ["take a shower", "breakfast", "every morning"],
    timeLimitSeconds: 90,
    points: 15,
  },
  {
    id: "a1-q7",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test A1 — Can You Introduce Yourself?",
    instructions: "Dengarkan pertanyaan penguji, lalu perkenalkan dirimu (nama, tempat tinggal, pekerjaan/status) menggunakan suara.",
    audioPrompt: "Hello! Can you introduce yourself? Tell me your name, where you live, and what you do.",
    question: "Jawab secara lisan dalam bahasa Inggris: sebutkan nama, tempat tinggal, dan aktivitas/pekerjaanmu.",
    targetAnswer: "Hello, my name is Rina. I am a student and I live in Padang.",
    keyPhrases: ["my name", "i am", "i live", "from", "student", "work"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "a1-q8",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test CAN — Daily Routine & Ability",
    instructions: "Dengarkan pertanyaan menggunakan modal CAN, lalu jawab dalam kalimat lengkap bahasa Inggris.",
    audioPrompt: "Can you explain your daily morning routine? What time do you wake up and what do you do?",
    question: "Jawab secara lisan: jelaskan jam bangun pagi dan 2–3 kegiatan rutinmu di pagi hari.",
    targetAnswer: "I usually wake up at five o'clock, take a shower, pray, and have breakfast.",
    keyPhrases: ["wake up", "morning", "shower", "breakfast", "usually", "o'clock", "five", "six"],
    timeLimitSeconds: 120,
    points: 15,
  },
];

/**
 * Preset 2: Level A2 — Meeting the Teacher at School (Pertemuan 3 Lengkap!)
 */
const PRESET_A2_SCHOOL: CbtQuestion[] = [
  {
    id: "a2-q1",
    type: "vocab_match",
    section: "Vocabulary & Matching",
    title: "Vocabulary Pertemuan 3 — Meeting the Teacher",
    instructions: "Cocokkan kata bahasa Inggris berikut dengan arti Bahasa Indonesia yang tepat.",
    question: "Apa arti dari kata 'Progress'?",
    options: ["Kehadiran", "Perilaku", "Perkembangan", "Kepala sekolah"],
    correctOptionIndex: 2,
    targetAnswer: "Perkembangan",
    timeLimitSeconds: 60,
    points: 10,
  },
  {
    id: "a2-q2",
    type: "vocab_match",
    section: "Vocabulary & Matching",
    title: "Vocabulary Pertemuan 3 — School Terms",
    instructions: "Cocokkan kata bahasa Inggris berikut dengan arti Bahasa Indonesia yang tepat.",
    question: "Apa arti dari kata 'Attendance'?",
    options: ["Kehadiran", "Nilai rapor", "Pekerjaan rumah", "Ruang kelas"],
    correctOptionIndex: 0,
    targetAnswer: "Kehadiran",
    timeLimitSeconds: 60,
    points: 10,
  },
  {
    id: "a2-q3",
    type: "text_fill",
    section: "Complete the Sentences",
    title: "Complete the Sentences — Pertemuan 3 (A)",
    instructions: "Lengkapi kalimat berikut dengan satu kata yang paling tepat dari pilihan kata.",
    passage: "Pilihan kata: teacher, school, homework, progress, friendly, classroom, grades, parent, study, improve",
    question: "My child has to finish his _____ before watching television.",
    targetAnswer: "homework",
    acceptableAnswers: ["homework", "assignment"],
    timeLimitSeconds: 75,
    points: 10,
  },
  {
    id: "a2-q4",
    type: "text_fill",
    section: "Complete the Sentences",
    title: "Complete the Sentences — Pertemuan 3 (B)",
    instructions: "Lengkapi kalimat berikut dengan kata kerja yang tepat sesuai konteks perkembangan belajar.",
    passage: "Pilihan kata: teacher, school, homework, progress, friendly, classroom, grades, parent, study, improve",
    question: "My child needs to _____ his mathematics skills.",
    targetAnswer: "improve",
    acceptableAnswers: ["improve", "practice", "practise"],
    timeLimitSeconds: 75,
    points: 10,
  },
  {
    id: "a2-q5",
    type: "translate",
    section: "Translate into English",
    title: "Translate into English — Bertanya Perkembangan Anak",
    instructions: "Terjemahkan kalimat berikut ke dalam bahasa Inggris sesuai Useful Expressions Pertemuan 3.",
    question: "Saya ingin bertanya tentang perkembangan anak saya.",
    targetAnswer: "I want to ask about my child's progress.",
    acceptableAnswers: [
      "I want to ask about my child's progress",
      "I'd like to ask about my child's progress",
      "I would like to ask about my child's progress",
    ],
    keyPhrases: ["ask", "child", "progress"],
    timeLimitSeconds: 90,
    points: 15,
  },
  {
    id: "a2-q6",
    type: "translate",
    section: "Translate into English",
    title: "Translate into English — Menanyakan Keaktifan di Kelas",
    instructions: "Terjemahkan kalimat tanya berikut ke dalam bahasa Inggris.",
    question: "Apakah anak saya aktif di kelas?",
    targetAnswer: "Is my child active in class?",
    acceptableAnswers: [
      "Is my child active in class?",
      "Is my child active in class",
      "Does my child participate in class?",
    ],
    keyPhrases: ["my child", "active", "class"],
    timeLimitSeconds: 90,
    points: 15,
  },
  {
    id: "a2-q7",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test A2 — Meeting the Teacher Role Play",
    instructions: "Dengarkan sapaan guru, lalu perkenalkan dirimu sebagai orang tua dan tanyakan nilai serta perkembangan anakmu.",
    audioPrompt: "Good morning! Welcome to our school. How can I help you today?",
    question: "Jawab secara lisan sebagai Orang Tua: sapa guru, perkenalkan dirimu, dan tanyakan perkembangan atau nilai anakmu.",
    targetAnswer: "Good morning, Ma'am. I am Andi's mother. I would like to ask about his progress and grades at school.",
    keyPhrases: ["good morning", "ask", "progress", "grades", "child", "school", "active"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "a2-q8",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test A2 — Last Weekend (Simple Past)",
    instructions: "Dengarkan pertanyaan penguji, lalu ceritakan kegiatanmu akhir pekan lalu menggunakan Simple Past Tense.",
    audioPrompt: "What did you do last weekend? Did you spend time with your family or friends?",
    question: "Jawab secara lisan dalam kalimat lengkap menggunakan bentuk lampau (Simple Past).",
    targetAnswer: "Last weekend I visited my relatives and watched a movie with my family.",
    keyPhrases: ["visited", "watched", "went", "stayed", "played", "family", "friends", "weekend"],
    timeLimitSeconds: 120,
    points: 15,
  },
];

/**
 * Preset 3: Level A3 — Developing (Bridge to B1) & 10 Grammar/Tenses
 */
const PRESET_A3_TENSES: CbtQuestion[] = [
  {
    id: "a3-q1",
    type: "vocab_match",
    section: "Vocabulary & Matching",
    title: "Kosakata Level A3 — Giving Opinions & Goals",
    instructions: "Pilih arti Bahasa Indonesia yang paling tepat untuk kata berikut.",
    question: "Apa arti dari kata 'Unforgettable'?",
    options: ["Tidak terlupakan", "Tanggung jawab", "Menantang", "Tepat waktu"],
    correctOptionIndex: 0,
    targetAnswer: "Tidak terlupakan",
    timeLimitSeconds: 60,
    points: 10,
  },
  {
    id: "a3-q2",
    type: "text_fill",
    section: "Grammar & 10 Tenses",
    title: "10 Tenses — Present Perfect (Pengalaman)",
    instructions: "Lengkapi kalimat Present Perfect berikut dengan bentuk Verb 3 (past participle) yang benar.",
    passage: "Pola Present Perfect: have / has + Verb 3",
    question: "I have _____ (learn) presentation and teamwork skills recently.",
    targetAnswer: "learned",
    acceptableAnswers: ["learned", "learnt"],
    timeLimitSeconds: 90,
    points: 10,
  },
  {
    id: "a3-q3",
    type: "text_fill",
    section: "Grammar & 10 Tenses",
    title: "10 Tenses — Past Continuous",
    instructions: "Lengkapi kalimat Past Continuous berikut dengan bentuk kerja yang tepat.",
    passage: "Pola Past Continuous: was / were + Verb-ing",
    question: "When my friend called last night, I was _____ (have) dinner with my family.",
    targetAnswer: "having",
    acceptableAnswers: ["having", "eating"],
    timeLimitSeconds: 90,
    points: 10,
  },
  {
    id: "a3-q4",
    type: "text_fill",
    section: "Grammar & 10 Tenses",
    title: "10 Tenses — Simple Past (Irregular Verb)",
    instructions: "Lengkapi kalimat berikut menggunakan bentuk lampau (Verb 2) yang tepat.",
    passage: "Pola Simple Past: Subject + Verb 2",
    question: "I _____ (choose) this study programme because I enjoy technology.",
    targetAnswer: "chose",
    acceptableAnswers: ["chose"],
    timeLimitSeconds: 90,
    points: 10,
  },
  {
    id: "a3-q5",
    type: "translate",
    section: "Translate into English",
    title: "Translate Level A3 — Memberi Saran (Modal Should)",
    instructions: "Terjemahkan kalimat saran berikut ke dalam bahasa Inggris menggunakan modal 'should'.",
    question: "Saya pikir siswa sebaiknya berlatih berbicara setiap hari.",
    targetAnswer: "I think students should practice speaking every day.",
    acceptableAnswers: [
      "I think students should practice speaking every day",
      "I think students should practise speaking every day",
      "I think students should practice speaking everyday",
    ],
    keyPhrases: ["think", "students", "should", "speaking", "every day"],
    timeLimitSeconds: 90,
    points: 15,
  },
  {
    id: "a3-q6",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test A3 — Overcoming a Challenge",
    instructions: "Dengarkan pertanyaan Level A3, lalu jelaskan satu tantangan sulit yang pernah kamu hadapi dan cara mengatasinya.",
    audioPrompt: "What is one difficult challenge you have faced, and how did you overcome it?",
    question: "Jawab secara lisan (2–3 kalimat): ceritakan tantangan yang pernah dihadapi dan langkah konkret yang kamu lakukan.",
    targetAnswer: "I once had difficulty speaking in public. I practised regularly and gradually became more confident.",
    keyPhrases: ["challenge", "difficulty", "practised", "practiced", "overcame", "confident", "improve", "learn"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "a3-q7",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test A3 — Importance of Teamwork",
    instructions: "Dengarkan pertanyaan tentang kerja tim, lalu sampaikan opinimu disertai alasan yang jelas.",
    audioPrompt: "Why is teamwork important in school or at work?",
    question: "Jawab secara lisan: jelaskan mengapa kerja tim penting di sekolah atau tempat kerja.",
    targetAnswer: "Teamwork allows people to share ideas, divide tasks, and solve problems more effectively.",
    keyPhrases: ["teamwork", "share", "ideas", "tasks", "solve", "problems", "together", "goals", "effectively"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "a3-q8",
    type: "audio_speaking",
    section: "Speaking Level A1–A3",
    title: "Speaking Test A3 — Five-Year Goals (Modal Would / Will)",
    instructions: "Dengarkan pertanyaan tentang target 5 tahun ke depan, lalu jawab dengan struktur kalimat masa depan.",
    audioPrompt: "What goals would you like to achieve in the next five years?",
    question: "Jawab secara lisan: sebutkan target karier atau pengembangan dirimu dalam 5 tahun mendatang.",
    targetAnswer: "I hope to improve my professional skills, gain work experience, and become more independent.",
    keyPhrases: ["goal", "hope", "would like", "will", "skills", "experience", "career", "independent", "future"],
    timeLimitSeconds: 120,
    points: 15,
  },
];

/**
 * Preset 4: English Speaking Interview Test — WH Questions (Adult Employees)
 */
const PRESET_WH_INTERVIEW: CbtQuestion[] = [
  {
    id: "wh-q1",
    type: "vocab_match",
    section: "WH-Questions Interview",
    title: "Aturan WH-Questions: How Many vs How Much",
    instructions: "Pilih penggunaan kata tanya yang tepat untuk benda yang dapat dihitung (countable nouns).",
    question: "Kalimat mana yang benar untuk menanyakan jumlah rapat per minggu?",
    options: [
      "How much meetings do you attend every week?",
      "How many meetings do you attend every week?",
      "What many meetings do you attend every week?",
      "Where much meetings do you attend every week?",
    ],
    correctOptionIndex: 1,
    targetAnswer: "How many meetings do you attend every week?",
    timeLimitSeconds: 60,
    points: 10,
  },
  {
    id: "wh-q2",
    type: "text_fill",
    section: "WH-Questions Interview",
    title: "WH-Questions — How Much (Uncountable)",
    instructions: "Lengkapi pertanyaan interview berikut dengan 'How many' atau 'How much'.",
    passage: "Catatan: How many = countable nouns; How much = uncountable nouns (time, money, experience).",
    question: "_____ time do you spend commuting to work every day?",
    targetAnswer: "How much",
    acceptableAnswers: ["How much", "how much"],
    timeLimitSeconds: 75,
    points: 10,
  },
  {
    id: "wh-q3",
    type: "text_fill",
    section: "WH-Questions Interview",
    title: "Workplace Daily Tasks — Complete the Sentence",
    instructions: "Lengkapi kalimat tanggung jawab kerja berikut dengan kata benda yang tepat.",
    passage: "Pilihan kata: deadline, report, colleague, schedule",
    question: "I am preparing the monthly financial _____ because the deadline is tomorrow afternoon.",
    targetAnswer: "report",
    acceptableAnswers: ["report", "document"],
    timeLimitSeconds: 75,
    points: 10,
  },
  {
    id: "wh-q4",
    type: "translate",
    section: "Translate into English",
    title: "Translate — Menjelaskan Tanggung Jawab Kerja",
    instructions: "Terjemahkan kalimat jawaban interview berikut ke dalam bahasa Inggris.",
    question: "Saya mengelola dokumen, menyiapkan laporan, dan berkomunikasi dengan pelanggan.",
    targetAnswer: "I manage documents, prepare reports, and communicate with customers.",
    acceptableAnswers: [
      "I manage documents, prepare reports, and communicate with customers",
      "I manage documents, prepare reports, and communicate with clients",
    ],
    keyPhrases: ["manage", "documents", "reports", "communicate", "customers"],
    timeLimitSeconds: 90,
    points: 15,
  },
  {
    id: "wh-q5",
    type: "audio_speaking",
    section: "WH-Questions Interview",
    title: "WH Interview (WHAT) — Job & Responsibilities",
    instructions: "Dengarkan pertanyaan pewawancara, lalu jelaskan pekerjaan dan tanggung jawab utamamu secara lisan.",
    audioPrompt: "What do you do for a living, and what are your main responsibilities at work?",
    question: "Jawab secara lisan dengan kalimat lengkap (sebutkan peran dan 2–3 tugas utama).",
    targetAnswer: "I work as an administrative staff member. I manage documents, prepare reports, and communicate with customers.",
    keyPhrases: ["work", "manage", "prepare", "communicate", "responsibilities", "team", "reports", "documents"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "wh-q6",
    type: "audio_speaking",
    section: "WH-Questions Interview",
    title: "WH Interview (WHY) — Importance of English",
    instructions: "Dengarkan pertanyaan WHY, lalu sampaikan alasanmu menggunakan 'because'.",
    audioPrompt: "Why is English important for your career?",
    question: "Jawab secara lisan: jelaskan mengapa bahasa Inggris penting bagi kariermu.",
    targetAnswer: "English is important because it helps me communicate with international clients and get better career opportunities.",
    keyPhrases: ["because", "communicate", "international", "clients", "career", "opportunities", "important"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "wh-q7",
    type: "audio_speaking",
    section: "WH-Questions Interview",
    title: "WH Interview (HOW) — Handling Work Pressure",
    instructions: "Dengarkan pertanyaan HOW, lalu jelaskan strategimu mengelola waktu atau tekanan di tempat kerja.",
    audioPrompt: "How do you handle pressure and manage your time at work?",
    question: "Jawab secara lisan: jelaskan cara kamu tetap tenang dan mengatur prioritas kerja.",
    targetAnswer: "I stay calm, make a daily schedule, prioritize important tasks, and focus on finding solutions.",
    keyPhrases: ["calm", "schedule", "prioritize", "tasks", "focus", "solutions", "manage", "time"],
    timeLimitSeconds: 120,
    points: 15,
  },
  {
    id: "wh-q8",
    type: "audio_speaking",
    section: "WH-Questions Interview",
    title: "WH Interview (HOW MANY / HOW MUCH) — Work Routine",
    instructions: "Dengarkan pertanyaan kuantitas, lalu jawab dengan angka dan durasi yang jelas dalam bahasa Inggris.",
    audioPrompt: "How many hours do you work every day, and how much time do you spend learning English?",
    question: "Jawab secara lisan: sebutkan jumlah jam kerja per hari dan waktu belajar bahasa Inggrismu.",
    targetAnswer: "I work for eight hours every day, and I spend about one hour learning English every day.",
    keyPhrases: ["hours", "every day", "work", "spend", "learning", "english", "minutes", "hour"],
    timeLimitSeconds: 120,
    points: 10,
  },
];

export const CBT_EXAM_PRESETS: CbtExamPreset[] = [
  {
    id: "a1_daily",
    label: "Level A1 — Beginner & Daily Conversation (8 Soal)",
    shortLabel: "Paket A1 (Daily)",
    levelBadge: "A1 Beginner",
    description: "Vocabulary Matching, Complete the Sentences, Translate, dan Speaking A1 + Modal CAN.",
    instructions: "Ujian Paket Jago Bahasa Inggris Level A1 (Beginner). Kerjakan bagian tertulis (Kosakata, Melengkapi Kalimat, Terjemahan) lalu lanjut ke Speaking Test.",
    questions: PRESET_A1_DAILY,
  },
  {
    id: "a2_school_daily",
    label: "Level A2 — Meeting the Teacher & Daily Life (8 Soal)",
    shortLabel: "Paket A2 (Pertemuan 3)",
    levelBadge: "A2 Elementary",
    description: "Diambil langsung dari Pertemuan 3 (Meeting the Teacher at School): Vocabulary, Complete the Sentences, Translate, Role Play & Speaking A2.",
    instructions: "Ujian Paket Jago Bahasa Inggris Level A2 — Pertemuan 3 (Meeting the Teacher at School). Kerjakan seluruh latihan tertulis dan speaking dengan kalimat lengkap.",
    questions: PRESET_A2_SCHOOL,
  },
  {
    id: "a3_tenses",
    label: "Level A3 — Developing & 10 Grammar/Tenses (8 Soal)",
    shortLabel: "Paket A3 (10 Tenses)",
    levelBadge: "A3 Bridge to B1",
    description: "Latihan 10 Tenses & Modals (Present Perfect, Past Continuous, Simple Past, Should/Would) serta Speaking Test Level A3.",
    instructions: "Ujian Paket Jago Bahasa Inggris Level A3 (Bridge to B1). Fokus pada ketepatan 10 Tenses/Modals, pemberian alasan, opini, dan rencana masa depan.",
    questions: PRESET_A3_TENSES,
  },
  {
    id: "wh_interview",
    label: "Interview WH-Questions — Adult Employees (8 Soal)",
    shortLabel: "Paket WH-Questions",
    levelBadge: "Adult Employees",
    description: "Fokus wawancara kerja (What, When, Who, Where, Why, How, How Many, How Much) & Workplace Daily Tasks.",
    instructions: "English Speaking Interview Test — WH Questions (Adult Employees). Jawab setiap pertanyaan wawancara secara profesional dengan kalimat lengkap dan contoh nyata.",
    questions: PRESET_WH_INTERVIEW,
  },
];

export const CBT_QUESTIONS_PER_EXAM = 10;

/**
 * Default Comprehensive Question Pool (24 Soal — 6 Vocab, 6 Isian, 6 Translate, 6 Speaking @ 10 poin)
 * Used as fallback when instructor hasn't saved custom questions yet.
 * Every student automatically receives a unique randomized set of 10 questions (100 poin).
 */
const ALL_PRESET_QUESTIONS: CbtQuestion[] = [
  ...PRESET_A1_DAILY,
  ...PRESET_A2_SCHOOL,
  ...PRESET_A3_TENSES,
  ...PRESET_WH_INTERVIEW,
];

function buildBalancedPool(source: CbtQuestion[], perType = 6): CbtQuestion[] {
  const types: CbtQuestionType[] = ["vocab_match", "text_fill", "translate", "audio_speaking"];
  const picked: CbtQuestion[] = [];
  for (const t of types) {
    const items = source
      .filter((q) => q.type === t)
      .slice(0, perType)
      .map((q) => ({ ...q, points: 10 }));
    picked.push(...items);
  }
  return picked;
}

export const DEFAULT_CBT_QUESTIONS: CbtQuestion[] = buildBalancedPool(ALL_PRESET_QUESTIONS, 6);

/**
 * Levenshtein Distance Algorithm (Edit Distance)
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.trim().toLowerCase();
  const s2 = b.trim().toLowerCase();

  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

/**
 * Calculates string similarity ratio between 0.0 and 1.0
 */
export function calculateTypoSimilarity(userAnswer: string, target: string): number {
  const s1 = userAnswer.trim().toLowerCase().replace(/[.,!?']/g, "");
  const s2 = target.trim().toLowerCase().replace(/[.,!?']/g, "");

  if (!s1 && !s2) return 1;
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const maxLen = Math.max(s1.length, s2.length);
  const distance = levenshteinDistance(s1, s2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Grades Vocabulary Matching / Multiple Choice question
 */
export function gradeVocabMatchQuestion(selectedAnswer: string, question: CbtQuestion): {
  earnedPoints: number;
  similarity: number;
  feedback: string;
} {
  const clean = selectedAnswer.trim();
  const expected =
    typeof question.correctOptionIndex === "number" && question.options?.[question.correctOptionIndex]
      ? question.options[question.correctOptionIndex]
      : question.targetAnswer;

  if (!clean) {
    return {
      earnedPoints: 0,
      similarity: 0,
      feedback: `Belum memilih jawaban. Jawaban yang benar: "${expected}".`,
    };
  }

  const isCorrect = clean.toLowerCase() === expected.trim().toLowerCase();
  if (isCorrect) {
    return {
      earnedPoints: question.points,
      similarity: 100,
      feedback: `Benar! Pilihan "${expected}" tepat (100%).`,
    };
  }

  return {
    earnedPoints: 0,
    similarity: 0,
    feedback: `Kurang tepat. Jawaban yang benar adalah: "${expected}".`,
  };
}

/**
 * Grades text fill-in-the-blank answer with proportional typo points
 */
export function gradeTextFillQuestion(userAnswer: string, question: CbtQuestion): {
  earnedPoints: number;
  similarity: number;
  feedback: string;
} {
  const cleanAns = userAnswer.trim();
  if (!cleanAns) {
    return {
      earnedPoints: 0,
      similarity: 0,
      feedback: `Tidak ada jawaban yang diisi. Jawaban yang tepat: "${question.targetAnswer}".`,
    };
  }

  const targets = [question.targetAnswer, ...(question.acceptableAnswers || [])].filter(Boolean);
  let maxSim = 0;
  let bestTarget = question.targetAnswer;

  for (const t of targets) {
    const sim = calculateTypoSimilarity(cleanAns, t);
    if (sim > maxSim) {
      maxSim = sim;
      bestTarget = t;
    }
  }

  let ratio = 0;
  let feedback = "";

  if (maxSim >= 0.96) {
    ratio = 1.0;
    feedback = `Sempurna! Jawaban tepat (100% cocok).`;
  } else if (maxSim >= 0.8) {
    ratio = 0.8;
    feedback = `Hampir sempurna! Ada typo ringan (${Math.round(maxSim * 100)}% mirip). Diberikan 80% poin. Jawaban target: "${bestTarget}".`;
  } else if (maxSim >= 0.6) {
    ratio = 0.5;
    feedback = `Cukup baik, namun ada kesalahan ejaan/kurang huruf (${Math.round(maxSim * 100)}% mirip). Diberikan 50% poin. Jawaban target: "${bestTarget}".`;
  } else {
    ratio = 0;
    feedback = `Jawaban belum tepat (${Math.round(maxSim * 100)}% mirip). Kunci jawaban yang benar: "${bestTarget}".`;
  }

  return {
    earnedPoints: Math.round(ratio * question.points * 10) / 10,
    similarity: Math.round(maxSim * 100),
    feedback,
  };
}

/**
 * Grades Translate into English answer (combines fuzzy sentence similarity + key phrase coverage)
 */
export function gradeTranslateQuestion(userAnswer: string, question: CbtQuestion): {
  earnedPoints: number;
  similarity: number;
  feedback: string;
} {
  const cleanAns = userAnswer.trim();
  if (!cleanAns) {
    return {
      earnedPoints: 0,
      similarity: 0,
      feedback: `Terjemahan belum diisi. Contoh terjemahan benar: "${question.targetAnswer}".`,
    };
  }

  const targets = [question.targetAnswer, ...(question.acceptableAnswers || [])].filter(Boolean);
  let maxSim = 0;
  let bestTarget = question.targetAnswer;

  for (const t of targets) {
    const sim = calculateTypoSimilarity(cleanAns, t);
    if (sim > maxSim) {
      maxSim = sim;
      bestTarget = t;
    }
  }

  const phrases = question.keyPhrases || [];
  let phraseHits = 0;
  const lower = cleanAns.toLowerCase();
  for (const p of phrases) {
    if (lower.includes(p.toLowerCase())) phraseHits++;
  }
  const phraseRatio = phrases.length > 0 ? phraseHits / phrases.length : 0;
  const combined = Math.max(maxSim, phraseRatio * 0.9);

  let ratio = 0;
  let feedback = "";

  if (combined >= 0.88) {
    ratio = 1.0;
    feedback = `Terjemahan sangat tepat! (${Math.round(combined * 100)}% akurat).`;
  } else if (combined >= 0.7) {
    ratio = 0.8;
    feedback = `Terjemahan bagus dan makna tersampaikan (${Math.round(combined * 100)}% mirip). Contoh ideal: "${bestTarget}".`;
  } else if (combined >= 0.5) {
    ratio = 0.55;
    feedback = `Cukup mendekati, namun susunan kata/grammar masih perlu diperbaiki (${Math.round(combined * 100)}%). Contoh ideal: "${bestTarget}".`;
  } else {
    ratio = 0;
    feedback = `Terjemahan belum sesuai (${Math.round(combined * 100)}%). Contoh jawaban benar: "${bestTarget}".`;
  }

  return {
    earnedPoints: Math.round(ratio * question.points * 10) / 10,
    similarity: Math.round(combined * 100),
    feedback,
  };
}

/**
 * Grades speaking / voice answer
 */
export function gradeSpeakingQuestion(transcript: string, question: CbtQuestion): {
  earnedPoints: number;
  similarity: number;
  feedback: string;
} {
  const clean = transcript.trim().toLowerCase();
  if (!clean) {
    return {
      earnedPoints: 0,
      similarity: 0,
      feedback: "Tidak ada suara yang terdeteksi. Pastikan microphone aktif dan izin browser diberikan.",
    };
  }

  const phrases = question.keyPhrases || [];
  let phraseMatches = 0;
  const matchedList: string[] = [];

  for (const p of phrases) {
    if (clean.includes(p.toLowerCase())) {
      phraseMatches++;
      matchedList.push(p);
    }
  }

  const phraseRatio = phrases.length > 0 ? phraseMatches / phrases.length : 0.5;
  const directSim = calculateTypoSimilarity(clean, question.targetAnswer);
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  let ratio = 0;
  let feedback = "";

  if (phraseRatio >= 0.45 || directSim >= 0.6) {
    ratio = 1.0;
    feedback = `Luar biasa! Ucapan fasih dan mencakup poin kunci (${matchedList.slice(0, 3).join(", ") || "struktur lengkap"}).`;
  } else if (phraseMatches >= 1 || wordCount >= 6) {
    ratio = 0.75;
    feedback = `Bagus! Respon lisan tersampaikan dengan baik (kata kunci: ${matchedList.join(", ") || "konteks sesuai"}).`;
  } else if (wordCount >= 3) {
    ratio = 0.45;
    feedback = `Suara terdeteksi namun respon masih terlalu singkat (${wordCount} kata). Coba jawab dalam kalimat lengkap.`;
  } else {
    ratio = 0.2;
    feedback = `Respon sangat minim. Diberikan poin partisipasi 20%.`;
  }

  const calculatedPoints = Math.round(ratio * question.points * 10) / 10;
  const calculatedSimilarity = Math.round(Math.max(phraseRatio, directSim, ratio) * 100);

  return {
    earnedPoints: calculatedPoints,
    similarity: calculatedSimilarity,
    feedback,
  };
}

function createMulberry32(seedInput: number): () => number {
  let a = seedInput >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mixSeed(userId: number, courseId: number, salt: number): number {
  let h = 2166136261 >>> 0;
  const parts = [userId, courseId, salt];
  for (const part of parts) {
    h ^= part >>> 0;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function shuffleWithMulberry<T>(arr: T[], seedInput: number): T[] {
  const copy = [...arr];
  const rand = createMulberry32(seedInput);
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickStratifiedBucketCounts(
  bucketLengths: [number, number, number, number],
  targetCount: number
): [number, number, number, number] {
  const total = bucketLengths[0] + bucketLengths[1] + bucketLengths[2] + bucketLengths[3];
  if (total <= targetCount) return [...bucketLengths] as [number, number, number, number];

  // Ideal balanced 10-question composition across all 4 CBT types:
  // 3 Vocab A–D + 3 Isian + 2 Translate + 2 Speaking = 10 Soal
  if (
    targetCount === 10 &&
    bucketLengths[0] >= 3 &&
    bucketLengths[1] >= 3 &&
    bucketLengths[2] >= 2 &&
    bucketLengths[3] >= 2
  ) {
    return [3, 3, 2, 2];
  }

  // General proportional stratified allocation for custom bank ratios
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  let remaining = targetCount;

  // First guarantee at least 1 from every non-empty bucket
  for (let i = 0; i < 4; i++) {
    if (bucketLengths[i] > 0 && remaining > 0) {
      counts[i] = 1;
      remaining -= 1;
    }
  }

  // Distribute remaining slots proportionally
  if (remaining > 0) {
    const spares = bucketLengths.map((len, i) => Math.max(0, len - counts[i]));
    const totalSpare = spares.reduce((a, b) => a + b, 0);
    if (totalSpare > 0) {
      for (let i = 0; i < 4; i++) {
        const extra = Math.min(spares[i], Math.floor((remaining * spares[i]) / totalSpare));
        counts[i] += extra;
      }
      let assigned = counts[0] + counts[1] + counts[2] + counts[3];
      let guard = 0;
      while (assigned < targetCount && guard < 40) {
        for (let i = 0; i < 4 && assigned < targetCount; i++) {
          if (counts[i] < bucketLengths[i]) {
            counts[i] += 1;
            assigned += 1;
          }
        }
        guard += 1;
      }
    }
  }

  return counts;
}

/**
 * Deterministic Seeded Random Shuffle & Stratified Sampling per User
 * Guarantees:
 * 1. Each user receives up to `count` questions (default: 10 questions) uniquely drawn from the course pool.
 * 2. Deterministic per (userId, courseId, isRemedial): refreshing mid-exam keeps the exact same 10 questions,
 *    while different users receive different subsets & orders.
 * 3. On remedial retry using the same pool (>= 20 questions), prioritizes unseen questions first!
 * 4. Stage 1: Written (Vocab A–D -> Isian -> Translate), Stage 2: Oral (Speaking Interview).
 */
export function getShuffledQuestionsForUser(
  userId: number,
  questions: CbtQuestion[] = DEFAULT_CBT_QUESTIONS,
  options?: {
    count?: number;
    courseId?: number;
    isRemedial?: boolean;
  }
): CbtQuestion[] {
  const targetCount = options?.count ?? CBT_QUESTIONS_PER_EXAM;
  const courseId = options?.courseId ?? 0;
  const isRemedial = Boolean(options?.isRemedial);

  const drawForSalt = (pool: CbtQuestion[], attemptSalt: number): CbtQuestion[] => {
    const vocab = shuffleWithMulberry(
      pool.filter((q) => q.type === "vocab_match"),
      mixSeed(userId, courseId, attemptSalt + 71)
    );
    const fill = shuffleWithMulberry(
      pool.filter((q) => q.type === "text_fill"),
      mixSeed(userId, courseId, attemptSalt + 101)
    );
    const translate = shuffleWithMulberry(
      pool.filter((q) => q.type === "translate"),
      mixSeed(userId, courseId, attemptSalt + 151)
    );
    const speaking = shuffleWithMulberry(
      pool.filter((q) => q.type === "audio_speaking"),
      mixSeed(userId, courseId, attemptSalt + 202)
    );

    const [vCount, fCount, tCount, sCount] = pickStratifiedBucketCounts(
      [vocab.length, fill.length, translate.length, speaking.length],
      targetCount
    );

    return [
      ...vocab.slice(0, vCount),
      ...fill.slice(0, fCount),
      ...translate.slice(0, tCount),
      ...speaking.slice(0, sCount),
    ];
  };

  if (isRemedial && questions.length > targetCount) {
    // Draw main set first, then prioritize unseen questions for the remedial attempt
    const mainPicked = drawForSalt(questions, 17);
    const seenIds = new Set(mainPicked.map((q) => q.id));
    const unseenPool = questions.filter((q) => !seenIds.has(q.id));
    if (unseenPool.length >= targetCount) {
      return drawForSalt(unseenPool, 9001);
    }
    // Mix all unseen + top-up from shuffled main pool
    const topUp = shuffleWithMulberry(mainPicked, mixSeed(userId, courseId, 9973)).slice(
      0,
      targetCount - unseenPool.length
    );
    return drawForSalt([...unseenPool, ...topUp], 9001);
  }

  return drawForSalt(questions, 17);
}

/**
 * Calculates overall exam result from answers
 */
export function calculateCbtOverallResult(
  userAnswers: Record<string, CbtUserAnswer>,
  questions: CbtQuestion[],
  passingScore = 70
): CbtExamResult {
  let totalEarned = 0;
  let totalPossible = 0;

  let writtenEarned = 0;
  let writtenMax = 0;

  let speakingEarned = 0;
  let speakingMax = 0;

  for (const q of questions) {
    totalPossible += q.points;
    const ans = userAnswers[q.id];
    const earned = ans ? ans.earnedPoints : 0;
    totalEarned += earned;

    if (q.type === "audio_speaking") {
      speakingMax += q.points;
      speakingEarned += earned;
    } else {
      writtenMax += q.points;
      writtenEarned += earned;
    }
  }

  const finalPercentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
  const readingScore = writtenMax > 0 ? Math.round((writtenEarned / writtenMax) * 100) : 0;
  const speakingScore = speakingMax > 0 ? Math.round((speakingEarned / speakingMax) * 100) : 0;

  return {
    totalEarnedPoints: Math.round(totalEarned * 10) / 10,
    totalPossiblePoints: totalPossible,
    finalPercentage,
    passingScore,
    passed: finalPercentage >= passingScore,
    readingScore,
    speakingScore,
    answers: userAnswers,
    completedAt: new Date().toISOString(),
  };
}
