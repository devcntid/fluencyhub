/* eslint-disable @next/next/no-img-element */
 
"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

export function ProfileDropdown({
  user,
  profileUrl = "/dashboard/profile",
  hasDashboardAccess = false,
}: {
  user: { name?: string | null; image?: string | null; role?: string | null };
  profileUrl?: string;
  hasDashboardAccess?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  console.log("ProfileDropdown rendered with hasDashboardAccess:", hasDashboardAccess, "for user:", user.name, "role:", user.role);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="block h-10 w-10 overflow-hidden rounded-full border-2 border-[var(--brand-100)] transition hover:border-[var(--brand)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-offset-2"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || "User Profile"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--brand)] text-sm font-bold text-white">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-4 py-3 border-b border-zinc-100">
            <p className="truncate text-sm font-medium text-zinc-900">{user.name}</p>
          </div>
          <div className="py-1">
            {hasDashboardAccess && (
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Dashboard
              </Link>
            )}
            {pathname !== "/" && (
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                Halaman Utama
              </Link>
            )}
            <Link
              href={profileUrl}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Profil
            </Link>
            <Link
              href="/transactions"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Riwayat Transaksi
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
