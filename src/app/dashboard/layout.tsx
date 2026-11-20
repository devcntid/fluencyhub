import { Suspense } from "react";
import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { listCoursePlayerCurriculum } from "@/lib/db/lessons.queries";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  let user = session?.user;
  if (session?.user?.id) {
    const dbUser = await getUserById(Number(session.user.id));
    if (dbUser) {
      user = {
        ...session.user,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.avatarUrl,
      };
    }
  }

  const unlockedExamCourseIds: number[] = [];
  const liveZoomCourseIds: number[] = [];
  let hasPrivateSessionAccess = false;
  let defaultCourseId: number | undefined;

  if (session?.user?.id) {
    const userId = Number(session.user.id);
    const enrollments = await listEnrollmentsForUser(userId);
    if (enrollments.length > 0) {
      defaultCourseId = enrollments[0].courseId;
    }

    for (const e of enrollments) {
      if (e.course.tier !== "tier_bawah") {
        liveZoomCourseIds.push(e.courseId);
      }
      if (e.course.tier === "tier_tinggi" || e.course.speakingPartnerType === "trainer_offline") {
        hasPrivateSessionAccess = true;
      }

      if (session.user.role === "admin" || Number(e.progressPct) >= 100) {
        unlockedExamCourseIds.push(e.courseId);
      } else {
        const curriculum = await listCoursePlayerCurriculum(e.courseId, userId);
        const allLessons = curriculum.flatMap((s) => s.lessons);
        if (allLessons.length === 0 || allLessons.every((l) => l.isCompleted)) {
          unlockedExamCourseIds.push(e.courseId);
        }
      }
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FBF6F1]">Loading...</div>}>
      <DashboardChrome
        user={user}
        unlockedExamCourseIds={unlockedExamCourseIds}
        liveZoomCourseIds={liveZoomCourseIds}
        hasPrivateSessionAccess={hasPrivateSessionAccess}
        defaultCourseId={defaultCourseId}
      >
        {children}
      </DashboardChrome>
    </Suspense>
  );
}
