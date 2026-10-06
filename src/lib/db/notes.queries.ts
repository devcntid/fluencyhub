import { sql } from "./client";

export interface LessonNote {
  id: number;
  userId: number;
  lessonId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function initializeNotesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS lesson_notes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, lesson_id)
    )
  `;
}

export async function getLessonNote(userId: number, lessonId: number): Promise<LessonNote | null> {
  const rows = await sql`
    SELECT * FROM lesson_notes
    WHERE user_id = ${userId} AND lesson_id = ${lessonId}
  `;
  const r = rows[0] as Record<string, unknown>;
  if (!r) return null;
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    lessonId: Number(r.lesson_id),
    content: String(r.content),
    createdAt: r.created_at as Date,
    updatedAt: r.updated_at as Date,
  };
}

export async function saveLessonNote(userId: number, lessonId: number, content: string): Promise<LessonNote> {
  // We'll call initialize once here just to be safe if it doesn't exist.
  // In a real prod environment we'd use migrations.
  await initializeNotesTable();

  const rows = await sql`
    INSERT INTO lesson_notes (user_id, lesson_id, content)
    VALUES (${userId}, ${lessonId}, ${content})
    ON CONFLICT (user_id, lesson_id)
    DO UPDATE SET 
      content = EXCLUDED.content,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;
  const r = rows[0] as Record<string, unknown>;
  return {
    id: Number(r.id),
    userId: Number(r.user_id),
    lessonId: Number(r.lesson_id),
    content: String(r.content),
    createdAt: r.created_at as Date,
    updatedAt: r.updated_at as Date,
  };
}
