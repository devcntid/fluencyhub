import Link from "next/link";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { listUserCertificates } from "@/lib/db/certificates.queries";
import {
  getLatestReadyCheckSummaryForUser,
  getStudentProgressSummary,
} from "@/lib/db/speaking.queries";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ProfileForm } from "./ProfileForm";
import { AvatarUploader } from "./AvatarUploader";

export const metadata = {
  title: "Profil Saya | English Ready",
  description: "Kelola data profil, foto, nomor WhatsApp, dan ringkasan progres akun English Ready kamu.",
};

export default async function ProfilePage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const [dbUser, enrollments, certificates, speakingSummary, latestReadyCheck] =
    await Promise.all([
      userId ? getUserById(userId) : Promise.resolve(null),
      userId ? listEnrollmentsForUser(userId) : Promise.resolve([]),
      userId ? listUserCertificates(userId) : Promise.resolve([]),
      userId
        ? getStudentProgressSummary(userId)
        : Promise.resolve({
            readyScore: 0,
            totalPoints: 0,
            streakDays: 0,
            sessionsCount: 0,
            fluencyAvg: 0,
            pronunciationAvg: 0,
            grammarAvg: 0,
            vocabularyAvg: 0,
            weeklyTrend: [],
            recentSessions: [],
          }),
      userId ? getLatestReadyCheckSummaryForUser(userId) : Promise.resolve(null),
    ]);

  const userName = dbUser?.name || session?.user?.name || "Sobat Ready";
  const userEmail = dbUser?.email || session?.user?.email || "email@englishready.id";
  const avatarUrl = dbUser?.avatarUrl || session?.user?.image || null;

  const roleMeta =
    dbUser?.role === "admin"
      ? { label: "Administrator", badgeCls: "bg-[#0B2559] text-white" }
      : dbUser?.role === "instructor"
      ? { label: "Instructor", badgeCls: "bg-purple-700 text-white" }
      : { label: "English Ready Member", badgeCls: "bg-[#0073F5] text-white" };

  const joinedLabel = dbUser?.createdAt
    ? new Date(dbUser.createdAt).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })
    : "September 2026";

  const readyScore =
    speakingSummary.readyScore > 0
      ? speakingSummary.readyScore
      : latestReadyCheck?.overallScore ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-7">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 font-[family-name:var(--font-heading)] text-2xl font-black tracking-[-0.02em] text-[#0B2559]">
            Profil &amp; Akun Saya
          </h1>
          <p className="m-0 mt-0.5 text-xs text-[#64748B] sm:text-sm">
            Kelola informasi profil, foto akun, dan pantau ringkasan perjalanan belajarmu di English Ready.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2 text-xs font-bold text-[#0B2559] no-underline shadow-2xs transition hover:bg-[#FBF6F1]"
        >
          <span>&larr;</span>
          <span>Kembali ke Dashboard</span>
        </Link>
      </div>

      {/* 1. Hero Profile Identity Card with Cover Banner */}
      <section className="overflow-hidden rounded-[26px] border border-[#E6DED4] bg-white shadow-[0_4px_20px_rgba(11,37,89,0.05)]">
        {/* Subtle Architectural Navy Cover */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-r from-[#0B2559] via-[#13387D] to-[#0B2559] sm:h-28">
          <div
            className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#0073F5]/30 blur-2xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-[#F26A12]/20 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative z-10 flex h-full items-start justify-end p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold text-blue-100 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Akun Aktif
            </span>
          </div>
        </div>

        {/* Avatar & Identity Body */}
        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-11 sm:-mt-13">
            <AvatarUploader initialAvatarUrl={avatarUrl} userName={userName} />
          </div>

          <div className="mt-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="m-0 truncate font-[family-name:var(--font-heading)] text-xl font-black text-[#0B2559] sm:text-2xl">
                  {userName}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-extrabold ${roleMeta.badgeCls}`}
                >
                  {roleMeta.label}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-[#64748B]">
                <span>{userEmail}</span>
                <span aria-hidden="true">&middot;</span>
                <span>Bergabung sejak {joinedLabel}</span>
              </div>
            </div>
          </div>

          {/* 4-Column Learner Snapshot Strip */}
          <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-[#F3ECE3] pt-5 sm:grid-cols-4 sm:gap-3">
            <div className="rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/75 p-3.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
                Ready Score
              </span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-black tabular-nums text-[#0B2559]">
                  {readyScore > 0 ? readyScore : "—"}
                </span>
                {readyScore > 0 && (
                  <span className="text-[11px] font-bold text-[#64748B]">/ 100</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/75 p-3.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
                Kelas Aktif
              </span>
              <div className="mt-1 text-lg font-black tabular-nums text-[#0B2559]">
                {enrollments.length}{" "}
                <span className="text-xs font-semibold text-[#64748B]">Program</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/75 p-3.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
                Sertifikat
              </span>
              <div className="mt-1 text-lg font-black tabular-nums text-emerald-700">
                {certificates.length}{" "}
                <span className="text-xs font-semibold text-[#64748B]">Diraih</span>
              </div>
            </div>

            <div className="rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/75 p-3.5">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
                Ready Points
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-lg font-black tabular-nums text-[#C2530A]">
                <span>{speakingSummary.totalPoints.toLocaleString("id-ID")}</span>
                <span className="text-[11px] font-bold text-[#64748B]">
                  · 🔥 {speakingSummary.streakDays}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Balanced 2-Column Grid: Personal Form (7 cols) + Account & Shortcuts (5 cols) */}
      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left: Editable Personal Information Form */}
        <div className="lg:col-span-7">
          <ProfileForm
            initialName={userName}
            initialEmail={userEmail}
            initialWhatsapp={dbUser?.whatsappNumber || ""}
          />
        </div>

        {/* Right: Account Summary & Quick Links */}
        <div className="space-y-5 lg:col-span-5">
          {/* Card A: Account & Membership Details */}
          <div className="rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-6">
            <h2 className="m-0 mb-4 font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559]">
              Detail Keanggotaan
            </h2>

            <div className="divide-y divide-[#F0EAE2] rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/70 px-4">
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <span className="font-semibold text-[#64748B]">Tipe Akun</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${roleMeta.badgeCls}`}
                >
                  {roleMeta.label}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <span className="font-semibold text-[#64748B]">Status</span>
                <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Aktif
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <span className="font-semibold text-[#64748B]">Bergabung Sejak</span>
                <span className="font-extrabold text-[#0B2559]">{joinedLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-xs">
                <span className="font-semibold text-[#64748B]">Sesi AI Speaking</span>
                <span className="font-extrabold text-[#0B2559]">
                  {speakingSummary.sessionsCount} sesi selesai
                </span>
              </div>
            </div>
          </div>

          {/* Card B: Quick Shortcuts */}
          <div className="rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-6">
            <h2 className="m-0 mb-3.5 font-[family-name:var(--font-heading)] text-base font-extrabold text-[#0B2559]">
              Akses Cepat
            </h2>

            <div className="space-y-2">
              <Link
                href="/dashboard/classroom?c=all"
                className="group flex items-center justify-between rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/60 px-4 py-3 text-xs font-bold text-[#0B2559] no-underline transition hover:border-[#0073F5]/40 hover:bg-blue-50/40"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#0073F5]">
                    <LandingIcon name="GraduationCap" size={16} color="currentColor" />
                  </span>
                  <span>Ruang Kelas &amp; Materi Video</span>
                </span>
                <span className="text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#0073F5]">
                  &rarr;
                </span>
              </Link>

              <Link
                href="/dashboard/speaking"
                className="group flex items-center justify-between rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/60 px-4 py-3 text-xs font-bold text-[#0B2559] no-underline transition hover:border-[#F26A12]/40 hover:bg-[#FFF4EC]/60"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#C2530A]">
                    <LandingIcon name="Mic" size={16} color="currentColor" />
                  </span>
                  <span>AI Speaking &amp; Progres Skor</span>
                </span>
                <span className="text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-[#C2530A]">
                  &rarr;
                </span>
              </Link>

              <Link
                href="/ready-check"
                className="group flex items-center justify-between rounded-2xl border border-[#EFE7DD] bg-[#FBF6F1]/60 px-4 py-3 text-xs font-bold text-[#0B2559] no-underline transition hover:border-emerald-300 hover:bg-emerald-50/40"
              >
                <span className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <LandingIcon name="Award" size={16} color="currentColor" />
                  </span>
                  <span>{readyScore > 0 ? "Tes Ulang Ready Check" : "Ambil Tes Ready Check Gratis"}</span>
                </span>
                <span className="text-[#94A3B8] transition group-hover:translate-x-0.5 group-hover:text-emerald-600">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
