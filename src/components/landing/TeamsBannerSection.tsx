"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export function TeamsBannerSection({ settings }: { settings?: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const ctaTitle = settings?.cta_title?.trim() || "Kesiapan bahasa Inggris tim, terukur per orang";
  const ctaSubtitle =
    settings?.cta_subtitle?.trim() ||
    "Asesmen awal dan akhir, laporan kenaikan skor per karyawan, dan ringkasan dampak untuk manajemen.";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const mailtoHref =
    "mailto:teams@englishready.id?subject=" +
    encodeURIComponent("Jadwalkan Diskusi — English Ready for Teams");

  return (
    <section
      id="untuk-tim"
      className="border-y border-[#E6DED4] bg-white scroll-mt-20"
    >
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:gap-8 sm:px-6 sm:py-16">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C2530A]">
            English Ready for Teams
          </div>
          <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[34px]">
            {ctaTitle}
          </h2>
          <p className="m-0 text-[16px] leading-[1.6] text-[#3D4760] sm:text-[17px]">
            {ctaSubtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full cursor-pointer whitespace-nowrap rounded-[14px] bg-[#0B2559] px-6 py-4 text-center text-[16px] font-bold text-white transition hover:bg-[#133882] sm:w-auto"
        >
          Jadwalkan diskusi
        </button>
      </div>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B2559]/55 p-3 sm:p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="teams-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="w-full max-w-[520px] overflow-hidden rounded-[24px] border border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#E6DED4] bg-white px-6 py-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2530A]">
                    English Ready for Teams
                  </div>
                  <h3 id="teams-modal-title" className="text-lg font-extrabold text-[#0B2559]">
                    Jadwalkan Diskusi Program Perusahaan
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Tutup modal diskusi tim"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#0B2559] hover:bg-[#F5ECE3]"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-[#3D4760]">
                  Cocok untuk tim IT, Product, Sales, dan Operasional yang berkolaborasi dengan klien maupun kantor regional lintas negara.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-[#E6DED4] bg-white p-4">
                    <div className="text-xs font-bold text-[#4A5468]">Rata-rata Kenaikan Skor</div>
                    <div className="mt-1 text-2xl font-extrabold text-[#0B2559]">+12 Poin</div>
                    <div className="text-[11px] font-semibold text-[#C2530A]">Baseline → Exit</div>
                  </div>
                  <div className="rounded-2xl border border-[#E6DED4] bg-white p-4">
                    <div className="text-xs font-bold text-[#4A5468]">Laporan HR &amp; Dampak</div>
                    <div className="mt-1 text-2xl font-extrabold text-[#0B2559]">30-Day Check</div>
                    <div className="text-[11px] font-semibold text-[#3D4760]">Kehadiran &amp; Confidence Index</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E6DED4] bg-white p-4 text-xs leading-relaxed text-[#3D4760]">
                  Hanya admin HR perusahaan terkait yang dapat melihat metrik kenaikan skor per karyawan. Rekaman suara tetap privat bagi peserta.
                </div>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-[#E6DED4] bg-white px-6 py-4 sm:flex-row">
                <a
                  href={mailtoHref}
                  className="flex-1 rounded-[12px] bg-[#C2530A] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#a84507]"
                >
                  Kirim Email ke Tim Kami
                </a>
                <a
                  href="#harga"
                  onClick={() => setOpen(false)}
                  className="rounded-[12px] border border-[#E6DED4] bg-[#FBF6F1] px-4 py-3 text-center text-sm font-bold text-[#0B2559] transition hover:bg-[#EFE7DD]"
                >
                  Lihat Paket Reguler
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}

