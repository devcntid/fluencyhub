import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

export const metadata: Metadata = {
  title: "Brand & Logo System v1.3 — English Ready",
  description: "Official visual guidelines, vector logos, and color palette for English Ready Indonesia.",
};

const PALETTE = [
  {
    name: "Navy",
    hex: "#0B2559",
    desc: '"English", judul, teks',
    textColor: "text-white",
    bgClass: "bg-[#0B2559]",
  },
  {
    name: "Biru Ready",
    hex: "#0073F5",
    desc: 'balon, "Ready"',
    textColor: "text-white",
    bgClass: "bg-[#0073F5]",
  },
  {
    name: "Biru teks",
    hex: "#0062D1",
    desc: "tautan, teks kecil",
    textColor: "text-white",
    bgClass: "bg-[#0062D1]",
  },
  {
    name: "Oranye centang",
    hex: "#F26A12",
    desc: "badge, CTA",
    textColor: "text-white",
    bgClass: "bg-[#F26A12]",
  },
  {
    name: "Oranye teks",
    hex: "#C2530A",
    desc: "teks oranye kecil",
    textColor: "text-white",
    bgClass: "bg-[#C2530A]",
  },
  {
    name: "Krem",
    hex: "#FBF6F1",
    desc: "latar",
    textColor: "text-[#0B2559]",
    bgClass: "bg-[#FBF6F1]",
    border: "border border-[#E6DED4]",
  },
];

export default function BrandGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#0073F5]/10 text-[#0062D1] mb-2">
                Official Visual Guidelines
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0B2559] tracking-tight">
                Sistem logo English Ready · v1.3
              </h1>
              <p className="mt-2 text-base text-slate-600 max-w-2xl">
                Logo asli (mikrofon dalam balon chat) + badge centang oranye sebagai tanda &ldquo;ready&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/brand/logo-horizontal.svg"
                download
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-[#0B2559] text-white hover:bg-[#0073F5] transition-colors shadow-sm"
              >
                Unduh Master SVG
              </Link>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>

        {/* 3 Main Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Masterbrand Vertikal + Tagline */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between items-center text-center">
            <div className="w-full text-left mb-6">
              <span className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                MASTERBRAND · VERTIKAL + TAGLINE
              </span>
            </div>

            <div className="py-8 flex flex-col items-center">
              <EnglishReadyLogo variant="vertical" height={48} withTagline />
            </div>

            <div className="w-full pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Rasio: 1:1.6</span>
              <span className="font-semibold text-[#0062D1]">Tagline Resmi</span>
            </div>
          </div>

          {/* Card 2: Masterbrand Horizontal (Light & Dark) */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-left mb-6">
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                  MASTERBRAND · HORIZONTAL
                </span>
              </div>

              {/* Versi Terang */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center min-h-[110px]">
                <EnglishReadyLogo variant="horizontal" height={36} />
              </div>

              {/* Versi Gelap */}
              <div className="mt-4">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-2">
                  VERSI GELAP
                </span>
                <div className="p-6 rounded-2xl bg-[#0B2559] flex items-center justify-center min-h-[110px] shadow-inner">
                  <EnglishReadyLogo variant="horizontal" mode="dark" height={36} />
                </div>
              </div>
            </div>

            <div className="w-full pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-6">
              <span>Navy `#0B2559` + Putih</span>
              <span className="font-semibold text-[#0062D1]">Latar Gelap / Terang</span>
            </div>
          </div>

          {/* Card 3: Sub-brand Podcast & Ikon App / Avatar */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="text-left mb-6">
                <span className="text-[11px] font-black tracking-widest uppercase text-slate-400">
                  SUB-BRAND PODCAST
                </span>
              </div>

              {/* Podcast Lockup */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center min-h-[140px]">
                <EnglishReadyLogo variant="podcast" height={34} />
              </div>

              {/* Ikon App / Avatar */}
              <div className="mt-6">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-3">
                  IKON APP / AVATAR
                </span>
                <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex flex-col items-center gap-1.5">
                    <EnglishReadyLogo variant="app-icon" height={56} />
                    <span className="text-[10px] font-medium text-slate-500">Squircle</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <EnglishReadyLogo variant="avatar" height={56} />
                    <span className="text-[10px] font-medium text-slate-500">Circle</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-6">
              <span>Audio & App Identity</span>
              <span className="font-semibold text-[#0062D1]">Multi-Platform</span>
            </div>
          </div>
        </div>

        {/* Color Palette Row */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0B2559] tracking-tight">
              Palet Warna Resmi v1.3
            </h2>
            <span className="text-xs text-slate-500">
              6 warna dasar sistem identitas English Ready
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {PALETTE.map((c) => (
              <div
                key={c.name}
                className={`${c.bgClass} ${c.textColor} ${c.border || ""} rounded-2xl p-4 flex flex-col justify-between min-h-[140px] shadow-sm transition-transform hover:-translate-y-1`}
              >
                <div>
                  <div className="text-sm font-extrabold leading-tight">{c.name}</div>
                  <div className="text-[11px] opacity-80 mt-1 leading-snug">{c.desc}</div>
                </div>
                <div className="pt-4">
                  <code className="text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-black/10">
                    {c.hex}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assets Download Grid */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm">
          <h3 className="text-base font-bold text-[#0B2559] mb-4">
            Aset Vektor & Raster v1.3 (Siap Digunakan)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <a
              href="/brand/logo-horizontal.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 hover:border-[#0073F5] hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#0B2559] group-hover:text-[#0073F5]">logo-horizontal.svg</div>
                <div className="text-slate-500">Lockup standar masterbrand</div>
              </div>
              <span className="text-[#0073F5] font-semibold">Buka &rarr;</span>
            </a>

            <a
              href="/brand/logo-horizontal-dark.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 hover:border-[#0073F5] hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#0B2559] group-hover:text-[#0073F5]">logo-horizontal-dark.svg</div>
                <div className="text-slate-500">Lockup untuk latar Navy</div>
              </div>
              <span className="text-[#0073F5] font-semibold">Buka &rarr;</span>
            </a>

            <a
              href="/brand/logo-icon.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 hover:border-[#0073F5] hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#0B2559] group-hover:text-[#0073F5]">logo-icon.svg</div>
                <div className="text-slate-500">Ikon mic + centang oranye</div>
              </div>
              <span className="text-[#0073F5] font-semibold">Buka &rarr;</span>
            </a>

            <a
              href="/brand/logo-wordmark.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 hover:border-[#0073F5] hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#0B2559] group-hover:text-[#0073F5]">logo-wordmark.svg</div>
                <div className="text-slate-500">Teks English Ready bertumpuk</div>
              </div>
              <span className="text-[#0073F5] font-semibold">Buka &rarr;</span>
            </a>

            <a
              href="/brand/logo-wordmark-dark.svg"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 hover:border-[#0073F5] hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#0B2559] group-hover:text-[#0073F5]">logo-wordmark-dark.svg</div>
                <div className="text-slate-500">Wordmark teks putih & biru terang</div>
              </div>
              <span className="text-[#0073F5] font-semibold">Buka &rarr;</span>
            </a>

            <a
              href="/icon.png"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-xl border border-slate-200 hover:border-[#0073F5] hover:bg-blue-50/50 transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="font-bold text-[#0B2559] group-hover:text-[#0073F5]">icon.png (512x512)</div>
                <div className="text-slate-500">Favicon & app icon raster</div>
              </div>
              <span className="text-[#0073F5] font-semibold">Buka &rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
