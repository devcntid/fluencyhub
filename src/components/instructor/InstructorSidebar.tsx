"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

const NAV = [
  { href: "/instructor", label: "Overview", exact: true },
  { href: "/instructor/courses", label: "My Courses" },
  { href: "/instructor/curriculum", label: "Kurikulum" },
  { href: "/instructor/students", label: "Students" },
  { href: "/instructor/analytics", label: "Analytics" },
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
      <div className="sidebar-profile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl || "https://i.pravatar.cc/80?img=15"} alt="" className="avatar avatar-ring-i h-9 w-9" />
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-heading)] text-xs font-bold text-white">{name}</p>
          <p className="text-[10px] font-medium text-[var(--sidebar-active-inst)]">Instructor · {sharePct}% Revenue</p>
          <p className="truncate text-[10px] text-zinc-500">{email}</p>
        </div>
      </div>
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
      <button 
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative flex w-[260px] flex-col bg-[var(--sidebar)] h-full overflow-y-auto shadow-2xl animate-in slide-in-from-left-full duration-200">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <Link href="/instructor" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <span className="flex h-6 w-6 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-inst)] text-[10px] font-extrabold text-white">
                  F
                </span>
                <span className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-white">
                  Fluency<span className="text-[var(--sidebar-active-inst)]">Hub</span>
                </span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <div className="sidebar-profile border-b border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl || "https://i.pravatar.cc/80?img=15"} alt="" className="avatar avatar-ring-i h-9 w-9" />
              <div className="min-w-0">
                <p className="truncate font-[family-name:var(--font-heading)] text-xs font-bold text-white">{name}</p>
                <p className="text-[10px] font-medium text-[var(--sidebar-active-inst)]">Instructor · {sharePct}% Revenue</p>
                <p className="truncate text-[10px] text-zinc-500">{email}</p>
              </div>
            </div>

            <nav className="flex-1 p-2 sidebar-nav">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link key={item.href} href={item.href} className={`sidebar-item${active ? " active-i" : ""}`}>
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-top border-white/10">
              <AdminSignOut />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
