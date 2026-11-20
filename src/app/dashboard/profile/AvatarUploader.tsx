"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateAvatar } from "./actions";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AvatarUploader({
  initialAvatarUrl,
  userName,
}: {
  initialAvatarUrl?: string | null;
  userName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialAvatarUrl || null);
  const [imgError, setImgError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const initials = getInitials(userName || "User");
  const showImage = Boolean(previewUrl) && !imgError;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran foto maksimal 5MB.");
      return;
    }

    // Immediate local optimistic preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setImgError(false);

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
        throw new Error("Gagal mengunggah foto profil.");
      }

      const uploadData = await uploadRes.json();
      const newAvatarUrl = uploadData.data.url;

      await updateAvatar(newAvatarUrl);
      setPreviewUrl(newAvatarUrl);
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setPreviewUrl(initialAvatarUrl || null);
      setErrorMsg(err instanceof Error ? err.message : "Gagal mengunggah foto.");
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (!userName) {
    return (
      <div className="flex flex-col gap-1.5">
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
          className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl border border-[#E6DED4] bg-white px-4 py-2.5 text-xs font-extrabold text-[#0B2559] shadow-2xs transition hover:border-[#0073F5]/40 hover:bg-[#FBF6F1] active:scale-95 disabled:opacity-50"
        >
          <span>{loading ? "Mengunggah..." : "Ganti Foto"}</span>
        </button>
        {errorMsg && <p className="m-0 text-xs font-bold text-rose-600">⚠️ {errorMsg}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        {/* Overlapping Circular Avatar */}
        <div className="flex items-end gap-4">
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            title="Klik untuk mengganti foto profil"
            className="group relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full ring-4 ring-white shadow-md transition active:scale-95 disabled:cursor-wait sm:h-24 sm:w-24"
          >
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl!}
                alt={userName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-[#0B2559] to-[#0073F5] text-2xl font-black tracking-tight text-white sm:text-3xl">
                {initials}
              </div>
            )}

            {/* Hover Camera Overlay */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center bg-[#0B2559]/60 text-white transition-opacity ${
                loading ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="mt-0.5 text-[10px] font-bold">Ubah</span>
                </>
              )}
            </div>
          </button>

          <div className="pb-1 sm:hidden">
            <button
              type="button"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2 text-xs font-bold text-[#0B2559] shadow-2xs transition hover:bg-[#FBF6F1] disabled:opacity-50"
            >
              <span>{loading ? "Mengunggah..." : "Ganti Foto"}</span>
            </button>
          </div>
        </div>

        {/* Desktop Change Photo Button */}
        <div className="hidden pb-1 sm:block">
          <button
            type="button"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E6DED4] bg-white px-4 py-2.5 text-xs font-extrabold text-[#0B2559] shadow-2xs transition hover:border-[#0073F5]/40 hover:bg-[#FBF6F1] active:scale-95 disabled:opacity-50"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>{loading ? "Mengunggah foto..." : "Ganti Foto Profil"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <p className="m-0 text-xs font-bold text-rose-600">⚠️ {errorMsg}</p>
      )}
    </div>
  );
}
