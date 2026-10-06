import { notFound, redirect } from "next/navigation";
import { CoursePlayer } from "@/components/course/CoursePlayer";
import { getAdminPath } from "@/lib/auth";
import { getCourseById } from "@/lib/db/courses.queries";
import { canAccessCoursePlayer } from "@/lib/db/enrollments.queries";
import { listCoursePlayerCurriculum } from "@/lib/db/lessons.queries";
import { auth } from "@/lib/session";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const session = await auth();
  const { courseId, lessonId } = await params;
  const cid = Number(courseId);
  const lid = Number(lessonId);
  if (!session?.user.id) redirect("/auth/signin");

  const access = await canAccessCoursePlayer(Number(session.user.id), session.user.role, cid);
  if (!access.allowed) redirect(`/checkout?courseId=${cid}`);

  const course = await getCourseById(cid);
  if (!course) notFound();

  const sections = await listCoursePlayerCurriculum(cid, session ? Number(session.user.id) : null);
  const flat = sections.flatMap((s) => s.lessons);
  const idx = flat.findIndex((l) => l.id === lid);
  if (idx < 0) notFound();
  const current = flat[idx];
  const prevId = idx > 0 ? flat[idx - 1].id : null;
  const nextId = idx < flat.length - 1 ? flat[idx + 1].id : null;

  const withinWindow =
    current.contentType === "live_class" &&
    current.liveClassDatetime &&
    // eslint-disable-next-line react-hooks/purity
    Date.now() >= current.liveClassDatetime.getTime() - 30 * 60 * 1000;
  const liveJoinUrl = current.contentType === "live_class" && (access.preview || withinWindow) ? current.liveClassUrl : null;

  const sidebar = sections.map((s) => ({
    ...s,
    lessons: s.lessons.map((l) => ({
      ...l,
      youtubeVideoId: null,
      liveClassUrl: null,
      documentUrl: null,
      textContent: null,
    })),
  }));

  const backHref =
    session.user.role === "instructor"
      ? "/instructor/courses"
      : session.user.role === "admin"
        ? `/${getAdminPath()}/courses`
        : "/dashboard";

  return (
    <CoursePlayer
      courseId={cid}
      courseTitle={course.title}
      current={current}
      sections={sidebar}
      prevId={prevId}
      nextId={nextId}
      preview={access.preview}
      liveJoinUrl={liveJoinUrl}
      backHref={backHref}
    />
  );
}
