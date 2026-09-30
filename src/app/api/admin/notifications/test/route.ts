import { NextResponse } from "next/server";
import { auth } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { sendFonnteWhatsApp } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user?.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email, phone, testType, settings } = await req.json();

    // Replace dummy variables
    const vars: Record<string, string> = {
      "{USER_NAME}": "Brok (Test User)",
      "{COURSE_TITLE}": "Mastering IELTS 2026",
      "{AMOUNT}": "Rp 150.000",
      "{METHOD}": "QRIS",
      "{DATE}": new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
      "{ORDER_ID}": "ORD-TEST-1234",
      "{NOTE}": "Transfer receipt is too blurry, please upload a clearer image.",
    };

    function replaceVars(template: string) {
      let result = template;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(key, value);
      }
      return result;
    }

    let subject = "";
    let html = "";
    let wa = "";

    if (testType === "success") {
      subject = replaceVars(settings.notif_email_subject_success || "");
      const rawBody = settings.notif_email_body_success || "";
      const bodyHtml = rawBody.split('\n').filter((l: string) => l.trim() !== "").map((l: string) => `<p>${l}</p>`).join("");
      html = replaceVars(`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <p>Hi {USER_NAME},</p>
        ${bodyHtml}
        <table style="margin-bottom: 20px;">
          <tr><td style="padding-right: 10px;">📚 <strong>Course</strong></td><td>: {COURSE_TITLE}</td></tr>
          <tr><td style="padding-right: 10px;">💰 <strong>Amount Paid</strong></td><td>: {AMOUNT}</td></tr>
          <tr><td style="padding-right: 10px;">💳 <strong>Method</strong></td><td>: {METHOD}</td></tr>
          <tr><td style="padding-right: 10px;">📅 <strong>Date</strong></td><td>: {DATE}</td></tr>
          <tr><td style="padding-right: 10px;">🔖 <strong>Order ID</strong></td><td>: {ORDER_ID}</td></tr>
        </table>
        <p>Access your course now:<br>👉 <a href="https://fluencyhub.id/dashboard" style="color: #4F46E5; text-decoration: none; font-weight: bold;">https://fluencyhub.id/dashboard</a></p>
        <p style="margin-top: 30px;">The FluencyHub Team</p>
      </div>`);
      wa = replaceVars(settings.notif_wa_success || "");
    } else {
      subject = replaceVars(settings.notif_email_subject_rejected || "");
      const rawBody = settings.notif_email_body_rejected || "";
      const bodyHtml = rawBody.split('\n').filter((l: string) => l.trim() !== "").map((l: string) => `<p>${l}</p>`).join("");
      html = replaceVars(`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <p>Hi {USER_NAME},</p>
        ${bodyHtml}
        <table style="margin-bottom: 20px;">
          <tr><td style="padding-right: 10px;">📚 <strong>Course</strong></td><td>: {COURSE_TITLE}</td></tr>
          <tr><td style="padding-right: 10px;">🔖 <strong>Order ID</strong></td><td>: {ORDER_ID}</td></tr>
        </table>
        <div style="background: #FFF0F0; padding: 15px; border-left: 4px solid #EF4444; margin-bottom: 20px;">
          <strong>Reason for rejection:</strong><br>
          {NOTE}
        </div>
        <p>Please re-upload a clear and valid payment proof to continue accessing your course:<br>👉 <a href="https://fluencyhub.id/dashboard" style="color: #4F46E5; text-decoration: none; font-weight: bold;">https://fluencyhub.id/dashboard</a></p>
        <p style="margin-top: 30px;">Thank you,<br>The FluencyHub Team</p>
      </div>`);
      wa = replaceVars(settings.notif_wa_rejected || "");
    }

    const promises = [];

    if (email && settings.notif_email_enabled === "true") {
      promises.push(sendEmail({ to: email, subject, html }));
    }

    if (phone && settings.notif_wa_enabled === "true") {
      let targetPhone = phone.replace(/[^0-9]/g, "");
      if (targetPhone.startsWith("0")) targetPhone = "62" + targetPhone.slice(1);
      else if (targetPhone.startsWith("8")) targetPhone = "62" + targetPhone;
      
      promises.push(sendFonnteWhatsApp(targetPhone, wa));
    }

    await Promise.allSettled(promises);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[TestNotificationError]", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
