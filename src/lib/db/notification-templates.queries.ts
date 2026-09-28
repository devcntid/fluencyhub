import type { NotificationTemplate } from "@/types/db";
import { sql } from "./client";
import { mapNotificationTemplate } from "./mappers";

export async function getActiveTemplate(
  eventTrigger: string,
  channel: string,
): Promise<NotificationTemplate | null> {
  const rows = await sql`
    SELECT * FROM notification_templates
    WHERE event_trigger = ${eventTrigger}
      AND channel = ${channel}
      AND is_active = true
    LIMIT 1
  `;
  return rows[0] ? mapNotificationTemplate(rows[0] as Record<string, unknown>) : null;
}
