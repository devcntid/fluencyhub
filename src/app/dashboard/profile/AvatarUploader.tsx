"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateAvatar } from "./actions";

export function AvatarUploader() {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "avatars");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Gagal mengunggah gambar.");
      }

      const uploadData = await uploadRes.json();
      const newAvatarUrl = uploadData.data.url;

      await updateAvatar(newAvatarUrl);
      
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  return (
    <div>
      <input 
        type="file" 
        accept="image/jpeg, image/png, image/webp" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <button 
        type="button" 
        disabled={loading}
        onClick={() => fileInputRef.current?.click()}
        className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 transition disabled:opacity-50"
      >
        {loading ? "Mengunggah..." : "Ubah Foto"}
      </button>
    </div>
  );
}
