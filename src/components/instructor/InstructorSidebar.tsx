"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminSignOut } from "@/components/admin/AdminSignOut";
import { LandingIcon } from "@/components/landing/LandingIcon";

const NAV = [
  { href: "/instructor", label: "Overview", exact: true, icon: "LayoutDashboard" },
  { href: "/instructor/courses", label: "My Courses", icon: "Video" },
  { href: "/instructor/curriculum", label: "Kurikulum", icon: "BookOpen" },
  { href: "/instructor/students", label: "Students", icon: "Users" },
  { href: "/instructor/analytics", label: "Analytics", icon: "MessageCircle" },
  { href: "/instructor/private-sessions", label: "Privat", icon: "Calendar" },
];

export function InstructorSidebar({
  name,
  email,
  avatarUrl,
  sharePct,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  sharePct: string;
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link href="/instructor" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-inst)] text-xs font-extrabold text-white">
            F
          </span>
          <span className="font-[family-name:var(--font-heading)] text-base font-extrabold text-white">
            Fluency<span className="text-[var(--sidebar-active-inst)]">Hub</span>
          </span>
        </Link>
      </div>
      <Link href="/instructor/profile" className="sidebar-profile hover:bg-white/5 transition-colors cursor-pointer block">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatarUrl || "https://i.pravatar.cc/80?img=15"} alt="" className="avatar avatar-ring-i h-9 w-9" />
          <div className="min-w-0">
            <p className="truncate font-[family-name:var(--font-heading)] text-xs font-bold text-white">{name}</p>
            <p className="text-[10px] font-medium text-[var(--sidebar-active-inst)]">Instructor · {sharePct}% Revenue</p>
            <p className="truncate text-[10px] text-zinc-500">{email}</p>
          </div>
        </div>
      </Link>
      <nav className="sidebar-nav">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`sidebar-item${active ? " active-i" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <AdminSignOut />
      </div>
    </aside>
  );
}

export function InstructorMobileNav({
  name,
  email,
  avatarUrl,
  sharePct,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  sharePct: string;
}) {
  const pathname = usePathname();

  return (
    <div className="admin-mobile-nav">
      <Link href="/instructor" className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-inst)] text-xs font-extrabold text-white">
          F
        </span>
      </Link>

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-md px-2 pb-safe pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] md:hidden">
        {NAV.map((m) => {
          const active = m.exact ? pathname === m.href : pathname === m.href || pathname.startsWith(`${m.href}/`);
          return (
            <Link
              key={m.href}
              href={m.href}
              className="group relative flex flex-1 flex-col items-center justify-center h-full rounded-2xl transition-all duration-300"
            >
              {active && (
                <span className="absolute inset-0 mx-auto my-auto h-12 w-14 rounded-2xl bg-indigo-50/70 scale-100 transition-transform animate-in zoom-in-75 duration-300" />
              )}
              <div className={`relative z-10 flex flex-col items-center gap-1 transition-transform duration-300 ${active ? "-translate-y-1 text-indigo-600" : "text-zinc-500"}`}>
                <LandingIcon name={m.icon} size={22} color="currentColor" className={active ? "drop-shadow-sm" : ""} />
                <span className={`text-[9px] sm:text-[10px] font-bold text-center leading-none ${active ? "opacity-100" : "opacity-70"}`}>{m.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
