import { sql } from "./client";

export async function createAuditLog(params: {
  adminId: number;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValueJson?: any;
  newValueJson?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const oldVal = params.oldValueJson ? JSON.stringify(params.oldValueJson) : null;
  const newVal = params.newValueJson ? JSON.stringify(params.newValueJson) : null;

  const rows = await sql`
    INSERT INTO audit_logs (
      admin_id, 
      action, 
      entity_type, 
      entity_id, 
      old_value_json, 
      new_value_json, 
      ip_address, 
      user_agent
    ) VALUES (
      ${params.adminId},
      ${params.action},
      ${params.entityType ?? null},
      ${params.entityId ?? null},
      ${oldVal ? sql`${oldVal}::jsonb` : null},
      ${newVal ? sql`${newVal}::jsonb` : null},
      ${params.ipAddress ?? null},
      ${params.userAgent ?? null}
    )
    RETURNING *
  `;
  return rows[0];
}

export async function getAuditLogs(limit: number = 50, offset: number = 0) {
  const rows = await sql`
    SELECT * FROM audit_logs
    ORDER BY created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  
  return rows.map(row => ({
    id: Number(row.id),
    adminId: Number(row.admin_id),
    action: row.action as string,
    entityType: row.entity_type as string | null,
    entityId: row.entity_id ? Number(row.entity_id) : null,
    oldValueJson: row.old_value_json as any,
    newValueJson: row.new_value_json as any,
    ipAddress: row.ip_address as string | null,
    userAgent: row.user_agent as string | null,
    createdAt: new Date(row.created_at as string | Date),
  }));
}
