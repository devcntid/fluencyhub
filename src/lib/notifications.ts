import { getOrderById } from "./db/orders.queries";
import { getUserById } from "./db/users.queries";
import { getCourseById } from "./db/courses.queries";
import { getPaymentMethodById } from "./db/payment-methods.queries";
import { getSettingsMap } from "./db/landing.queries";
import { sendEmail } from "./email";

const FONNTE_API_URL = "https://api.fonnte.com/send";

/**
 * Mengirim pesan WhatsApp menggunakan API Fonnte.
 */
export async function sendFonnteWhatsApp(targetPhone: string, message: string) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.warn("[Notifications] FONNTE_TOKEN tidak ditemukan di environment.");
    return false;
  }

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target: targetPhone,
        message: message,
        typing: false,
        delay: "2",
      }),
    });

    const result = await response.json();
    if (!response.ok || !result.status) {
      console.error("[Notifications] Fonnte Error:", result);
      return false;
    }
    
    console.log(`[Notifications] WhatsApp berhasil dikirim ke ${targetPhone}`);
    return true;
  } catch (error) {
    console.error("[Notifications] Gagal memanggil API Fonnte:", error);
    return false;
  }
}


/**
 * Fungsi utama yang dipanggil saat pembayaran lunas.
 * Akan menarik data dari database, merakit teks, dan mengirim notifikasi paralel.
 */
export async function notifyPaymentSuccess(orderId: number) {
  try {
    const order = await getOrderById(orderId);
    if (!order) return;

    const [user, course] = await Promise.all([
      getUserById(order.userId),
      getCourseById(order.courseId)
    ]);

    if (!user || !course) return;
    
    // Ambil nama metode pembayaran jika ada
    let methodName = "Transfer";
    if (order.paymentMethodId) {
      const pm = await getPaymentMethodById(order.paymentMethodId);
      if (pm) methodName = pm.name;
    }

    // 1. Ambil Settings dan siapkan Variabel
    const settings = await getSettingsMap();
    
    const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" });
    const formattedTotal = formatter.format(Number(order.totalAmount));
    const formattedDate = (order.paidAt ?? new Date()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + " WIB";

    const vars: Record<string, string> = {
      "{USER_NAME}": user.name || "Student",
      "{COURSE_TITLE}": course.title,
      "{AMOUNT}": formattedTotal,
      "{METHOD}": methodName,
      "{DATE}": formattedDate,
      "{ORDER_ID}": order.orderNumber,
    };

    function replaceVars(template: string) {
      let result = template;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(key, value);
      }
      return result;
    }

    // Default Templates (Fallbacks)
    const defaultWaMessage = `*FluencyHub - Pembayaran Berhasil!* 🎉\n\nHalo *{USER_NAME}*, pembayaran kamu untuk kelas *{COURSE_TITLE}* sebesar *{AMOUNT}* telah berhasil diverifikasi.\n\nSilakan login ke *Dashboard* kamu dan mulai belajar sekarang:\n👉 https://fluencyhub.id/dashboard\n\nSemoga lancar belajarnya brok! 🔥`;
    const defaultEmailSubject = `✅ Payment Confirmed — Access to {COURSE_TITLE} is Now Active!`;
    const defaultEmailBody = `Great news! Your payment has been successfully confirmed. You can now log in to the dashboard and start learning right away.\n\nKeep up the enthusiasm and happy learning!`;

    // Ambil template dari settings atau gunakan default
    const waMessage = replaceVars(settings.notif_wa_success ?? defaultWaMessage);
    const emailSubject = replaceVars(settings.notif_email_subject_success ?? defaultEmailSubject);
    
    // Konversi body text ke format HTML menggunakan paragraf (<p>)
    const rawEmailBody = settings.notif_email_body_success ?? defaultEmailBody;
    const bodyHtml = rawEmailBody.split('\n').filter(line => line.trim() !== "").map(line => `<p>${line}</p>`).join("");
    
    // Gabung dengan template frame + tabel
    const emailHtml = replaceVars(`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
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

    // 3. Kirim secara paralel tanpa saling menunggu (non-blocking)
    const promises = [];
    
    if (user.whatsappNumber && settings.notif_wa_enabled !== "false") {
      let targetPhone = user.whatsappNumber.replace(/[^0-9]/g, "");
      if (targetPhone.startsWith("0")) targetPhone = "62" + targetPhone.slice(1);
      else if (targetPhone.startsWith("8")) targetPhone = "62" + targetPhone;
      
      promises.push(sendFonnteWhatsApp(targetPhone, waMessage));
    }
    
    if (user.email && settings.notif_email_enabled !== "false") {
      promises.push(sendEmail({ to: user.email, subject: emailSubject, html: emailHtml }));
    }

    await Promise.allSettled(promises);

  } catch (error) {
    console.error("[Notifications] Error saat memproses notifikasi:", error);
  }
}

/**
 * Fungsi yang dipanggil saat admin menolak bukti pembayaran manual.
 */
export async function notifyPaymentRejected(orderId: number, note: string) {
  try {
    const order = await getOrderById(orderId);
    if (!order) return;

    const [user, course] = await Promise.all([
      getUserById(order.userId),
      getCourseById(order.courseId)
    ]);

    if (!user || !course) return;

    // 1. Ambil Settings dan siapkan Variabel
    const settings = await getSettingsMap();
    
    const vars: Record<string, string> = {
      "{USER_NAME}": user.name || "Student",
      "{COURSE_TITLE}": course.title,
      "{ORDER_ID}": order.orderNumber,
      "{NOTE}": note || "Bukti transfer tidak valid/kurang jelas.",
    };

    function replaceVars(template: string) {
      let result = template;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replaceAll(key, value);
      }
      return result;
    }

    // Default Templates (Fallbacks)
    const defaultWaMessage = `*FluencyHub - Pembayaran Ditolak* ❌\n\nHalo *{USER_NAME}*, mohon maaf bukti transfer kamu untuk kelas *{COURSE_TITLE}* telah ditolak oleh Admin.\n\n*Alasan penolakan:*\n"{NOTE}"\n\nSilakan upload ulang bukti pembayaran yang benar melalui halaman:\n👉 https://fluencyhub.id/dashboard\n\nJika ada pertanyaan, silakan balas pesan ini.`;
    const defaultEmailSubject = `❌ Payment Rejected — Please re-upload your payment proof`;
    const defaultEmailBody = `We are sorry to inform you that your manual payment proof has been rejected by the admin. Please check the rejection reason and upload a clearer proof of payment via your dashboard to activate your access.`;

    // Ambil template dari settings atau gunakan default
    const waMessage = replaceVars(settings.notif_wa_rejected ?? defaultWaMessage);
    const emailSubject = replaceVars(settings.notif_email_subject_rejected ?? defaultEmailSubject);
    
    // Konversi body text ke format HTML menggunakan paragraf (<p>)
    const rawEmailBody = settings.notif_email_body_rejected ?? defaultEmailBody;
    const bodyHtml = rawEmailBody.split('\n').filter(line => line.trim() !== "").map(line => `<p>${line}</p>`).join("");
    
    const emailHtml = replaceVars(`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
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

    // 3. Kirim secara paralel
    const promises = [];
    
    if (user.whatsappNumber && settings.notif_wa_enabled !== "false") {
      let targetPhone = user.whatsappNumber.replace(/[^0-9]/g, "");
      if (targetPhone.startsWith("0")) targetPhone = "62" + targetPhone.slice(1);
      else if (targetPhone.startsWith("8")) targetPhone = "62" + targetPhone;
      
      promises.push(sendFonnteWhatsApp(targetPhone, waMessage));
    }
    
    if (user.email && settings.notif_email_enabled !== "false") {
      promises.push(sendEmail({ to: user.email, subject: emailSubject, html: emailHtml }));
    }

    await Promise.allSettled(promises);

  } catch (error) {
    console.error("[Notifications] Error saat memproses notifikasi rejection:", error);
  }
}
