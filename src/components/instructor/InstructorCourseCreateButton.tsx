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
  const [price, setPrice] = useState("0");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all_levels">("beginner");

  function startCreate() {
    setTitle("");
    setSlug("");
    setShortDescription("");
    setPrice("0");
    setThumbnailUrl("");
    setLevel("beginner");
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
            <span className="label">Level</span>
            <select
              className="input"
              value={level}
              onChange={(e) =>
                setLevel(e.target.value as "beginner" | "intermediate" | "advanced" | "all_levels")
              }
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All Levels</option>
            </select>
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
            <span className="label">Price</span>
            <input
              type="number"
              min="0"
              step="any"
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
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
