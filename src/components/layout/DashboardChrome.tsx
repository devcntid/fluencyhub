"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

export function DashboardChrome({
  user,
  unlockedExamCourseIds = [],
  liveZoomCourseIds = [],
  hasPrivateSessionAccess = false,
  defaultCourseId,
  children,
}: {
  user?: { name?: string | null; image?: string | null; role?: string | null };
  unlockedExamCourseIds?: number[];
  liveZoomCourseIds?: number[];
  hasPrivateSessionAccess?: boolean;
  defaultCourseId?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const c = searchParams.get("c");
  const suffix = c ? `?c=${c}` : "";

  const [open, setOpen] = useState(false);
  const player = /\/dashboard\/courses\/\d+/.test(pathname);

  const isClassroom =
    pathname.startsWith("/dashboard/classroom") ||
    pathname.startsWith("/dashboard/videos") ||
    pathname.startsWith("/dashboard/live") ||
    pathname.startsWith("/dashboard/resources");

  const [isClassroomExpanded, setIsClassroomExpanded] = useState(isClassroom);
  
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

  useEffect(() => {
    if (isClassroom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsClassroomExpanded(true);
    }
  }, [isClassroom]);

  if (player) return <>{children}</>;

  const currentTab = searchParams.get("tab") || "videos";
  const cParam = c ? `&c=${c}` : "&c=all";

  const effectiveCourseId = c && c !== "all" ? Number(c) : null;
  const isExamUnlocked = effectiveCourseId
    ? unlockedExamCourseIds.includes(effectiveCourseId)
    : unlockedExamCourseIds.length > 0;
  const isLiveZoomAllowed = effectiveCourseId
    ? liveZoomCourseIds.includes(effectiveCourseId)
    : liveZoomCourseIds.length > 0;

  const classroomSubItems = [
    { id: "videos", label: "Video Lessons", icon: "PlayCircle", href: `/dashboard/classroom?tab=videos${cParam}` },
    ...(isLiveZoomAllowed
      ? [{ id: "live", label: "Live Zoom", icon: "Video", href: `/dashboard/classroom?tab=live${cParam}` }]
      : []),
    { id: "resources", label: "Resources", icon: "BookOpen", href: `/dashboard/classroom?tab=resources${cParam}` },
    {
      id: "exam",
      label: "Final Exam",
      icon: "Award",
      isLocked: !isExamUnlocked,
      href: `/dashboard/classroom?tab=exam${cParam}`,
    },
  ];

  const menu = [
    { id: "dashboard", icon: "LayoutDashboard", label: "Dashboard", shortLabel: "Home", href: "/dashboard" },
    { id: "classroom", icon: "GraduationCap", label: "Classroom", shortLabel: "Kelas", href: "/dashboard/classroom?c=all" },
    { id: "speaking", icon: "Bot", label: "AI Speaking", shortLabel: "Speaking", href: "/dashboard/speaking" },
    { id: "private", icon: "Calendar", label: "Private Sessions", shortLabel: "Private", href: `/dashboard/private-sessions${suffix}` },
    { id: "profile", icon: "User", label: "My Profile", shortLabel: "Profil", href: "/dashboard/profile" },
  ];

  return (
    <div className="min-h-screen bg-[#FBF6F1]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#0B2559] px-4 py-6 text-slate-200 md:flex">
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center px-2">
          <EnglishReadyLogo height={32} mode="dark" />
        </Link>

        {/* Profile Sidebar */}
        <Link href="/dashboard/profile" className="mb-6 flex items-center gap-3 px-2 text-left hover:opacity-80 transition">
          {user?.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.image} alt={user.name || "User"} className="h-10 w-10 rounded-full border-2 border-white/20 object-cover" />
            </>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 text-sm font-bold text-white">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="truncate text-sm font-bold text-white">{user?.name}</span>
            <span className="truncate text-xs font-medium text-[#AFC4EA]">English Ready Member</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto no-scrollbar">
          {menu.map((m) => {
            const basePath = m.href.split("?")[0];
            const isActive =
              m.id === "classroom"
                ? isClassroom
                : m.id === "dashboard"
                ? pathname === basePath
                : m.id === "speaking"
                ? pathname.startsWith("/dashboard/speaking") || pathname.startsWith("/dashboard/progress")
                : pathname.startsWith(basePath);

            if (m.id === "classroom") {
              return (
                <div key="classroom-nav" className="flex flex-col">
                  <div
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition ${
                      isClassroom
                        ? "bg-[var(--brand)] text-white shadow-sm"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                    }`}
                  >
                    <Link
                      href={m.href}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      onClick={() => {
                        if (isClassroom) {
                          setIsClassroomExpanded((prev) => !prev);
                        } else {
                          setIsClassroomExpanded(true);
                        }
                      }}
                    >
                      <LandingIcon name="GraduationCap" color="currentColor" />
                      <span className="truncate">{m.label}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsClassroomExpanded((prev) => !prev);
                      }}
                      className="p-1 -mr-1 rounded-lg hover:bg-white/10 active:scale-95 transition text-current cursor-pointer"
                      aria-label="Toggle submenu"
                    >
                      <LandingIcon
                        name={isClassroomExpanded ? "ChevronDown" : "ChevronRight"}
                        size={14}
                        color="currentColor"
                      />
                    </button>
                  </div>

                  {/* Submenu for Ruang Kelas */}
                  {isClassroomExpanded && (
                    <div className="mt-1 ml-4 pl-3 border-l-2 border-white/20 flex flex-col gap-1 py-1 animate-in fade-in slide-in-from-top-1 duration-200">
                      {classroomSubItems.map((sub) => {
                        const isSubActive = currentTab === sub.id;
                        return (
                          <Link
                            key={sub.id}
                            href={sub.href}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition ${
                              isSubActive
                                ? "bg-[#0073F5]/25 text-white font-bold border border-[#0073F5]/45 shadow-2xs"
                                : sub.isLocked
                                ? "text-white/50 hover:bg-white/8 hover:text-white/80"
                                : "text-white/75 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <LandingIcon name={sub.icon} size={14} color="currentColor" />
                              <span className="truncate">{sub.label}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={m.id}
                href={m.href}
                className={`flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                  isActive ? "bg-white text-[#0B2559] font-bold shadow-xs" : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LandingIcon name={m.icon} color="currentColor" />
                  <span className="truncate">{m.label}</span>
                </div>
                {m.id === "private" && !hasPrivateSessionAccess && (
                  <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/30 shrink-0">
                    <LandingIcon name="Lock" size={10} color="currentColor" />
                    <span>VIP</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col md:pl-64">
        {/* Topbar */}
        <div className="sticky top-0 z-40 flex h-[72px] items-center justify-between border-b border-[#E6DED4] bg-[#FBF6F1]/95 px-4 backdrop-blur-md md:justify-end md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Link href="/dashboard" className="flex items-center ml-2">
              <EnglishReadyLogo height={28} mode="light" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <button className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 relative">
              <LandingIcon name="Bell" color="currentColor" />
            </button>
            {user && <ProfileDropdown user={user} />}
          </div>
        </div>

        <div className="pb-16 sm:pb-20 md:pb-0">
          {children}
        </div>

        {/* Bottom Navigation (Mobile & iPad < 768px) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 sm:h-20 items-center justify-around border-t border-[#E6DED4] bg-[#FBF6F1]/95 backdrop-blur-md px-1 sm:px-2 pb-safe shadow-[0_-4px_24px_rgba(11,37,89,0.06)] md:hidden">
          {menu.map((m) => {
            const basePath = m.href.split('?')[0];
            const isClassroom = m.id === "classroom" && (
              pathname.startsWith("/dashboard/classroom") ||
              pathname.startsWith("/dashboard/videos") ||
              pathname.startsWith("/dashboard/live") ||
              pathname.startsWith("/dashboard/resources")
            );
            const isActive =
              m.id === "dashboard"
                ? pathname === basePath
                : m.id === "speaking"
                ? pathname.startsWith("/dashboard/speaking") || pathname.startsWith("/dashboard/progress")
                : isClassroom || pathname.startsWith(basePath);
            return (
              <Link
                key={m.id}
                href={m.href}
                className="group relative flex flex-1 flex-col items-center justify-center h-full rounded-xl transition-all duration-300 min-w-0"
              >
                {isActive && (
                  <span className="absolute inset-x-1.5 inset-y-1.5 rounded-xl bg-[#0B2559]/10 scale-100 transition-transform animate-in zoom-in-75 duration-300" />
                )}
                <div className={`relative z-10 flex flex-col items-center gap-0.5 transition-transform duration-300 ${isActive ? "-translate-y-0.5 text-[#0B2559]" : "text-zinc-500"}`}>
                  <LandingIcon name={m.icon} size={19} color="currentColor" className={isActive ? "drop-shadow-xs" : ""} />
                  <span className={`text-[10px] tracking-tight font-bold truncate max-w-[58px] text-center ${isActive ? "opacity-100 font-extrabold" : "opacity-75"}`}>
                    {m.shortLabel || m.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
