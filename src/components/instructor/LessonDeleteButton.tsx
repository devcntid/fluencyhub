"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

export function LessonDeleteButton({ id, title }: { id: number; title?: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      style={{ color: "var(--red)" }}
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: "Hapus Pelajaran?",
          message: title
            ? `Apakah Anda yakin ingin menghapus "${title}"? Tindakan ini permanen dan tidak dapat dibatalkan.`
            : "Apakah Anda yakin ingin menghapus materi pelajaran ini? Tindakan ini permanen dan tidak dapat dibatalkan.",
          confirmText: "Ya, Hapus",
          cancelText: "Batal",
          variant: "danger",
        });

        if (!ok) return;

        setBusy(true);
        try {
          const res = await fetch(`/api/instructor/lessons/${id}`, { method: "DELETE" });
          if (!res.ok) {
            toast.error("Gagal menghapus materi pelajaran.");
            return;
          }
          toast.success("Materi pelajaran berhasil dihapus!");
          router.refresh();
        } catch {
          toast.error("Terjadi kesalahan jaringan saat menghapus.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}

