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

export function PaymentMethodLogo({
  src,
  name,
  code,
}: {
  src: string | null;
  name: string;
  code: string;
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

  return (
    <span className="relative inline-flex h-8 w-14 shrink-0 items-center justify-center">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={showRemote ? name : ""}
          referrerPolicy="no-referrer"
          className={showRemote ? "h-8 w-14 object-contain" : "hidden"}
          onLoad={() => setRemoteOk(true)}
          onError={() => setRemoteOk(false)}
        />
      ) : null}
      {showLocal ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={local!} alt={name} className="h-8 w-14 object-contain" />
      ) : null}
      {!showRemote && !showLocal ? (
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[var(--brand-50)] text-[10px] font-bold text-[var(--brand)]">
          {initial}
        </span>
      ) : null}
    </span>
  );
}
