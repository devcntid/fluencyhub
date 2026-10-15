"use client";

import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function ClassroomClientTabs({
  currentTab,
  courseId,
  hasExam,
  isCertified,
  isExamUnlocked = false,
}: {
  currentTab: string;
  courseId?: number | "all";
  hasExam?: boolean;
  isCertified?: boolean;
  isExamUnlocked?: boolean;
}) {
  const cParam = courseId ? `&c=${courseId}` : "";

  const tabs = [
    {
      id: "videos",
      label: "Video Lessons",
      icon: "Play",
      href: `/dashboard/classroom?tab=videos${cParam}`,
    },
    {
      id: "live",
      label: "Live Zoom",
      icon: "Video",
      href: `/dashboard/classroom?tab=live${cParam}`,
    },
    {
      id: "resources",
      label: "Resources",
      icon: "BookOpen",
      href: `/dashboard/classroom?tab=resources${cParam}`,
    },
    ...(isExamUnlocked
      ? [
          {
            id: "exam",
            label: isCertified ? "Certificate & Exam" : "Final Exam",
            icon: "Award",
            badge: isCertified ? "Passed" : hasExam ? "Unlocked" : "Soon",
            badgeColor: isCertified
              ? "bg-emerald-100 text-emerald-800"
              : hasExam
              ? "bg-blue-100 text-blue-800"
              : "bg-zinc-100 text-zinc-600",
            href: `/dashboard/classroom?tab=exam${cParam}`,
          },
        ]
      : []),
  ];

  return (
    <div className="flex border-b border-zinc-200 bg-white px-4 md:px-8 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
      {tabs.map((t) => {
        const isActive = currentTab === t.id;
        return (
          <Link
            key={t.id}
            href={t.href}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all duration-200 ${
              isActive
                ? "border-[var(--brand)] text-[var(--brand)] bg-blue-50/50 shadow-xs"
                : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50/50"
            }`}
          >
            <LandingIcon name={t.icon} size={16} color="currentColor" />
            <span>{t.label}</span>
            {t.badge && (
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${t.badgeColor}`}>
                {t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
