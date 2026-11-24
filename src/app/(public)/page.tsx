import { redirect } from "next/navigation";
import { FaqSection } from "@/components/landing/FaqSection";
import { HeroSection } from "@/components/landing/HeroSection";
import { MethodSection } from "@/components/landing/MethodSection";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { ProgramAndCatalogSection } from "@/components/landing/ProgramAndCatalogSection";
import { TeamsBannerSection } from "@/components/landing/TeamsBannerSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { getLandingBundle } from "@/lib/landing";
import { getProgramGoal } from "@/lib/programs/catalog";
import { auth } from "@/lib/session";
import { getLatestReadyCheckSummaryForUser } from "@/lib/db/speaking.queries";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string; all?: string }>;
}) {
  const params = await searchParams;
  const matchedGoal = getProgramGoal(params.goal);
  if (matchedGoal) {
    redirect(`/programs/${matchedGoal.slug}`);
  }
  if (params.all === "1") {
    redirect("/programs");
  }

  const [{ settings, pains, methods, testimonials, faqs }, session] =
    await Promise.all([getLandingBundle(), auth()]);

  const userReadyCheck = session?.user?.id
    ? await getLatestReadyCheckSummaryForUser(Number(session.user.id))
    : null;

  return (
    <main className="bg-[#FBF6F1] text-[#0B2559]">
      <HeroSection
        settings={settings}
        isLoggedIn={Boolean(session?.user?.id)}
        userReadyCheck={userReadyCheck}
        userName={session?.user?.name ?? null}
      />
      <ProblemSection items={pains} settings={settings} />
      <MethodSection items={methods} imageUrl={settings.method_image_url ?? ""} />
      <ProgramAndCatalogSection />
      <TestimonialSection items={testimonials} />
      <TeamsBannerSection
        settings={settings}
        isLoggedIn={Boolean(session?.user?.id)}
        userName={session?.user?.name ?? null}
        userEmail={session?.user?.email ?? null}
      />
      <FaqSection items={faqs} />
    </main>
  );
}
