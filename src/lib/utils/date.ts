/**
 * Date and time formatting utilities tailored for WIB (Asia/Jakarta, UTC+7).
 * Works reliably on both client and server (e.g. Vercel UTC runtime).
 */

const JAKARTA_TZ = "Asia/Jakarta";

/**
 * Format time in WIB (HH:mm) e.g. "13:05"
 */
export function formatTimeWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "--:--";
  const d = typeof date === "object" ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "--:--";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(".", ":");
}

/**
 * Format day of month in WIB (e.g. "14")
 */
export function formatDateDayWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "--";
  const d = typeof date === "object" ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    day: "numeric",
  }).format(d);
}

/**
 * Format month abbreviation in WIB (e.g. "OKT")
 */
export function formatDateMonthWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "--";
  const d = typeof date === "object" ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    month: "short",
  })
    .format(d)
    .toUpperCase()
    .replace(".", "");
}

/**
 * Format full date in WIB (e.g. "Rabu, 14 Oktober 2026")
 */
export function formatFullDateWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "Tanggal belum ditentukan";
  const d = typeof date === "object" ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "Tanggal belum ditentukan";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Get date string in YYYY-MM-DD for WIB
 */
export function getLocalDateStringWIB(date: Date | string | number = new Date()): string {
  const d = typeof date === "object" ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

/**
 * Format relative day label in WIB: "HARI INI", "BESOK", or "RAB, 14 OKT"
 */
export function formatDayLabelWIB(d: Date | string | number | null, now: Date = new Date()): string {
  if (!d) return "TBA";
  const targetDate = typeof d === "object" ? d : new Date(d);
  if (Number.isNaN(targetDate.getTime())) return "TBA";

  const targetDayStr = getLocalDateStringWIB(targetDate);
  const todayStr = getLocalDateStringWIB(now);

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowStr = getLocalDateStringWIB(tomorrow);

  if (targetDayStr === todayStr) return "HARI INI";
  if (targetDayStr === tomorrowStr) return "BESOK";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: JAKARTA_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  })
    .format(targetDate)
    .toUpperCase()
    .replace(".", "");
}
