"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { CourseFeaturedToggle, CoursePublishButton } from "@/components/admin/CourseAdminActions";
import { formatIdr } from "@/lib/utils/cn";

type CourseRow = {
  id: number;
  instructorId: number;
  instructorName: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  price: string;
  originalPrice: string | null;
  status: string;
  isFeatured: boolean;
  marketingTag: string | null;
  thumbnailUrl: string | null;
  level: string;
};

type Draft = {
  instructorId: number;
  title: string;
  slug: string;
  shortDescription: string;
  price: string;
  originalPrice: string;
  status: "draft" | "published" | "archived";
  isFeatured: boolean;
  marketingTag: string;
  thumbnailUrl: string;
  level: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CourseAdminTable({
  courses,
  instructors,
  curriculumHrefPrefix,
}: {
  courses: CourseRow[];
  instructors: Array<{ id: number; name: string }>;
  curriculumHrefPrefix: string;
}) {
  const router = useRouter();
  const firstInstructor = instructors[0]?.id ?? 0;
  const empty: Draft = {
    instructorId: firstInstructor,
    title: "",
    slug: "",
    shortDescription: "",
    price: "0",
    originalPrice: "",
    status: "draft",
    isFeatured: false,
    marketingTag: "",
    thumbnailUrl: "",
    level: "beginner",
  };
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [values, setValues] = useState<Draft>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCourses = courses.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q) ||
      c.instructorName.toLowerCase().includes(q)
    );
  });

  function startCreate() {
    setEditId(null);
    setValues(empty);
    setError("");
    setOpen(true);
  }

  function startEdit(c: CourseRow) {
    setEditId(c.id);
    setValues({
      instructorId: c.instructorId,
      title: c.title,
      slug: c.slug,
      shortDescription: c.shortDescription ?? "",
      price: c.price,
      originalPrice: c.originalPrice ?? "",
      status: c.status as Draft["status"],
      isFeatured: c.isFeatured,
      marketingTag: c.marketingTag ?? "",
      thumbnailUrl: c.thumbnailUrl ?? "",
      level: c.level,
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setError("");
    const body = {
      instructorId: Number(values.instructorId),
      title: values.title,
      slug: values.slug || slugify(values.title),
      shortDescription: values.shortDescription || null,
      price: values.price,
      originalPrice: values.originalPrice || null,
      status: values.status,
      isFeatured: values.isFeatured,
      marketingTag: values.marketingTag || null,
      thumbnailUrl: values.thumbnailUrl || null,
      level: values.level,
    };
    const res = await fetch(editId == null ? "/api/admin/courses" : `/api/admin/courses/${editId}`, {
      method: editId == null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Save failed. Title and slug are required.");
      return;
    }
    setOpen(false);
    router.refresh();
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
    if (json.data?.url) setValues((v) => ({ ...v, thumbnailUrl: json.data!.url! }));
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">Courses</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Cari kelas..."
              className="input !pl-9 text-sm py-1.5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={startCreate}>
            Add course
          </button>
        </div>
      </div>
      <AdminDataGrid columns={["Title", "Instructor", "Price", "Status", "Featured", "Publish", "Actions"]} rowCount={filteredCourses.length}>
        {({ start, end }) =>
          filteredCourses.slice(start, end).map((c, i) => (
            <tr key={c.id}>
              <td className="text-[var(--text-3)]">{start + i + 1}</td>
              <td>
                <p className="font-semibold">{c.title}</p>
                <p className="text-xs text-[var(--text-4)]">{c.slug}</p>
              </td>
              <td>{c.instructorName}</td>
              <td>{formatIdr(c.price)}</td>
              <td>
                <span className={c.status === "published" ? "badge badge-success" : "badge badge-warning"}>{c.status}</span>
              </td>
              <td>
                <CourseFeaturedToggle id={c.id} isFeatured={c.isFeatured} />
              </td>
              <td>
                <CoursePublishButton id={c.id} status={c.status} />
              </td>
              <td>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <Link href={`${curriculumHrefPrefix}/${c.id}`} className="btn btn-secondary btn-sm">
                    Lessons
                  </Link>
                  <Link href={`/dashboard/courses/${c.id}`} className="btn btn-secondary btn-sm">
                    Preview
                  </Link>
                </div>
              </td>
            </tr>
          ))
        }
      </AdminDataGrid>
      <AdminFormDialog title={editId == null ? "Add course" : "Edit course"} open={open} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label>
            <span className="label">Title</span>
            <input
              className="input"
              value={values.title}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  title: e.target.value,
                  slug: editId == null ? slugify(e.target.value) : v.slug,
                }))
              }
            />
          </label>
          <label>
            <span className="label">Slug</span>
            <input className="input" value={values.slug} onChange={(e) => setValues((v) => ({ ...v, slug: e.target.value }))} />
          </label>
          <label>
            <span className="label">Instructor</span>
            <select
              className="input"
              value={values.instructorId}
              onChange={(e) => setValues((v) => ({ ...v, instructorId: Number(e.target.value) }))}
            >
              {instructors.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Short description</span>
            <textarea
              className="input min-h-20"
              value={values.shortDescription}
              onChange={(e) => setValues((v) => ({ ...v, shortDescription: e.target.value }))}
            />
          </label>
          <label>
            <span className="label">Price</span>
            <input className="input" value={values.price} onChange={(e) => setValues((v) => ({ ...v, price: e.target.value }))} />
          </label>
          <label>
            <span className="label">Original price</span>
            <input className="input" value={values.originalPrice} onChange={(e) => setValues((v) => ({ ...v, originalPrice: e.target.value }))} />
          </label>
          <label>
            <span className="label">Marketing tag</span>
            <input className="input" value={values.marketingTag} onChange={(e) => setValues((v) => ({ ...v, marketingTag: e.target.value }))} />
          </label>
          <label>
            <span className="label">Level</span>
            <select
              className="input"
              value={values.level}
              onChange={(e) => setValues((v) => ({ ...v, level: e.target.value }))}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all_levels">All Levels</option>
            </select>
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
          {values.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.thumbnailUrl} alt="" className="h-24 w-40 rounded-[var(--r)] object-cover" />
          ) : null}
          <label>
            <span className="label">Status</span>
            <select
              className="input"
              value={values.status}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as Draft["status"] }))}
            >
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.isFeatured}
              onChange={(e) => setValues((v) => ({ ...v, isFeatured: e.target.checked }))}
            />
            <span className="text-sm font-semibold">Featured</span>
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
            Save
          </button>
        </div>
      </AdminFormDialog>
    </div>
  );
}
