// English Ready v1.3 - Landing CMS Settings Page
import { CmsSettingsForm } from "@/components/admin/CmsSettingsForm";
import { getSettingsMap } from "@/lib/db/landing.queries";
import Link from "next/link";

export default async function CmsSettingsPage() {
  const settings = await getSettingsMap();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
            Pengaturan Konten Landing Page
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Sesuaikan teks utama halaman depan English Ready, mulai dari Hero Section, Masalah & Solusi, hingga Penawaran untuk Tim.
          </p>
        </div>
        <Link
          href="/"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200/90 hover:bg-slate-50 transition shadow-2xs shrink-0"
        >
          <span>Buka Landing Page</span>
          <span>↗</span>
        </Link>
      </div>

      <CmsSettingsForm initial={settings} />
    </div>
  );
}
