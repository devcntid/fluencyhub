"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function ResourceCompleteButton({ 
  courseId, 
  lessonId, 
  initialCompleted 
}: { 
  courseId: number; 
  lessonId: number; 
  initialCompleted: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleToggleComplete() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId,
          isCompleted: !initialCompleted,
        }),
      });
      if (!res.ok) throw new Error("Failed to update progress");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengupdate progress. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      disabled={isSubmitting}
      onClick={handleToggleComplete}
      className={`flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${
        initialCompleted
          ? "bg-zinc-600 hover:bg-zinc-700"
          : "bg-green-600 hover:bg-green-700"
      }`}
    >
      <LandingIcon name={initialCompleted ? "X" : "CheckCircle"} size={16} color="#fff" />
      {initialCompleted ? "Batal Tandai Selesai" : "Tandai Selesai"}
    </button>
  );
}
