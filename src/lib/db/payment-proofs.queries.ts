import type { PaymentProof } from "@/types/db";
import { sql } from "./client";
import { mapPaymentProof } from "./mappers";

export async function createPaymentProof(data: {
  orderId: number;
  fileUrl: string;
  fileName?: string | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
}): Promise<PaymentProof> {
  await sql`
    UPDATE payment_proofs SET status = 'rejected', rejection_note = 'Diganti oleh pengguna'
    WHERE order_id = ${data.orderId} AND status = 'pending'
  `;

  const rows = await sql`
    INSERT INTO payment_proofs (order_id, file_url, file_name, file_size_bytes, mime_type)
    VALUES (
      ${data.orderId}, ${data.fileUrl}, ${data.fileName ?? null},
      ${data.fileSizeBytes ?? null}, ${data.mimeType ?? null}
    )
    RETURNING *
  `;
  return mapPaymentProof(rows[0] as Record<string, unknown>);
}

export async function getPaymentProofById(id: number): Promise<PaymentProof | null> {
  const rows = await sql`SELECT * FROM payment_proofs WHERE id = ${id}`;
  return rows[0] ? mapPaymentProof(rows[0] as Record<string, unknown>) : null;
}

export async function listPendingProofs(): Promise<
  Array<PaymentProof & { orderNumber: string; userName: string; courseTitle: string; amount: string; whatsappNumber: string | null; bankName: string | null; }>
> {
  const rows = await sql`
    SELECT p.*, o.order_number, u.name AS user_name, u.whatsapp_number, c.title AS course_title, o.total_amount, pm.name AS bank_name
    FROM payment_proofs p
    JOIN orders o ON o.id = p.order_id
    JOIN users u ON u.id = o.user_id
    JOIN courses c ON c.id = o.course_id
    LEFT JOIN payment_methods pm ON pm.id = o.payment_method_id
    WHERE p.status = 'pending'
    ORDER BY p.uploaded_at ASC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapPaymentProof(row),
      orderNumber: String(row.order_number),
      userName: String(row.user_name),
      whatsappNumber: row.whatsapp_number ? String(row.whatsapp_number) : null,
      courseTitle: String(row.course_title),
      amount: String(row.total_amount),
      bankName: row.bank_name ? String(row.bank_name) : null,
    };
  });
}

export async function approveProofsForOrder(orderId: number, verifiedBy: number): Promise<void> {
  await sql`
    UPDATE payment_proofs SET
      status = 'approved',
      verified_by = ${verifiedBy},
      verified_at = NOW()
    WHERE order_id = ${orderId} AND status = 'pending'
  `;
}

export async function updatePaymentProofStatus(
  id: number,
  status: "approved" | "rejected",
  verifiedBy: number,
  rejectionNote?: string | null,
): Promise<PaymentProof> {
  const rows = await sql`
    UPDATE payment_proofs SET
      status = ${status},
      verified_by = ${verifiedBy},
      verified_at = NOW(),
      rejection_note = ${rejectionNote ?? null}
    WHERE id = ${id}
    RETURNING *
  `;
  return mapPaymentProof(rows[0] as Record<string, unknown>);
}
