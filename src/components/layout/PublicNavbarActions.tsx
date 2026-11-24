"use client";

import { useState } from "react";
import Link from "next/link";
import { ReadyCheckTrigger } from "@/components/landing/ReadyCheckTrigger";

const NAV_LINKS = [
  { href: "/#program", label: "Program" },
  { href: "/#ready-score", label: "Ready Score" },
  { href: "/#podcast", label: "Podcast" },
  { href: "/#konsultasi", label: "Konsultasi" },
  { href: "/#faq", label: "FAQ" },
];

export function PublicNavbarMobileMenu({
  isLoggedIn,
  hasDashboardAccess = false,
}: {
  isLoggedIn: boolean;
  hasDashboardAccess?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label={menuOpen ? "Tutup menu" : "Buka menu navigasi"}
        aria-expanded={menuOpen}
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] transition hover:bg-[#F5ECE3]"
      >
        {menuOpen ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {menuOpen && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-[#E6DED4] bg-white px-4 py-4 shadow-lg">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 text-[15px] font-semibold text-[#0B2559] transition hover:bg-[#FBF6F1] hover:text-[#C2530A]"
              >
                {item.label}
              </Link>
            ))}
          </div>
          {(!isLoggedIn || !hasDashboardAccess) && (
            <div className="mt-3 flex flex-col gap-2 border-t border-[#E6DED4] pt-3">
              {!isLoggedIn && (
                <Link
                  href="/auth/signin"
                  onClick={() => setMenuOpen(false)}
                  className="w-full rounded-xl border border-[#E6DED4] bg-[#FBF6F1] px-4 py-2.5 text-center text-sm font-bold text-[#0B2559]"
                >
                  Masuk
                </Link>
              )}
              <ReadyCheckTrigger
                label="Cek Ready Score gratis"
                isLoggedIn={isLoggedIn}
                onAfterOpen={() => setMenuOpen(false)}
                className="w-full cursor-pointer rounded-xl bg-[#C2530A] px-4 py-2.5 text-center text-sm font-bold text-white"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

