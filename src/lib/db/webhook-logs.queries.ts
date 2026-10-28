import type { WebhookLog } from "@/types/db";
import { asDate, asDateOrNull, asNum, sql } from "./client";

function mapWebhookLog(row: Record<string, unknown>): WebhookLog {
  return {
    id: asNum(row.id),
    orderNumber: row.order_number == null ? null : String(row.order_number),
    provider: row.provider as WebhookLog["provider"],
    eventType: row.event_type == null ? null : String(row.event_type),
    gatewayTxnId: row.gateway_txn_id == null ? null : String(row.gateway_txn_id),
    payloadJson: row.payload_json,
    signatureValid: Boolean(row.signature_valid),
    processingStatus: row.processing_status as WebhookLog["processingStatus"],
    errorMessage: row.error_message == null ? null : String(row.error_message),
    receivedAt: asDate(row.received_at),
    processedAt: asDateOrNull(row.processed_at),
  };
}

export async function listWebhookLogsRecent(limit = 20): Promise<WebhookLog[]> {
  const rows = await sql`
    SELECT * FROM webhook_logs ORDER BY received_at DESC LIMIT ${limit}
  `;
  return rows.map((r) => mapWebhookLog(r as Record<string, unknown>));
}

export async function createWebhookLog(data: {
  orderNumber?: string | null;
  provider: "midtrans" | "xendit" | "faspay";
  eventType?: string | null;
  gatewayTxnId?: string | null;
  payloadJson: unknown;
  signatureValid: boolean;
  processingStatus?: string;
  errorMessage?: string | null;
}): Promise<void> {
  await sql`
    INSERT INTO webhook_logs (
      order_number, provider, event_type, gateway_txn_id, payload_json,
      signature_valid, processing_status, error_message
    ) VALUES (
      ${data.orderNumber ?? null}, ${data.provider}, ${data.eventType ?? null},
      ${data.gatewayTxnId ?? null}, ${JSON.stringify(data.payloadJson)}::jsonb,
      ${data.signatureValid}, ${data.processingStatus ?? "received"}, ${data.errorMessage ?? null}
    )
  `;
}
