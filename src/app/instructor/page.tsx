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
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

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
    <div className="anim mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="grid-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-bold">Monthly Enrollment</h3>
            <span className="badge badge-primary">Last 6 months</span>
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
              upcomingLive.map((lc) => (
                <div key={lc.id} className="flex items-center gap-3 rounded-lg border border-zinc-100 p-3 bg-zinc-50/50">
                  <div className="text-center w-12 shrink-0">
                    <div className="text-sm font-bold text-zinc-900">{format(new Date(lc.datetime), "d")}</div>
                    <div className="text-[10px] font-semibold text-zinc-500 uppercase">{format(new Date(lc.datetime), "MMM", { locale: localeId })}</div>
                  </div>
                  <div className="w-px h-8 bg-zinc-200" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[var(--brand)]">{format(new Date(lc.datetime), "HH:mm")} WIB</div>
                    <div className="truncate text-sm font-bold text-zinc-900" title={lc.title}>{lc.title}</div>
                    <div className="truncate text-xs text-zinc-500">{lc.courseTitle}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-32 flex-col items-center justify-center text-sm text-zinc-500">
                Tidak ada jadwal live terdekat.
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="card">
        <h3 className="mb-3 font-[family-name:var(--font-heading)] text-[15px] font-bold">Course Performance</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th>Revenue (share)</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td className="max-w-[180px] truncate font-semibold">{c.title}</td>
                  <td>
                    <span className={`badge ${c.status === "published" ? "badge-success" : "badge-warning"}`}>{c.status}</span>
                  </td>
                  <td className="font-semibold">{c.enrollmentCount}</td>
                  <td className="font-bold text-[var(--green)]">{Number(c.revenue) > 0 ? formatIdr(c.revenue) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
