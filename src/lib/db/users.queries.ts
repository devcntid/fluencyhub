import type { User, UserRole } from "@/types/db";
import { sql } from "./client";
import { mapUser } from "./mappers";

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await sql`
    SELECT * FROM users
    WHERE lower(email) = ${email.trim().toLowerCase()} AND deleted_at IS NULL
  `;
  return rows[0] ? mapUser(rows[0] as Record<string, unknown>) : null;
}

export async function getInstructorPublic(
  id: number,
): Promise<{ id: number; name: string; avatarUrl: string | null } | null> {
  const rows = await sql`
    SELECT id, name, avatar_url FROM users
    WHERE id = ${id} AND deleted_at IS NULL AND role = 'instructor'
  `;
  const row = rows[0] as { id: unknown; name: string; avatar_url: string | null } | undefined;
  if (!row) return null;
  return { id: Number(row.id), name: row.name, avatarUrl: row.avatar_url };
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await sql`SELECT * FROM users WHERE id = ${id} AND deleted_at IS NULL`;
  return rows[0] ? mapUser(rows[0] as Record<string, unknown>) : null;
}

export async function createUser(data: {
  name: string;
  email: string;
  googleId?: string | null;
  avatarUrl?: string | null;
  role?: UserRole;
  whatsappNumber?: string | null;
}): Promise<User> {
  const rows = await sql`
    INSERT INTO users (name, email, google_id, avatar_url, role, whatsapp_number)
    VALUES (
      ${data.name},
      ${data.email},
      ${data.googleId ?? null},
      ${data.avatarUrl ?? null},
      ${data.role ?? "user"},
      ${data.whatsappNumber ?? null}
    )
    ON CONFLICT (email) DO UPDATE SET 
      google_id = COALESCE(users.google_id, EXCLUDED.google_id),
      name = COALESCE(users.name, EXCLUDED.name)
    RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}

export type AdminUserRow = User & { enrolledCount: number };

export async function listInstructorsAdmin(): Promise<Array<{ id: number; name: string }>> {
  const rows = await sql`
    SELECT id, name FROM users
    WHERE role IN ('instructor', 'admin') AND deleted_at IS NULL AND is_active = TRUE
    ORDER BY name ASC
  `;
  return rows.map((r) => {
    const row = r as { id: unknown; name: string };
    return { id: Number(row.id), name: row.name };
  });
}

export async function createUserAdmin(data: {
  name: string;
  email: string;
  whatsappNumber?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isActive: boolean;
  revenueSharePct?: string;
}): Promise<User> {
  const rows = await sql`
    INSERT INTO users (name, email, whatsapp_number, avatar_url, role, is_active, revenue_share_pct)
    VALUES (
      ${data.name},
      ${data.email.trim().toLowerCase()},
      ${data.whatsappNumber ?? null},
      ${data.avatarUrl ?? null},
      ${data.role},
      ${data.isActive},
      ${data.revenueSharePct ?? "70.00"}
    )
    RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function updateUserAdmin(
  id: number,
  data: {
    name?: string;
    email?: string;
    whatsappNumber?: string | null;
    avatarUrl?: string | null;
    role?: UserRole;
    isActive?: boolean;
    revenueSharePct?: string;
  },
): Promise<User> {
  const rows = await sql`
    UPDATE users SET
      name = COALESCE(${data.name ?? null}, name),
      email = COALESCE(${data.email ?? null}, email),
      whatsapp_number = CASE
        WHEN ${data.whatsappNumber !== undefined} THEN ${data.whatsappNumber ?? null}
        ELSE whatsapp_number
      END,
      avatar_url = CASE
        WHEN ${data.avatarUrl !== undefined} THEN ${data.avatarUrl ?? null}
        ELSE avatar_url
      END,
      role = COALESCE(${data.role ?? null}, role),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      revenue_share_pct = COALESCE(${data.revenueSharePct ?? null}, revenue_share_pct),
      updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
    RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function deleteUserAdmin(id: number): Promise<void> {
  await sql`
    UPDATE users
    SET deleted_at = NOW(), is_active = FALSE, updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NULL
  `;
}

export async function restoreUserAdmin(id: number): Promise<void> {
  await sql`
    UPDATE users
    SET deleted_at = NULL, is_active = TRUE, updated_at = NOW()
    WHERE id = ${id} AND deleted_at IS NOT NULL
  `;
}

export async function listUsersAdmin(): Promise<AdminUserRow[]> {
  const rows = await sql`
    SELECT u.*,
      (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id) AS enrolled_count
    FROM users u
    ORDER BY u.created_at DESC
  `;
  return rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      ...mapUser(row),
      enrolledCount: Number(row.enrolled_count ?? 0),
    };
  });
}

export async function updateUserLastLogin(id: number): Promise<void> {
  await sql`UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = ${id}`;
}

export async function updateUserRole(id: number, role: UserRole): Promise<User> {
  const rows = await sql`
    UPDATE users SET role = ${role}, updated_at = NOW() WHERE id = ${id} RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}

export async function updateUserProfile(
  id: number,
  data: { name?: string; whatsappNumber?: string | null; avatarUrl?: string | null },
): Promise<User> {
  const rows = await sql`
    UPDATE users
    SET
      name = CASE
        WHEN ${data.name !== undefined} THEN ${data.name ?? null}
        ELSE name
      END,
      whatsapp_number = CASE
        WHEN ${data.whatsappNumber !== undefined} THEN ${data.whatsappNumber ?? null}
        ELSE whatsapp_number
      END,
      avatar_url = CASE
        WHEN ${data.avatarUrl !== undefined} THEN ${data.avatarUrl ?? null}
        ELSE avatar_url
      END,
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapUser(rows[0] as Record<string, unknown>);
}
