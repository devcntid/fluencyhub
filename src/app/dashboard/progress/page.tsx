import { auth } from "@/lib/session";
import { redirect } from "next/navigation";
import {
  getStudentProgressSummary,
  listEnrolledPackagesForSpeaking,
} from "@/lib/db/speaking.queries";
import { SpeakingHubClient } from "@/components/speaking/SpeakingHubClient";

export const metadata = {
  title: "Progres Belajar & Skor | English Ready",
  description:
    "Pantau grafik kenaikan Ready Score dan akumulasi Ready Points latihan berbicaramu.",
};

export default async function ProgressDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard/progress");
  }

  const userId = Number(session.user.id);
  const [summary, enrolledCourses] = await Promise.all([
    getStudentProgressSummary(userId),
    listEnrolledPackagesForSpeaking(userId),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-6 sm:py-5">
      <SpeakingHubClient
        initialSummary={summary}
        enrolledCourses={enrolledCourses}
        initialTab="progress"
      />
    </main>
  );
}
