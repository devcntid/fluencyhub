import type {
  Faq,
  LandingMethodItem,
  LandingPainPoint,
  SiteSetting,
  Testimonial,
} from "@/types/db";
import { asDate, asNum, sql } from "./client";

type Row = Record<string, unknown>;

function mapSetting(row: Row): SiteSetting {
  return {
    id: asNum(row.id),
    key: String(row.key),
    value: String(row.value ?? ""),
    updatedAt: asDate(row.updated_at),
  };
}

function mapPain(row: Row): LandingPainPoint {
  return {
    id: asNum(row.id),
    icon: String(row.icon),
    iconBg: String(row.icon_bg),
    iconColor: String(row.icon_color),
    title: String(row.title),
    description: String(row.description),
    sortOrder: asNum(row.sort_order),
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function mapMethod(row: Row): LandingMethodItem {
  return {
    id: asNum(row.id),
    tab: row.tab as LandingMethodItem["tab"],
    icon: String(row.icon),
    title: String(row.title),
    description: String(row.description),
    sortOrder: asNum(row.sort_order),
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function mapTestimonial(row: Row): Testimonial {
  return {
    id: asNum(row.id),
    name: String(row.name),
    role: String(row.role),
    quote: String(row.quote),
    avatarUrl: (row.avatar_url as string) ?? null,
    rating: asNum(row.rating),
    sortOrder: asNum(row.sort_order),
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

function mapFaq(row: Row): Faq {
  return {
    id: asNum(row.id),
    question: String(row.question),
    answer: String(row.answer),
    sortOrder: asNum(row.sort_order),
    isActive: Boolean(row.is_active),
    createdAt: asDate(row.created_at),
    updatedAt: asDate(row.updated_at),
  };
}

export async function listSiteSettings(): Promise<SiteSetting[]> {
  const rows = await sql`SELECT * FROM site_settings ORDER BY key ASC`;
  return rows.map((r) => mapSetting(r as Row));
}

export async function getSettingsMap(): Promise<Record<string, string>> {
  const rows = await listSiteSettings();
  return Object.fromEntries(rows.map((s) => [s.key, s.value]));
}

export async function upsertSiteSettings(entries: Record<string, string>): Promise<void> {
  for (const [key, value] of Object.entries(entries)) {
    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `;
  }
}

export async function listPainPoints(activeOnly = true): Promise<LandingPainPoint[]> {
  const rows = activeOnly
    ? await sql`SELECT * FROM landing_pain_points WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
    : await sql`SELECT * FROM landing_pain_points ORDER BY sort_order ASC, id ASC`;
  return rows.map((r) => mapPain(r as Row));
}

export async function createPainPoint(data: {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<LandingPainPoint> {
  const existing = await sql`SELECT 1 FROM landing_pain_points WHERE sort_order = ${data.sortOrder} LIMIT 1`;
  if (existing.length > 0) {
    throw new Error("Sort order already exists");
  }

  const rows = await sql`
    INSERT INTO landing_pain_points (icon, icon_bg, icon_color, title, description, sort_order, is_active)
    VALUES (${data.icon}, ${data.iconBg}, ${data.iconColor}, ${data.title}, ${data.description}, ${data.sortOrder}, ${data.isActive})
    RETURNING *
  `;
  return mapPain(rows[0] as Row);
}

export async function updatePainPoint(
  id: number,
  data: Partial<{
    icon: string;
    iconBg: string;
    iconColor: string;
    title: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
  }>,
): Promise<LandingPainPoint> {
  if (data.sortOrder !== undefined) {
    const existing = await sql`SELECT 1 FROM landing_pain_points WHERE sort_order = ${data.sortOrder} AND id != ${id} LIMIT 1`;
    if (existing.length > 0) {
      throw new Error("Sort order already exists");
    }
  }

  const rows = await sql`
    UPDATE landing_pain_points SET
      icon = COALESCE(${data.icon ?? null}, icon),
      icon_bg = COALESCE(${data.iconBg ?? null}, icon_bg),
      icon_color = COALESCE(${data.iconColor ?? null}, icon_color),
      title = COALESCE(${data.title ?? null}, title),
      description = COALESCE(${data.description ?? null}, description),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapPain(rows[0] as Row);
}

export async function deletePainPoint(id: number): Promise<void> {
  await sql`DELETE FROM landing_pain_points WHERE id = ${id}`;
}

export async function listMethodItems(activeOnly = true): Promise<LandingMethodItem[]> {
  const rows = activeOnly
    ? await sql`SELECT * FROM landing_method_items WHERE is_active = TRUE ORDER BY tab ASC, sort_order ASC, id ASC`
    : await sql`SELECT * FROM landing_method_items ORDER BY tab ASC, sort_order ASC, id ASC`;
  return rows.map((r) => mapMethod(r as Row));
}

export async function createMethodItem(data: {
  tab: "online" | "hybrid";
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<LandingMethodItem> {
  const existing = await sql`SELECT 1 FROM landing_method_items WHERE tab = ${data.tab} AND sort_order = ${data.sortOrder} LIMIT 1`;
  if (existing.length > 0) {
    throw new Error("Sort order already exists for this tab");
  }

  const rows = await sql`
    INSERT INTO landing_method_items (tab, icon, title, description, sort_order, is_active)
    VALUES (${data.tab}, ${data.icon}, ${data.title}, ${data.description}, ${data.sortOrder}, ${data.isActive})
    RETURNING *
  `;
  return mapMethod(rows[0] as Row);
}

export async function updateMethodItem(
  id: number,
  data: Partial<{
    tab: "online" | "hybrid";
    icon: string;
    title: string;
    description: string;
    sortOrder: number;
    isActive: boolean;
  }>,
): Promise<LandingMethodItem> {
  if (data.sortOrder !== undefined || data.tab !== undefined) {
    const current = await sql`SELECT tab, sort_order FROM landing_method_items WHERE id = ${id}`;
    if (current.length > 0) {
      const targetTab = data.tab ?? current[0].tab;
      const targetSort = data.sortOrder ?? current[0].sort_order;
      const existing = await sql`SELECT 1 FROM landing_method_items WHERE tab = ${targetTab} AND sort_order = ${targetSort} AND id != ${id} LIMIT 1`;
      if (existing.length > 0) {
        throw new Error("Sort order already exists for this tab");
      }
    }
  }

  const rows = await sql`
    UPDATE landing_method_items SET
      tab = COALESCE(${data.tab ?? null}, tab),
      icon = COALESCE(${data.icon ?? null}, icon),
      title = COALESCE(${data.title ?? null}, title),
      description = COALESCE(${data.description ?? null}, description),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapMethod(rows[0] as Row);
}

export async function deleteMethodItem(id: number): Promise<void> {
  await sql`DELETE FROM landing_method_items WHERE id = ${id}`;
}

export async function listTestimonials(activeOnly = true): Promise<Testimonial[]> {
  const rows = activeOnly
    ? await sql`SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
    : await sql`SELECT * FROM testimonials ORDER BY sort_order ASC, id ASC`;
  return rows.map((r) => mapTestimonial(r as Row));
}

export async function createTestimonial(data: {
  name: string;
  role: string;
  quote: string;
  avatarUrl: string | null;
  rating: number;
  sortOrder: number;
  isActive: boolean;
}): Promise<Testimonial> {
  const existing = await sql`SELECT 1 FROM testimonials WHERE sort_order = ${data.sortOrder} LIMIT 1`;
  if (existing.length > 0) {
    throw new Error("Sort order already exists");
  }

  const rows = await sql`
    INSERT INTO testimonials (name, role, quote, avatar_url, rating, sort_order, is_active)
    VALUES (${data.name}, ${data.role}, ${data.quote}, ${data.avatarUrl}, ${data.rating}, ${data.sortOrder}, ${data.isActive})
    RETURNING *
  `;
  return mapTestimonial(rows[0] as Row);
}

export async function updateTestimonial(
  id: number,
  data: Partial<{
    name: string;
    role: string;
    quote: string;
    avatarUrl: string | null;
    rating: number;
    sortOrder: number;
    isActive: boolean;
  }>,
): Promise<Testimonial> {
  if (data.sortOrder !== undefined) {
    const existing = await sql`SELECT 1 FROM testimonials WHERE sort_order = ${data.sortOrder} AND id != ${id} LIMIT 1`;
    if (existing.length > 0) {
      throw new Error("Sort order already exists");
    }
  }

  const rows = await sql`
    UPDATE testimonials SET
      name = COALESCE(${data.name ?? null}, name),
      role = COALESCE(${data.role ?? null}, role),
      quote = COALESCE(${data.quote ?? null}, quote),
      avatar_url = COALESCE(${data.avatarUrl ?? null}, avatar_url),
      rating = COALESCE(${data.rating ?? null}, rating),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapTestimonial(rows[0] as Row);
}

export async function deleteTestimonial(id: number): Promise<void> {
  await sql`DELETE FROM testimonials WHERE id = ${id}`;
}

export async function listFaqs(activeOnly = true): Promise<Faq[]> {
  const rows = activeOnly
    ? await sql`SELECT * FROM faqs WHERE is_active = TRUE ORDER BY sort_order ASC, id ASC`
    : await sql`SELECT * FROM faqs ORDER BY sort_order ASC, id ASC`;
  return rows.map((r) => mapFaq(r as Row));
}

export async function createFaq(data: {
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}): Promise<Faq> {
  const existing = await sql`SELECT 1 FROM faqs WHERE sort_order = ${data.sortOrder} LIMIT 1`;
  if (existing.length > 0) {
    throw new Error("Sort order already exists");
  }

  const rows = await sql`
    INSERT INTO faqs (question, answer, sort_order, is_active)
    VALUES (${data.question}, ${data.answer}, ${data.sortOrder}, ${data.isActive})
    RETURNING *
  `;
  return mapFaq(rows[0] as Row);
}

export async function updateFaq(
  id: number,
  data: Partial<{ question: string; answer: string; sortOrder: number; isActive: boolean }>,
): Promise<Faq> {
  if (data.sortOrder !== undefined) {
    const existing = await sql`SELECT 1 FROM faqs WHERE sort_order = ${data.sortOrder} AND id != ${id} LIMIT 1`;
    if (existing.length > 0) {
      throw new Error("Sort order already exists");
    }
  }

  const rows = await sql`
    UPDATE faqs SET
      question = COALESCE(${data.question ?? null}, question),
      answer = COALESCE(${data.answer ?? null}, answer),
      sort_order = COALESCE(${data.sortOrder ?? null}, sort_order),
      is_active = COALESCE(${data.isActive ?? null}, is_active),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `;
  return mapFaq(rows[0] as Row);
}

export async function deleteFaq(id: number): Promise<void> {
  await sql`DELETE FROM faqs WHERE id = ${id}`;
}
