"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";

export function SectionFormDialog({
  courseId,
  section,
  triggerClassName = "btn btn-secondary btn-sm",
  triggerLabel,
}: {
  courseId: number;
  section?: { id: number; title: string; sortOrder: number };
  triggerClassName?: string;
  triggerLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(section?.title ?? "");
  const [sortOrder, setSortOrder] = useState(section?.sortOrder ?? 1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openForm() {
    setTitle(section?.title ?? "");
    setSortOrder(section?.sortOrder ?? 1);
    setError("");
    setOpen(true);
  }

  async function save() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    const res = await fetch(section ? `/api/instructor/sections/${section.id}` : "/api/instructor/sections", {
      method: section ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(section ? { title: title.trim(), sortOrder } : { courseId, title: title.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Save failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button type="button" className={triggerClassName} onClick={openForm}>
        {triggerLabel}
      </button>
      <AdminFormDialog title={section ? "Edit section" : "Add section"} open={open} onClose={() => setOpen(false)}>
        <label className="mb-3 block">
          <span className="label">Section title</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        {section ? (
          <label className="mb-3 block">
            <span className="label">Sort order</span>
            <input className="input" type="number" min="1" value={sortOrder} onChange={(e) => setSortOrder(Math.max(1, Number(e.target.value) || 1))} />
          </label>
        ) : null}
        {error ? <p className="mb-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
            Save
          </button>
        </div>
      </AdminFormDialog>
    </>
  );
}
