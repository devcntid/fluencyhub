import { EnrollmentBars } from "@/components/instructor/EnrollmentBars";
import {
  getInstructorOverview,
  listInstructorCoursesWithRevenue,
  listInstructorEnrollmentByMonth,
} from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";
import { formatIdr } from "@/lib/utils/cn";

export default async function InstructorAnalyticsPage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const [stats, courses, months] = await Promise.all([
    getInstructorOverview(scope),
    listInstructorCoursesWithRevenue(scope),
    listInstructorEnrollmentByMonth(scope, 6),
  ]);
  const share = Number(stats.sharePct) / 100;

  return (
    <div className="mx-auto flex max-w-[900px] flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { lbl: "Revenue (My Share)", val: formatIdr(stats.instructorRevenue), c: "var(--green)" },
          { lbl: "Total Enrolled", val: `${stats.enrolledTotal} siswa`, c: "var(--brand)" },
          { lbl: "Avg Completion", val: `${Number(stats.avgCompletion).toFixed(0)}%`, c: "var(--accent)" },
        ].map((s) => (
          <div key={s.lbl} className="card">
            <p className="mb-1 text-xs text-[var(--text-3)]">{s.lbl}</p>
            <p className="font-[family-name:var(--font-heading)] text-2xl font-extrabold" style={{ color: s.c }}>
              {s.val}
            </p>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-heading)] text-[15px] font-bold">Enrollment Over Time</h3>
          <span className="badge badge-primary">Last 6 months</span>
        </div>
        <EnrollmentBars points={months} />
      </div>
      <div className="card">
        <h3 className="mb-3 font-[family-name:var(--font-heading)] text-[15px] font-bold">Revenue per Course</h3>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-12 text-center">No.</th>
                <th>Course</th>
                <th>Enrolled</th>
                <th>Gross (est.)</th>
                <th>My Share</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, i) => {
                const shareAmt = Number(c.revenue);
                const gross = share > 0 ? shareAmt / share : shareAmt;
                return (
                  <tr key={c.id}>
                    <td className="text-center text-[var(--text-4)]">{i + 1}</td>
                    <td className="max-w-[150px] truncate font-semibold">{c.title}</td>
                    <td>{c.enrollmentCount}</td>
                    <td>{shareAmt > 0 ? formatIdr(gross) : "—"}</td>
                    <td className="font-bold text-[var(--green)]">{shareAmt > 0 ? formatIdr(c.revenue) : "—"}</td>
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
