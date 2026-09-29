import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { sendFonnteWhatsApp } from "@/lib/notifications";

export async function GET(req: Request) {
  // In a real Vercel Cron, you'd secure this with an Authorization header
  // e.g. if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1. Ambil jadwal live class untuk H-24 (antara 23-24 jam dari sekarang)
    const h24Rows = await sql`
      SELECT 
        u.name as user_name,
        u.whatsapp_number as whatsapp,
        l.title as lesson_title,
        l.live_class_datetime,
        c.title as course_title,
        l.id as lesson_id,
        u.id as user_id
      FROM lessons l
      JOIN sections s ON s.id = l.section_id
      JOIN courses c ON c.id = s.course_id
      JOIN enrollments e ON e.course_id = c.id
      JOIN users u ON u.id = e.user_id
      WHERE l.content_type = 'live_class'
        AND l.deleted_at IS NULL
        AND l.live_class_datetime > NOW() + INTERVAL '23 hours'
        AND l.live_class_datetime <= NOW() + INTERVAL '24 hours'
        AND u.whatsapp_number IS NOT NULL
    `;

    // 2. Ambil jadwal live class untuk H-1 Jam (antara 0-1 jam dari sekarang)
    const h1Rows = await sql`
      SELECT 
        u.name as user_name,
        u.whatsapp_number as whatsapp,
        l.title as lesson_title,
        l.live_class_datetime,
        c.title as course_title,
        l.id as lesson_id,
        u.id as user_id
      FROM lessons l
      JOIN sections s ON s.id = l.section_id
      JOIN courses c ON c.id = s.course_id
      JOIN enrollments e ON e.course_id = c.id
      JOIN users u ON u.id = e.user_id
      WHERE l.content_type = 'live_class'
        AND l.deleted_at IS NULL
        AND l.live_class_datetime > NOW() 
        AND l.live_class_datetime <= NOW() + INTERVAL '1 hour'
        AND u.whatsapp_number IS NOT NULL
    `;

    const formatPhone = (phone: string) => {
      let target = phone.replace(/[^0-9]/g, "");
      if (target.startsWith("0")) target = "62" + target.slice(1);
      else if (target.startsWith("8")) target = "62" + target;
      return target;
    };

    const formatDate = (date: any) => {
      return new Date(date).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'full', timeStyle: 'short' });
    };

    let sentCount = 0;

    // Kirim H-24
    for (const r of h24Rows) {
      const wa = formatPhone(r.whatsapp as string);
      const time = formatDate(r.live_class_datetime);
      const msg = `*FluencyHub - Pengingat Live Class H-1!* ⏰\n\nHalo *${r.user_name}*, besok kamu ada jadwal kelas live!\n\n📚 Kelas: *${r.course_title}*\n📝 Modul: *${r.lesson_title}*\n📅 Waktu: *${time} WIB*\n\nJangan lupa persiapkan diri kamu ya! Link Zoom bisa diakses melalui dashboard:\n👉 https://fluencyhub.id/dashboard\n\nSemangat belajarnya brok! 🔥`;
      
      await sendFonnteWhatsApp(wa, msg);
      sentCount++;
    }

    // Kirim H-1 Jam
    for (const r of h1Rows) {
      const wa = formatPhone(r.whatsapp as string);
      const time = formatDate(r.live_class_datetime);
      const msg = `*FluencyHub - Live Class Segera Dimulai!* 🚀\n\nHalo *${r.user_name}*, kelas live kamu akan dimulai dalam waktu kurang dari 1 jam!\n\n📚 Kelas: *${r.course_title}*\n📝 Modul: *${r.lesson_title}*\n📅 Waktu: *${time} WIB*\n\nBuruan login ke dashboard dan klik tombol Join Zoom-nya sekarang:\n👉 https://fluencyhub.id/dashboard\n\nSee you in class brok! 👋`;
      
      await sendFonnteWhatsApp(wa, msg);
      sentCount++;
    }

    return NextResponse.json({ 
      success: true, 
      sent: sentCount,
      h24Count: h24Rows.length,
      h1Count: h1Rows.length 
    });

  } catch (error: any) {
    console.error("[Cron] Live Reminders Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
