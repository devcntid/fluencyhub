"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

export function SectionDeleteButton({ id, title }: { id: number; title?: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="px-3 py-1 text-xs font-semibold rounded-lg text-rose-300 hover:text-white bg-rose-500/15 hover:bg-rose-500/30 border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: "Hapus Modul & Seluruh Materi?",
          message: title
            ? `Modul "${title}" beserta semua materi pelajaran di dalamnya akan dihapus secara permanen.`
            : "Semua materi pelajaran di dalam modul ini akan dihapus secara permanen. Apakah Anda yakin?",
          confirmText: "Ya, Hapus Modul",
          cancelText: "Batal",
          variant: "danger",
        });

        if (!ok) return;

        setBusy(true);
        try {
          const res = await fetch(`/api/instructor/sections/${id}`, { method: "DELETE" });
          if (!res.ok) {
            toast.error("Gagal menghapus modul.");
            return;
          }
          toast.success("Modul berhasil dihapus!");
          router.refresh();
        } catch {
          toast.error("Terjadi kesalahan jaringan saat menghapus modul.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}

