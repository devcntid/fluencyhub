import { sql } from "./src/lib/db/client";

async function run() {
  const settings = await sql`SELECT key, value FROM site_settings WHERE key = 'notif_payment_success_wa'`;
  console.log("Settings:");
  for (const s of settings) {
    console.log(s.key, JSON.stringify(s.value));
  }
  process.exit(0);
}

run().catch(console.error);
