/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { listInstructorCoursesWithRevenue } from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { auth } from "@/lib/session";
import { InstructorCourseCreateButton } from "@/components/instructor/InstructorCourseCreateButton";
import { InstructorCourseEditDialog } from "@/components/instructor/InstructorCourseEditDialog";
import { InstructorCourseDeleteButton } from "@/components/instructor/InstructorCourseDeleteButton";
import { InstructorCoursePublishButton } from "@/components/instructor/InstructorCoursePublishButton";
import { LandingIcon } from "@/components/landing/LandingIcon";

export default async function InstructorCoursesPage() {
  const session = await auth();
  const scope = instructorScopeId(session?.user.role, Number(session?.user.id ?? 0));
  const courses = await listInstructorCoursesWithRevenue(scope);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[var(--brand,#2563eb)] border border-blue-100">
              <LandingIcon name="BookOpen" size={13} color="currentColor" /> Course Management
            </span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs text-zinc-500 font-medium">Instructor Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
            My Courses
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500">
            Classes you teach. Manage curriculum, syllabus, live Zoom sessions, and student final exams.
          </p>
        </div>
        <div className="shrink-0">
          <InstructorCourseCreateButton />
        </div>
      </div>

      {/* Courses List */}
      <div className="flex flex-col gap-4">
        {courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-12 text-center text-zinc-500">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
              <LandingIcon name="BookOpen" size={28} color="currentColor" />
            </div>
            <h3 className="text-base font-bold text-zinc-800">No courses created yet</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Get started by creating your first course. You can design your curriculum and publish it when ready.
            </p>
          </div>
        ) : null}

        {courses.map((c) => (
          <div
            key={c.id}
            className="rounded-3xl border border-zinc-200/90 bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-5"
          >
            {/* Top Section: Thumbnail + Info + Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Course Thumbnail */}
              <div className="relative h-32 w-full sm:h-28 sm:w-44 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 border border-zinc-100">
                {c.thumbnailUrl ? (
                  <img
                    src={c.thumbnailUrl}
                    alt={c.title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-zinc-400 bg-zinc-100 font-semibold text-xs">
                    No Thumbnail
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                      c.status === "published"
                        ? "bg-emerald-600/90 text-white"
                        : "bg-amber-600/90 text-white"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
              </div>

              {/* Course Details */}
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  {c.level ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 capitalize">
                      {c.level.replace("_", " ")}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-zinc-100 text-zinc-700">
                    {c.isFree ? "Free" : `Rp ${Number(c.price).toLocaleString("id-ID")}`}
                  </span>
                  <span className="text-zinc-300">•</span>
                  <span className="text-xs font-semibold text-zinc-500 inline-flex items-center gap-1">
                    <LandingIcon name="Users" size={13} color="currentColor" />
                    {c.enrollmentCount} {c.enrollmentCount === 1 ? "student" : "students"}
                  </span>
                </div>

                <h3 className="font-[family-name:var(--font-heading)] text-base sm:text-lg font-bold text-zinc-900 leading-snug">
                  {c.title}
                </h3>

                {c.shortDescription ? (
                  <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {c.shortDescription}
                  </p>
                ) : null}
              </div>

              {/* Top Right: Publish / Unpublish Button */}
              <div className="shrink-0 self-start sm:self-auto flex items-center gap-2">
                <InstructorCoursePublishButton courseId={c.id} courseTitle={c.title} status={c.status} />
              </div>
            </div>

            {/* Bottom Row / Management Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-zinc-100">
              {/* Left: Core Management Navigation */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/instructor/curriculum?courseId=${c.id}`}
                  className="btn btn-secondary btn-sm h-8 px-3 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  <LandingIcon name="BookOpen" size={13} color="currentColor" />
                  <span>Curriculum</span>
                </Link>

                <Link
                  href={`/instructor/curriculum?courseId=${c.id}&tab=exams`}
                  className="btn btn-sm h-8 px-3 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                >
                  <LandingIcon name="Award" size={13} color="currentColor" />
                  <span>Exams & Grading</span>
                </Link>

                <Link
                  href={`/instructor/students`}
                  className="btn btn-secondary btn-sm h-8 px-3 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900"
                >
                  <LandingIcon name="Users" size={13} color="currentColor" />
                  <span>Students</span>
                </Link>

                <Link
                  href={`/dashboard/classroom?c=${c.id}`}
                  target="_blank"
                  className="btn btn-secondary btn-sm h-8 px-3 text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5 text-zinc-700 hover:text-zinc-900"
                >
                  <LandingIcon name="Eye" size={13} color="currentColor" />
                  <span>Student Preview</span>
                </Link>
              </div>

              {/* Right: Settings & Delete */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <InstructorCourseEditDialog
                  course={{
                    id: c.id,
                    title: c.title,
                    slug: c.slug,
                    shortDescription: c.shortDescription,
                    price: c.price,
                    thumbnailUrl: c.thumbnailUrl,
                    status: c.status as "draft" | "published",
                    level: c.level,
                  }}
                />
                <InstructorCourseDeleteButton id={c.id} title={c.title} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
