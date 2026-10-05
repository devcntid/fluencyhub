require("dotenv").config({ path: ".env.local" });
const { Pool } = require("@neondatabase/serverless");
const client = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  try {
    await client.connect();
    // Delete duplicates first if any
    await client.query(`
      DELETE FROM lesson_progress
      WHERE id IN (
        SELECT id
        FROM (
         BY id DESC) AS row_num
          FROM lesson_progress
        ) t
        WHERE t.row_num > 1
      )
    `);
    
    // Add unique constraint
    await client.query(`
      ALTER TABLE lesson_progress 
      ADD CONSTRAINT lesson_progress_user_id_lesson_id_unique UNIQUE (user_id, lesson_id)
    `);
    console.log("Unique constraint added successfully");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
fix();
