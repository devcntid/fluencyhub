/**
 * Official Lesson Templates from:
 * - Paket_Jago_Bahasa_Inggris_Daily_English_Conversation.md
 * - Kompilasi_Lengkap_Paket_Jago_Bahasa_Inggris_A1-A3.docx
 *
 * Every meeting follows the mandatory 6-part curriculum structure:
 * 1. Vocabulary (20 Verbs, 20 Nouns, 5 Adjectives)
 * 2. Useful Expressions
 * 3. Dialogue (Speaker — English — Arti)
 * 4. Catatan Grammar
 * 5. Role Play (Role A & Role B)
 * 6. Exercise (Matching, Complete the Sentences, Translate, Q&A, Speaking)
 */

export interface PaketJagoLessonTemplate {
  id: string;
  meetingNumber: number;
  level: "A1" | "A2" | "A3";
  title: string;
  durationMinutes: number;
  content: string;
}

export const PAKET_JAGO_LESSON_TEMPLATES: PaketJagoLessonTemplate[] = [
  {
    id: "p1-greetings",
    meetingNumber: 1,
    level: "A1",
    title: "Pertemuan 1: Greetings and Self-Introduction (A1)",
    durationMinutes: 60,
    content: `# Pertemuan 1 — Greetings and Self-Introduction (Level A1)

## 1. Vocabulary (Kosakata Inti)
**A. Verbs (20 Kata Kerja):**
greet, introduce, spell, say, ask, answer, meet, know, live, come, work, study, like, enjoy, remember, repeat, speak, listen, start, finish

**B. Nouns (20 Kata Benda):**
name, age, address, city, country, job, school, class, friend, family, teacher, student, phone, number, language, hobby, day, morning, afternoon, evening

**C. Adjectives (5 Kata Sifat):**
friendly, polite, happy, shy, confident

## 2. Useful Expressions
- Hello, my name is ... (Halo, nama saya ...)
- Nice to meet you. (Senang bertemu dengan Anda.)
- Where are you from? (Dari mana asal Anda?)
- Could you repeat that, please? (Bisakah Anda mengulanginya?)
- How do you say this in English? (Bagaimana cara mengatakan ini dalam bahasa Inggris?)

## 3. Dialogue (Percakapan)
- **A:** Hello, my name is Dina. What is your name? *(Halo, nama saya Dina. Siapa nama Anda?)*
- **B:** I'm Rani. Nice to meet you. *(Saya Rani. Senang bertemu dengan Anda.)*
- **A:** Nice to meet you too. Where are you from? *(Senang bertemu dengan Anda juga. Anda berasal dari mana?)*
- **B:** I'm from Padang. *(Saya berasal dari Padang.)*

## 4. Catatan Grammar (Simple Present & To Be)
- **I am / My name is ...** — Memperkenalkan identitas diri.
- **Where are you from? / Where do you live?** — Menanyakan asal dan tempat tinggal.

## 5. Role Play (Praktik Berpasangan)
- **Role A & Role B:** Perkenalkan dirimu kepada teman kelas baru. Tanyakan nama, kota asal, pekerjaan/status, dan hobi (minimal 8 kalimat).

## 6. Exercise (Latihan)
1. Tulis 5 kalimat perkenalan diri dalam bahasa Inggris lalu ucapkan dengan lantang.
2. Jawab pertanyaan Speaking A1: *What is your name? How old are you? Where do you live? What is your favourite food?*`,
  },
  {
    id: "p2-morning-routine",
    meetingNumber: 2,
    level: "A1",
    title: "Pertemuan 2: Daily Morning Routine (A1)",
    durationMinutes: 60,
    content: `# Pertemuan 2 — Daily Morning Routine (Level A1)

## 1. Vocabulary (Kosakata Inti)
**A. Verbs (20 Kata Kerja):**
wake up, get up, pray, make, brush, wash, take, shower, comb, dress, prepare, cook, eat, drink, pack, leave, check, clean, open, close

**B. Nouns (20 Kata Benda):**
alarm, bed, bathroom, toothbrush, toothpaste, soap, towel, comb, uniform, clothes, breakfast, rice, bread, milk, water, bag, book, kitchen, clock, morning

**C. Adjectives (5 Kata Sifat):**
early, fresh, clean, busy, ready

## 2. Useful Expressions
- What time do you wake up? (Jam berapa kamu bangun?)
- I usually wake up at five o'clock. (Saya biasanya bangun jam lima.)
- What do you do next? (Apa yang kamu lakukan selanjutnya?)
- Have a nice day! (Semoga harimu menyenangkan!)

## 3. Dialogue (Percakapan)
- **A:** What time do you wake up? *(Jam berapa kamu bangun?)*
- **B:** I wake up at five. *(Saya bangun jam lima.)*
- **A:** What do you do next? *(Apa yang kamu lakukan selanjutnya?)*
- **B:** I pray, take a shower, and have breakfast. *(Saya beribadah, mandi, dan sarapan.)*

## 4. Catatan Grammar (Simple Present — Kebiasaan)
- Pola: **Subject + Verb 1 (s/es)** — *I wake up at five. / He brushes his teeth every morning.*

## 5. Role Play
- Ceritakan urutan rutinitas pagimu secara berurutan kepada pasangan belajar.

## 6. Exercise (Latihan)
1. Urutkan 6 aktivitas pagi beserta jamnya dalam bahasa Inggris.
2. Praktik Speaking: *Can you explain your daily morning routine?*`,
  },
  {
    id: "p3-meeting-teacher",
    meetingNumber: 3,
    level: "A2",
    title: "Pertemuan 3: Meeting the Teacher at School (A2 — Materi Lengkap)",
    durationMinutes: 90,
    content: `# Pertemuan 3 — Meeting the Teacher at School (Level A2)

**Tujuan Pembelajaran:** Mampu menyapa guru, memperkenalkan diri, menanyakan kondisi & perkembangan anak, serta melakukan percakapan orang tua–guru dalam bahasa Inggris.

## 1. Vocabulary (Kosakata)
**A. Verbs (20 Kata Kerja):**
Meet (Bertemu), Greet (Menyapa), Introduce (Memperkenalkan), Ask (Bertanya), Answer (Menjawab), Explain (Menjelaskan), Discuss (Membicarakan), Listen (Mendengarkan), Speak (Berbicara), Teach (Mengajar), Learn (Belajar), Study (Mempelajari), Understand (Memahami), Improve (Meningkatkan), Help (Membantu), Guide (Membimbing), Remind (Mengingatkan), Attend (Menghadiri), Practice (Berlatih), Report (Melaporkan).

**B. Nouns (20 Kata Benda):**
Teacher (Guru), Parent (Orang tua), Student (Murid), Child (Anak), School (Sekolah), Classroom (Ruang kelas), Principal (Kepala sekolah), Head teacher (Guru senior), Lesson (Pelajaran), Subject (Mata pelajaran), Homework (PR), Assignment (Tugas), Examination (Ujian), Grade (Nilai), Report card (Rapor), Attendance (Kehadiran), Behavior (Perilaku), Progress (Perkembangan), Schedule (Jadwal), Meeting (Pertemuan).

**C. Adjectives (5 Kata Sifat):**
Friendly (Ramah), Polite (Sopan), Active (Aktif), Quiet (Pendiam/tenang), Responsible (Bertanggung jawab).

## 2. Useful Expressions (Ungkapan Sehari-hari)
- Good morning, Ma'am / Sir. *(Selamat pagi, Bu / Pak.)*
- I'm Andi's mother / father. *(Saya ibu / ayah Andi.)*
- How is my child doing at school? *(Bagaimana perkembangan anak saya di sekolah?)*
- Is my child doing well in class? *(Apakah anak saya belajar dengan baik di kelas?)*
- Does my child participate in class? *(Apakah anak saya aktif di kelas?)*
- How are my child's grades? *(Bagaimana nilai anak saya?)*
- Does my child get along with other students? *(Apakah anak saya bergaul baik dengan murid lain?)*
- What should my child improve? *(Apa yang perlu ditingkatkan oleh anak saya?)*
- Thank you for your advice. *(Terima kasih atas sarannya.)*

## 3. Dialogue (Percakapan Orang Tua & Guru)
- **Parent:** Good morning, Ma'am. *(Selamat pagi, Bu.)*
- **Teacher:** Good morning. How can I help you? *(Selamat pagi. Ada yang bisa saya bantu?)*
- **Parent:** I'm Andi's mother. I'd like to ask about his progress at school. *(Saya ibunya Andi. Saya ingin bertanya tentang perkembangan Andi di sekolah.)*
- **Teacher:** Of course. Andi is doing quite well. *(Tentu. Andi belajar dengan cukup baik.)*
- **Parent:** Is he active in class? *(Apakah dia aktif di kelas?)*
- **Teacher:** Yes, he often asks questions and participates in discussions. *(Ya, dia sering bertanya dan ikut berdiskusi.)*
- **Parent:** Are there any subjects he needs to improve? *(Apakah ada mata pelajaran yang perlu dia tingkatkan?)*
- **Teacher:** He needs to practice mathematics more often. *(Dia perlu lebih sering berlatih matematika.)*
- **Parent:** What can I do to help him at home? *(Apa yang bisa saya lakukan untuk membantunya di rumah?)*
- **Teacher:** You can help him review his lessons and finish his homework. *(Ibu bisa membantunya mengulang pelajaran dan menyelesaikan PR.)*

## 4. Catatan Grammar
- **Simple Present:** *My child studies every day.* (Kebiasaan)
- **Present Continuous:** *He is studying now.* (Sedang berlangsung)
- **Simple Present Question:** *Does he understand the lesson?*
- **WH-Question:** *How is my child doing?*
- **Modal Can / Should:** *How can I help him? / He should practice more.*

## 5. Role Play
- **Role A (Parent):** Menyapa guru, memperkenalkan diri, menanyakan nilai & perilaku anak, meminta saran.
- **Role B (Teacher):** Menyambut orang tua, menjelaskan perkembangan, kelebihan/kekurangan murid, dan memberi saran.
- *Target:* Buat percakapan baru minimal 10 kalimat menggunakan minimal 5 kosakata Vocabulary & 3 Useful Expressions.

## 6. Exercise (Latihan)
- **A. Vocabulary Matching:** Teacher, Homework, Grade, Classroom, Progress, Principal, Attendance, Friendly, Behavior, Meeting.
- **B. Complete the Sentences:** *My child goes to _____ every morning. / My child has to finish his _____. / My child needs to _____ his mathematics skills.*
- **C. Translate into English:** *Saya ingin bertanya tentang perkembangan anak saya. / Apakah anak saya aktif di kelas? / Bagaimana nilai anak saya?*
- **D. Speaking Practice:** Ceritakan pengalaman bertemu guru anak di sekolah (kapan, kenapa, apa yang ditanyakan, bagaimana membantu anak di rumah).`,
  },
  {
    id: "p8-work-daily",
    meetingNumber: 8,
    level: "A2",
    title: "Pertemuan 8: At Work — Daily Tasks & Workplace (A2)",
    durationMinutes: 60,
    content: `# Pertemuan 8 — At Work: Daily Tasks (Level A2)

## 1. Vocabulary (Kosakata Inti)
**A. Verbs (20 Kata Kerja):**
work, start, finish, check, send, receive, write, read, print, call, email, discuss, plan, organize, prepare, report, help, solve, attend, manage

**B. Nouns (20 Kata Benda):**
office, employee, manager, colleague, meeting, computer, document, email, report, task, project, deadline, printer, phone, desk, schedule, customer, client, break, company

**C. Adjectives (5 Kata Sifat):**
busy, professional, careful, responsible, urgent

## 2. Useful Expressions
- What are you working on? *(Apa yang sedang kamu kerjakan?)*
- When is the deadline? *(Kapan tenggat waktunya?)*
- I manage documents and prepare reports. *(Saya mengelola dokumen dan menyiapkan laporan.)*
- Let me check my schedule first. *(Biar saya cek jadwal saya dulu.)*

## 3. Dialogue
- **A:** What are you working on? *(Apa yang sedang kamu kerjakan?)*
- **B:** I'm preparing a report. *(Saya sedang menyiapkan laporan.)*
- **A:** When is the deadline? *(Kapan tenggat waktunya?)*
- **B:** It is tomorrow afternoon. *(Besok sore.)*

## 4. Catatan Grammar (Present Continuous & Simple Present at Work)
- **I am preparing a report** (Sedang dikerjakan sekarang).
- **I usually start working at 8 AM** (Rutinitas kerja).

## 5. Role Play
- **Manager & Employee:** Diskusikan tugas harian, progres laporan, dan tenggat waktu proyek.

## 6. Exercise
1. Tulis jadwal kerja harianmu dalam 5 kalimat bahasa Inggris.
2. Latihan Speaking Interview: *What are your main responsibilities at work?*`,
  },
  {
    id: "wh-interview-adult",
    meetingNumber: 12,
    level: "A2",
    title: "English Speaking Interview Test: WH-Questions (Adult Employees)",
    durationMinutes: 90,
    content: `# English Speaking Interview Test — WH-Questions (Adult Employees)

**Tujuan:** Mengukur kemampuan menjawab pertanyaan seputar pekerjaan, pengalaman, jadwal, keuangan, dan lingkungan kerja menggunakan **What, When, Who, Where, Why, How, How Many, dan How Much**.

## 1. What (Informasi & Pekerjaan)
- *What do you do for a living?* → I work as an administrative staff member.
- *What are your main responsibilities at work?* → I manage documents, prepare reports, and communicate with customers.
- *What skills do you need for your job?* → I need communication, teamwork, and problem-solving skills.

## 2. When & Where (Waktu & Tempat)
- *When do you usually start working?* → I usually start working at 8 AM.
- *When did you get your first job?* → I got my first job in 2022.
- *Where would you like to work in the future?* → I would like to work in an international company.

## 3. Who & Why (Orang & Alasan)
- *Who do you usually ask for help at work?* → I usually ask my supervisor for help.
- *Why is English important for your career?* → English is important because it helps me communicate with international clients.
- *Why is teamwork important in the workplace?* → Because teamwork helps us achieve our goals more effectively.

## 4. How, How Many & How Much (Cara & Kuantitas)
- *How do you handle pressure at work?* → I stay calm and focus on finding solutions.
- *How many meetings do you attend every week?* → I attend about three meetings every week. *(Countable)*
- *How much time do you spend learning English every day?* → I spend about one hour learning English every day. *(Uncountable)*

## 5. Rubrik Penilaian Speaking (Total 100)
- **Grammar Accuracy:** 20
- **Vocabulary:** 20
- **Pronunciation:** 20
- **Fluency:** 20
- **Confidence & Communication:** 20
- *Skala:* 86–100 Sangat Baik | 71–85 Baik | 56–70 Cukup | 0–55 Perlu Bimbingan.`,
  },
  {
    id: "p21-24-a3-bridge",
    meetingNumber: 21,
    level: "A3",
    title: "Pertemuan 21–24: Past Experiences, Future Goals, Opinions & 10 Tenses (A3)",
    durationMinutes: 90,
    content: `# Pertemuan 21–24 — Level A3 (Bridge to B1): Experiences, Goals & Opinions

## 1. Vocabulary Inti Level A3
**A. Verbs (20 Kata Kerja):**
experience, overcome, achieve, plan, intend, improve, apply, prepare, believe, agree, disagree, suggest, recommend, advise, compare, consider, summarize, present, collaborate, reflect

**B. Nouns (20 Kata Benda):**
experience, challenge, achievement, opportunity, career, goal, plan, opinion, advice, suggestion, solution, teamwork, technology, skill, presentation, feedback, responsibility, communication, habit, certificate

**C. Adjectives (5 Kata Sifat):**
unforgettable, ambitious, realistic, confident, fluent

## 2. Fokus 10 Grammar / Tenses & Modals
1. **Simple Present:** *I practise English three times a week.*
2. **Present Continuous:** *I am developing communication and computer skills.*
3. **Present Perfect:** *I have learned presentation and teamwork skills.*
4. **Present Perfect Continuous:** *I have been practising speaking for a few months.*
5. **Simple Past:** *I chose it because I like technology.*
6. **Past Continuous:** *I was having dinner when my friend called.*
7. **Simple Future (WILL):** *I will look for a job after graduation.*
8. **Future Continuous:** *I will be attending a meeting at nine tomorrow.*
9. **Modal CAN / COULD:** *I can cooperate with different people. / Could you repeat the question?*
10. **Modal WILL / WOULD:** *I would prefer working in a team. / I would admit my mistake and find a solution.*

## 3. Dialogue & Role Play (3 Menit Final Conversation)
- **A:** What is one difficult challenge you have faced, and how did you overcome it?
- **B:** I once had difficulty speaking in public. I practised regularly and gradually became more confident.
- **A:** What goals would you like to achieve in the next five years?
- **B:** I hope to improve my professional skills, gain work experience, and become more independent.

## 4. Exercise & Evaluasi Akhir (Level A3)
1. Tulis 1 paragraf opini tentang pentingnya kerja tim dengan minimal 2 alasan (*I think... because...*).
2. Latihan Speaking Test A3: Jawab 5 pertanyaan mendalam (tantangan hidup, pengaruh orang tua/mentor, dampak teknologi, target 5 tahun, dan saran untuk pemula).`,
  },
];

