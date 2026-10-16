"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminSignOut } from "@/components/admin/AdminSignOut";
import { LandingIcon } from "@/components/landing/LandingIcon";

const NAV = [
  { href: "/instructor", label: "Dashboard", exact: true, icon: "LayoutDashboard" },
  { href: "/instructor/courses", label: "My Courses", icon: "Video" },
  { href: "/instructor/curriculum", label: "Curriculum", icon: "BookOpen" },
  { href: "/instructor/students", label: "Students", icon: "Users" },
  { href: "/instructor/private-sessions", label: "Private Sessions", icon: "Calendar" },
  { href: "/instructor/profile", label: "Profile & Settings", icon: "User" },
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
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/instructor/curriculum" && pathname.startsWith("/instructor/exams"));
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="admin-mobile-nav">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition active:scale-95 cursor-pointer"
          aria-label="Open Menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        </button>

        <Link href="/instructor" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-inst)] text-xs font-extrabold text-white">
            F
          </span>
        </Link>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex w-[280px] max-w-[80vw] flex-col bg-[var(--sidebar)] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-left-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Link href="/instructor" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-inst)] text-xs font-extrabold text-white">
                  F
                </span>
                <span className="font-[family-name:var(--font-heading)] text-base font-extrabold text-white">
                  Fluency<span className="text-[var(--sidebar-active-inst)]">Hub</span>
                </span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white p-1 rounded-md cursor-pointer" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Link href="/instructor/profile" onClick={() => setOpen(false)} className="p-4 border-b border-white/10 flex items-center gap-3 hover:bg-white/5 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl || "https://i.pravatar.cc/80?img=15"} alt="" className="avatar avatar-ring-i h-9 w-9 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-heading)] text-xs font-bold text-white">{name}</p>
                <p className="text-[10px] font-medium text-[var(--sidebar-active-inst)]">Instructor · {sharePct}% Revenue</p>
                <p className="truncate text-[10px] text-zinc-400">{email}</p>
              </div>
            </Link>

            <nav className="flex-1 p-3 flex flex-col gap-1.5 overflow-y-auto">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`) ||
                    (item.href === "/instructor/curriculum" && pathname.startsWith("/instructor/exams"));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                      active
                        ? "bg-[rgba(16,185,129,0.15)] text-[#6ee7b7] font-bold border-l-4 border-[#10b981]"
                        : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <LandingIcon name={item.icon} size={18} color="currentColor" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10">
              <AdminSignOut />
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
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
