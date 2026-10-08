"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";

export function DashboardChrome({
  user,
  children,
}: {
  user?: { name?: string | null; image?: string | null; role?: string | null };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const c = searchParams.get("c");
  const suffix = c ? `?c=${c}` : "";

  const [open, setOpen] = useState(false);
  const player = /\/dashboard\/courses\/\d+/.test(pathname);
  
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

  if (player) return <>{children}</>;

  const menu = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Dashboard", href: "/dashboard" },
    { id: "videos", icon: "Play", label: "Videos", href: `/dashboard/videos${suffix}` },
    { id: "live", icon: "Video", label: "Live", href: `/dashboard/live${suffix}` },
    { id: "resources", icon: "BookOpen", label: "Resources", href: `/dashboard/resources${suffix}` },
    { id: "private", icon: "Calendar", label: "Sesi Privat", href: `/dashboard/private-sessions${suffix}` },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0f1117] px-4 py-6 text-zinc-400 md:flex">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center gap-2 px-2 text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] bg-[var(--brand)]">
            <LandingIcon name="MessageCircle" color="#fff" />
          </span>
          <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold tracking-tight">
            Fluency<span className="text-[var(--brand)]">Hub</span>
          </span>
        </Link>

        {/* Profile Sidebar */}
        <Link href="/dashboard/profile" className="mb-8 flex items-center gap-3 px-2 text-left hover:opacity-80 transition">
          {user?.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.image} alt={user.name || "User"} className="h-10 w-10 rounded-full border-2 border-zinc-700 object-cover" />
            </>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800 text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-bold text-white">{user?.name}</span>
            <span className="truncate text-xs font-medium text-blue-500">Hybrid Pro Member</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1">
          {menu.map((m) => {
            const basePath = m.href.split('?')[0];
            const isActive = m.id === "dashboard" ? pathname === basePath : pathname.startsWith(basePath);
            return (
              <Link
                key={m.id}
                href={m.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-[var(--brand)] text-white" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                }`}
              >
                <LandingIcon name={m.icon} color="currentColor" />
                {m.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64">
        {/* Topbar */}
        <div className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-zinc-200 bg-white/80 px-4 backdrop-blur-md md:justify-end md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold ml-2">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--brand)]">
                <LandingIcon name="MessageCircle" color="#fff" />
              </span>
              FluencyHub
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 relative">
              <LandingIcon name="Bell" color="currentColor" />
            </button>
            {user && <ProfileDropdown user={user} />}
          </div>
        </div>

        <div className="pb-24 md:pb-0">
          {children}
        </div>

        {/* Bottom Navigation (Mobile & iPad < 768px) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-20 items-center justify-around border-t border-zinc-200 bg-white/95 backdrop-blur-md px-2 pb-safe pt-2 shadow-[0_-4px_24px_rgba(0,0,0,0.05)] md:hidden">
          {menu.map((m) => {
            const basePath = m.href.split('?')[0];
            const isActive = m.id === "dashboard" ? pathname === basePath : pathname.startsWith(basePath);
            return (
              <Link
                key={m.id}
                href={m.href}
                className="group relative flex flex-1 flex-col items-center justify-center h-full rounded-2xl transition-all duration-300"
              >
                {isActive && (
                  <span className="absolute inset-0 mx-auto my-auto h-12 w-14 rounded-2xl bg-blue-50/70 scale-100 transition-transform animate-in zoom-in-75 duration-300" />
                )}
                <div className={`relative z-10 flex flex-col items-center gap-1 transition-transform duration-300 ${isActive ? "-translate-y-1 text-[var(--brand)]" : "text-zinc-500"}`}>
                  <LandingIcon name={m.icon} size={22} color="currentColor" className={isActive ? "drop-shadow-sm" : ""} />
                  <span className={`text-[10px] font-bold ${isActive ? "opacity-100" : "opacity-70"}`}>{m.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
