export function QrCodeImage({
  src,
  alt = "QRIS payment",
  className = "",
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`mx-auto aspect-square w-full h-auto max-w-full rounded-xl border border-zinc-200 bg-white p-2 object-contain shadow-2xs transition-all ${className}`}
    />
  );
}
