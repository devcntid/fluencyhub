"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InstructorCourseDeleteButton({ id }: { id: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function remove() {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    setBusy(true);
    const res = await fetch(`/api/instructor/courses/${id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      alert("Delete failed.");
      return;
    }
    router.refresh();
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm flex-1 md:flex-none justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
      disabled={busy}
      onClick={remove}
    >
      Delete
    </button>
  );
}
