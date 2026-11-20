import { getSettingsMap } from "@/lib/db/landing.queries";
import { NotificationSettingsForm } from "@/components/admin/NotificationSettingsForm";

export default async function NotificationsPage() {
  const settings = await getSettingsMap();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
            Konfigurasi Notifikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola template pesan otomatis WhatsApp & Email untuk konfirmasi pembayaran siswa dan uji coba pengiriman pesan.
          </p>
        </div>
      </div>
      <NotificationSettingsForm settings={settings} />
    </div>
  );
}
