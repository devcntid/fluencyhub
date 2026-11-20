"use client";

import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function ClassroomClientTabs({
  currentTab,
  courseId,
  hasExam,
  isCertified,
  isExamUnlocked = false,
  hasLiveZoom = true,
  videosCount,
  liveCount,
  resourcesCount,
}: {
  currentTab: string;
  courseId?: number | "all";
  hasExam?: boolean;
  isCertified?: boolean;
  isExamUnlocked?: boolean;
  hasLiveZoom?: boolean;
  videosCount?: number;
  liveCount?: number;
  resourcesCount?: number;
}) {
  void hasExam;
  void isExamUnlocked;
  const cParam = courseId ? `&c=${courseId}` : "";

  const tabs: {
    id: string;
    label: string;
    shortLabel: string;
    icon: string;
    href: string;
    count?: number;
  }[] = [
    {
      id: "videos",
      label: "Video Lessons",
      shortLabel: "Video",
      icon: "PlayCircle",
      href: `/dashboard/classroom?tab=videos${cParam}`,
      count: videosCount,
    },
    ...(hasLiveZoom
      ? [
          {
            id: "live",
            label: "Live Zoom",
            shortLabel: "Live Zoom",
            icon: "Video",
            href: `/dashboard/classroom?tab=live${cParam}`,
            count: liveCount,
          },
        ]
      : []),
    {
      id: "resources",
      label: "Resources",
      shortLabel: "Materi",
      icon: "BookOpen",
      href: `/dashboard/classroom?tab=resources${cParam}`,
      count: resourcesCount,
    },
    {
      id: "exam",
      label: isCertified ? "Certificate & Exam" : "Final Exam",
      shortLabel: isCertified ? "Sertifikat" : "Final Exam",
      icon: "Award",
      href: `/dashboard/classroom?tab=exam${cParam}`,
    },
  ];

  const mobileGridCols = tabs.length === 3 ? "grid-cols-3" : "grid-cols-2";

  return (
    <nav
      aria-label="Navigasi Ruang Kelas"
      className={`grid ${mobileGridCols} sm:flex sm:flex-wrap lg:flex-nowrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FBF6F1] border border-[#E6DED4]`}
    >
      {tabs.map((t) => {
        const isActive = currentTab === t.id;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "bg-[#0B2559] text-white shadow-sm"
                : "text-zinc-600 hover:text-[#0B2559] hover:bg-white/80"
            }`}
          >
            <LandingIcon name={t.icon} size={15} color="currentColor" />
            <span className="sm:hidden">{t.shortLabel}</span>
            <span className="hidden sm:inline">{t.label}</span>
            {typeof t.count === "number" && (
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-white text-zinc-500 border border-[#E6DED4]"
                }`}
              >
                {t.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
