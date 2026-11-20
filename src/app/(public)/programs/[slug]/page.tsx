import Link from "next/link";
import { notFound } from "next/navigation";
import { ProgramCohortShowcase } from "@/components/landing/ProgramCohortShowcase";
import { PROGRAM_GOALS, getProgramGoal } from "@/lib/programs/catalog";
import { getProgramPageData } from "@/lib/programs/page-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const goal = getProgramGoal(slug);
  if (!goal) {
    return { title: "Program — English Ready" };
  }
  return {
    title: `${goal.title} — Program English Ready`,
    description: goal.heroDescription,
  };
}

export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const goal = getProgramGoal(slug);
  if (!goal) {
    notFound();
  }

  const { publicCourses, enrolledCourseIds, latestReadyCheck } =
    await getProgramPageData();

  return (
    <main className="bg-[#FBF6F1] text-[#0B2559]">
      {/* Breadcrumb & Goal Switcher Bar */}
      <div className="border-b border-[#E6DED4] bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/#program"
              className="inline-flex items-center gap-1.5 font-bold text-[#0B2559] no-underline transition hover:text-[#C2530A]"
            >
              <span aria-hidden="true">←</span>
              <span>Beranda</span>
            </Link>
            <span className="text-[#C9BBA9]">/</span>
            <Link
              href="/programs"
              className="font-semibold text-[#4A5468] no-underline transition hover:text-[#0B2559]"
            >
              Program
            </Link>
            <span className="text-[#C9BBA9]">/</span>
            <span className="font-bold text-[#C2530A]">{goal.title}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PROGRAM_GOALS.map((g) => {
              const active = g.slug === goal.slug;
              return (
                <Link
                  key={g.slug}
                  href={`/programs/${g.slug}`}
                  className={`rounded-full px-3 py-1 text-xs font-bold no-underline transition ${
                    active
                      ? "bg-[#0B2559] text-white"
                      : "border border-[#E6DED4] bg-[#FBF6F1] text-[#0B2559] hover:border-[#0B2559]"
                  }`}
                >
                  {g.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <ProgramCohortShowcase
        goal={goal}
        courses={publicCourses}
        enrolledCourseIds={enrolledCourseIds}
        latestReadyCheck={latestReadyCheck}
        isStandalonePage={true}
      />
    </main>
  );
}

