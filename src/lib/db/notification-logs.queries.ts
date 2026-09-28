import type { NotificationLog } from "@/types/db";
import { sql } from "./client";
import { mapNotificationLog } from "./mappers";

export async function createNotificationLog(data: {
  templateId?: number | null;
  orderNumber?: string | null;
  userId?: number | null;
  lessonId?: number | null;
  recipient: string;
  channel: string;
  requestPayload?: string | null;
  responsePayload?: string | null;
  status?: string;
  errorMessage?: string | null;
}): Promise<NotificationLog> {
  const rows = await sql`
    INSERT INTO notification_logs (
      template_id, order_number, user_id, lesson_id, recipient,
      channel, request_payload, response_payload, status, error_message
    ) VALUES (
      ${data.templateId ?? null}, ${data.orderNumber ?? null}, ${data.userId ?? null}, ${data.lessonId ?? null},
      ${data.recipient}, ${data.channel}, ${data.requestPayload ?? null}, ${data.responsePayload ?? null},
      ${data.status ?? "QUEUED"}, ${data.errorMessage ?? null}
    )
    RETURNING *
  `;
  return mapNotificationLog(rows[0] as Record<string, unknown>);
}
