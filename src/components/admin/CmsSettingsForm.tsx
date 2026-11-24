"use client";
// English Ready v1.3 - Modern Landing CMS Settings Form

import { useState } from "react";
import Link from "next/link";

interface CmsSettingsFormProps {
  initial: Record<string, string>;
}

export function CmsSettingsForm({ initial }: CmsSettingsFormProps) {
  const [values, setValues] = useState<Record<string, string>>({
    hero_eyebrow: initial.hero_eyebrow ?? "English readiness untuk orang Indonesia",
    hero_title: initial.hero_title ?? "Seberapa siap bahasa Inggrismu?",
    hero_subtitle:
      initial.hero_subtitle ??
      "Bukan sekadar grammar. Kami ukur dan latih kesiapanmu untuk bicara, berelasi, berbisnis, dan berkontribusi di mana pun, tanpa batas negara.",
    hero_social_proof: initial.hero_social_proof ?? "Speak. Connect. Contribute.",

    problem_title: initial.problem_title ?? "Bisa baca, tapi belum berani bicara?",
    problem_subtitle:
      initial.problem_subtitle ??
      "Kamu tidak sendirian. Speaking adalah kemampuan bahasa Inggris terlemah orang Indonesia: skor 447, di bawah reading 491 (EF EPI 2025).",

    cta_title:
      initial.cta_title ??
      "Bingung pilih kelas atau jadwal yang pas? Yuk konsultasi dulu",
    cta_subtitle:
      initial.cta_subtitle ??
      "Cocok untuk anak-anak, pelajar, ibu rumah tangga, pekerja, maupun rombongan sekolah dan kantor. Kami bantu pilihkan level, program, dan jadwal belajar terbaik.",
  });

  const [busy, setBusy] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function save() {
    setBusy(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan pengaturan ke database.");
      }

      setSuccessMsg("Pengaturan Landing Page berhasil disimpan & diterapkan!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
    >
      {/* CARD 1: HERO SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0073F5] flex items-center justify-center font-bold text-sm">
              🚀
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Hero Section (Bagian Teratas)
              </h2>
              <p className="text-xs text-slate-500">
                Teks utama yang pertama kali dilihat oleh calon siswa saat membuka English Ready
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0062D1] border border-blue-100">
            Halaman Utama
          </span>
        </div>

        <div className="grid gap-4">
          {/* Eyebrow */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Eyebrow (Label di Atas Judul)</label>
              <span className="text-[11px] text-slate-400">Teks oranye huruf kapital</span>
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-semibold text-slate-900 focus:border-[#0073F5] focus:ring-1 focus:ring-blue-100 outline-none transition"
              value={values.hero_eyebrow}
              placeholder="Contoh: English readiness untuk orang Indonesia"
              onChange={(e) => setValues((v) => ({ ...v, hero_eyebrow: e.target.value }))}
            />
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Judul Utama (Headline)</label>
              <span className="text-[11px] text-slate-400">Pertanyaan inti English Ready</span>
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-extrabold text-slate-900 focus:border-[#0073F5] focus:ring-1 focus:ring-blue-100 outline-none transition"
              value={values.hero_title}
              placeholder="Contoh: Seberapa siap bahasa Inggrismu?"
              onChange={(e) => setValues((v) => ({ ...v, hero_title: e.target.value }))}
            />
          </div>

          {/* Subtitle */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Deskripsi / Subtitle</label>
              <span className="text-[11px] text-slate-400">Penjelasan nilai kesiapan dan tujuan</span>
            </div>
            <textarea
              rows={3}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-800 leading-relaxed focus:border-[#0073F5] focus:ring-1 focus:ring-blue-100 outline-none transition"
              value={values.hero_subtitle}
              placeholder="Ketik deskripsi hero..."
              onChange={(e) => setValues((v) => ({ ...v, hero_subtitle: e.target.value }))}
            />
          </div>

          {/* Tagline / Social Proof */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Tagline / Slogan Masterbrand</label>
              <span className="text-[11px] text-slate-400">Motto 3 pilar resmi English Ready</span>
            </div>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-bold text-[#0B2559] focus:border-[#0073F5] focus:ring-1 focus:ring-blue-100 outline-none transition"
              value={values.hero_social_proof}
              placeholder="Speak. Connect. Contribute."
              onChange={(e) => setValues((v) => ({ ...v, hero_social_proof: e.target.value }))}
            />
          </div>

          {/* Info note */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5 text-xs text-[#0B2559]">
            <span className="text-base shrink-0">💡</span>
            <p className="leading-relaxed">
              <strong>Info Desain:</strong> Di sebelah kanan Hero, sistem sekarang otomatis menampilkan <strong>Widget Asesmen Ready Check (10 Menit)</strong> atau <strong>Skor Live Siswa</strong> (jika sudah login), menggantikan foto statis lama.
            </p>
          </div>
        </div>
      </div>

      {/* CARD 2: PROBLEM & STATS SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-sm">
              🎯
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Masalah & Statistik (Problem Section)
              </h2>
              <p className="text-xs text-slate-500">
                Pernyataan masalah speaking orang Indonesia yang diselesaikan oleh English Ready
              </p>
            </div>
          </div>
          <Link
            href="/fh-admin/cms/pain-points"
            className="text-xs font-bold text-[#0073F5] hover:underline flex items-center gap-1 shrink-0"
          >
            Edit 3 Poin Masalah &rarr;
          </Link>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Judul Bagian Masalah</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:border-[#0073F5] outline-none transition"
              value={values.problem_title}
              placeholder="Contoh: Bisa baca, tapi belum berani bicara?"
              onChange={(e) => setValues((v) => ({ ...v, problem_title: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Deskripsi & Kutipan Riset / Statistik</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed focus:border-[#0073F5] outline-none transition"
              value={values.problem_subtitle}
              placeholder="Contoh: Kamu tidak sendirian. Speaking adalah kemampuan bahasa Inggris terlemah orang Indonesia: skor 447, di bawah reading 491 (EF EPI 2025)."
              onChange={(e) => setValues((v) => ({ ...v, problem_subtitle: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* CARD 3: KONSULTASI PROGRAM (FINAL CTA) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
              💬
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-heading">
                Konsultasi Program &amp; Jadwal Belajar
              </h2>
              <p className="text-xs text-slate-500">
                Banner konsultasi gratis untuk semua kalangan (anak, pelajar, ibu rumah tangga, pekerja, hingga rombongan)
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
            Konsultasi
          </span>
        </div>

        <div className="grid gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Judul Banner Konsultasi (CTA Title)</label>
            <input
              type="text"
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-bold text-slate-900 focus:border-[#0073F5] outline-none transition"
              value={values.cta_title}
              placeholder="Contoh: Bingung pilih kelas atau jadwal yang pas? Yuk konsultasi dulu"
              onChange={(e) => setValues((v) => ({ ...v, cta_title: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-slate-700">Deskripsi Banner Konsultasi (CTA Subtitle)</label>
            <textarea
              rows={2}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm text-slate-800 leading-relaxed focus:border-[#0073F5] outline-none transition"
              value={values.cta_subtitle}
              placeholder="Contoh: Cocok untuk anak-anak, pelajar, ibu rumah tangga, pekerja, maupun rombongan sekolah dan kantor."
              onChange={(e) => setValues((v) => ({ ...v, cta_subtitle: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* QUICK LINKS TO OTHER CMS MENUS */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
        <span className="text-xs font-bold text-slate-700 block mb-2">
          Kelola Komponen Landing Page Lainnya:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <Link
            href="/fh-admin/cms/pain-points"
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#0073F5] font-semibold text-slate-700 hover:text-[#0073F5] transition text-center"
          >
            📋 Pain Points (3 Masalah)
          </Link>
          <Link
            href="/fh-admin/cms/methods"
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#0073F5] font-semibold text-slate-700 hover:text-[#0073F5] transition text-center"
          >
            ⚙️ Method Copy (3 Langkah)
          </Link>
          <Link
            href="/fh-admin/cms/testimonials"
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#0073F5] font-semibold text-slate-700 hover:text-[#0073F5] transition text-center"
          >
            ⭐ Testimonials Siswa
          </Link>
          <Link
            href="/fh-admin/cms/faqs"
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#0073F5] font-semibold text-slate-700 hover:text-[#0073F5] transition text-center"
          >
            ❓ FAQs Pertanyaan Umum
          </Link>
        </div>
      </div>

      {/* ERROR & SUCCESS NOTIFICATIONS */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          ✓ {successMsg}
        </div>
      )}

      {/* SAVE BUTTON BAR */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs text-slate-400">
          Perubahan teks akan otomatis memperbarui tampilan Landing Page secara real-time.
        </span>
        <button
          type="submit"
          disabled={busy}
          className="px-6 py-3 rounded-xl bg-[#0073F5] hover:bg-[#0062D1] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
        >
          {busy ? "Menyimpan Pengaturan..." : "Simpan Pengaturan Landing Page"}
        </button>
      </div>
    </form>
  );
}
