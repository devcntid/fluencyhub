import Link from "next/link";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

export function PublicFooter() {
  return (
    <footer className="bg-[#0B2559] text-white print:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-8 px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <EnglishReadyLogo height={36} mode="dark" />
          </div>
          <div className="text-base font-bold">Speak. Connect. Contribute.</div>
          <div className="max-w-xs text-xs leading-relaxed text-[#D5DDEE]">
            English Ready Indonesia — Program kesiapan bahasa Inggris untuk kerja, studi, dan pergaulan global.
          </div>
          <div className="text-sm text-[#D5DDEE]">© 2026 English Ready Indonesia</div>
        </div>

        <div className="flex flex-wrap gap-10 text-[15px] sm:gap-12">
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-white">Program</span>
            <Link href="/#program" className="text-[#D5DDEE] transition-colors hover:text-white">
              Ready to Speak
            </Link>
            <Link href="/#program" className="text-[#D5DDEE] transition-colors hover:text-white">
              Ready for Work
            </Link>
            <Link href="/#program" className="text-[#D5DDEE] transition-colors hover:text-white">
              Ready to Go
            </Link>
            <Link href="/#program" className="text-[#D5DDEE] transition-colors hover:text-white">
              Ready for the World
            </Link>
            <Link href="/#konsultasi" className="text-[#D5DDEE] transition-colors hover:text-white">
              Konsultasi Program
            </Link>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-white">Ikuti kami</span>
            <a
              href="https://instagram.com/englishready.media"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D5DDEE] transition-colors hover:text-white"
            >
              Instagram @englishready.media
            </a>
            <span className="text-[#D5DDEE]">TikTok @englishready.media</span>
            <span className="text-[#D5DDEE]">YouTube @englishready</span>
            <span className="text-[#D5DDEE]">WhatsApp Channel</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-white">Lainnya</span>
            <Link href="/programs" className="text-[#D5DDEE] transition-colors hover:text-white">
              Katalog Kelas
            </Link>
            <Link href="/brand" className="text-[#D5DDEE] transition-colors hover:text-white">
              Panduan Brand v1.3
            </Link>
            <Link href="/#faq" className="text-[#D5DDEE] transition-colors hover:text-white">
              FAQ
            </Link>
            <Link href="/#faq" className="text-[#D5DDEE] transition-colors hover:text-white">
              Kebijakan privasi
            </Link>
            <Link href="/#faq" className="text-[#D5DDEE] transition-colors hover:text-white">
              Syarat &amp; ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
