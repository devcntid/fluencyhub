import { UserAdminTable } from "@/components/admin/UserAdminTable";
import { listUsersAdmin } from "@/lib/db/users.queries";
import { listAllCoursesAdmin } from "@/lib/db/courses.queries";
import { auth } from "@/lib/session";

export default async function AdminUsersPage() {
  const [users, session, courses] = await Promise.all([
    listUsersAdmin(),
    auth(),
    listAllCoursesAdmin(),
  ]);
  
  return (
    <UserAdminTable
      currentUserId={session?.user.id ? Number(session.user.id) : null}
      courses={courses.map(c => ({ id: c.id, title: c.title }))}
      users={users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        whatsappNumber: u.whatsappNumber,
        avatarUrl: u.avatarUrl,
        role: u.role,
        enrolledCount: u.enrolledCount,
        isActive: u.isActive,
        revenueSharePct: u.revenueSharePct,
        createdAt: new Date(u.createdAt).toISOString(),
        deletedAt: u.deletedAt ? new Date(u.deletedAt).toISOString() : null,
      }))}
    />
  );
}
