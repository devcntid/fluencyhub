"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileInfo } from "./actions";

interface ProfileFormProps {
  initialName: string;
  initialWhatsapp: string;
}

export function ProfileForm({ initialName, initialWhatsapp }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const router = useRouter();
  
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      // Mengirim "+62" bersama dengan input nomor
      const whatsappInput = formData.get("whatsappNumber") as string;
      const formattedWhatsapp = whatsappInput ? `+62${whatsappInput.replace(/^0+/, "")}` : "";
      
      formData.set("whatsappNumber", formattedWhatsapp);

      await updateProfileInfo(formData);
      
      setShowToast(true);
      router.refresh();
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Gagal memperbarui profil:", error);
    } finally {
      setLoading(false);
    }
  }

  // Mengambil angka setelah +62 untuk ditampilkan di input
  const displayWhatsapp = initialWhatsapp?.startsWith("+62") 
    ? initialWhatsapp.substring(3) 
    : initialWhatsapp;

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm">
        <h2 className="mb-6 text-xl font-bold text-zinc-900">Informasi Pribadi</h2>
        
        <div className="flex flex-col gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              defaultValue={initialName}
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-zinc-800">Nomor WhatsApp</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-xl border border-r-0 border-zinc-200 bg-zinc-50 px-4 text-sm font-medium text-zinc-500">
                +62
              </span>
              <input
                type="tel"
                name="whatsappNumber"
                defaultValue={displayWhatsapp || ""}
                placeholder="81234567890"
                className="w-full rounded-r-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            type="submit" 
            disabled={loading}
            className="rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[var(--brand-600)] disabled:opacity-50"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {/* Custom Toast Notification */}
      {showToast && (
        <div className="fixed top-8 right-8 z-50 flex items-center gap-3 rounded bg-[#0E9F9F] px-4 py-3 text-white shadow-lg animate-in slide-in-from-right-8 fade-in duration-300">
          <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span className="font-semibold tracking-wide text-sm">Berhasil Memperbarui Profil</span>
        </div>
      )}
    </>
  );
}
