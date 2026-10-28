"use client";

import { useEffect, useState } from "react";

function fallbackSvgPath(code: string): string | null {
  const c = code.toUpperCase();
  const rules: Array<[string, string]> = [
    ["QRIS", "qris"],
    ["SHOPEE", "shopee"],
    ["LINKAJA", "linkaja"],
    ["GOOGLEPAY", "gpay"],
    ["CREDITCARD", "card"],
    ["ALFAMART", "alfamart"],
    ["INDOMARET", "indomaret"],
    ["GOPAY", "gopay"],
    ["DANA", "dana"],
    ["OVO", "ovo"],
    ["MANDIRI", "mandiri"],
    ["PERMATA", "permata"],
    ["DANAMON", "danamon"],
    ["CIMB", "cimb"],
    ["MUAMALAT", "bsi"],
    ["BSI", "bsi"],
    ["BJB", "bjb"],
    ["BRI", "bri"],
    ["BNI", "bni"],
    ["BNC", "bca"],
    ["BCA", "bca"],
  ];
  for (const [needle, file] of rules) {
    if (c.includes(needle)) return `/payments/${file}.svg`;
  }
  return null;
}

type LogoSize = "xs" | "sm" | "md" | "lg";

export function PaymentMethodLogo({
  src,
  name,
  code,
  size = "md",
  className = "",
}: {
  src: string | null;
  name: string;
  code: string;
  size?: LogoSize;
  className?: string;
}) {
  const local = fallbackSvgPath(code);
  const [remoteOk, setRemoteOk] = useState(false);
  const initial = name.slice(0, 2).toUpperCase();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRemoteOk(false);
  }, [src]);

  const showRemote = Boolean(src) && remoteOk;
  const showLocal = !showRemote && Boolean(local);

  const sizeClasses = {
    xs: {
      wrapper: "h-4 w-8",
      img: "h-4 w-8 object-contain",
      fallback: "h-4 w-4 text-[9px]",
    },
    sm: {
      wrapper: "h-6 w-12",
      img: "h-6 w-12 object-contain",
      fallback: "h-6 w-6 text-[10px]",
    },
    md: {
      wrapper: "h-8 w-14",
      img: "h-8 w-14 object-contain",
      fallback: "h-8 w-8 text-[10px]",
    },
    lg: {
      wrapper: "h-10 w-20",
      img: "h-10 w-20 object-contain",
      fallback: "h-10 w-10 text-xs",
    },
  }[size];

  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center ${sizeClasses.wrapper} ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={showRemote ? name : ""}
          referrerPolicy="no-referrer"
          className={showRemote ? sizeClasses.img : "hidden"}
          onLoad={() => setRemoteOk(true)}
          onError={() => setRemoteOk(false)}
        />
      ) : null}
      {showLocal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={local!} alt={name} className={sizeClasses.img} />
      ) : null}
      {!showRemote && !showLocal ? (
        <span className={`flex items-center justify-center rounded-md bg-[var(--brand-50)] font-bold text-[var(--brand)] ${sizeClasses.fallback}`}>
          {initial}
        </span>
      ) : null}
    </span>
  );
}
