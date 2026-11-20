import React from "react";

export interface EnglishReadyLogoProps {
  variant?: "horizontal" | "vertical" | "icon" | "wordmark" | "podcast" | "app-icon" | "avatar";
  mode?: "light" | "dark";
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  height?: number;
  withTagline?: boolean;
}

/**
 * Sistem Logo English Ready — v1.3 Official Masterbrand
 * - Icon: Balon chat Biru Ready (#0073F5) + mikrofon Navy (#0B2559) + badge centang Oranye (#F26A12)
 * - Wordmark Light: "English" Navy (#0B2559) + "Ready" Biru Ready (#0073F5)
 * - Wordmark Dark (di latar Navy #0B2559): "English" Putih (#FFFFFF) + "Ready" Biru Terang (#52A8FF)
 * - Sub-brand: Podcast (badge navy pill "PODCAST")
 * - Ikon App & Avatar: Squircle / Circular container
 */
export function EnglishReadyLogo({
  variant = "horizontal",
  mode = "light",
  className = "",
  iconClassName = "",
  textClassName = "",
  height = 36,
  withTagline = false,
}: EnglishReadyLogoProps) {
  const iconSrc = "/brand/logo-icon.svg";
  const wordmarkSrc =
    mode === "dark" ? "/brand/logo-wordmark-dark.svg" : "/brand/logo-wordmark.svg";

  if (variant === "icon") {
    return (
      <div className={`relative inline-flex shrink-0 items-center justify-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt="English Ready"
          style={{ height: `${height}px`, width: `${height}px` }}
          className={`block object-contain ${iconClassName}`}
        />
      </div>
    );
  }

  if (variant === "app-icon") {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden ${className}`}
        style={{ width: `${height}px`, height: `${height}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt="English Ready App Icon"
          style={{ height: `${Math.round(height * 0.72)}px`, width: `${Math.round(height * 0.72)}px` }}
          className={`block object-contain ${iconClassName}`}
        />
      </div>
    );
  }

  if (variant === "avatar") {
    return (
      <div
        className={`relative inline-flex shrink-0 items-center justify-center bg-white rounded-full shadow-sm border border-slate-200/80 overflow-hidden ${className}`}
        style={{ width: `${height}px`, height: `${height}px` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt="English Ready Avatar"
          style={{ height: `${Math.round(height * 0.72)}px`, width: `${Math.round(height * 0.72)}px` }}
          className={`block object-contain ${iconClassName}`}
        />
      </div>
    );
  }

  if (variant === "wordmark") {
    return (
      <div className={`relative inline-flex shrink-0 items-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wordmarkSrc}
          alt="English Ready"
          style={{ height: `${height}px`, width: "auto" }}
          className={`block object-contain ${textClassName}`}
        />
      </div>
    );
  }

  if (variant === "podcast") {
    return (
      <div className={`inline-flex flex-col items-center text-center gap-2 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          style={{ height: `${Math.round(height * 1.35)}px`, width: `${Math.round(height * 1.35)}px` }}
          className={`block object-contain ${iconClassName}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wordmarkSrc}
          alt="English Ready"
          style={{ height: `${height}px`, width: "auto" }}
          className={`block object-contain ${textClassName}`}
        />
        <div
          className={`inline-flex items-center justify-center px-4 py-0.5 rounded-full text-[11px] font-black tracking-[0.22em] uppercase ${
            mode === "dark" ? "bg-white text-[#0B2559]" : "bg-[#0B2559] text-white"
          }`}
        >
          PODCAST
        </div>
      </div>
    );
  }

  if (variant === "vertical") {
    return (
      <div className={`inline-flex flex-col items-center text-center gap-2 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          style={{ height: `${Math.round(height * 1.4)}px`, width: `${Math.round(height * 1.4)}px` }}
          className={`block object-contain ${iconClassName}`}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={wordmarkSrc}
          alt="English Ready"
          style={{ height: `${height}px`, width: "auto" }}
          className={`block object-contain ${textClassName}`}
        />
        {withTagline && (
          <div
            className={`text-xs font-bold leading-snug tracking-tight ${
              mode === "dark" ? "text-[#D5DDEE]" : "text-[#0B2559]"
            }`}
          >
            <div>Speak. Connect.</div>
            <div>Contribute.</div>
          </div>
        )}
      </div>
    );
  }

  // Default: horizontal lockup (v1.3 icon + stacked "English / Ready" wordmark)
  return (
    <div className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={iconSrc}
        alt=""
        style={{ height: `${height}px`, width: `${height}px` }}
        className={`block shrink-0 object-contain ${iconClassName}`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={wordmarkSrc}
        alt="English Ready"
        style={{ height: `${height + 2}px`, width: "auto" }}
        className={`block object-contain ${textClassName}`}
      />
    </div>
  );
}

export default EnglishReadyLogo;
