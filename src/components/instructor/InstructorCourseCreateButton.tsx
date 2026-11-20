"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { useToast } from "@/components/ui/NotificationProvider";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const TIER_CONFIG = {
  tier_bawah: {
    label: "🥉 Paket Bawah (Self-Paced AI Partner)",
    badge: "Self-Paced AI",
    partner: "ai" as const,
    partnerLabel: "🤖 AI Speaking Partner 24/7",
    suggestedPrice: "99000",
    minPrice: 49000,
    maxPrice: 199000,
    rangeText: "Rp 49.000 – Rp 199.000 (Standar: Rp 99.000/bln)",
    desc: "Materi video mandiri + AI speaking partner 24/7 (tanpa tatap muka langsung)",
  },
  tier_menengah: {
    label: "🥈 Paket Menengah (Live Online Zoom Cohort)",
    badge: "Paling Diminati",
    partner: "trainer_online" as const,
    partnerLabel: "💻 Live Trainer Online via Zoom",
    suggestedPrice: "1490000",
    minPrice: 799000,
    maxPrice: 1990000,
    rangeText: "Rp 799.000 – Rp 1.990.000 (Standar: Rp 1.490.000)",
    desc: "Kelas kelompok intensif 6 minggu (maks. 12 murid) via Zoom bersama instruktur",
  },
  tier_tinggi: {
    label: "🥇 Paket Tinggi (Executive Offline 1-on-1)",
    badge: "Executive 1-on-1",
    partner: "trainer_offline" as const,
    partnerLabel: "📍 Trainer Tatap Muka (Offline) + Atur Lokasi",
    suggestedPrice: "2690000",
    minPrice: 1990000,
    maxPrice: 3990000,
    rangeText: "Rp 1.990.000 – Rp 3.990.000 (Standar: Rp 2.690.000)",
    desc: "Bimbingan privat tatap muka 1-on-1 langsung + fitur bebas tentukan lokasi temu",
  },
};

export function InstructorCourseCreateButton() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("1490000");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all_levels">("beginner");
  const [tier, setTier] = useState<"tier_bawah" | "tier_menengah" | "tier_tinggi">("tier_menengah");

  function handleTierChange(newTier: "tier_bawah" | "tier_menengah" | "tier_tinggi") {
    setTier(newTier);
    if (!price || price === "0" || price === "99000" || price === "1490000" || price === "2690000") {
      setPrice(TIER_CONFIG[newTier].suggestedPrice);
    }
  }

  function startCreate() {
    setTitle("");
    setSlug("");
    setShortDescription("");
    setPrice("1490000");
    setThumbnailUrl("");
    setLevel("beginner");
    setTier("tier_menengah");
    setError("");
    setUploading(false);
    setOpen(true);
  }

  async function uploadThumbnail(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("folder", "thumbnails");
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Failed to upload thumbnail.");
        return;
      }
      if (json.data?.url) {
        setThumbnailUrl(json.data.url);
      }
    } catch {
      setError("Network error while uploading thumbnail.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (uploading) {
      setError("Please wait until thumbnail upload finishes.");
      return;
    }
    setBusy(true);
    setError("");
    const body = {
      title,
      slug: slug || slugify(title),
      shortDescription: shortDescription || null,
      price: price ? price.replace(",", ".") : "0",
      thumbnailUrl: thumbnailUrl || null,
      level,
      tier,
      speakingPartnerType: TIER_CONFIG[tier].partner,
      tierBadge: TIER_CONFIG[tier].badge,
    };
    try {
      const res = await fetch("/api/instructor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setBusy(false);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        let errMsg = "Save failed. Title and slug are required.";
        if (typeof err.error === "string") {
          errMsg = err.error;
        } else if (err.error?.fieldErrors) {
          errMsg = Object.values(err.error.fieldErrors).flat().join(", ");
        } else if (err.message) {
          errMsg = err.message;
        }
        setError(errMsg);
        toast.error(errMsg);
        return;
      }
      setOpen(false);
      toast.success("Kursus baru berhasil dibuat!");
      router.refresh();
    } catch {
      setBusy(false);
      setError("Network error while saving course.");
    }
  }

  return (
    <>
      <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
        Create New Course
      </button>

      <AdminFormDialog title="Create New Course" open={open} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label>
            <span className="label">Title</span>
            <input
              className="input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label>
            <span className="label">Slug</span>
            <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} />
          </label>
          <label>
            <span className="label">Level Kemampuan</span>
            <select
              className="input"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as "beginner" | "intermediate" | "advanced" | "all_levels")
              }
            >
              <option value="beginner">Beginner (Dasar)</option>
              <option value="intermediate">Intermediate (Menengah)</option>
              <option value="advanced">Advanced (Mahir)</option>
              <option value="all_levels">All Levels (Semua Level)</option>
            </select>
          </label>
          <label>
            <div className="flex items-center justify-between mb-1">
              <span className="label !mb-0 font-bold">Tingkatan Paket Program (Tier)</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {TIER_CONFIG[tier].partnerLabel}
              </span>
            </div>
            <select
              className="input bg-white font-medium"
              value={tier}
              onChange={(e) => handleTierChange(e.target.value as any)}
            >
              <option value="tier_bawah">🥉 Paket Bawah (Self-Paced AI Partner)</option>
              <option value="tier_menengah">🥈 Paket Menengah (Live Online Zoom Cohort)</option>
              <option value="tier_tinggi">🥇 Paket Tinggi (Executive Offline 1-on-1)</option>
            </select>
            <p className="mt-1 text-xs text-zinc-500 leading-snug">
              {TIER_CONFIG[tier].desc}
            </p>
          </label>
          <label>
            <span className="label">Short description</span>
            <textarea
              className="input min-h-20"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </label>
          <label>
            <div className="flex items-center justify-between mb-1">
              <span className="label !mb-0 font-bold">Harga Kursus (IDR)</span>
              <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Saran: {TIER_CONFIG[tier].rangeText}
              </span>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              className="input font-semibold"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`Contoh: ${TIER_CONFIG[tier].suggestedPrice}`}
            />
            {Number(price) > 0 && (Number(price) < TIER_CONFIG[tier].minPrice || Number(price) > TIER_CONFIG[tier].maxPrice) && (
              <p className="mt-1 text-xs text-amber-600 font-medium flex items-center gap-1">
                <span>⚠️</span>
                <span>Harga di luar rentang rekomendasi ({TIER_CONFIG[tier].rangeText}).</span>
              </p>
            )}
          </label>
          <label>
            <span className="label">Thumbnail</span>
            <input
              className="input"
              type="file"
              disabled={uploading}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadThumbnail(file);
              }}
            />
            {uploading && (
              <p className="mt-1 text-xs font-semibold text-blue-600 animate-pulse">
                Uploading image... Please wait.
              </p>
            )}
          </label>
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="h-24 w-40 rounded-[var(--r)] object-cover" />
          ) : null}
          <p className="text-xs text-[var(--text-4)] mt-2">
            New courses are saved as &quot;Draft&quot; by default. You can publish your course once you add at least 1 module containing both video and document materials.
          </p>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || uploading} onClick={save}>
            {busy ? "Saving..." : uploading ? "Uploading..." : "Create Course"}
          </button>
        </div>
      </AdminFormDialog>
    </>
  );
}
