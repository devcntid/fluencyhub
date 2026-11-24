"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";

const AUDIENCE_OPTIONS = [
  "Anak / Pelajar",
  "Ibu Rumah Tangga / Umum",
  "Mahasiswa / Pekerja",
  "Grup / Sekolah / Kantor",
] as const;

const LEARNING_TYPE_OPTIONS = [
  "Kelas Sendiri / Privat",
  "Kelas Reguler (Cohort)",
  "Rombongan / Grup (5+)",
] as const;

type AudienceOption = (typeof AUDIENCE_OPTIONS)[number];
type LearningTypeOption = (typeof LEARNING_TYPE_OPTIONS)[number];

const emptySubscribe = () => () => {};
const SIGNIN_HREF = "/auth/signin?callbackUrl=%2F%23konsultasi";

const LEGACY_B2B_TITLES = new Set([
  "Kesiapan bahasa Inggris tim, terukur per orang",
  "Siap Menguasai English untuk Karir Anda?",
]);

const LEGACY_B2B_SUBTITLES = new Set([
  "Asesmen awal dan akhir, laporan kenaikan skor per karyawan, dan ringkasan dampak untuk manajemen.",
]);

const DEFAULT_CTA_TITLE =
  "Bingung pilih kelas atau jadwal yang pas? Yuk konsultasi dulu";
const DEFAULT_CTA_SUBTITLE =
  "Cocok untuk anak-anak, pelajar, ibu rumah tangga, pekerja, maupun rombongan sekolah dan kantor. Kami bantu pilihkan level, program, dan jadwal belajar terbaik.";

interface ConsultationFormState {
  name: string;
  email: string;
  whatsapp: string;
  audience: AudienceOption;
  learningType: LearningTypeOption;
  notes: string;
  website: string;
}

function createInitialForm(
  userName?: string | null,
  userEmail?: string | null
): ConsultationFormState {
  return {
    name: userName?.trim() || "",
    email: userEmail?.trim() || "",
    whatsapp: "",
    audience: "Ibu Rumah Tangga / Umum",
    learningType: "Kelas Reguler (Cohort)",
    notes: "",
    website: "",
  };
}

export function TeamsBannerSection({
  settings,
  isLoggedIn = false,
  userName = null,
  userEmail = null,
}: {
  settings?: Record<string, string>;
  isLoggedIn?: boolean;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ConsultationFormState>(() =>
    createInitialForm(userName, userEmail)
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedInfo, setSubmittedInfo] = useState<{
    email: string;
    audience: string;
    learningType: string;
  } | null>(null);

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const rawTitle = settings?.cta_title?.trim() || "";
  const rawSubtitle = settings?.cta_subtitle?.trim() || "";
  const ctaTitle =
    rawTitle && !LEGACY_B2B_TITLES.has(rawTitle) ? rawTitle : DEFAULT_CTA_TITLE;
  const ctaSubtitle =
    rawSubtitle && !LEGACY_B2B_SUBTITLES.has(rawSubtitle)
      ? rawSubtitle
      : DEFAULT_CTA_SUBTITLE;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, submitting]);

  function handleOpenModal() {
    setErrorMsg(null);
    if (isLoggedIn) {
      setForm((prev) => ({
        ...prev,
        name: prev.name || userName?.trim() || "",
        email: prev.email || userEmail?.trim() || "",
      }));
    }
    setOpen(true);
  }

  function handleCloseModal() {
    if (submitting) return;
    setOpen(false);
    if (submittedInfo) {
      setSubmittedInfo(null);
      setForm(createInitialForm(userName, userEmail));
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || !isLoggedIn) return;

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/teams-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (res.status === 401) {
        setErrorMsg(
          "Sesi login kamu sudah berakhir. Silakan masuk kembali terlebih dahulu."
        );
        return;
      }

      if (!res.ok || !data.success) {
        setErrorMsg(
          data.error || "Gagal mengirim permintaan konsultasi. Silakan coba lagi."
        );
        return;
      }

      setSubmittedInfo({
        email: form.email.trim(),
        audience: form.audience,
        learningType: form.learningType,
      });
    } catch {
      setErrorMsg("Koneksi bermasalah. Pastikan internet aktif lalu coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section
      id="konsultasi"
      className="relative border-y border-[#E6DED4] bg-white scroll-mt-20"
    >
      {/* Keep legacy anchor working smoothly */}
      <span id="untuk-tim" className="pointer-events-none absolute -top-20" aria-hidden="true" />

      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-4 py-14 sm:gap-8 sm:px-6 sm:py-16">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3">
          <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C2530A]">
            Konsultasi Program English Ready
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
          onClick={handleOpenModal}
          className="w-full cursor-pointer whitespace-nowrap rounded-[14px] bg-[#0B2559] px-6 py-4 text-center text-[16px] font-bold text-white transition hover:bg-[#133882] sm:w-auto"
        >
          Konsultasi gratis
        </button>
      </div>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B2559]/55 p-3 backdrop-blur-xs sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="consultation-modal-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) handleCloseModal();
            }}
          >
            <div className="flex max-h-[92vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[24px] border border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] shadow-2xl">
              {/* Header */}
              <div className="flex shrink-0 items-center justify-between border-b border-[#E6DED4] bg-white px-5 py-4 sm:px-6">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#C2530A]">
                    Konsultasi Program English Ready
                  </div>
                  <h3
                    id="consultation-modal-title"
                    className="text-base font-extrabold text-[#0B2559] sm:text-lg"
                  >
                    Konsultasi Kelas &amp; Jadwal Belajar
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Tutup modal konsultasi"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#0B2559] transition hover:bg-[#F5ECE3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ✕
                </button>
              </div>

              {!isLoggedIn ? (
                /* Login Required Gate */
                <>
                  <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl border border-[#E6DED4] bg-white px-3.5 py-3">
                        <div className="text-[11px] font-bold text-[#4A5468]">
                          Untuk Semua Kalangan
                        </div>
                        <div className="mt-0.5 text-lg font-extrabold text-[#0B2559] sm:text-xl">
                          Anak – Dewasa
                        </div>
                        <div className="text-[11px] font-semibold text-[#C2530A]">
                          Pelajar, IRT, Pekerja &amp; Grup
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#E6DED4] bg-white px-3.5 py-3">
                        <div className="text-[11px] font-bold text-[#4A5468]">
                          Rekomendasi Personal
                        </div>
                        <div className="mt-0.5 text-lg font-extrabold text-[#0B2559] sm:text-xl">
                          Gratis &amp; Fleksibel
                        </div>
                        <div className="text-[11px] font-semibold text-[#3D4760]">
                          Dibantu pilih level &amp; jadwal pas
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E6DED4] bg-white p-5 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#0073F5]">
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                      <h4 className="text-base font-extrabold text-[#0B2559]">
                        Login Diperlukan untuk Konsultasi
                      </h4>
                      <p className="mx-auto mt-1.5 max-w-[410px] text-xs leading-relaxed text-[#3D4760] sm:text-sm">
                        Silakan masuk ke akun English Ready terlebih dahulu agar
                        advisor kami bisa mencocokkan program terbaik dan mengirim
                        rekomendasi langsung ke email &amp; WhatsApp kamu.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2.5 border-t border-[#E6DED4] bg-white px-5 py-4 sm:flex-row sm:px-6">
                    <Link
                      href={SIGNIN_HREF}
                      onClick={() => setOpen(false)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#C2530A] px-4 py-3 text-center text-sm font-bold text-white no-underline transition hover:bg-[#a84507]"
                    >
                      Masuk untuk Lanjutkan →
                    </Link>
                    <a
                      href="#program"
                      onClick={handleCloseModal}
                      className="rounded-[12px] border border-[#E6DED4] bg-[#FBF6F1] px-4 py-3 text-center text-sm font-bold text-[#0B2559] transition hover:bg-[#EFE7DD]"
                    >
                      Lihat Daftar Program
                    </a>
                  </div>
                </>
              ) : submittedInfo ? (
                /* Success Confirmation View */
                <>
                  <div className="flex-1 overflow-y-auto px-5 py-7 text-center sm:px-6">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECFDF5] text-[#059669] ring-1 ring-[#A7F3D0]">
                      <svg
                        className="h-7 w-7"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </div>
                    <h4 className="text-xl font-extrabold text-[#0B2559]">
                      Permintaan Konsultasi Terkirim!
                    </h4>
                    <p className="mx-auto mt-2 max-w-[440px] text-sm leading-relaxed text-[#3D4760]">
                      Kebutuhan belajar kategori{" "}
                      <span className="font-bold text-[#0B2559]">
                        {submittedInfo.audience}
                      </span>{" "}
                      ({submittedInfo.learningType}) sudah langsung masuk ke email
                      tim English Ready, dan konfirmasi otomatis telah dikirim ke{" "}
                      <span className="font-bold text-[#0062D1]">
                        {submittedInfo.email}
                      </span>
                      .
                    </p>

                    <div className="mx-auto mt-5 max-w-[440px] rounded-2xl border border-[#E6DED4] bg-white p-4 text-left text-xs leading-relaxed text-[#3D4760]">
                      <div className="font-bold text-[#0B2559]">
                        Langkah selanjutnya:
                      </div>
                      <p className="mt-1">
                        Advisor English Ready akan menghubungimu lewat WhatsApp atau
                        email dalam maksimal <strong>1×24 jam kerja</strong> untuk
                        membantu memilihkan program dan jadwal paling pas.
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2.5 border-t border-[#E6DED4] bg-white px-5 py-4 sm:flex-row sm:px-6">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 cursor-pointer rounded-[12px] bg-[#0B2559] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#133882]"
                    >
                      Selesai &amp; Tutup
                    </button>
                    <a
                      href="#program"
                      onClick={handleCloseModal}
                      className="rounded-[12px] border border-[#E6DED4] bg-[#FBF6F1] px-4 py-3 text-center text-sm font-bold text-[#0B2559] transition hover:bg-[#EFE7DD]"
                    >
                      Lihat Daftar Program
                    </a>
                  </div>
                </>
              ) : (
                /* Authenticated Universal Consultation Form */
                <form
                  onSubmit={handleSubmit}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6 sm:py-5">
                    {/* Compact Value Strip */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="rounded-2xl border border-[#E6DED4] bg-white px-3.5 py-3">
                        <div className="text-[11px] font-bold text-[#4A5468]">
                          Untuk Semua Kalangan
                        </div>
                        <div className="mt-0.5 text-lg font-extrabold text-[#0B2559] sm:text-xl">
                          Anak – Dewasa
                        </div>
                        <div className="text-[11px] font-semibold text-[#C2530A]">
                          Pelajar, IRT, Pekerja &amp; Grup
                        </div>
                      </div>
                      <div className="rounded-2xl border border-[#E6DED4] bg-white px-3.5 py-3">
                        <div className="text-[11px] font-bold text-[#4A5468]">
                          Rekomendasi Personal
                        </div>
                        <div className="mt-0.5 text-lg font-extrabold text-[#0B2559] sm:text-xl">
                          Gratis &amp; Fleksibel
                        </div>
                        <div className="text-[11px] font-semibold text-[#3D4760]">
                          Dibantu pilih level &amp; jadwal pas
                        </div>
                      </div>
                    </div>

                    {/* Signed-in Account Indicator */}
                    {(userName || userEmail) && (
                      <div className="flex items-center gap-2 rounded-xl border border-[#DCE7FA] bg-[#EFF6FF] px-3 py-2 text-xs text-[#0B2559]">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#0073F5]" />
                        <span className="truncate">
                          Masuk sebagai{" "}
                          <strong className="font-bold">
                            {userName || userEmail}
                          </strong>
                          {userName && userEmail ? ` (${userEmail})` : ""}
                        </span>
                      </div>
                    )}

                    {errorMsg && (
                      <div
                        role="alert"
                        className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs font-semibold text-[#B91C1C]"
                      >
                        {errorMsg}
                      </div>
                    )}

                    {/* Honeypot hidden field */}
                    <input
                      type="text"
                      name="website"
                      value={form.website}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, website: e.target.value }))
                      }
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden"
                    />

                    {/* Name & WhatsApp */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="consult-name"
                          className="mb-1 block text-xs font-bold text-[#0B2559]"
                        >
                          Nama Lengkap <span className="text-[#C2530A]">*</span>
                        </label>
                        <input
                          id="consult-name"
                          type="text"
                          required
                          minLength={2}
                          maxLength={120}
                          placeholder="cth. Siti Rahmawati"
                          value={form.name}
                          onChange={(e) =>
                            setForm((prev) => ({ ...prev, name: e.target.value }))
                          }
                          disabled={submitting}
                          className="w-full rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2.5 text-sm text-[#0B2559] placeholder:text-[#94A3B8] focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 focus:outline-none disabled:opacity-60"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="consult-whatsapp"
                          className="mb-1 block text-xs font-bold text-[#0B2559]"
                        >
                          Nomor WhatsApp <span className="text-[#C2530A]">*</span>
                        </label>
                        <input
                          id="consult-whatsapp"
                          type="tel"
                          required
                          minLength={8}
                          maxLength={25}
                          placeholder="0812-3456-7890"
                          value={form.whatsapp}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              whatsapp: e.target.value,
                            }))
                          }
                          disabled={submitting}
                          className="w-full rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2.5 text-sm text-[#0B2559] placeholder:text-[#94A3B8] focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 focus:outline-none disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="consult-email"
                        className="mb-1 block text-xs font-bold text-[#0B2559]"
                      >
                        Email Aktif <span className="text-[#C2530A]">*</span>
                      </label>
                      <input
                        id="consult-email"
                        type="email"
                        required
                        maxLength={160}
                        placeholder="nama@email.com"
                        value={form.email}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, email: e.target.value }))
                        }
                        disabled={submitting}
                        className="w-full rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2.5 text-sm text-[#0B2559] placeholder:text-[#94A3B8] focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 focus:outline-none disabled:opacity-60"
                      />
                    </div>

                    {/* Audience Category Selector */}
                    <div>
                      <span className="mb-1.5 block text-xs font-bold text-[#0B2559]">
                        Program untuk Siapa?{" "}
                        <span className="text-[#C2530A]">*</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {AUDIENCE_OPTIONS.map((option) => {
                          const active = form.audience === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                setForm((prev) => ({ ...prev, audience: option }))
                              }
                              className={`cursor-pointer rounded-xl border px-3 py-2 text-center text-xs font-bold transition ${
                                active
                                  ? "border-[#0B2559] bg-[#0B2559] text-white shadow-xs"
                                  : "border-[#E6DED4] bg-white text-[#3D4760] hover:border-[#0B2559]/40 hover:bg-[#FAF5EF]"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Learning Type Selector */}
                    <div>
                      <span className="mb-1.5 block text-xs font-bold text-[#0B2559]">
                        Tipe Belajar yang Diminati{" "}
                        <span className="text-[#C2530A]">*</span>
                      </span>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {LEARNING_TYPE_OPTIONS.map((option) => {
                          const active = form.learningType === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  learningType: option,
                                }))
                              }
                              className={`cursor-pointer rounded-xl border px-2.5 py-2 text-center text-xs font-bold transition ${
                                active
                                  ? "border-[#C2530A] bg-[#FFF4EC] text-[#C2530A] shadow-xs"
                                  : "border-[#E6DED4] bg-white text-[#3D4760] hover:border-[#C2530A]/40 hover:bg-[#FAF5EF]"
                              } disabled:cursor-not-allowed disabled:opacity-60`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label
                        htmlFor="consult-notes"
                        className="mb-1 block text-xs font-bold text-[#0B2559]"
                      >
                        Ceritakan Target / Kendala Belajar{" "}
                        <span className="font-normal text-[#64748B]">(Opsional)</span>
                      </label>
                      <textarea
                        id="consult-notes"
                        rows={2}
                        maxLength={1000}
                        placeholder="cth. Untuk anak SD biar berani bicara, percakapan harian ibu rumah tangga, persiapan IELTS, atau kelas grup..."
                        value={form.notes}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                        disabled={submitting}
                        className="w-full resize-none rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2.5 text-sm text-[#0B2559] placeholder:text-[#94A3B8] focus:border-[#0073F5] focus:ring-2 focus:ring-[#0073F5]/20 focus:outline-none disabled:opacity-60"
                      />
                    </div>

                    <p className="text-[11px] leading-relaxed text-[#4A5468]">
                      Pesan dikirim langsung ke email tim advisor English Ready.
                      Data kamu aman dan hanya dipakai untuk membantu memilihkan
                      program belajar.
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex shrink-0 flex-col gap-2.5 border-t border-[#E6DED4] bg-white px-5 py-4 sm:flex-row sm:px-6">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] bg-[#C2530A] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#a84507] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Mengirim Konsultasi...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <rect width="20" height="16" x="2" y="4" rx="2" />
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                          </svg>
                          Kirim Konsultasi ke Tim Kami
                        </>
                      )}
                    </button>
                    <a
                      href="#program"
                      onClick={handleCloseModal}
                      className="rounded-[12px] border border-[#E6DED4] bg-[#FBF6F1] px-4 py-3 text-center text-sm font-bold text-[#0B2559] transition hover:bg-[#EFE7DD]"
                    >
                      Lihat Daftar Program
                    </a>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </section>
  );
}
