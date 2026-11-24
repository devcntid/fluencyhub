import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error("[Email] SMTP_USER atau SMTP_PASSWORD belum dikonfigurasi.");
    return { success: false, error: "SMTP credentials not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"English Ready" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
