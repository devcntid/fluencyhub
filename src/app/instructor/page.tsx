import { EnrollmentBars } from "@/components/instructor/EnrollmentBars";
import {
  getInstructorOverview,
  listInstructorCoursesWithRevenue,
  listInstructorEnrollmentByMonth,
  getInstructorUpcomingLiveClasses,
} from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";
import { formatIdr } from "@/lib/utils/cn";

import { AdminIcon } from "@/components/admin/AdminIcon";
import { formatTimeWIB, formatDateDayWIB, formatDateMonthWIB } from "@/lib/utils/date";

export default async function InstructorHomePage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const [stats, courses, months, upcomingLive] = await Promise.all([
    getInstructorOverview(scope),
    listInstructorCoursesWithRevenue(scope),
    listInstructorEnrollmentByMonth(scope, 6),
    getInstructorUpcomingLiveClasses(scope),
  ]);
  const share = Number(stats.sharePct).toFixed(0);

  return (
    <div className="anim flex w-full flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
            Overview & Analytics
          </h1>
          <p className="mt-0.5 text-xs text-zinc-500">
            Course performance analytics, instructor earnings ({share}% revenue share), and live mentoring schedules.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { lbl: `Revenue (${share}%)`, val: formatIdr(stats.instructorRevenue), bg: "#f0fdf4", c: "var(--green)", icon: "DollarSign" },
          { lbl: "Total Enrolled", val: String(stats.enrolledTotal), bg: "#eff6ff", c: "var(--blue)", icon: "Users" },
          { lbl: "Active Courses", val: String(stats.publishedCount), bg: "#f5f3ff", c: "#7c3aed", icon: "BookOpen" },
          { lbl: "Avg Completion", val: `${Number(stats.avgCompletion).toFixed(1)}%`, bg: "#fff7ed", c: "#ea580c", icon: "TrendingUp" },
        ].map((s) => (
          <div key={s.lbl} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <AdminIcon name={s.icon} color={s.c} />
            </div>
            <div>
              <p className="stat-val">{s.val}</p>
              <p className="stat-lbl">{s.lbl}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-bold">Monthly Enrollment & Growth</h3>
            <span className="badge badge-primary shrink-0 whitespace-nowrap inline-flex items-center justify-center leading-none">Last 6 months</span>
          </div>
          <EnrollmentBars points={months} />
        </div>

        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-bold flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
              </span>
              Upcoming Live Classes
            </h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {upcomingLive.length > 0 ? (
              upcomingLive.map((lc) => {
                const startDate = new Date(lc.datetime);
                const dur = lc.durationMinutes || 60;
                const endDate = new Date(startDate.getTime() + dur * 60 * 1000);
                const isLive = new Date() >= startDate && new Date() < endDate;

                return (
                  <div key={lc.id} className={`flex items-center gap-3 rounded-lg border p-3 ${
                    isLive ? "border-red-200 bg-red-50/30 ring-1 ring-red-100" : "border-zinc-100 bg-zinc-50/50"
                  }`}>
                    <div className="text-center w-12 shrink-0">
                      <div className="text-sm font-bold text-zinc-900">{formatDateDayWIB(startDate)}</div>
                      <div className="text-[10px] font-semibold text-zinc-500 uppercase">{formatDateMonthWIB(startDate)}</div>
                    </div>
                    <div className="w-px h-8 bg-zinc-200" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-semibold ${isLive ? "text-red-600 font-bold" : "text-[var(--brand)]"}`}>
                          {formatTimeWIB(startDate)} - {formatTimeWIB(endDate)} WIB
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium">({dur} min)</span>
                        {isLive && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-red-600 bg-red-100 border border-red-200 rounded px-1.5 py-0.2 animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="truncate text-sm font-bold text-zinc-900" title={lc.title}>{lc.title}</div>
                      <div className="truncate text-xs text-zinc-500">{lc.courseTitle}</div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-sm text-zinc-500">
                No upcoming live classes scheduled.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-bold">
            Course Performance & Revenue Analytics
          </h3>
          <span className="badge badge-primary">Analytics</span>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-10 text-center">No.</th>
                <th>Course</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Gross (est.)</th>
                <th>My Share ({share}%)</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const shareAmt = Number(c.revenue);
                const shareRatio = Number(stats.sharePct) / 100;
                const gross = shareRatio > 0 ? shareAmt / shareRatio : shareAmt;
                return (
                  <tr key={c.id}>
                    <td className="text-center text-[var(--text-4)]">{i + 1}</td>
                    <td className="font-semibold text-zinc-900">{c.title}</td>
                    <td>
                      <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="font-semibold">{c.enrollmentCount}</td>
                    <td className="text-zinc-600 font-medium">{shareAmt > 0 ? formatIdr(gross) : "—"}</td>
                    <td className="font-bold text-[var(--green)]">
                      {shareAmt > 0 ? formatIdr(c.revenue) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
