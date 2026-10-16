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

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file tidak didukung. Harap upload gambar PNG, JPG, atau WEBP.");
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar. Maksimum ukuran tanda tangan adalah 5MB.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload to storage
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

      // 2. Save signature URL to user profile
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
      toast.success("Tanda tangan digital berhasil disimpan dan otomatis aktif pada sertifikat!");
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
        "Tanda tangan digital Anda akan dihapus dari seluruh sertifikat kursus yang Anda ajar. Siswa akan melihat tanda tangan tipografi standar.",
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
    <div className="flex flex-col gap-6">
      {/* Hidden file input */}
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

      {/* Header & Status Badge */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <LandingIcon name="Award" size={16} color="currentColor" />
            </span>
            Tanda Tangan Digital Sertifikat
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Upload tanda tangan resmi Anda. Tanda tangan ini akan <strong>otomatis dicetak</strong> pada seluruh sertifikat kelulusan siswa yang lulus dari kursus Anda.
          </p>
        </div>

        <div>
          {signatureUrl ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Aktif pada Sertifikat
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Belum Diunggah
            </span>
          )}
        </div>
      </div>

      {/* Signature Preview & Dropzone */}
      {signatureUrl ? (
        <div className="flex flex-col gap-3">
          <div className="relative group rounded-2xl border-2 border-zinc-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col items-center justify-center">
            {/* Transparent checkerboard background */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
            />

            {/* Simulated certificate signing area */}
            <div className="relative z-10 flex flex-col items-center max-w-sm py-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                Pratinjau Tanda Tangan di Sertifikat
              </span>
              
              <div className="h-24 w-64 flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={signatureUrl}
                  alt="Tanda Tangan Instruktur"
                  className="max-h-full max-w-full object-contain filter drop-shadow-sm select-none"
                />
              </div>

              <div className="h-[1.5px] w-52 bg-slate-800 my-1.5" />
              <span className="text-sm font-bold text-slate-900 tracking-tight">{instructorName}</span>
              <span className="text-[11px] font-semibold text-slate-500">Lead Course Instructor</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="btn btn-secondary px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200/80 flex items-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <LandingIcon name="Download" size={14} color="currentColor" />
                  <span>Ganti File Tanda Tangan</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isUploading}
              className="btn btn-ghost px-4 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <LandingIcon name="Trash" size={14} color="currentColor" />
              <span>Hapus Tanda Tangan</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State / Upload Dropzone */
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
          className={`flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
              : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/60 hover:bg-zinc-50"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="h-10 w-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-zinc-800">Sedang mengunggah tanda tangan...</p>
              <p className="text-xs text-zinc-500">Menyimpan dan mengaitkan ke profil Anda</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
                <LandingIcon name="Award" size={28} color="currentColor" />
              </div>

              <div>
                <p className="text-sm font-bold text-zinc-900">
                  Klik untuk pilih file atau seret file ke sini
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  Format yang didukung: <strong>PNG (Direkomendasikan Latar Transparan)</strong>, JPG, WEBP (Maks. 5MB)
                </p>
              </div>

              <span className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition">
                <LandingIcon name="Download" size={14} color="currentColor" />
                Pilih File Tanda Tangan
              </span>
            </div>
          )}
        </div>
      )}

      {/* Guide & Best Practices */}
      <div className="rounded-2xl bg-amber-50/60 border border-amber-200/80 p-4 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <LandingIcon name="CheckCircle" size={14} color="currentColor" />
          <span>Panduan Tanda Tangan Terbaik untuk Sertifikat:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-800 pl-1 leading-relaxed">
          <li>
            <strong>Gunakan latar belakang transparan (format PNG):</strong> Tanda tangan akan menyatu sempurna di atas background motif sertifikat resmi tanpa kotak putih yang mengganggu.
          </li>
          <li>
            <strong>Warna tinta:</strong> Gunakan tinta hitam pekat atau biru tua formal agar terlihat tajam dan elegan saat dicetak maupun diekspor ke PDF.
          </li>
          <li>
            <strong>Cara cepat membuat tanda tangan transparan:</strong> Tanda tangani kertas putih bersih &rarr; foto dengan pencahayaan terang &rarr; gunakan tools hapus background online (seperti remove.bg atau Canva) &rarr; simpan sebagai PNG transparan.
          </li>
        </ul>
      </div>
    </div>
  );
}
