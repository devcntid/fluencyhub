"use client";

import { useState } from "react";
import type { Faq } from "@/types/db";

const MOCKUP_FAQS = [
  {
    id: 1,
    question: "Apakah Ready Check benar-benar gratis?",
    answer:
      "Ya. Kamu hanya perlu login Google atau nomor WhatsApp untuk melihat hasil lengkap.",
  },
  {
    id: 2,
    question: "Apa bedanya dengan kursus video biasa?",
    answer:
      "Kamu belajar dalam cohort dengan live roleplay mingguan, dan kemajuanmu diukur dari Baseline sampai Exit.",
  },
  {
    id: 3,
    question: "Rekaman suaraku dipakai untuk apa?",
    answer:
      "Hanya untuk penilaian. Tidak dipublikasikan tanpa izin tertulis, dan bisa dihapus kapan saja atas permintaanmu.",
  },
  {
    id: 4,
    question: "Metode pembayaran apa saja?",
    answer: "QRIS, transfer bank, virtual account, dan e-wallet.",
  },
];

export function FaqSection({ items }: { items?: Faq[] }) {
  const faqList = items && items.length > 0 ? items : MOCKUP_FAQS;
  const [openId, setOpenId] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="mx-auto flex max-w-[880px] flex-col gap-4 px-4 py-14 scroll-mt-20 sm:px-6 sm:py-[72px]"
    >
      <h2 className="m-0 mb-2 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[38px]">
        Pertanyaan yang sering muncul
      </h2>

      {faqList.map((f) => {
        const isOpen = openId === f.id;
        return (
          <div
            key={f.id}
            className="rounded-[16px] border border-[#E6DED4] bg-white px-5 py-4 sm:px-6 sm:py-5"
          >
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : f.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-4 text-left text-[16.5px] font-bold text-[#0B2559] sm:text-[18px]"
            >
              <span>{f.question}</span>
              <span className="shrink-0 text-xl font-normal text-[#4A5468]">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <p className="m-0 mt-3 text-[15px] leading-[1.6] text-[#3D4760] sm:text-[16px]">
                {f.answer}
              </p>
            )}
          </div>
        );
      })}
    </section>
  );
}
