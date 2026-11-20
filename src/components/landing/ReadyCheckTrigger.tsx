"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

const emptySubscribe = () => () => {};

interface ReadyCheckTriggerProps {
  label?: string;
  className?: string;
  isLoggedIn?: boolean;
  onAfterOpen?: () => void;
}

const CHECK_STEPS = [
  {
    step: 1,
    title: "Tentang kamu",
    desc: "Tujuan belajar & rasa percaya diri",
    time: "1–2 mnt",
    accent: false,
  },
  {
    step: 2,
    title: "Pemahaman mendengar",
    desc: "3 potongan rekaman situasi kerja",
    time: "2–3 mnt",
    accent: false,
  },
  {
    step: 3,
    title: "Bahasa konteks kerja",
    desc: "Pilihan kata & komunikasi profesional",
    time: "2–3 mnt",
    accent: false,
  },
  {
    step: 4,
    title: "Tugas bicara (AI)",
    desc: "2 rekaman suara singkat + analisis instan",
    time: "3 mnt",
    accent: true,
  },
];

export function ReadyCheckTrigger({
  label = "Cek Ready Score",
  className = "",
  isLoggedIn = false,
  onAfterOpen,
}: ReadyCheckTriggerProps) {
  const [open, setOpen] = useState(false);
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [consentChecked, setConsentChecked] = useState(true);

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

  const targetHref = "/ready-check?started=1";

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          onAfterOpen?.();
        }}
        className={className}
      >
        {label}
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center bg-[#0B2559]/60 p-0 backdrop-blur-xs sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ready-check-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-[490px] flex-col overflow-hidden rounded-t-[28px] border border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] shadow-2xl sm:rounded-[28px]">
              {/* Top Modal Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-[#E6DED4] bg-white px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <EnglishReadyLogo variant="icon" height={28} />
                  <div className="flex items-center gap-2">
                    <span className="text-[17px] font-extrabold tracking-[-0.02em] text-[#0B2559]">
                      Ready Check
                    </span>
                    <span className="rounded-full bg-[#FFF4EC] px-2.5 py-0.5 text-[11px] font-extrabold text-[#C2530A]">
                      Gratis · 10 mnt
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Tutup modal Ready Check"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#4A5468] transition hover:bg-[#F5ECE3] hover:text-[#0B2559]"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                <div className="space-y-1.5">
                  <h2
                    id="ready-check-title"
                    className="m-0 text-2xl font-black leading-[1.15] tracking-[-0.02em] text-[#0B2559]"
                  >
                    10 menit untuk tahu seberapa siap kamu
                  </h2>
                  <p className="m-0 text-sm leading-relaxed text-[#3D4760]">
                    Empat bagian singkat berbasis situasi kerja nyata. Tidak ada jawaban memalukan—kami hanya memetakan titik awalmu.
                  </p>
                </div>

                <div className="space-y-2">
                  {CHECK_STEPS.map((s) => (
                    <div
                      key={s.step}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6DED4]/80 bg-white px-4 py-3 shadow-[0_1px_2px_rgba(11,37,89,0.02)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-white ${
                            s.accent ? "bg-[#F26A12]" : "bg-[#0B2559]"
                          }`}
                        >
                          {s.step}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[14.5px] font-extrabold text-[#0B2559]">{s.title}</div>
                          <div className="text-xs text-[#4A5468]">{s.desc}</div>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-lg bg-[#FBF6F1] px-2 py-1 text-[11px] font-bold text-[#4A5468]">
                        {s.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Privacy Consent */}
                <div className="rounded-2xl border border-[#E6DED4] bg-white p-4">
                  <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#0B2559] sm:text-[13px]">
                    <input
                      type="checkbox"
                      checked={consentChecked}
                      onChange={(e) => setConsentChecked(e.target.checked)}
                      className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-[#0B2559]"
                    />
                    <span>
                      Saya setuju rekaman suara dan jawaban dipakai{" "}
                      <strong className="font-extrabold">hanya untuk penilaian Ready Score</strong>. Tidak
                      dipublikasikan tanpa izin terpisah.{" "}
                      <a
                        href="#faq"
                        onClick={() => setOpen(false)}
                        className="font-bold text-[#0062D1] underline hover:text-[#0B2559]"
                      >
                        Kebijakan privasi
                      </a>
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2.5 rounded-xl bg-blue-50/70 px-3.5 py-2.5 text-xs font-medium text-[#0B2559]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#0073F5"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className="shrink-0"
                  >
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
                  </svg>
                  <span>Siapkan mikrofon dan tempat tenang (opsi ketik tersedia jika tanpa mic).</span>
                </div>
              </div>

              {/* Sticky Modal Footer */}
              <div className="flex shrink-0 flex-col gap-2.5 border-t border-[#E6DED4] bg-white px-5 pb-6 pt-4 sm:px-6">
                {consentChecked ? (
                  <Link
                    href={targetHref}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#F26A12] px-4 py-3.5 text-center text-[15.5px] font-extrabold text-white no-underline shadow-sm transition hover:bg-[#C2530A]"
                  >
                    <span>Mulai Ready Check Sekarang</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="w-full cursor-not-allowed rounded-[14px] bg-zinc-200 px-4 py-3.5 text-center text-[15px] font-bold text-zinc-500"
                  >
                    Centang persetujuan untuk melanjutkan
                  </button>
                )}
                <div className="flex items-center justify-between gap-2 text-xs text-[#4A5468]">
                  <span>
                    {isLoggedIn
                      ? "Hasil akan otomatis siap disimpan ke akunmu."
                      : "Tanpa login. Login hanya untuk menyimpan hasil."}
                  </span>
                  <a
                    href="#ready-score"
                    onClick={() => setOpen(false)}
                    className="shrink-0 font-extrabold text-[#0062D1] hover:underline"
                  >
                    Lihat 5 level &rarr;
                  </a>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
