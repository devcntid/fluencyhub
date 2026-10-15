"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

export function InstructorCourseDeleteButton({ id, title }: { id: number; title?: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function remove() {
    const ok = await confirm({
      title: "Hapus Kursus Ini?",
      message: title
        ? `Kursus "${title}" beserta semua modul, materi, dan data ujian di dalamnya akan dihapus. Tindakan ini tidak dapat dibatalkan.`
        : "Kursus beserta seluruh modul dan data di dalamnya akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.",
      confirmText: "Ya, Hapus Kursus",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/instructor/courses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus kursus.");
        return;
      }
      toast.success("Kursus berhasil dihapus!");
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan saat menghapus kursus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm flex-1 md:flex-none justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
      disabled={busy}
      onClick={remove}
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}

