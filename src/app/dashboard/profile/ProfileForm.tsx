"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileInfo } from "./actions";

interface ProfileFormProps {
  initialName: string;
  initialEmail?: string;
  initialWhatsapp: string;
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialWhatsapp,
}: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const displayWhatsapp = initialWhatsapp?.startsWith("+62")
    ? initialWhatsapp.substring(3)
    : initialWhatsapp?.startsWith("62")
    ? initialWhatsapp.substring(2)
    : initialWhatsapp?.replace(/^0+/, "") || "";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const formData = new FormData(e.currentTarget);
      const rawWa = String(formData.get("whatsappNumber") || "").replace(/[^0-9]/g, "");
      const cleanedWa = rawWa.replace(/^0+/, "");
      const formattedWhatsapp = cleanedWa ? `+62${cleanedWa}` : "";

      formData.set("whatsappNumber", formattedWhatsapp);

      await updateProfileInfo(formData);

      setShowToast(true);
      router.refresh();
      setTimeout(() => setShowToast(false), 3500);
    } catch (error) {
      console.error("Gagal memperbarui profil:", error);
      setErrorMsg("Gagal menyimpan perubahan profil. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-col justify-between rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-7"
      >
        <div className="mb-5 border-b border-[#F3ECE3] pb-4">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#0B2559]">
            Informasi Pribadi
          </h2>
          <p className="m-0 mt-0.5 text-xs text-[#64748B]">
            Pastikan nama dan nomor WhatsApp aktifmu sudah benar untuk sertifikat &amp; notifikasi kelas.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0B2559]"
            >
              Nama Lengkap
            </label>
            <input
              id="profile-name"
              type="text"
              name="name"
              defaultValue={initialName}
              required
              placeholder="Masukkan nama lengkapmu"
              className="w-full rounded-xl border border-[#D8CBB8] bg-[#FBF6F1]/60 px-4 py-3 text-sm font-semibold text-[#0B2559] outline-none transition focus:border-[#0073F5] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <p className="m-0 text-[11.5px] text-[#64748B]">
              Nama ini akan digunakan secara resmi pada Sertifikat Kelulusan English Ready.
            </p>
          </div>

          {/* Verified Email (Read-only when provided) */}
          {initialEmail && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="profile-email"
                  className="block text-xs font-extrabold uppercase tracking-wider text-[#0B2559]"
                >
                  Alamat Email
                </label>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                  ✓ Terverifikasi
                </span>
              </div>
              <input
                id="profile-email"
                type="email"
                value={initialEmail}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-[#EFE7DD] bg-[#F5F1EB] px-4 py-3 text-sm font-medium text-[#64748B]"
              />
            </div>
          )}

          {/* WhatsApp Number */}
          <div className="space-y-1.5">
            <label
              htmlFor="profile-wa"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0B2559]"
            >
              Nomor WhatsApp Aktif
            </label>
            <div className="flex overflow-hidden rounded-xl border border-[#D8CBB8] bg-[#FBF6F1]/60 transition focus-within:border-[#0073F5] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
              <span className="inline-flex items-center gap-1.5 border-r border-[#E6DED4] bg-[#EFE7DD]/70 px-3.5 text-xs font-extrabold text-[#0B2559]">
                <span>🇮🇩</span>
                <span>+62</span>
              </span>
              <input
                id="profile-wa"
                type="tel"
                name="whatsappNumber"
                defaultValue={displayWhatsapp}
                placeholder="81234567890"
                className="w-full bg-transparent px-3.5 py-3 text-sm font-semibold text-[#0B2559] outline-none placeholder:font-normal placeholder:text-[#94A3B8]"
              />
            </div>
            <p className="m-0 text-[11.5px] text-[#64748B]">
              Digunakan untuk pengingat sesi Live Zoom, konfirmasi pembayaran, dan info sertifikat.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700">
            ⚠️ {errorMsg}
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3ECE3] pt-5">
          {showToast ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Perubahan berhasil disimpan!
            </span>
          ) : (
            <span className="text-xs text-[#64748B]">
              Perubahan langsung aktif di seluruh platform
            </span>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#0073F5] px-6 py-2.5 text-sm font-extrabold text-white shadow-xs transition hover:bg-[#0062D1] active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </button>
        </div>
      </form>

      {/* Clean Floating Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-emerald-400/40 bg-[#0B2559] px-4 py-3 text-white shadow-xl sm:bottom-6 sm:right-6">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs font-black text-white">
            ✓
          </span>
          <span className="text-xs font-bold sm:text-sm">Profil kamu berhasil diperbarui!</span>
        </div>
      )}
    </>
  );
}
