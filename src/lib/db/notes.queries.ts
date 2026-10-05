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
  const r = rows[0] as any;
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id,
    lessonId: r.lesson_id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
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
  const r = rows[0] as any;
  return {
    id: r.id,
    userId: r.user_id,
    lessonId: r.lesson_id,
    content: r.content,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}
