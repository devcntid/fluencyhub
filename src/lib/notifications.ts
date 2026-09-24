import { getOrderById } from "./db/orders.queries";
import { getUserById } from "./db/users.queries";
import { getCourseById } from "./db/courses.queries";
import { getPaymentMethodById } from "./db/payment-methods.queries";

const FONNTE_API_URL = "https://api.fonnte.com/send";
const RESEND_API_URL = "https://api.resend.com/emails";

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
 * Mengirim Email menggunakan API Resend.
 */
export async function sendResendEmail(toEmail: string, subject: string, htmlContent: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Notifications] RESEND_API_KEY tidak ditemukan di environment.");
    return false;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "FluencyHub <onboarding@resend.dev>", // Ganti dengan domain asli jika sudah punya
        to: toEmail,
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Notifications] Resend Error:", errorData);
      return false;
    }

    console.log(`[Notifications] Email berhasil dikirim ke ${toEmail}`);
    return true;
  } catch (error) {
    console.error("[Notifications] Gagal memanggil API Resend:", error);
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

    // 1. Siapkan Pesan WhatsApp
    const formatter = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" });
    const formattedTotal = formatter.format(Number(order.totalAmount));

    const waMessage = `*FluencyHub - Pembayaran Berhasil!* 🎉\n\nHalo *${user.name}*, pembayaran kamu untuk kelas *${course.title}* sebesar *${formattedTotal}* telah berhasil diverifikasi.\n\nSilakan login ke *Dashboard* kamu dan mulai belajar sekarang:\n👉 https://fluencyhub.id/dashboard\n\nSemoga lancar belajarnya brok! 🔥`;

    // 2. Siapkan Pesan Email (HTML)
    const emailSubject = `✅ Payment Confirmed — Access to ${course.title} is Now Active!`;
    const formattedDate = (order.paidAt ?? new Date()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + " WIB";
    
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <p>Hi ${user.name},</p>
        <p>Great news! Your payment for the following course has been confirmed:</p>
        
        <table style="margin-bottom: 20px;">
          <tr><td style="padding-right: 10px;">📚 <strong>Course</strong></td><td>: ${course.title}</td></tr>
          <tr><td style="padding-right: 10px;">💰 <strong>Amount Paid</strong></td><td>: ${formattedTotal}</td></tr>
          <tr><td style="padding-right: 10px;">💳 <strong>Method</strong></td><td>: ${methodName}</td></tr>
          <tr><td style="padding-right: 10px;">📅 <strong>Date</strong></td><td>: ${formattedDate}</td></tr>
          <tr><td style="padding-right: 10px;">🔖 <strong>Order ID</strong></td><td>: ${order.orderNumber}</td></tr>
        </table>
        
        <p>Access your course now:<br>
        👉 <a href="https://fluencyhub-theta.vercel.app/dashboard" style="color: #4F46E5; text-decoration: none; font-weight: bold;">https://fluencyhub.id/dashboard</a></p>
        
        <p style="margin-top: 30px;">Happy learning!<br>The FluencyHub Team</p>
      </div>
    `;

    // 3. Kirim secara paralel tanpa saling menunggu (non-blocking)
    const promises = [];
    
    if (user.whatsappNumber) {
      // Pastikan awalan 0 diganti jadi 62, dan kalau awalnya 8 langsung ditambah 62
      let targetPhone = user.whatsappNumber.replace(/[^0-9]/g, "");
      if (targetPhone.startsWith("0")) targetPhone = "62" + targetPhone.slice(1);
      else if (targetPhone.startsWith("8")) targetPhone = "62" + targetPhone;
      
      promises.push(sendFonnteWhatsApp(targetPhone, waMessage));
    }
    
    promises.push(sendResendEmail(user.email, emailSubject, emailHtml));

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

    // 1. Siapkan Pesan WhatsApp
    const waMessage = `*FluencyHub - Pembayaran Ditolak* ❌\n\nHalo *${user.name}*, mohon maaf bukti transfer kamu untuk kelas *${course.title}* telah ditolak oleh Admin.\n\n*Alasan penolakan:*\n"${note || 'Bukti transfer tidak valid/kurang jelas.'}"\n\nSilakan upload ulang bukti pembayaran yang benar melalui halaman:\n👉 https://fluencyhub.id/dashboard\n\nJika ada pertanyaan, silakan balas pesan ini.`;

    // 2. Siapkan Pesan Email (HTML)
    const emailSubject = `❌ Payment Rejected — Please re-upload your payment proof`;
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <p>Hi ${user.name},</p>
        <p>We are sorry, but your manual payment proof for the following course has been rejected:</p>
        
        <table style="margin-bottom: 20px;">
          <tr><td style="padding-right: 10px;">📚 <strong>Course</strong></td><td>: ${course.title}</td></tr>
          <tr><td style="padding-right: 10px;">🔖 <strong>Order ID</strong></td><td>: ${order.orderNumber}</td></tr>
        </table>

        <div style="background: #FFF0F0; padding: 15px; border-left: 4px solid #EF4444; margin-bottom: 20px;">
          <strong>Reason for rejection:</strong><br>
          ${note || 'Invalid payment proof.'}
        </div>
        
        <p>Please re-upload a clear and valid payment proof to continue accessing your course:<br>
        👉 <a href="https://fluencyhub-theta.vercel.app/dashboard" style="color: #4F46E5; text-decoration: none; font-weight: bold;">https://fluencyhub.id/dashboard</a></p>
        
        <p style="margin-top: 30px;">Thank you,<br>The FluencyHub Team</p>
      </div>
    `;

    // 3. Kirim secara paralel
    const promises = [];
    
    if (user.whatsappNumber) {
      let targetPhone = user.whatsappNumber.replace(/[^0-9]/g, "");
      if (targetPhone.startsWith("0")) targetPhone = "62" + targetPhone.slice(1);
      else if (targetPhone.startsWith("8")) targetPhone = "62" + targetPhone;
      
      promises.push(sendFonnteWhatsApp(targetPhone, waMessage));
    }
    
    promises.push(sendResendEmail(user.email, emailSubject, emailHtml));

    await Promise.allSettled(promises);

  } catch (error) {
    console.error("[Notifications] Error saat memproses notifikasi rejection:", error);
  }
}
