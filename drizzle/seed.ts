import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { PAYMENT_INSTRUCTIONS_SEED, PAYMENT_METHODS_SEED } from "./payment-seed-data";

config({ path: ".env.local" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

async function seed() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? process.env.ADMIN_EMAILS?.split(",")[0]?.trim() ?? "admin@fluencyhub.id";
  const instructorEmail =
    process.env.SEED_INSTRUCTOR_EMAIL ?? process.env.INSTRUCTOR_EMAILS?.split(",")[0]?.trim() ?? "anindya@fluencyhub.id";

  await sql`
    INSERT INTO users (id, google_id, name, email, role, is_active, revenue_share_pct)
    VALUES (1, 'google_admin_001', 'FluencyHub Admin', ${adminEmail}, 'admin', TRUE, 0.00)
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      role = 'admin',
      is_active = TRUE
  `;

  await sql`
    INSERT INTO users (id, google_id, name, email, whatsapp_number, role, is_active, revenue_share_pct) VALUES
    (2, 'google_instr_001', 'Dr. Anindya Kusuma, M.Sc.', ${instructorEmail}, '6281234567801', 'instructor', TRUE, 70.00),
    (3, 'google_instr_002', 'Rizky Pratama, M.Hum.', 'rizky@fluencyhub.id', '6281234567802', 'instructor', TRUE, 70.00),
    (4, 'google_instr_003', 'Sarah Maharani, B.Ed.', 'sarah@fluencyhub.id', '6281234567803', 'instructor', TRUE, 65.00)
    ON CONFLICT (id) DO UPDATE SET
      email = CASE WHEN users.id = 2 THEN EXCLUDED.email ELSE users.email END,
      role = 'instructor',
      is_active = TRUE
  `;

  await sql`
    INSERT INTO users (id, google_id, name, email, whatsapp_number, role, is_active) VALUES
    (5, 'google_user_001', 'Budi Santoso', 'budi.santoso@gmail.com', '6281111110001', 'user', TRUE)
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    UPDATE users SET role = 'admin', is_active = TRUE, updated_at = NOW()
    WHERE lower(email) = ${adminEmail.toLowerCase()}
  `;
  await sql`
    UPDATE users SET role = 'instructor', is_active = TRUE, updated_at = NOW()
    WHERE lower(email) = ${instructorEmail.toLowerCase()}
  `;

  await sql`SELECT setval('users_id_seq', GREATEST((SELECT MAX(id) FROM users), 20))`;

  await sql`
    INSERT INTO categories (id, name, slug, icon, sort_order) VALUES
    (1, 'Applied English for STEM', 'applied-english-stem', 'flask', 1),
    (2, 'Business Communication', 'business-communication', 'handshake', 2),
    (3, 'Presentation & Public Speaking', 'presentation-public-speaking', 'presentation', 3),
    (4, 'Technical Writing', 'technical-writing', 'pencil-line', 4),
    (5, 'Interview Preparation', 'interview-preparation', 'user-check', 5),
    (6, 'Academic English', 'academic-english', 'graduation-cap', 6)
    ON CONFLICT (slug) DO NOTHING
  `;
  await sql`SELECT setval('categories_id_seq', 10)`;

  for (const [id, code, name, logoUrl, type, provider, sortOrder] of PAYMENT_METHODS_SEED) {
    await sql`
      INSERT INTO payment_methods (
        id, code, name, logo_url, type, provider,
        admin_fee_flat, admin_fee_pct, is_active, is_redirect, sort_order
      ) VALUES (
        ${id}, ${code}, ${name}, ${logoUrl}, ${type}, ${provider},
        0, 0.00, TRUE, FALSE, ${sortOrder}
      )
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        type = EXCLUDED.type,
        provider = EXCLUDED.provider,
        admin_fee_flat = EXCLUDED.admin_fee_flat,
        admin_fee_pct = EXCLUDED.admin_fee_pct,
        is_active = TRUE,
        is_redirect = EXCLUDED.is_redirect,
        sort_order = EXCLUDED.sort_order
    `;
  }
  await sql`SELECT setval('payment_methods_id_seq', 40)`;

  await sql`DELETE FROM payment_instructions`;
  for (const [methodId, title, content, sortOrder] of PAYMENT_INSTRUCTIONS_SEED) {
    await sql`
      INSERT INTO payment_instructions (payment_method_id, title, content, sort_order)
      VALUES (${methodId}, ${title}, ${content}, ${sortOrder})
    `;
  }

  await sql`
    INSERT INTO courses (
      id, instructor_id, category_id, title, slug, short_description,
      price, original_price, status, is_featured, level,
      enrollment_count, platform_fee_pct, published_at, thumbnail_url,
      tier, speaking_partner_type, tier_badge, features_json
    ) VALUES
    (1, 2, 1, 'Applied English for STEM Professionals', 'applied-english-stem-professionals',
     'Master technical English for data presentations, research, and international collaboration.',
     1499000, 2499000, 'published', FALSE, 'intermediate', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
     'tier_menengah', 'trainer_online', 'Online Cohort', NULL),
    (2, 2, 2, 'Business English Masterclass: Negotiation & Meetings', 'business-english-masterclass',
     'Communicate confidently in international meetings, contract negotiations, and boardroom presentations.',
     1799000, 2799000, 'published', FALSE, 'intermediate', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80',
     'tier_menengah', 'trainer_online', 'Online Cohort', NULL),
    (3, 3, 3, 'Public Speaking in English: Zero to Confident', 'public-speaking-english-zero-confident',
     'From speaking anxiety to delivering compelling English presentations in front of any audience.',
     999000, 1699000, 'published', FALSE, 'beginner', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
     'tier_bawah', 'ai', 'Self-Paced AI', NULL),
    (4, 4, 5, 'English Interview Prep: Tech & Multinational Companies', 'english-interview-prep-tech',
     'Ace HRD and user interviews at multinational and tech companies with confidence.',
     1299000, 1999000, 'published', FALSE, 'all_levels', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
     'tier_tinggi', 'trainer_offline', 'Executive 1-on-1', NULL),
    (5, 2, 2, 'Ready Daily: Latihan Mandiri & AI Speaking Partner', 'ready-daily',
     'Bangun kebiasaan bicara bahasa Inggris setiap hari bersama AI Speaking Partner 24/7 dan auto-scoring poin terukur.',
     99000, 199000, 'published', FALSE, 'beginner', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
     'tier_bawah', 'ai', 'Self-Paced AI',
     '["Akses penuh materi video modul pembelajaran 24/7", "AI Speaking Partner 24/7 (latihan bicara kapan saja)", "Auto-scoring poin & evaluasi kemampuan instan", "Daily speaking challenge harian di platform", "Grup komunitas diskusi WhatsApp aktif", "Pelacakan grafik Ready Points di dashboard progres"]'::jsonb),
    (6, 2, 2, 'Cohort Ready for Work: 6-Week Live Online Mentoring', 'cohort-ready-for-work',
     'Program intensif 6 minggu bersama Live Trainer online dalam kelompok kecil (maks. 12 orang) untuk siap kerja, rapat, dan presentasi global.',
     1490000, 1990000, 'published', TRUE, 'intermediate', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
     'tier_menengah', 'trainer_online', 'Paling Diminati',
     '["Semua fasilitas Paket Bawah (Materi Video + AI Partner)", "6 sesi live online mentoring (90 menit) via Zoom", "Kelas kecil interaktif (maksimal 12 orang per kelompok)", "Live feedback & koreksi aksen/grammar langsung dari trainer", "Tes Baseline & Exit untuk mengukur kenaikan Ready Score", "Ready Certificate resmi berbasis skor untuk profil LinkedIn", "Opsi cicilan 3x Rp 497.000 / bulan"]'::jsonb),
    (7, 2, 2, 'Ready Path: Executive 1-on-1 Offline Mentoring', 'ready-path-executive',
     'Pendampingan privat tatap muka langsung (offline) bersama trainer dengan fitur bebas memilih titik lokasi pertemuan di coworking atau kafe.',
     2690000, 3490000, 'published', FALSE, 'advanced', 0, 30.00, NOW(),
     'https://images.unsplash.com/photo-1556761175-4b46a572b786?auto=format&fit=crop&w=800&q=80',
     'tier_tinggi', 'trainer_offline', 'Executive 1-on-1',
     '["Semua fasilitas Paket Menengah (Cohort + AI Speaking Partner)", "Sesi privat tatap muka langsung (offline 1-on-1) bersama Trainer", "Fitur Atur Lokasi Temu (Coworking Space, Kafe, atau Kantor)", "Simulasi intensif wawancara kerja & pitch presentation personal", "Review eksklusif dokumen (CV, resume, slide deck presentasi)", "Akses konsultasi prioritas personal langsung dengan coach"]'::jsonb)
    ON CONFLICT (slug) DO UPDATE SET
      tier = EXCLUDED.tier,
      speaking_partner_type = EXCLUDED.speaking_partner_type,
      tier_badge = EXCLUDED.tier_badge,
      features_json = EXCLUDED.features_json,
      price = EXCLUDED.price,
      original_price = EXCLUDED.original_price,
      is_featured = EXCLUDED.is_featured
  `;
  await sql`SELECT setval('courses_id_seq', 10)`;

  const sections: Array<[number, number, string, number]> = [
    [1, 1, "Module 1: Foundation — Scientific Communication", 1],
    [2, 1, "Module 2: Technical Presentation Skills", 2],
    [3, 1, "Module 3: Live Collaboration Sessions", 3],
    [7, 1, "Module 4: Writing for Journals & Docs", 4],
    [8, 1, "Module 5: Cross-border Team English", 5],
    [4, 2, "Module 1: Business Meeting Essentials", 1],
    [9, 2, "Module 2: Negotiation Language", 2],
    [10, 2, "Module 3: Email, Slack & Async Updates", 3],
    [11, 2, "Module 4: Boardroom Presentations", 4],
    [5, 3, "Part 1: Overcoming Speaking Anxiety", 1],
    [12, 3, "Part 2: Structure of a Great Talk", 2],
    [13, 3, "Part 3: Voice, Pace & Body Language", 3],
    [14, 3, "Part 4: Live Stage Practice", 4],
    [6, 4, "Module 1: HRD Interview Preparation", 1],
    [15, 4, "Module 2: User / Hiring Manager Rounds", 2],
    [16, 4, "Module 3: Behavioral STAR Stories", 3],
    [17, 4, "Module 4: Offer, Salary & Follow-up", 4],
  ];
  for (const [id, courseId, title, sortOrder] of sections) {
    await sql`
      INSERT INTO sections (id, course_id, title, sort_order)
      VALUES (${id}, ${courseId}, ${title}, ${sortOrder})
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, sort_order = EXCLUDED.sort_order, course_id = EXCLUDED.course_id
    `;
  }
  await sql`SELECT setval('sections_id_seq', 40)`;

  type LessonSeed = {
    id: number;
    sectionId: number;
    title: string;
    type: "youtube_video" | "live_class" | "text";
    yt?: string;
    desc: string;
    mins: number;
    free?: boolean;
    sort: number;
  };

  const lessons: LessonSeed[] = [
    { id: 1, sectionId: 1, title: "Welcome & Program Overview", type: "youtube_video", yt: "Unzc731iCUY", desc: "How this STEM English program is structured and how to practice weekly.", mins: 18, free: true, sort: 1 },
    { id: 2, sectionId: 1, title: "The 3 Pillars of Scientific Communication", type: "youtube_video", yt: "eIho2S0ZahI", desc: "Clarity, precision, and brevity when you explain research.", mins: 22, sort: 2 },
    { id: 21, sectionId: 1, title: "Audience Analysis for Technical Talks", type: "youtube_video", yt: "Ks-_Mh1QhMc", desc: "Adapt vocabulary for engineers, PMs, and executives.", mins: 16, sort: 3 },
    { id: 22, sectionId: 1, title: "Avoiding Translator English", type: "youtube_video", yt: "iCvmsMzlF7o", desc: "Natural collocations instead of word-for-word Indonesian.", mins: 14, sort: 4 },
    { id: 3, sectionId: 2, title: "Data Presentation Vocabulary", type: "youtube_video", yt: "5MgBikgcWnY", desc: "Phrases for charts, trends, outliers, and confidence intervals.", mins: 25, sort: 1 },
    { id: 23, sectionId: 2, title: "Narrating a Dashboard in 3 Minutes", type: "youtube_video", yt: "8S0FDjFBj8o", desc: "Rule of three for exec updates.", mins: 19, sort: 2 },
    { id: 24, sectionId: 2, title: "Handling Tough Questions on Numbers", type: "youtube_video", yt: "qp0HIF3SfI4", desc: "Bridge phrases when you do not have the exact figure.", mins: 17, sort: 3 },
    { id: 25, sectionId: 2, title: "Slide Language: Titles vs Speeches", type: "text", desc: "Write assertion titles. Speak the story, do not read bullets.", mins: 10, sort: 4 },
    { id: 26, sectionId: 3, title: "Live Class #1 — Research Pitch Simulation", type: "live_class", desc: "Zoom roleplay: 5-minute research pitch + Q&A.", mins: 90, sort: 1 },
    { id: 27, sectionId: 3, title: "Live Class #2 — Cross-team Standup", type: "live_class", desc: "Simulate a global standup with interruptions.", mins: 75, sort: 2 },
    { id: 28, sectionId: 7, title: "Abstracts that Get Read", type: "youtube_video", yt: "ZXsQAXx_ao0", desc: "Move, gap, purpose, method, result in 150 words.", mins: 15, sort: 1 },
    { id: 29, sectionId: 7, title: "API & Runbook English", type: "youtube_video", yt: "UF8uR6Z6KLc", desc: "Write steps a tired on-call engineer can follow.", mins: 20, sort: 2 },
    { id: 30, sectionId: 7, title: "Peer Review Comments without Sounding Rude", type: "youtube_video", yt: "HAnw168huqA", desc: "Hedging and evidence-based feedback.", mins: 13, sort: 3 },
    { id: 31, sectionId: 8, title: "Async Updates for Remote Teams", type: "youtube_video", yt: "36m1o-tM05g", desc: "Written standups that replace meetings.", mins: 12, sort: 1 },
    { id: 32, sectionId: 8, title: "Disagreeing Politely in Slack", type: "text", desc: "Templates for pushback without losing face.", mins: 8, sort: 2 },

    { id: 11, sectionId: 4, title: "Welcome to Business English", type: "youtube_video", yt: "Unzc731iCUY", desc: "Outcomes for meetings, negotiation, and follow-up.", mins: 12, free: true, sort: 1 },
    { id: 33, sectionId: 4, title: "Opening and Framing a Meeting", type: "youtube_video", yt: "eIho2S0ZahI", desc: "Agenda language, time-boxing, and parking lots.", mins: 18, sort: 2 },
    { id: 34, sectionId: 4, title: "Turn-taking and Interrupting Politely", type: "youtube_video", yt: "iCvmsMzlF7o", desc: "Get airtime without sounding aggressive.", mins: 15, sort: 3 },
    { id: 35, sectionId: 4, title: "Closing with Clear Next Actions", type: "youtube_video", yt: "8S0FDjFBj8o", desc: "Owners, dates, and recap emails.", mins: 11, sort: 4 },
    { id: 36, sectionId: 9, title: "BATNA and Interest vs Position", type: "youtube_video", yt: "qp0HIF3SfI4", desc: "English frames for principled negotiation.", mins: 21, sort: 1 },
    { id: 37, sectionId: 9, title: "Anchoring and Counter-offers", type: "youtube_video", yt: "Ks-_Mh1QhMc", desc: "Price talk without freezing.", mins: 16, sort: 2 },
    { id: 38, sectionId: 9, title: "Live Class — Supplier Negotiation", type: "live_class", desc: "Pair roleplay: delay, discount, and SLA.", mins: 80, sort: 3 },
    { id: 39, sectionId: 10, title: "Email that Gets a Yes", type: "youtube_video", yt: "5MgBikgcWnY", desc: "Subject lines, BLUF, and CTA.", mins: 14, sort: 1 },
    { id: 40, sectionId: 10, title: "Status Updates Executives Actually Read", type: "text", desc: "Green / yellow / red plus one ask.", mins: 9, sort: 2 },
    { id: 41, sectionId: 11, title: "Story Arc for a Business Case", type: "youtube_video", yt: "ZXsQAXx_ao0", desc: "Problem, cost of inaction, option, ask.", mins: 20, sort: 1 },
    { id: 42, sectionId: 11, title: "Q&A after the Board Deck", type: "youtube_video", yt: "UF8uR6Z6KLc", desc: "Bridge, answer, check.", mins: 17, sort: 2 },

    { id: 12, sectionId: 5, title: "Welcome to Public Speaking", type: "youtube_video", yt: "Unzc731iCUY", desc: "From anxiety to a repeatable talk process.", mins: 10, free: true, sort: 1 },
    { id: 43, sectionId: 5, title: "Why Your Brain Freezes On Stage", type: "youtube_video", yt: "Ks-_Mh1QhMc", desc: "Physiological arousal and what to do in 60 seconds.", mins: 18, sort: 2 },
    { id: 44, sectionId: 5, title: "Warm-up Routine before Any Talk", type: "youtube_video", yt: "eIho2S0ZahI", desc: "Breath, jaw, and first-sentence drill.", mins: 12, sort: 3 },
    { id: 45, sectionId: 12, title: "Hook, Map, and Landing", type: "youtube_video", yt: "8S0FDjFBj8o", desc: "Openings that earn the next 10 minutes.", mins: 16, sort: 1 },
    { id: 46, sectionId: 12, title: "One Idea per Slide", type: "youtube_video", yt: "qp0HIF3SfI4", desc: "Visual support instead of paragraph slides.", mins: 14, sort: 2 },
    { id: 47, sectionId: 13, title: "Voice: Volume, Pace, Pause", type: "youtube_video", yt: "iCvmsMzlF7o", desc: "Record-and-fix checklist.", mins: 19, sort: 1 },
    { id: 48, sectionId: 13, title: "Hands, Stance, and Eye Contact", type: "youtube_video", yt: "HAnw168huqA", desc: "What to do when you do not know where to stand.", mins: 13, sort: 2 },
    { id: 49, sectionId: 14, title: "Live Class — 3-Minute Story", type: "live_class", desc: "Each student delivers a timed story with feedback.", mins: 90, sort: 1 },
    { id: 50, sectionId: 14, title: "Recording Review Homework", type: "text", desc: "Upload a 90-second clip and self-score the rubric.", mins: 8, sort: 2 },

    { id: 13, sectionId: 6, title: "Welcome to Interview Prep", type: "youtube_video", yt: "Unzc731iCUY", desc: "HRD, user, and bar-raiser rounds explained.", mins: 11, free: true, sort: 1 },
    { id: 51, sectionId: 6, title: "Tell Me About Yourself (90 seconds)", type: "youtube_video", yt: "eIho2S0ZahI", desc: "Present-past-future without a life story.", mins: 15, sort: 2 },
    { id: 52, sectionId: 6, title: "Why This Company, Why This Role", type: "youtube_video", yt: "5MgBikgcWnY", desc: "Research language that sounds specific.", mins: 12, sort: 3 },
    { id: 53, sectionId: 15, title: "System Design in Spoken English", type: "youtube_video", yt: "ZXsQAXx_ao0", desc: "Trade-offs, constraints, and diagrams in words.", mins: 22, sort: 1 },
    { id: 54, sectionId: 15, title: "Walk Me Through This Project", type: "youtube_video", yt: "UF8uR6Z6KLc", desc: "Impact, your role, and what you would redo.", mins: 16, sort: 2 },
    { id: 55, sectionId: 16, title: "STAR without Sounding Scripted", type: "youtube_video", yt: "qp0HIF3SfI4", desc: "Situation short, action long, result numeric.", mins: 18, sort: 1 },
    { id: 56, sectionId: 16, title: "Conflict and Failure Stories", type: "youtube_video", yt: "iCvmsMzlF7o", desc: "Accountability language hiring managers trust.", mins: 14, sort: 2 },
    { id: 57, sectionId: 16, title: "Live Class — Mock HRD Panel", type: "live_class", desc: "Two interviewers, five questions, recorded debrief.", mins: 75, sort: 3 },
    { id: 58, sectionId: 17, title: "Salary Bands and Counter Offers", type: "youtube_video", yt: "Ks-_Mh1QhMc", desc: "Range talk without naming a number too early.", mins: 13, sort: 1 },
    { id: 59, sectionId: 17, title: "Thank-you Emails that Add Signal", type: "text", desc: "One insight + one clarification, not flattery.", mins: 7, sort: 2 },
  ];

  const liveAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  for (const lesson of lessons) {
    const ytUrl = lesson.yt ? `https://www.youtube.com/watch?v=${lesson.yt}` : null;
    await sql`
      INSERT INTO lessons (
        id, section_id, title, content_type, youtube_url, youtube_video_id,
        live_class_url, live_class_datetime, live_class_platform,
        text_content, description, duration_minutes, is_free_preview, sort_order
      ) VALUES (
        ${lesson.id}, ${lesson.sectionId}, ${lesson.title}, ${lesson.type},
        ${ytUrl}, ${lesson.yt ?? null},
        ${lesson.type === "live_class" ? "https://zoom.us/j/fluencyhub-demo" : null},
        ${lesson.type === "live_class" ? liveAt : null},
        ${lesson.type === "live_class" ? "zoom" : null},
        ${lesson.type === "text" ? lesson.desc : null},
        ${lesson.desc}, ${lesson.mins}, ${lesson.free ?? false}, ${lesson.sort}
      )
      ON CONFLICT (id) DO UPDATE SET
        section_id = EXCLUDED.section_id,
        title = EXCLUDED.title,
        content_type = EXCLUDED.content_type,
        youtube_url = EXCLUDED.youtube_url,
        youtube_video_id = EXCLUDED.youtube_video_id,
        live_class_url = EXCLUDED.live_class_url,
        live_class_datetime = EXCLUDED.live_class_datetime,
        live_class_platform = EXCLUDED.live_class_platform,
        text_content = EXCLUDED.text_content,
        description = EXCLUDED.description,
        duration_minutes = EXCLUDED.duration_minutes,
        is_free_preview = EXCLUDED.is_free_preview,
        sort_order = EXCLUDED.sort_order
    `;
  }
  await sql`SELECT setval('lessons_id_seq', 80)`;

  await sql`
    UPDATE courses c SET total_duration_min = COALESCE((
      SELECT SUM(l.duration_minutes) FROM lessons l
      JOIN sections s ON s.id = l.section_id
      WHERE s.course_id = c.id AND l.deleted_at IS NULL
    ), 0)
  `;

  await sql`
    INSERT INTO coupons (code, description, discount_type, discount_value, is_active)
    VALUES
    ('STEMFLUENT', '20% off any course', 'percentage', 20, TRUE),
    ('WELCOME2026', '20% welcome discount', 'percentage', 20, TRUE)
    ON CONFLICT (code) DO NOTHING
  `;

  await sql`
    INSERT INTO notification_templates (event_trigger, channel, message_content, is_active) VALUES
    ('PAYMENT_SUCCESS', 'WHATSAPP', 'Hi {name}! Payment confirmed for {course_title}.', TRUE),
    ('MANUAL_TRANSFER_PENDING', 'WHATSAPP', 'Hi {name}, we received your transfer proof for {course_title}.', TRUE),
    ('PAYMENT_REJECTED', 'WHATSAPP', 'Hi {name}, we could not verify your proof. {rejection_note}', TRUE)
    ON CONFLICT (event_trigger, channel) DO NOTHING
  `;

  await sql`
    UPDATE courses SET marketing_tag = 'Best Seller', is_featured = TRUE, enrollment_count = 87,
      thumbnail_url = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=75'
    WHERE id = 1
  `;
  await sql`
    UPDATE courses SET marketing_tag = 'Most Popular', is_featured = TRUE, enrollment_count = 54,
      thumbnail_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=75'
    WHERE id = 2
  `;
  await sql`
    UPDATE courses SET marketing_tag = 'New', is_featured = FALSE, enrollment_count = 112,
      thumbnail_url = 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=600&q=75'
    WHERE id = 3
  `;

  const settings: Array<[string, string]> = [
    ["hero_eyebrow", "Metode Hybrid #1 di Indonesia"],
    ["hero_title", "Kuasai Bahasa Inggris untuk"],
    ["hero_title_highlight", "Karir & STEM."],
    [
      "hero_subtitle",
      "Berhenti menghafal Grammar. Belajar mempresentasikan data, bernegosiasi dengan klien global, dan menembus literatur teknis melalui simulasi Roleplay nyata.",
    ],
    ["hero_social_proof", "1,200+ profesional IT & Bisnis bergabung"],
    ["hero_image_url", "https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&q=75"],
    ["hero_stat_label", "Fluency Rate"],
    ["hero_stat_value", "+85% in 3 Months"],
    ["cta_title", "Siap Menguasai English untuk Karir Anda?"],
    ["cta_subtitle", "Bergabung dengan 1,200+ profesional Indonesia yang sudah merasakan manfaatnya."],
    ["method_image_url", "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=75"],
  ];
  for (const [key, value] of settings) {
    await sql`
      INSERT INTO site_settings (key, value, updated_at) VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }

  await sql`DELETE FROM landing_pain_points`;
  await sql`
    INSERT INTO landing_pain_points (icon, icon_bg, icon_color, title, description, sort_order, is_active) VALUES
    ('Brain', '#fef2f2', '#dc2626', 'The Grammar Trap',
     'Terlalu sibuk memikirkan 16 tenses membuat Anda gugup dan kehilangan momen untuk menyampaikan argumen krusial dalam meeting.', 1, TRUE),
    ('MessageSquareOff', '#fff7ed', '#ea580c', 'Budaya "Sungkan"',
     'Mental block dan ketakutan membuat kita pasif dan tidak percaya diri saat bernegosiasi dengan mitra atau klien global.', 2, TRUE),
    ('BookOpen', '#f5f3ff', '#7c3aed', 'Literasi STEM Rendah',
     'Kesulitan membedah jurnal ilmiah, dokumentasi API, atau laporan analitik kompleks tanpa bantuan translator.', 3, TRUE)
  `;

  await sql`DELETE FROM landing_method_items`;
  await sql`
    INSERT INTO landing_method_items (tab, icon, title, description, sort_order, is_active) VALUES
    ('online', 'Video', 'Cinematic Video Modules', 'Akses puluhan modul video berkualitas tinggi kapan saja, di device apapun.', 1, TRUE),
    ('online', 'Users', 'Live Virtual Mentoring', 'Praktik bicara mingguan via Zoom dengan simulasi meeting dan presentasi.', 2, TRUE),
    ('hybrid', 'Building2', 'Offline Studio Access', 'Hadir ke studio mewah kami di Sudirman dengan desain Roundtable realistis.', 1, TRUE),
    ('hybrid', 'Target', 'High-Pressure Roleplay', 'Simulasi negosiasi bertekanan tinggi dengan kondisi psikologis nyata.', 2, TRUE)
  `;

  await sql`DELETE FROM testimonials`;
  await sql`
    INSERT INTO testimonials (name, role, quote, avatar_url, rating, sort_order, is_active) VALUES
    ('Budi Santoso', 'Software Engineer, Gojek',
     'Setelah 3 bulan, bisa presentasi architecture system ke VP Engineering asing tanpa gugup. Game changer!',
     'https://i.pravatar.cc/80?img=12', 5, 1, TRUE),
    ('Dewi Rahayu', 'Data Analyst, Tokopedia',
     'Teknik roleplay sangat realistis. Sekarang bisa menjelaskan anomali data ke stakeholder internasional dengan percaya diri.',
     'https://i.pravatar.cc/80?img=47', 5, 2, TRUE),
    ('Fajar Nugroho', 'Product Manager, Shopee',
     'Investasi terbaik untuk karir saya. Sekarang lead meeting dengan tim global dari 5 negara tiap minggu.',
     'https://i.pravatar.cc/80?img=33', 5, 3, TRUE)
  `;

  await sql`DELETE FROM faqs`;
  await sql`
    INSERT INTO faqs (question, answer, sort_order, is_active) VALUES
    ('Apakah materi bisa diakses seumur hidup?',
     'Ya. Setelah pembayaran dikonfirmasi, enrollment Anda aktif dan video on-demand tetap bisa dibuka di dashboard member.', 1, TRUE),
    ('Apa bedanya kelas Online dan Hybrid?',
     'Online fokus pada modul video plus mentoring Zoom. Hybrid menambahkan sesi studio tatap muka dan roleplay bertekanan tinggi.', 2, TRUE),
    ('Metode pembayaran apa yang tersedia?',
     'QRIS, e-wallet (GoPay, DANA, ShopeePay, OVO, LinkAja), virtual account bank, gerai ritel, kartu, dan transfer manual.', 3, TRUE),
    ('Apakah ada live class untuk presentasi teknis?',
     'Ada. Jadwal live class Zoom/Google Meet muncul di dashboard. Link hanya terbuka 30 menit sebelum mulai.', 4, TRUE),
    ('Bagaimana jika saya sudah bisa grammar tapi masih nge-lag di meeting?',
     'Itu fokus kami. Latihan roleplay meeting, presentasi data, dan negosiasi — bukan menghafal 16 tenses.', 5, TRUE),
    ('Bisakah saya ganti kelas setelah membeli?',
     'Hubungi admin lewat WhatsApp yang terdaftar di profil. Transfer ke kelas lain mengikuti kebijakan refund/upgrade yang berlaku.', 6, TRUE)
  `;

  console.log(`Seed complete. Admin: ${adminEmail} · Instructor: ${instructorEmail}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
