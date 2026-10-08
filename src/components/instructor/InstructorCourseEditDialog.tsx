"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function InstructorCourseEditDialog({
  course,
}: {
  course: {
    id: number;
    title: string;
    slug: string;
    shortDescription: string | null;
    price: string;
    thumbnailUrl: string | null;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(course.title);
  const [slug, setSlug] = useState(course.slug);
  const [shortDescription, setShortDescription] = useState(course.shortDescription || "");
  const [price, setPrice] = useState(course.price);
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnailUrl || "");

  function startEdit() {
    setTitle(course.title);
    setSlug(course.slug);
    setShortDescription(course.shortDescription || "");
    setPrice(course.price);
    setThumbnailUrl(course.thumbnailUrl || "");
    setError("");
    setOpen(true);
  }

  async function uploadThumbnail(file: File) {
    const form = new FormData();
    form.set("file", file);
    form.set("folder", "thumbnails");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      setError("Thumbnail upload failed.");
      return;
    }
    const json = (await res.json()) as { data?: { url?: string } };
    if (json.data?.url) setThumbnailUrl(json.data.url);
  }

  async function save() {
    setBusy(true);
    setError("");
    const body = {
      title,
      slug: slug || slugify(title),
      shortDescription: shortDescription || null,
      price,
      thumbnailUrl: thumbnailUrl || null,
    };
    const res = await fetch(`/api/instructor/courses/${course.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Save failed. Title and slug are required.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className="btn btn-secondary btn-sm flex-1 md:flex-none justify-center" onClick={startEdit}>
        Edit Details
      </button>

      <AdminFormDialog title="Edit Course Details" open={open} onClose={() => setOpen(false)}>
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
            <span className="label">Short description</span>
            <textarea
              className="input min-h-20"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
          </label>
          <label>
            <span className="label">Price</span>
            <input type="number" min="0" className="input" value={price} onChange={(e) => setPrice(Math.max(0, Number(e.target.value)).toString())} />
          </label>
          <label>
            <span className="label">Thumbnail</span>
            <input
              className="input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadThumbnail(file);
              }}
            />
          </label>
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt="" className="h-24 w-40 rounded-[var(--r)] object-cover" />
          ) : null}
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
            Save Changes
          </button>
        </div>
      </AdminFormDialog>
    </>
  );
}
