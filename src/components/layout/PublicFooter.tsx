import Link from "next/link";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="2.75" y="2.75" width="18.5" height="18.5" rx="5.25" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.35" cy="6.65" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[17px] w-[17px]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.17 1.6 5.99L0 24l6.21-1.63a11.94 11.94 0 0 0 5.84 1.49h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.2-3.51-8.41zM12.06 21.84h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.22-3.69.97.98-3.59-.24-.37a9.87 9.87 0 0 1-1.52-5.28c0-5.46 4.45-9.9 9.91-9.9 2.65 0 5.13 1.03 7 2.9a9.84 9.84 0 0 1 2.9 7c0 5.47-4.45 9.87-9.92 9.87zm5.43-7.41c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.08-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

const PROGRAM_LINKS = [
  { label: "Ready to Speak", href: "/#program" },
  { label: "Ready for Work", href: "/#program" },
  { label: "Ready to Go", href: "/#program" },
  { label: "Ready for the World", href: "/#program" },
  { label: "Konsultasi Program", href: "/#konsultasi" },
] as const;

const OTHER_LINKS = [
  { label: "Katalog Kelas", href: "/programs" },
  { label: "Ready Score", href: "/#ready-score" },
  { label: "Panduan Brand v1.3", href: "/brand" },
  { label: "FAQ", href: "/#faq" },
] as const;

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    handle: "@englishready.media",
    href: "https://instagram.com/englishready.media",
    external: true,
    icon: InstagramIcon,
    badgeClass:
      "bg-[#E1306C]/15 text-[#FF6FA3] border-[#E1306C]/30 group-hover:bg-[#E1306C] group-hover:text-white group-hover:border-[#E1306C]",
  },
  {
    name: "TikTok",
    handle: "@englishready.media",
    href: "https://www.tiktok.com/@englishready.media",
    external: true,
    icon: TikTokIcon,
    badgeClass:
      "bg-white/10 text-white border-white/20 group-hover:bg-white group-hover:text-[#0B2559] group-hover:border-white",
  },
  {
    name: "YouTube",
    handle: "@englishready",
    href: "https://www.youtube.com/@englishready",
    external: true,
    icon: YouTubeIcon,
    badgeClass:
      "bg-[#FF0000]/15 text-[#FF6666] border-[#FF0000]/30 group-hover:bg-[#FF0000] group-hover:text-white group-hover:border-[#FF0000]",
  },
  {
    name: "WhatsApp Channel",
    handle: "Info & Konsultasi",
    href: "/#konsultasi",
    external: false,
    icon: WhatsAppIcon,
    badgeClass:
      "bg-[#25D366]/15 text-[#4ADE80] border-[#25D366]/30 group-hover:bg-[#25D366] group-hover:text-[#0B2559] group-hover:border-[#25D366]",
  },
] as const;

export function PublicFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#0B2559] text-white print:hidden">
      {/* Subtle Top Hairline & Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0073F5]/60 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -right-24 h-64 w-64 rounded-full bg-[#0073F5]/12 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -left-24 h-64 w-64 rounded-full bg-[#F26A12]/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1200px] px-4 pt-12 pb-8 sm:px-6 lg:pt-14">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand Column */}
          <div className="flex flex-col gap-3.5 sm:col-span-2 lg:col-span-4 lg:pr-4">
            <Link
              href="/"
              aria-label="English Ready, beranda"
              className="inline-flex w-fit items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <EnglishReadyLogo height={36} mode="dark" />
            </Link>

            <p className="font-[family-name:var(--font-heading)] text-[15px] font-extrabold tracking-tight text-white">
              Speak. Connect. Contribute.
            </p>

            <p className="max-w-sm text-[13px] leading-relaxed text-[#C5D2E8]">
              English Ready Indonesia — Program kesiapan bahasa Inggris untuk kerja, studi, dan
              pergaulan global.
            </p>

            <div className="pt-1">
              <Link
                href="/#konsultasi"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2 text-xs font-bold text-white transition hover:border-[#F26A12]/60 hover:bg-[#F26A12] hover:text-white"
              >
                <span>Konsultasi Gratis</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Program Column */}
          <div className="flex flex-col gap-3 lg:col-span-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8FB4F8]">
              Program
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {PROGRAM_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-[#D5DDEE] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Lainnya Column */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8FB4F8]">
              Lainnya
            </h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              {OTHER_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="inline-flex items-center text-[#D5DDEE] transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Media Column with Logos */}
          <div className="flex flex-col gap-3 sm:col-span-2 lg:col-span-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8FB4F8]">
              Ikuti Kami
            </h3>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;
                const inner = (
                  <>
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${social.badgeClass}`}
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-white leading-tight group-hover:text-white">
                        {social.name}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-[#A9BCDE] leading-tight group-hover:text-[#D5DDEE]">
                        {social.handle}
                      </span>
                    </span>
                  </>
                );

                return (
                  <li key={social.name}>
                    {social.external ? (
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${social.name} ${social.handle}`}
                        className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/6"
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        href={social.href}
                        aria-label={`${social.name} — ${social.handle}`}
                        className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/6"
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Legal Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-[#A9BCDE] sm:flex-row">
          <p className="m-0 text-center sm:text-left">
            &copy; 2026 English Ready Indonesia. Seluruh hak cipta dilindungi.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            <Link href="/#faq" className="transition-colors hover:text-white">
              Kebijakan Privasi
            </Link>
            <span aria-hidden="true" className="text-white/20">
              &bull;
            </span>
            <Link href="/#faq" className="transition-colors hover:text-white">
              Syarat &amp; Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
