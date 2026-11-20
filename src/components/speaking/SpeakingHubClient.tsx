"use client";

import { useState } from "react";
import { AiSpeakingRoom } from "./AiSpeakingRoom";
import { StudentProgressTab } from "./StudentProgressTab";
import type { StudentProgressSummary } from "@/types/db";
import type { EnrolledPackageInput } from "@/lib/speaking/scenarios";

export function SpeakingHubClient({
  initialSummary,
  enrolledCourses = [],
  initialTab = "practice",
}: {
  initialSummary: StudentProgressSummary;
  enrolledCourses?: EnrolledPackageInput[];
  initialTab?: "practice" | "progress";
}) {
  const [activeTab, setActiveTab] = useState<"practice" | "progress">(initialTab);
  const [summary, setSummary] = useState<StudentProgressSummary>(initialSummary);

  async function refreshSummary() {
    try {
      const res = await fetch("/api/student/progress");
      const json = await res.json();
      if (res.ok && json.data) {
        setSummary(json.data);
      }
    } catch (err) {
      console.warn("[refreshSummary error]:", err);
    }
  }

  function handleSwitchToProgress() {
    setActiveTab("progress");
    void refreshSummary();
  }

  return (
    <div className="flex w-full flex-col gap-4 sm:gap-5">
      {/* Unified Clean Top Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Segmented Switcher */}
        <div className="flex w-full items-center gap-1 rounded-2xl border border-[#E6DED4] bg-[#EFE7DD]/80 p-1 sm:w-auto sm:min-w-[360px]">
          <button
            type="button"
            onClick={() => setActiveTab("practice")}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold transition-all sm:text-[13px] ${
              activeTab === "practice"
                ? "bg-[#0B2559] text-white shadow-xs"
                : "text-[#4A5468] hover:text-[#0B2559]"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4" />
            </svg>
            <span>AI Speaking Studio</span>
          </button>

          <button
            type="button"
            onClick={handleSwitchToProgress}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold transition-all sm:text-[13px] ${
              activeTab === "progress"
                ? "bg-[#0B2559] text-white shadow-xs"
                : "text-[#4A5468] hover:text-[#0B2559]"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            <span>Progres &amp; Skor</span>
            {summary.sessionsCount > 0 && (
              <span className="rounded-full bg-[#F26A12] px-1.5 py-0.5 text-[10px] font-extrabold leading-none text-white">
                {summary.sessionsCount}
              </span>
            )}
          </button>
        </div>

        {/* Crisp Gamification Metric Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 sm:pb-0">
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3 py-1.5 text-xs shadow-2xs">
            <span aria-hidden="true">🔥</span>
            <span className="font-extrabold tabular-nums text-[#0B2559]">{summary.streakDays}</span>
            <span className="text-[11px] font-medium text-[#64748B]">Hari Streak</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3 py-1.5 text-xs shadow-2xs">
            <span aria-hidden="true">⭐</span>
            <span className="font-extrabold tabular-nums text-[#C2530A]">
              {summary.totalPoints.toLocaleString("id-ID")}
            </span>
            <span className="text-[11px] font-medium text-[#64748B]">Ready Points</span>
          </div>
          {summary.readyScore > 0 && (
            <div className="hidden shrink-0 items-center gap-1.5 rounded-xl border border-blue-200/80 bg-blue-50/70 px-3 py-1.5 text-xs md:flex">
              <span className="font-extrabold tabular-nums text-[#0062D1]">
                {summary.readyScore}/100
              </span>
              <span className="text-[11px] font-semibold text-[#0B2559]">Ready Score</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "practice" ? (
        <AiSpeakingRoom
          enrolledCourses={enrolledCourses}
          onSessionSaved={refreshSummary}
          onSwitchToProgress={handleSwitchToProgress}
        />
      ) : (
        <StudentProgressTab
          summary={summary}
          onStartPractice={() => setActiveTab("practice")}
        />
      )}
    </div>
  );
}
