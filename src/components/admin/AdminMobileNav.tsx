"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import type { AdminNavGroup } from "@/components/admin/AdminSidebar";

export function AdminMobileNav({ base, groups }: { base: string; groups: AdminNavGroup[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close when pathname changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(false);
  }, [pathname]);

  // Prevent scrolling when drawer is open
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
              <Link href={base} className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <span className="flex h-6 w-6 items-center justify-center rounded-[var(--r)] bg-[var(--sidebar-active-admin)] text-[10px] font-extrabold text-white">
                  F
                </span>
                <span className="font-[family-name:var(--font-heading)] text-sm font-extrabold text-white">
                  Fluency<span className="text-[var(--sidebar-active-admin)]">Hub</span>
                </span>
              </Link>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            
            <nav className="flex-1 p-2 sidebar-nav">
              {groups.map((group) => (
                <div key={group.title}>
                  <p className="sidebar-group">{group.title}</p>
                  {group.items.map((item) => {
                    const exactOnly = item.href === base || item.href === `${base}/payments` || item.href === `${base}/cms`;
                    const active = exactOnly
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link key={item.href} href={item.href} className={`sidebar-item${active ? " active-a" : ""}`}>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
