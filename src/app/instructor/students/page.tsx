import { AdminSimpleGrid } from "@/components/admin/AdminSimpleGrid";
import { listStudentsForInstructor } from "@/lib/db/enrollments.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";

export default async function InstructorStudentsPage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const students = await listStudentsForInstructor(scope);

  return (
    <div className="w-full flex flex-col gap-4">
      <h1 className="text-xl font-extrabold text-zinc-900">Students</h1>
      <AdminSimpleGrid
        columns={["Name", "Email", "WhatsApp", "Course", "Progress", "Status", "Joined"]}
        rows={students.map((s) => ({
          key: String(s.enrollmentId),
          cells: [
            s.name,
            s.email,
            s.whatsappNumber ?? "—",
            s.courseTitle,
            `${Number(s.progressPct).toFixed(0)}%`,
            { badge: s.status, tone: s.status === "active" ? "success" : "warning" },
            new Date(s.enrolledAt).toLocaleDateString("id-ID"),
          ],
        }))}
      />
    </div>
  );
}
