"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import QRCode from "qrcode";
import { PaymentMethodLogo } from "@/components/checkout/PaymentMethodLogo";
import { QrCodeImage } from "@/components/checkout/QrCodeImage";
import { generateQrisString } from "@/lib/payment/qris";
import type { PaymentInstruction } from "@/types/db";

function formatIdr(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function VAInstructions({
  vaNumber,
  qrImage,
  paymentUrl,
  instructions,
  title,
  orderNumber,
  orderStatus,
  methodName,
  methodCode,
  methodType,
  logoUrl,
  merchantName = "FluencyHub",
  totalAmount,
  expiresAt,
  createdAt,
  onReorder,
  onExpireChange,
}: {
  vaNumber?: string | null;
  qrImage?: string | null;
  paymentUrl?: string | null;
  instructions: PaymentInstruction[];
  title?: string;
  orderNumber?: string | null;
  orderStatus?: string | null;
  methodName?: string | null;
  methodCode?: string | null;
  methodType?: string | null;
  logoUrl?: string | null;
  merchantName?: string | null;
  totalAmount?: number | null;
  expiresAt?: Date | string | null;
  createdAt?: Date | string | null;
  onReorder?: () => void;
  onExpireChange?: (expired: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showFullQrModal, setShowFullQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"mbanking" | "atm" | "ibanking">("mbanking");

  const isRetail =
    methodType === "retail_outlet" ||
    methodCode?.toUpperCase().includes("INDOMARET") ||
    methodCode?.toUpperCase().includes("ALFAMART") ||
    methodCode?.includes("706") ||
    methodCode?.includes("707");

  const isQris = Boolean(
    qrImage ||
    methodType === "qr_code" ||
    methodCode?.toUpperCase().includes("QRIS") ||
    methodCode?.includes("711") ||
    methodCode?.includes("836")
  );

  const isEWallet = methodType === "e_wallet" && !isQris;
  const isVA = !isRetail && !isQris && !isEWallet;

  const [mounted, setMounted] = useState(false);

  // Aturan countdown batas waktu:
  // - QRIS: 15 menit (15 * 60 detik)
  // - Gerai Retail (Indomaret / Alfamart): 24 jam / seharian (24 * 60 * 60 detik)
  // - Virtual Account: 1 jam (60 * 60 detik)
  // - E-Wallet: tidak menggunakan countdown waktu
  const hasCountdown = !isEWallet;
  const defaultDurationSeconds = isQris ? 15 * 60 : isRetail ? 24 * 60 * 60 : 60 * 60;

  // Nilai awal dibuat deterministik agar HTML yang dihasilkan Server (SSR) dan Client awal sama persis
  const [secondsRemaining, setSecondsRemaining] = useState<number>(defaultDurationSeconds);

  // Interval real-time countdown agar timer tetap jalan akurat meski tab ditutup/ditinggal
  useEffect(() => {
    setMounted(true);
    if (!hasCountdown) return;

    let targetMs: number | null = null;

    // 1. Prioritas utama: expiresAt dari database
    if (expiresAt) {
      const ms = new Date(expiresAt).getTime();
      if (!isNaN(ms)) targetMs = ms;
    }

    // 2. Prioritas kedua: hitung dari createdAt order + durasi metode
    if (!targetMs && createdAt) {
      const ms = new Date(createdAt).getTime();
      if (!isNaN(ms)) targetMs = ms + defaultDurationSeconds * 1000;
    }

    // 3. Prioritas ketiga: localStorage per orderNumber
    if (!targetMs && typeof window !== "undefined" && orderNumber) {
      const storageKey = `fluencyhub_expiry_${orderNumber}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const ms = parseInt(stored, 10);
        if (!isNaN(ms)) targetMs = ms;
      }
      if (!targetMs) {
        targetMs = Date.now() + defaultDurationSeconds * 1000;
        localStorage.setItem(storageKey, String(targetMs));
      }
    }

    if (!targetMs) {
      targetMs = Date.now() + defaultDurationSeconds * 1000;
    }

    const updateRemaining = () => {
      const diff = Math.max(0, Math.floor((targetMs! - Date.now()) / 1000));
      setSecondsRemaining(diff);
      return diff;
    };

    updateRemaining();

    const interval = setInterval(() => {
      const remaining = updateRemaining();
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasCountdown, expiresAt, createdAt, defaultDurationSeconds, orderNumber]);

  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const isExpired = mounted ? (secondsRemaining <= 0 || orderStatus === "expired") : (orderStatus === "expired");
  const pad = (n: number) => String(n).padStart(2, "0");

  useEffect(() => {
    if (mounted) {
      onExpireChange?.(isExpired);
    }
  }, [isExpired, mounted, onExpireChange]);

  useEffect(() => {
    if (isExpired && showFullQrModal) {
      setShowFullQrModal(false);
    }
  }, [isExpired, showFullQrModal]);

  const [internalQr, setInternalQr] = useState<string | null>(qrImage ?? null);

  useEffect(() => {
    if (qrImage) {
      setInternalQr(qrImage);
    } else if (isQris && orderNumber) {
      const qrisString = generateQrisString({
        orderNumber,
        amount: Number(totalAmount) || 0,
        merchantName: merchantName || "FluencyHub",
      });
      QRCode.toDataURL(qrisString, { width: 280, margin: 2, errorCorrectionLevel: "M" })
        .then((url) => setInternalQr(url))
        .catch(() => {});
    }
  }, [qrImage, isQris, orderNumber, totalAmount, merchantName]);

  const activeQr = qrImage || internalQr;

  const handleCopy = (text: string, isOrder = false) => {
    navigator.clipboard.writeText(text);
    if (isOrder) {
      setCopiedOrder(true);
      setTimeout(() => setCopiedOrder(false), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = async () => {
    if (!activeQr || isExpired) return;
    setDownloading(true);
    try {
      if (activeQr.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = activeQr;
        link.download = `QRIS-${orderNumber || "FluencyHub"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const res = await fetch(activeQr);
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `QRIS-${orderNumber || "FluencyHub"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      window.open(activeQr, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  const handleOpenFullQr = () => {
    if (!activeQr || isExpired) return;
    try {
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>QRIS - ${orderNumber || "FluencyHub"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #09090b;
      color: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      background: #ffffff;
      color: #09090b;
      padding: 32px 24px;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
      text-align: center;
      max-width: 420px;
      width: 100%;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #18181b;
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      padding: 5px 14px;
      border-radius: 9999px;
      margin-bottom: 14px;
      letter-spacing: 0.5px;
    }
    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #22c55e;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 6px;
      color: #09090b;
    }
    p {
      color: #71717a;
      font-size: 12px;
      line-height: 1.5;
    }
    .qr-wrapper {
      background: #ffffff;
      padding: 16px;
      border-radius: 20px;
      border: 1.5px solid #e4e4e7;
      display: inline-block;
      margin: 18px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    img {
      display: block;
      width: 280px;
      height: 280px;
      max-width: 100%;
      height: auto;
      margin: 0 auto;
    }
    .meta-box {
      border-top: 1px dashed #e4e4e7;
      padding-top: 14px;
      margin-top: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }
    .meta-label { color: #71717a; font-size: 12px; }
    .meta-val { font-weight: 700; color: #18181b; }
    .amount { font-size: 18px; font-weight: 800; color: #09090b; }
    .actions {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }
    .btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      font-weight: 700;
      font-size: 12px;
      padding: 10px 14px;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      border: 1px solid transparent;
    }
    .btn-dark {
      background: #09090b;
      color: #ffffff;
    }
    .btn-dark:hover { background: #27272a; }
    .btn-outline {
      background: #ffffff;
      color: #18181b;
      border-color: #d4d4d8;
    }
    .btn-outline:hover { background: #f4f4f5; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      QRIS NASIONAL
    </div>
    <h1>Pembayaran QRIS</h1>
    <p>Scan dengan aplikasi m-banking atau e-wallet pilihan Anda.</p>
    
    <div class="qr-wrapper">
      <img src="${activeQr}" alt="QRIS Code" />
    </div>

    <div class="meta-box">
      <span class="meta-label">Merchant</span>
      <span class="meta-val">${merchantName || "FluencyHub"}</span>
    </div>
    ${orderNumber ? `
    <div class="meta-box" style="margin-top: 6px; border-top: none; padding-top: 0;">
      <span class="meta-label">Nomor Order</span>
      <span class="meta-val" style="font-family: monospace;">${orderNumber}</span>
    </div>` : ""}
    ${totalAmount ? `
    <div class="meta-box" style="margin-top: 6px; border-top: none; padding-top: 0;">
      <span class="meta-label">Total Tagihan</span>
      <span class="amount">${formatIdr(totalAmount)}</span>
    </div>` : ""}

    <div class="actions">
      <button class="btn btn-dark" onclick="window.print()">Cetak / Print</button>
      <button class="btn btn-outline" onclick="window.close()">Tutup Tab</button>
    </div>
  </div>
</body>
</html>`);
        newWindow.document.close();
      } else {
        setShowFullQrModal(true);
      }
    } catch {
      setShowFullQrModal(true);
    }
  };

  // Title formatting
  const displayTitle =
    title ||
    (isQris
      ? "Pembayaran QRIS"
      : isRetail
      ? `Pembayaran ${methodName || "Gerai Retail"}`
      : isEWallet
      ? `Pembayaran ${methodName || "E-Wallet"}`
      : "Transfer Virtual Account");

  return (
    <div className="card anim !p-3 sm:!p-5 w-full min-w-0 overflow-hidden box-border">
      {/* Header dengan Logo & Judul */}
      <div className="mb-4 sm:mb-5 flex items-center gap-2.5 sm:gap-3 border-b border-[var(--border)] pb-3.5 sm:pb-4 min-w-0">
        {methodCode ? (
          <PaymentMethodLogo
            src={logoUrl ?? null}
            name={methodName ?? displayTitle}
            code={methodCode}
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-xl font-extrabold font-heading text-[var(--text)] leading-snug">
            {displayTitle}
          </h2>
          <p className="text-[11px] sm:text-xs font-semibold text-[var(--text-3)] leading-tight mt-0.5">
            {isRetail
              ? "Bayar langsung di kasir toko terdekat"
              : isQris
              ? "Dukungan QRIS Nasional (BCA, Mandiri, GoPay, OVO, Dana, dll)"
              : isEWallet
              ? "Pembayaran Digital E-Wallet"
              : methodName || "Virtual Account Resmi"}
          </p>
        </div>
      </div>

      {/* COOLDOWN / COUNTDOWN TIMER UNTUK QRIS (15m), RETAIL (24h), VA (1h). E-WALLET TIDAK MENGGUNAKAN TIMER */}
      {hasCountdown && (
        <div
          className={`mb-4 sm:mb-5 rounded-2xl border p-3.5 sm:p-4.5 transition-all shadow-xs ${
            isExpired
              ? "border-rose-200 bg-rose-50/70"
              : "border-zinc-200 bg-white"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isExpired
                    ? "bg-rose-100 text-rose-600"
                    : "bg-black text-white shadow-xs"
                }`}
              >
                {isExpired ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="animate-pulse">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-extrabold text-zinc-900 leading-tight" suppressHydrationWarning>
                  {isExpired ? "Batas Waktu Pembayaran Habis" : "Selesaikan Pembayaran Dalam"}
                </p>
                <p className="text-[11px] sm:text-xs font-medium text-zinc-500 mt-0.5 leading-snug" suppressHydrationWarning>
                  {isExpired
                    ? "Transaksi ini telah kedaluwarsa. Silakan lakukan pemesanan ulang."
                    : `Batas waktu pembayaran ${isQris ? "15 menit" : isRetail ? "24 jam" : "1 jam"}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-start sm:justify-end self-stretch sm:self-auto shrink-0">
              {isExpired ? (
                <span suppressHydrationWarning className="inline-flex items-center gap-1 rounded-xl bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold font-mono">
                  Kedaluwarsa
                </span>
              ) : (
                <div suppressHydrationWarning className="flex items-center justify-center gap-1 font-mono font-extrabold text-sm sm:text-base text-zinc-900 bg-zinc-100/80 border border-zinc-200/90 px-3 py-1.5 rounded-xl shadow-2xs w-full sm:w-auto">
                  {hours > 0 && (
                    <>
                      <span suppressHydrationWarning className="px-2 py-0.5 rounded-lg bg-white text-zinc-900 font-bold border border-zinc-200/70 shadow-2xs">{pad(hours)}</span>
                      <span className="text-zinc-400 font-bold">:</span>
                    </>
                  )}
                  <span suppressHydrationWarning className="px-2 py-0.5 rounded-lg bg-white text-zinc-900 font-bold border border-zinc-200/70 shadow-2xs">{pad(minutes)}</span>
                  <span className="text-zinc-400 font-bold">:</span>
                  <span suppressHydrationWarning className="px-2 py-0.5 rounded-lg bg-white text-zinc-900 font-bold border border-zinc-200/70 shadow-2xs">{pad(seconds)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1. GERAI RETAIL (INDOMARET / ALFAMART): Highlight Kode Pembayaran Kasir */}
      {isRetail && vaNumber && (
        <div className={`mb-4 sm:mb-5 rounded-2xl border-2 p-4 sm:p-6 text-center shadow-xs min-w-0 overflow-hidden ${
          isExpired ? "border-rose-200 bg-rose-50/25" : "border-zinc-200 bg-white"
        }`}>
          {isExpired ? (
            <span className="inline-block rounded-full bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1 text-[11px] sm:text-xs font-bold mb-3 shadow-2xs">
              KODE PEMBAYARAN KEDALUWARSA
            </span>
          ) : (
            <span className="inline-block rounded-full bg-black text-white px-3 py-1 text-[11px] sm:text-xs font-bold mb-3 shadow-2xs">
              KODE PEMBAYARAN KASIR
            </span>
          )}

          <div className={`my-1 sm:my-2 font-mono text-xl xs:text-2xl sm:text-3xl font-black tracking-wide sm:tracking-wider break-all px-3 py-2.5 rounded-xl border max-w-full inline-block ${
            isExpired
              ? "text-zinc-400 line-through filter blur-[0.5px] opacity-40 select-none bg-zinc-100 border-zinc-200"
              : "text-zinc-900 select-all bg-zinc-50 border-zinc-200"
          }`}>
            {vaNumber}
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto mt-2 mb-4 leading-relaxed px-2">
            {isExpired ? (
              <span className="text-rose-700 font-semibold">
                Kode pembayaran ini sudah kedaluwarsa. Jangan berikan kode ini ke kasir toko.
              </span>
            ) : (
              <>Tunjukkan kode ini ke kasir <strong>{methodName || "Indomaret / Alfamart"}</strong> saat melakukan pembayaran.</>
            )}
          </p>

          {isExpired ? (
            <button
              type="button"
              onClick={onReorder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-6 py-2.5 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              <span>Pesan Ulang / Buat Kode Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleCopy(vaNumber)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-5 py-2.5 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              {copied ? "Kode Berhasil Disalin!" : "Salin Kode Pembayaran"}
            </button>
          )}
        </div>
      )}

      {/* 2. QRIS: Tampilan QR Code Gambar Bersih, Responsif & Tombol Simpan Hitam Putih */}
      {isQris && (
        <div className={`mb-4 sm:mb-5 rounded-2xl border-2 p-4 sm:p-6 text-center shadow-xs min-w-0 overflow-hidden ${
          isExpired ? "border-rose-200 bg-rose-50/20" : "border-zinc-200 bg-white"
        }`}>
          {isExpired ? (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 text-[10px] sm:text-xs font-bold text-rose-700 shadow-2xs">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-rose-600">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span className="truncate">KODE QRIS SUDAH KEDALUWARSA</span>
            </div>
          ) : (
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-black text-white px-3 py-1 text-[10px] sm:text-xs font-bold max-w-full shadow-2xs">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate">SCAN QRIS DENGAN APLIKASI APAPUN</span>
            </div>
          )}

          {/* QR Container dengan Blur & Overlay saat Expired */}
          <div
            onClick={() => !isExpired && activeQr && setShowFullQrModal(true)}
            title={isExpired ? "Kode QR telah kedaluwarsa" : "Klik untuk perbesar QR"}
            className={`mx-auto w-[180px] xs:w-[200px] sm:w-[230px] max-w-full p-2 sm:p-3 bg-white rounded-2xl border transition relative overflow-hidden ${
              isExpired
                ? "border-rose-200 cursor-not-allowed select-none shadow-none"
                : "shadow-sm border-zinc-200 cursor-pointer hover:shadow-md"
            }`}
          >
            <div className={isExpired ? "filter blur-[5px] grayscale opacity-20 pointer-events-none select-none transition-all" : ""}>
              {activeQr ? (
                <QrCodeImage src={activeQr} />
              ) : (
                <div className="flex h-[180px] items-center justify-center text-xs text-zinc-400">
                  Membuat kode QR...
                </div>
              )}
            </div>

            {/* Expired Overlay di atas gambar QR */}
            {isExpired && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-white/80 backdrop-blur-[2px]">
                <div className="h-11 w-11 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-2 shadow-xs">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <p className="font-extrabold text-xs sm:text-sm text-rose-700 font-heading">
                  QR Tidak Berlaku
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-500 font-medium mt-0.5 leading-tight">
                  Waktu pembayaran telah habis
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons for QRIS */}
          {isExpired ? (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-sm sm:max-w-md mx-auto">
              <button
                type="button"
                onClick={onReorder}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                  <path d="M21 3v5h-5"/>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                  <path d="M3 21v-5h5"/>
                </svg>
                <span>Pesan Ulang / Buat QR Baru</span>
              </button>
            </div>
          ) : (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-sm sm:max-w-md mx-auto">
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={downloading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-5 py-2.5 text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>{downloading ? "Mengunduh..." : "Simpan Gambar QRIS"}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenFullQr}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 px-5 py-2.5 text-xs sm:text-sm font-bold text-zinc-900 shadow-2xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                <span>Buka QR Penuh</span>
              </button>
            </div>
          )}

          {isExpired ? (
            <>
              <p className="mt-3 text-xs font-semibold text-rose-700 leading-snug">
                Transaksi ini telah kedaluwarsa. Jangan lakukan transfer atau scan ke kode QR ini.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                Silakan klik tombol di atas untuk membuat pesanan baru dengan kode QR yang aktif.
              </p>
            </>
          ) : (
            <>
              <p className="mt-3 text-xs font-semibold text-zinc-800 leading-snug">
                Scan via BCA, Mandiri Livin, BRImo, GoPay, OVO, Dana, ShopeePay, LinkAja, dll.
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                Bisa disimpan ke galeri ponsel untuk pembayaran langsung dari aplikasi m-banking atau e-wallet Anda.
              </p>
            </>
          )}
        </div>
      )}

      {/* 3. VIRTUAL ACCOUNT: Highlight Nomor VA */}
      {isVA && !vaNumber && (
        <div className="mb-4 sm:mb-5 rounded-2xl border-2 border-amber-200 bg-amber-50/70 p-4 sm:p-6 text-center shadow-xs">
          <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4 className="text-base font-bold text-amber-900 mb-1">Nomor Virtual Account Belum Terbit</h4>
          <p className="text-xs sm:text-sm text-amber-700 max-w-md mx-auto mb-4 leading-relaxed">
            Nomor Virtual Account belum berhasil digenerate oleh server gateway. Silakan buat tagihan baru atau pilih metode lain.
          </p>
          <button
            type="button"
            onClick={onReorder}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-5 py-2.5 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M3 21v-5h5"/>
            </svg>
            <span>Pesan Ulang / Buat Tagihan Baru</span>
          </button>
        </div>
      )}

      {isVA && vaNumber && (
        <div className={`mb-4 sm:mb-5 rounded-2xl border-2 p-4 sm:p-6 text-center shadow-xs min-w-0 overflow-hidden ${
          isExpired ? "border-rose-200 bg-rose-50/25" : "border-zinc-200 bg-white"
        }`}>
          {isExpired ? (
            <span className="inline-block rounded-full bg-rose-100 border border-rose-200 text-rose-700 px-3 py-1 text-[11px] sm:text-xs font-bold mb-3 shadow-2xs">
              NOMOR VA KEDALUWARSA
            </span>
          ) : (
            <span className="inline-block rounded-full bg-black text-white px-3 py-1 text-[11px] sm:text-xs font-bold mb-3 shadow-2xs">
              NOMOR VIRTUAL ACCOUNT
            </span>
          )}

          <div className={`my-1 sm:my-2 font-mono text-xl xs:text-2xl sm:text-3xl font-black tracking-wide sm:tracking-wider break-all px-3 py-2.5 rounded-xl border max-w-full inline-block ${
            isExpired
              ? "text-zinc-400 line-through filter blur-[0.5px] opacity-40 select-none bg-zinc-100 border-zinc-200"
              : "text-zinc-900 select-all bg-zinc-50 border-zinc-200"
          }`}>
            {vaNumber}
          </div>

          <p className="text-xs sm:text-sm text-zinc-600 max-w-md mx-auto mt-2 mb-4 leading-relaxed px-2">
            {isExpired ? (
              <span className="text-rose-700 font-semibold">
                Nomor Virtual Account ini sudah kedaluwarsa. Jangan lakukan transfer ke nomor ini.
              </span>
            ) : (
              <>Transfer sesuai nominal persis ke nomor Virtual Account di atas sebelum batas waktu habis.</>
            )}
          </p>

          {isExpired ? (
            <button
              type="button"
              onClick={onReorder}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-6 py-2.5 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M3 21v-5h5"/>
              </svg>
              <span>Pesan Ulang / Buat Tagihan Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleCopy(vaNumber)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white px-5 py-2.5 font-bold text-xs sm:text-sm shadow-xs transition active:scale-95 cursor-pointer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              {copied ? "Nomor VA Berhasil Disalin!" : "Salin Nomor VA"}
            </button>
          )}
        </div>
      )}

      {/* 4. E-WALLET: Card Tindakan Hanya untuk E-Wallet Tertentu (cth. OVO) */}
      {isEWallet && paymentUrl && (
        <div className="mb-4 sm:mb-5 rounded-2xl border-2 border-zinc-200 bg-white p-4 sm:p-6 text-center shadow-xs">
          <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-black text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </div>
          <h4 className="text-base font-bold text-zinc-900">Lanjutkan Pembayaran {methodName}</h4>
          <p className="mt-1 mb-4 text-xs sm:text-sm text-zinc-600 max-w-sm mx-auto">
            Klik tombol di bawah jika halaman pembayaran {methodName} belum terbuka secara otomatis.
          </p>
          <a
            href={paymentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-black hover:bg-zinc-800 text-white border border-black px-6 py-3 w-full font-bold shadow-md hover:shadow-lg transition-all text-xs sm:text-sm cursor-pointer"
          >
            Buka Halaman Pembayaran {methodName} ↗
          </a>
        </div>
      )}

      {/* DETAIL TRANSAKSI PEMESANAN */}
      <div className="mb-4 sm:mb-5 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)] min-w-0">
        <div className="border-b border-[var(--border)] bg-[var(--surface-3,var(--surface-2))] px-3 sm:px-4 py-2.5 flex items-center justify-between gap-1.5 min-w-0">
          <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[var(--text-2)] shrink-0">
            Detail Transaksi
          </h3>
          {isExpired ? (
            <span suppressHydrationWarning className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-rose-700 dark:text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="whitespace-nowrap">Kedaluwarsa</span>
            </span>
          ) : (
            <span suppressHydrationWarning className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="whitespace-nowrap">Menunggu Pembayaran</span>
            </span>
          )}
        </div>
        <div className="divide-y divide-[var(--border)] px-3 sm:px-4 text-sm">
          {vaNumber && (
            <div className="flex items-center justify-between py-2.5 gap-2 min-w-0">
              <span className="text-xs sm:text-sm text-[var(--text-3)] shrink-0">
                {isRetail
                  ? "Kode Bayar"
                  : isQris
                  ? "ID Referensi"
                  : isEWallet
                  ? "ID Transaksi"
                  : "No. Virtual Account"}
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`font-mono font-bold text-xs sm:text-sm tracking-wider truncate ${
                  isExpired ? "text-zinc-400 line-through select-none" : "text-[var(--text)] select-all"
                }`}>
                  {vaNumber}
                </span>
                <button
                  type="button"
                  disabled={isExpired}
                  onClick={() => !isExpired && handleCopy(vaNumber)}
                  title={isExpired ? "Nomor telah kedaluwarsa" : copied ? "Tersalin!" : "Salin nomor"}
                  aria-label="Salin nomor"
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-all ${
                    isExpired
                      ? "border-zinc-200 bg-zinc-100 text-zinc-300 cursor-not-allowed opacity-50"
                      : copied
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--brand)] hover:bg-[var(--border)]"
                  }`}
                >
                  {copied ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}

          {hasCountdown && (
            <div className="flex items-center justify-between py-2.5 gap-2 min-w-0">
              <span className="text-xs sm:text-sm text-[var(--text-3)] shrink-0">Batas Waktu</span>
              <span className={`font-mono font-bold text-xs sm:text-sm ${isExpired ? "text-rose-600 dark:text-rose-400" : "text-zinc-900 dark:text-zinc-100"}`}>
                {isExpired
                  ? "Kedaluwarsa"
                  : hours > 0
                  ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
                  : `${pad(minutes)}:${pad(seconds)}`}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between py-2.5 gap-2 min-w-0">
            <span className="text-xs sm:text-sm text-[var(--text-3)] shrink-0">Merchant</span>
            <span className="text-xs sm:text-sm font-semibold text-[var(--text)] truncate">{merchantName || "FluencyHub"}</span>
          </div>

          {totalAmount != null && totalAmount > 0 && (
            <div className="flex items-center justify-between py-2.5 gap-2 min-w-0">
              <span className="text-xs sm:text-sm text-[var(--text-3)] shrink-0">Total Pembayaran</span>
              <span className="font-heading font-extrabold text-[14px] sm:text-[16px] text-[var(--brand)] truncate">
                {formatIdr(totalAmount)}
              </span>
            </div>
          )}

          {orderNumber && (
            <div className="flex items-center justify-between py-2.5 gap-2 min-w-0">
              <span className="text-xs sm:text-sm text-[var(--text-3)] shrink-0">Nomor Order</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-mono text-xs text-[var(--text-2)] truncate select-all">{orderNumber}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(orderNumber, true)}
                  title={copiedOrder ? "Tersalin!" : "Salin nomor order"}
                  aria-label="Salin nomor order"
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-all ${
                    copiedOrder
                      ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)] hover:text-[var(--brand)] hover:border-[var(--brand)]"
                  }`}
                >
                  {copiedOrder ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PANDUAN LANGKAH PEMBAYARAN (COLLAPSIBLE / ACCORDION) */}
      <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <button
          type="button"
          onClick={() => setShowInstructions((prev) => !prev)}
          className="w-full flex items-center justify-between p-3.5 sm:p-4 text-left font-heading text-xs sm:text-sm font-bold text-[var(--text)] hover:bg-[var(--surface-2)] transition cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--brand)]">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Cara Pembayaran
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-3)]">
            <span>{showInstructions ? "Sembunyikan" : "Lihat Petunjuk"}</span>
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-200 ${showInstructions ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {showInstructions && (
          <div className="border-t border-[var(--border)] p-3.5 sm:p-4 pt-3">
            {/* 1. Panduan Khusus Gerai Retail (Indomaret / Alfamart) */}
            {isRetail && (
              <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm text-[var(--text-2)] leading-relaxed">
                <li>Kunjungi gerai <strong>{methodName || "Indomaret / Alfamart"}</strong> terdekat.</li>
                <li>Sampaikan ke kasir bahwa Anda ingin melakukan pembayaran tagihan <strong>Faspay / FluencyHub</strong>.</li>
                <li>Tunjukkan atau sebutkan <strong>Kode Pembayaran: {vaNumber}</strong> kepada kasir.</li>
                <li>Kasir akan mengonfirmasi detail pesanan dan total tagihan sebesar <strong>{totalAmount ? formatIdr(totalAmount) : "sesuai rincian"}</strong>.</li>
                <li>Lakukan pembayaran ke kasir secara tunai atau debit.</li>
                <li>Simpan struk pembayaran sebagai bukti transaksi resmi. Pesanan akan otomatis terverifikasi.</li>
              </ol>
            )}

            {/* 2. Panduan Khusus QRIS */}
            {isQris && (
              <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm text-[var(--text-2)] leading-relaxed">
                <li>Buka aplikasi mobile banking atau e-wallet pilihan Anda (BCA, Mandiri, BRI, GoPay, OVO, Dana, ShopeePay, dll).</li>
                <li>Pilih menu <strong>Scan QRIS</strong> atau <strong>Bayar</strong>.</li>
                <li>Arahkan kamera ke QR Code di atas (atau pilih gambar tangkapan layar / gambar unduhan QR dari galeri ponsel).</li>
                <li>Pastikan nama merchant penerima adalah <strong>FluencyHub</strong> dan total tagihan adalah <strong>{totalAmount ? formatIdr(totalAmount) : "sesuai rincian"}</strong>.</li>
                <li>Konfirmasi dan masukkan PIN transaksi Anda.</li>
                <li>Setelah berhasil, klik tombol <strong>Cek Status Pembayaran</strong> di bawah untuk mengakses kelas.</li>
              </ol>
            )}

            {/* 3. Panduan Khusus Virtual Account */}
            {isVA && (
              <div>
                <div className="flex gap-1.5 sm:gap-2 border-b border-[var(--border)] pb-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("mbanking")}
                    className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === "mbanking"
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)]"
                    }`}
                  >
                    m-Banking
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("atm")}
                    className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === "atm"
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)]"
                    }`}
                  >
                    ATM
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("ibanking")}
                    className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                      activeTab === "ibanking"
                        ? "bg-[var(--brand)] text-white"
                        : "bg-[var(--surface-2)] text-[var(--text-3)] hover:text-[var(--text)]"
                    }`}
                  >
                    i-Banking
                  </button>
                </div>

                {activeTab === "mbanking" && (
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-[var(--text-2)] leading-relaxed">
                    <li>Buka aplikasi m-Banking di ponsel Anda dan lakukan login.</li>
                    <li>Pilih menu <strong>Transfer</strong> &gt; <strong>Virtual Account</strong>.</li>
                    <li>Masukkan nomor Virtual Account: <strong className="font-mono">{vaNumber || "(Belum terbit)"}</strong>.</li>
                    <li>Periksa detail tagihan <strong>FluencyHub</strong> dan nominal {totalAmount ? formatIdr(totalAmount) : ""}.</li>
                    <li>Masukkan PIN m-Banking untuk menyelesaikan transaksi.</li>
                  </ol>
                )}

                {activeTab === "atm" && (
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-[var(--text-2)] leading-relaxed">
                    <li>Masukkan kartu ATM dan PIN Anda di mesin ATM.</li>
                    <li>Pilih menu <strong>Transaksi Lainnya</strong> &gt; <strong>Transfer</strong> &gt; <strong>ke Rekening Virtual Account</strong>.</li>
                    <li>Masukkan nomor Virtual Account: <strong className="font-mono">{vaNumber || "(Belum terbit)"}</strong>.</li>
                    <li>Pastikan data tagihan sudah sesuai, lalu pilih <strong>Benar / Ya</strong>.</li>
                    <li>Ambil struk ATM sebagai bukti transaksi pembayaran Anda.</li>
                  </ol>
                )}

                {activeTab === "ibanking" && (
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-[var(--text-2)] leading-relaxed">
                    <li>Login ke situs Internet Banking bank Anda.</li>
                    <li>Pilih menu <strong>Transfer Dana</strong> &gt; <strong>Transfer ke Virtual Account</strong>.</li>
                    <li>Masukkan nomor Virtual Account: <strong className="font-mono">{vaNumber}</strong>.</li>
                    <li>Konfirmasi transaksi menggunakan token / OTP Internet Banking Anda.</li>
                  </ol>
                )}
              </div>
            )}

            {/* 4. Panduan Khusus E-Wallet */}
            {isEWallet && (
              <ol className="list-decimal list-inside space-y-2 text-xs md:text-sm text-[var(--text-2)] leading-relaxed">
                <li>Buka notifikasi atau aplikasi <strong>{methodName}</strong> di ponsel Anda.</li>
                <li>Periksa detail pembayaran merchant <strong>FluencyHub</strong> dan nominal <strong>{totalAmount ? formatIdr(totalAmount) : ""}</strong>.</li>
                <li>Konfirmasi pembayaran dan masukkan PIN keamanan akun Anda.</li>
                <li>Setelah verifikasi selesai, klik tombol <strong>Cek Status Pembayaran</strong> di bawah ini.</li>
              </ol>
            )}

            {/* Tambahan instruksi database jika ada konten khusus */}
            {instructions && instructions.length > 0 && !isRetail && !isQris && !isVA && (
              <div className="mt-3 pt-3 border-t border-[var(--border)] space-y-2">
                {instructions.map((ins) => (
                  <div key={ins.id} className="text-xs text-[var(--text-2)]">
                    <p className="font-semibold text-[var(--text)] mb-1">{ins.title}</p>
                    <div className="instruction-html" dangerouslySetInnerHTML={{ __html: ins.content }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL QRIS FULL SCREEN */}
      {showFullQrModal && activeQr && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowFullQrModal(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowFullQrModal(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white flex items-center justify-center transition cursor-pointer"
              aria-label="Tutup modal"
            >
              ✕
            </button>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-3 py-1 text-xs font-bold shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              QRIS UKURAN PENUH
            </div>
            <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white mt-1">Scan QRIS</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Dukungan QRIS Nasional untuk semua e-wallet & m-banking</p>
            <div className="my-4 p-3 bg-white rounded-2xl border border-zinc-200 shadow-inner inline-block">
              <img src={activeQr} alt="QRIS Penuh" className="w-[260px] h-[260px] mx-auto block" />
            </div>
            {totalAmount ? (
              <p className="text-base font-extrabold text-zinc-900 dark:text-white mb-4">
                Total: {formatIdr(totalAmount)}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="flex-1 rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-black py-2.5 text-xs font-bold shadow-xs transition cursor-pointer"
              >
                {downloading ? "Mengunduh..." : "Simpan Gambar"}
              </button>
              <button
                type="button"
                onClick={() => setShowFullQrModal(false)}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 py-2.5 px-4 text-xs font-semibold hover:bg-zinc-100 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
