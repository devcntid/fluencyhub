"use client";

import { useState, useRef } from "react";
import { useToast, useConfirm } from "@/components/ui/NotificationProvider";
import { LandingIcon } from "@/components/landing/LandingIcon";

interface InstructorSignatureFormProps {
  initialSignatureUrl?: string | null;
  instructorName?: string;
}

export function InstructorSignatureForm({
  initialSignatureUrl = null,
  instructorName = "Instructor",
}: InstructorSignatureFormProps) {
  const toast = useToast();
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [signatureUrl, setSignatureUrl] = useState<string | null>(initialSignatureUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFileSelect(file: File) {
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Harap upload gambar PNG, JPG, atau WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimum ukuran tanda tangan adalah 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "signatures");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.data?.url) {
        throw new Error(uploadData.error || "Gagal mengunggah file tanda tangan.");
      }

      const uploadedUrl = uploadData.data.url;

      const saveRes = await fetch("/api/instructor/profile/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureUrl: uploadedUrl }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData.error || "Gagal menyimpan tanda tangan ke profil.");
      }

      setSignatureUrl(saveData.signatureUrl);
      toast.success("Tanda tangan digital berhasil disimpan & aktif di sertifikat!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat mengunggah.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleDelete() {
    if (!signatureUrl) return;

    const ok = await confirm({
      title: "Hapus Tanda Tangan Digital?",
      message:
        "Tanda tangan digital Anda akan dihapus dari sertifikat kursus. Siswa akan melihat tanda tangan tipografi standar.",
      confirmText: "Ya, Hapus Tanda Tangan",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!ok) return;

    setIsUploading(true);
    try {
      const res = await fetch("/api/instructor/profile/signature", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureUrl: null }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus tanda tangan.");
      }

      setSignatureUrl(null);
      toast.success("Tanda tangan digital berhasil dihapus.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div
      id="tanda-tangan"
      className="flex flex-col gap-5 rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-7"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F3ECE3] pb-4">
        <div className="min-w-0">
          <h2 className="m-0 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#0B2559] flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF4EC] text-[#C2530A]">
              <LandingIcon name="Award" size={16} color="currentColor" />
            </span>
            <span>Tanda Tangan Digital Sertifikat</span>
          </h2>
          <p className="m-0 mt-1 text-xs text-[#64748B] leading-relaxed">
            Otomatis dicetak pada setiap <strong>Sertifikat Kelulusan</strong> siswa di kelas yang
            Anda ajar.
          </p>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${
            signatureUrl
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              signatureUrl ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
          <span>{signatureUrl ? "Aktif di Sertifikat" : "Belum Diunggah"}</span>
        </span>
      </div>

      {/* 2-Col Internal Split: Preview/Dropzone (7) + Quick 3-step Guide (5) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Live Certificate Preview OR Upload Dropzone */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          {signatureUrl ? (
            <>
              <div className="relative flex-1 rounded-2xl border border-[#D8CBB8] bg-gradient-to-br from-[#FBF6F1] via-white to-[#FBF6F1] p-6 overflow-hidden flex flex-col items-center justify-center min-h-[210px]">
                {/* Subtle certificate corner ornaments */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2.5 rounded-xl border border-dashed border-[#DFD5C8]"
                />
                <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-400 mb-3">
                    Pratinjau di Sertifikat Resmi
                  </span>

                  <div className="h-24 w-60 flex items-center justify-center p-2 rounded-xl bg-white/80 border border-[#EFE7DC]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signatureUrl}
                      alt="Tanda Tangan Instruktur"
                      className="max-h-full max-w-full object-contain select-none"
                    />
                  </div>

                  <div className="h-[1.5px] w-48 bg-[#0B2559] mt-3 mb-1.5" />
                  <span className="text-sm font-extrabold text-[#0B2559] tracking-tight">
                    {instructorName}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-500">
                    Lead Course Instructor • English Ready
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-4 py-2.5 text-xs font-extrabold text-white shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <LandingIcon name="Download" size={14} color="#fff" />
                      <span>Ganti Tanda Tangan</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-600 transition cursor-pointer disabled:opacity-50"
                >
                  <LandingIcon name="Trash" size={14} color="currentColor" />
                  <span>Hapus</span>
                </button>
              </div>
            </>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFileSelect(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 min-h-[210px] flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center ${
                isDragging
                  ? "border-[#0073F5] bg-blue-50/50 scale-[1.01]"
                  : "border-[#D8CBB8] bg-[#FBF6F1]/60 hover:border-[#0073F5]/60 hover:bg-[#FBF6F1]"
              }`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="h-9 w-9 rounded-full border-2 border-[#0073F5] border-t-transparent animate-spin" />
                  <p className="text-sm font-extrabold text-[#0B2559]">
                    Mengunggah tanda tangan...
                  </p>
                  <p className="text-xs text-zinc-500">Menyimpan ke profil instruktur</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF4EC] border border-[#F26A12]/25 text-[#C2530A]">
                    <LandingIcon name="Award" size={24} color="currentColor" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-extrabold text-[#0B2559]">
                      Klik atau seret gambar tanda tangan ke sini
                    </p>
                    <p className="text-xs text-zinc-500">
                      Format <strong>PNG (disarankan transparan)</strong>, JPG, atau WEBP • Maks.
                      5MB
                    </p>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-1.5 rounded-xl bg-[#0B2559] px-4 py-2 text-xs font-extrabold text-white shadow-xs">
                    <LandingIcon name="Download" size={13} color="#fff" />
                    <span>Pilih File Tanda Tangan</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Concise 3-Step Visual Guide */}
        <div className="lg:col-span-5 rounded-2xl border border-[#EFE7DC] bg-[#FBF6F1]/80 p-4 sm:p-5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <p className="m-0 text-xs font-extrabold uppercase tracking-wider text-[#0B2559]">
              Tips Hasil Terbaik di Sertifikat
            </p>
            <div className="space-y-2.5">
              {[
                {
                  num: "1",
                  title: "Latar Belakang Transparan (PNG)",
                  desc: "Agar tanda tangan menyatu rapi di sertifikat tanpa kotak putih.",
                },
                {
                  num: "2",
                  title: "Gunakan Tinta Hitam / Biru Tua",
                  desc: "Kontras tajam dan elegan saat dicetak maupun disimpan sebagai PDF.",
                },
                {
                  num: "3",
                  title: "Cara Cepat Buat PNG",
                  desc: "Tanda tangan di kertas putih, foto terang, lalu hapus latar lewat remove.bg atau Canva.",
                },
              ].map((tip) => (
                <div key={tip.num} className="flex items-start gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B2559] text-[10px] font-extrabold text-white mt-0.5">
                    {tip.num}
                  </span>
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-extrabold text-[#0B2559]">{tip.title}</p>
                    <p className="m-0 text-[11px] text-zinc-600 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="m-0 pt-3 border-t border-[#E6DED4] text-[11px] text-zinc-500">
            Perubahan tanda tangan langsung berlaku pada seluruh sertifikat baru maupun yang
            diunduh ulang.
          </p>
        </div>
      </div>
    </div>
  );
}
