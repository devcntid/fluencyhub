import { NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { getSettingsMap } from "@/lib/db/landing.queries";
import { auth } from "@/lib/session";

const AUDIENCE_OPTIONS = [
  "Anak / Pelajar",
  "Ibu Rumah Tangga / Umum",
  "Mahasiswa / Pekerja",
  "Grup / Sekolah / Kantor",
] as const;

const LEARNING_TYPE_OPTIONS = [
  "Kelas Sendiri / Privat",
  "Kelas Reguler (Cohort)",
  "Rombongan / Grup (5+)",
] as const;

const consultationInquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama lengkap minimal 2 karakter.")
    .max(120, "Nama lengkap terlalu panjang."),
  email: z
    .string()
    .trim()
    .email("Format email tidak valid.")
    .max(160, "Email terlalu panjang."),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp minimal 8 digit.")
    .max(25, "Nomor WhatsApp terlalu panjang.")
    .regex(/^[+\d\s\-()]+$/, "Nomor WhatsApp hanya boleh berisi angka."),
  audience: z.enum(AUDIENCE_OPTIONS, {
    error: "Pilih kategori peserta.",
  }),
  learningType: z.enum(LEARNING_TYPE_OPTIONS, {
    error: "Pilih tipe belajar yang diminati.",
  }),
  notes: z
    .string()
    .trim()
    .max(1000, "Catatan kebutuhan maksimal 1.000 karakter.")
    .optional()
    .default(""),
  website: z.string().optional().default(""),
});

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX_REQUESTS = 5;
const rateLimitStore = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitStore.get(key) ?? []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    rateLimitStore.set(key, timestamps);
    return true;
  }
  timestamps.push(now);
  rateLimitStore.set(key, timestamps);
  return false;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeWhatsAppDigits(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith("8")) {
    return `62${digits}`;
  }
  return digits;
}

function buildInternalConsultationEmailHtml(params: {
  name: string;
  email: string;
  whatsapp: string;
  audience: string;
  learningType: string;
  notes: string;
  submittedAt: string;
  accountLabel: string;
}) {
  const safeName = escapeHtml(params.name);
  const safeEmail = escapeHtml(params.email);
  const safeWhatsapp = escapeHtml(params.whatsapp);
  const safeAudience = escapeHtml(params.audience);
  const safeLearningType = escapeHtml(params.learningType);
  const safeAccountLabel = escapeHtml(params.accountLabel);
  const safeNotes = params.notes
    ? escapeHtml(params.notes).replaceAll("\n", "<br />")
    : "<span style=\"color:#64748B;font-style:italic;\">Tidak ada catatan tambahan</span>";
  const safeSubmittedAt = escapeHtml(params.submittedAt);

  const waDigits = normalizeWhatsAppDigits(params.whatsapp);
  const waText = encodeURIComponent(
    `Halo ${params.name}, terima kasih sudah menghubungi English Ready! Kami lihat kamu tertarik konsultasi kelas untuk kategori ${params.audience} (${params.learningType}). Kapan waktu yang nyaman untuk ngobrol singkat?`
  );
  const waLink = waDigits ? `https://wa.me/${waDigits}?text=${waText}` : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; background-color: #FBF6F1; padding: 24px; border-radius: 16px; border: 1px solid #E6DED4; color: #0B2559;">
      <div style="background-color: #0B2559; color: #FFFFFF; padding: 20px 24px; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #F26A12; margin-bottom: 6px;">
          English Ready &bull; Permintaan Konsultasi Baru
        </div>
        <h2 style="margin: 0; font-size: 20px; line-height: 1.3; color: #FFFFFF;">
          Konsultasi Program dari ${safeName}
        </h2>
      </div>

      <div style="background-color: #FFFFFF; margin-top: 16px; padding: 20px 24px; border-radius: 12px; border: 1px solid #E6DED4;">
        <p style="margin: 0 0 14px 0; font-size: 14px; color: #3D4760;">
          Ada permintaan konsultasi pemilihan kelas &amp; jadwal baru yang masuk dari landing page English Ready:
        </p>

        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; width: 170px; vertical-align: top;">Nama Lengkap</td>
            <td style="padding: 8px 0; color: #0B2559; font-weight: 700;">${safeName}</td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Kategori Peserta</td>
            <td style="padding: 8px 0;">
              <span style="display: inline-block; background-color: #FFF4EC; color: #C2530A; font-weight: 700; padding: 3px 10px; border-radius: 999px; font-size: 13px;">
                ${safeAudience}
              </span>
            </td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Tipe Belajar</td>
            <td style="padding: 8px 0; color: #0B2559; font-weight: 700;">${safeLearningType}</td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Email Aktif</td>
            <td style="padding: 8px 0; color: #0062D1; font-weight: 600;">
              <a href="mailto:${safeEmail}" style="color: #0062D1; text-decoration: none;">${safeEmail}</a>
            </td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Nomor WhatsApp</td>
            <td style="padding: 8px 0; color: #0B2559; font-weight: 600;">${safeWhatsapp}</td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Target / Kendala</td>
            <td style="padding: 8px 0; color: #3D4760; line-height: 1.5;">${safeNotes}</td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Akun Pengirim</td>
            <td style="padding: 8px 0; color: #4A5468; font-size: 13px;">${safeAccountLabel}</td>
          </tr>
          <tr style="border-top: 1px solid #F1ECE6;">
            <td style="padding: 8px 12px 8px 0; color: #4A5468; font-weight: 600; vertical-align: top;">Waktu Masuk</td>
            <td style="padding: 8px 0; color: #4A5468; font-size: 13px;">${safeSubmittedAt}</td>
          </tr>
        </table>

        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #F1ECE6;">
          ${
            waLink
              ? `<a href="${waLink}" style="display: inline-block; background-color: #0B2559; color: #FFFFFF; padding: 10px 18px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 13px; margin-right: 8px;">Hubungi via WhatsApp</a>`
              : ""
          }
          <span style="font-size: 12px; color: #4A5468;">
            Atau langsung klik <strong>Reply</strong> pada email ini untuk membalas ke ${safeEmail}.
          </span>
        </div>
      </div>

      <p style="margin: 16px 0 0 0; font-size: 11px; color: #64748B; text-align: center;">
        Notifikasi otomatis dari sistem Konsultasi Program English Ready.
      </p>
    </div>
  `;
}

function buildRequesterConfirmationHtml(params: {
  name: string;
  audience: string;
  learningType: string;
  notes: string;
}) {
  const safeName = escapeHtml(params.name);
  const safeAudience = escapeHtml(params.audience);
  const safeLearningType = escapeHtml(params.learningType);
  const safeNotes = params.notes
    ? escapeHtml(params.notes).replaceAll("\n", "<br />")
    : "";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background-color: #FBF6F1; padding: 24px; border-radius: 16px; border: 1px solid #E6DED4; color: #0B2559;">
      <div style="background-color: #0B2559; color: #FFFFFF; padding: 22px 24px; border-radius: 12px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #F26A12; margin-bottom: 6px;">
          English Ready &bull; Konsultasi Program
        </div>
        <h2 style="margin: 0; font-size: 20px; line-height: 1.3; color: #FFFFFF;">
          Permintaan Konsultasi Kamu Sudah Kami Terima
        </h2>
      </div>

      <div style="background-color: #FFFFFF; margin-top: 16px; padding: 22px 24px; border-radius: 12px; border: 1px solid #E6DED4; font-size: 14px; line-height: 1.65; color: #3D4760;">
        <p style="margin-top: 0;">Halo <strong style="color: #0B2559;">${safeName}</strong>,</p>
        <p>
          Terima kasih sudah menghubungi <strong style="color: #0B2559;">English Ready</strong> untuk konsultasi program kategori <strong style="color: #0B2559;">${safeAudience}</strong> (${safeLearningType}).
        </p>
        <p>
          Tim advisor kami sudah menerima pesanmu dan akan segera menghubungimu melalui WhatsApp atau email dalam maksimal <strong>1&times;24 jam kerja</strong> untuk membantu mencarikan kelas dan jadwal yang paling sesuai.
        </p>

        ${
          safeNotes
            ? `<div style="margin: 16px 0; padding: 12px 14px; background-color: #FBF6F1; border-left: 3px solid #F26A12; border-radius: 8px; font-size: 13px; color: #3D4760;">
                <div style="font-weight: 700; color: #0B2559; margin-bottom: 4px;">Ringkasan catatanmu:</div>
                ${safeNotes}
              </div>`
            : ""
        }

        <div style="margin-top: 18px; padding: 14px 16px; background-color: #F8FAFC; border: 1px solid #E6DED4; border-radius: 10px; font-size: 13px;">
          <strong style="color: #0B2559;">Apa yang akan dibantu saat sesi konsultasi?</strong>
          <ul style="margin: 8px 0 0 0; padding-left: 18px; color: #3D4760;">
            <li>Pemetaan level awal &amp; rekomendasi kelas paling cocok (anak, pelajar, ibu rumah tangga, pekerja, maupun grup).</li>
            <li>Penyesuaian jadwal belajar yang fleksibel dengan aktivitas sehari-hari.</li>
            <li>Informasi biaya, promo aktif, dan cara pendaftaran yang paling praktis.</li>
          </ul>
        </div>

        <p style="margin: 20px 0 0 0; color: #0B2559;">
          Salam hangat,<br />
          <strong>Tim Advisor English Ready</strong>
        </p>
      </div>

      <p style="margin: 16px 0 0 0; font-size: 11px; color: #64748B; text-align: center;">
        Email ini dikirim otomatis sebagai konfirmasi permintaan konsultasi program kamu di English Ready.
      </p>
    </div>
  `;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error:
            "Silakan login ke akun kamu terlebih dahulu untuk mengirim permintaan konsultasi.",
        },
        { status: 401 }
      );
    }

    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "local";
    const rateLimitKey = `user:${session.user.id}:${ip}`;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        {
          error:
            "Terlalu banyak permintaan dalam waktu singkat. Silakan coba lagi beberapa menit lagi.",
        },
        { status: 429 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Format data tidak valid." },
        { status: 400 }
      );
    }

    const parsed = consultationInquirySchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        { error: firstIssue?.message || "Mohon lengkapi semua kolom wajib." },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Anti-bot honeypot: silently succeed without sending emails
    if (data.website.trim().length > 0) {
      return NextResponse.json({
        success: true,
        message: "Permintaan konsultasi berhasil dikirim.",
      });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        {
          error:
            "Layanan pengiriman email belum dikonfigurasi di server (SMTP_USER / SMTP_PASSWORD).",
        },
        { status: 503 }
      );
    }

    const settings = await getSettingsMap().catch(
      () => ({}) as Record<string, string>
    );

    const configuredTeamEmail =
      process.env.TEAMS_INQUIRY_EMAIL?.trim() ||
      settings.teams_email?.trim() ||
      process.env.SMTP_USER;

    const submittedAt =
      new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " WIB";

    const accountLabel =
      [session.user.name, session.user.email].filter(Boolean).join(" · ") ||
      `User #${session.user.id}`;

    const internalResult = await sendEmail({
      to: configuredTeamEmail,
      replyTo: data.email,
      subject: `[Konsultasi Program] ${data.name} — ${data.audience} (${data.learningType})`,
      html: buildInternalConsultationEmailHtml({
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp,
        audience: data.audience,
        learningType: data.learningType,
        notes: data.notes,
        submittedAt,
        accountLabel,
      }),
    });

    if (!internalResult.success) {
      return NextResponse.json(
        {
          error:
            "Gagal mengirim email ke tim kami saat ini. Silakan coba beberapa saat lagi.",
        },
        { status: 500 }
      );
    }

    // Send automatic confirmation receipt to requester (non-blocking if secondary fails)
    const confirmationResult = await sendEmail({
      to: data.email,
      replyTo: configuredTeamEmail,
      subject: `Permintaan Konsultasi English Ready Diterima — ${data.audience}`,
      html: buildRequesterConfirmationHtml({
        name: data.name,
        audience: data.audience,
        learningType: data.learningType,
        notes: data.notes,
      }),
    });

    if (!confirmationResult.success) {
      console.warn(
        "[ConsultationInquiry] Email konfirmasi ke pengirim gagal dikirim:",
        confirmationResult.error
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Permintaan konsultasi berhasil dikirim ke tim English Ready dan email konfirmasi sudah dikirim ke inbox kamu.",
    });
  } catch (error) {
    console.error("[ConsultationInquiry] Unexpected error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
