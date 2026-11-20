import { redirect } from "next/navigation";
import { auth } from "@/lib/session";
import {
  getStudentProgressSummary,
  listEnrolledPackagesForSpeaking,
} from "@/lib/db/speaking.queries";
import { SpeakingHubClient } from "@/components/speaking/SpeakingHubClient";

export const metadata = {
  title: "AI Speaking Partner & Progres Belajar | English Ready",
  description:
    "Latihan berbicara bahasa Inggris interaktif 24/7 bersama AI sesuai materi paket kelasmu dan pantau kenaikan Ready Score.",
};

export default async function SpeakingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=/dashboard/speaking");
  }

  const userId = Number(session.user.id);
  const [summary, enrolledCourses] = await Promise.all([
    getStudentProgressSummary(userId),
    listEnrolledPackagesForSpeaking(userId),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 py-3 sm:gap-5 sm:px-6 sm:py-5">
      <SpeakingHubClient initialSummary={summary} enrolledCourses={enrolledCourses} />
    </main>
  );
}
