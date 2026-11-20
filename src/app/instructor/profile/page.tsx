import { redirect } from "next/navigation";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";
import { getInstructorOverview } from "@/lib/db/courses.queries";
import { instructorScopeId } from "@/lib/instructor-scope";
import { ProfileForm } from "@/app/dashboard/profile/ProfileForm";
import { AvatarUploader } from "@/app/dashboard/profile/AvatarUploader";
import { InstructorZoomForm } from "./InstructorZoomForm";
import { InstructorSignatureForm } from "./InstructorSignatureForm";

export default async function InstructorProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = Number(session.user.id);
  const scope = instructorScopeId(session.user.role, userId);

  const [dbUser, stats] = await Promise.all([
    getUserById(userId),
    getInstructorOverview(scope),
  ]);

  const userName = dbUser?.name || session.user.name || "Instructor";
  const userEmail = dbUser?.email || session.user.email || "";
  const avatarUrl = dbUser?.avatarUrl || session.user.image || null;
  const whatsappNumber = dbUser?.whatsappNumber || "";
  const zoomLink = dbUser?.zoomLink ?? null;
  const signatureUrl = dbUser?.signatureUrl ?? null;
  const sharePct = String(
    Number(dbUser?.revenueSharePct ?? stats.sharePct ?? 70)
  ).replace(/\.00$/, "");

  const joinedDate = dbUser?.createdAt
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(
        new Date(dbUser.createdAt)
      )
    : "—";

  const hasWhatsapp = Boolean(whatsappNumber.trim());
  const hasZoom = Boolean(zoomLink && zoomLink.trim());
  const hasSignature = Boolean(signatureUrl && signatureUrl.trim());
  const setupCompletedCount = [hasWhatsapp, hasZoom, hasSignature].filter(Boolean).length;

  return (
    <main className="anim w-full max-w-6xl mx-auto flex flex-col gap-5 sm:gap-6 pb-8">
      {/* 1. NAVY COVER IDENTITY CARD + INSTRUCTOR SNAPSHOT */}
      <section className="overflow-hidden rounded-[24px] border border-[#E6DED4] bg-white shadow-[0_2px_12px_rgba(11,37,89,0.04)]">
        {/* Navy Cover Banner */}
        <div className="relative h-28 sm:h-32 bg-gradient-to-br from-[#0B2559] via-[#102F6E] to-[#163D8A] px-5 sm:px-7 py-4 overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#0073F5]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-[#F26A12]/20 blur-3xl"
          />

          <div className="relative flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 border border-white/15 px-3 py-1 text-[11px] font-bold text-blue-100 backdrop-blur-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Profil &amp; Pengaturan Instruktur</span>
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F26A12]/25 border border-[#F26A12]/40 px-3 py-1 text-[11px] font-extrabold text-orange-100">
              <span>Kelengkapan Profil: {setupCompletedCount}/3</span>
            </span>
          </div>
        </div>

        {/* Overlapping Avatar + Identity + Quick Readiness Pills */}
        <div className="px-5 sm:px-7 pb-6 -mt-10 sm:-mt-12 relative">
          <AvatarUploader initialAvatarUrl={avatarUrl} userName={userName} />

          <div className="mt-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="m-0 font-[family-name:var(--font-heading)] text-xl sm:text-2xl font-extrabold text-[#0B2559] tracking-tight truncate">
                  {userName}
                </h1>
                <span className="rounded-full bg-[#0B2559]/8 text-[#0B2559] px-2.5 py-0.5 text-[11px] font-extrabold">
                  {session.user.role === "admin" ? "Admin & Instruktur" : "Instruktur"}
                </span>
              </div>
              <p className="m-0 text-xs sm:text-sm text-zinc-500 truncate">{userEmail}</p>
            </div>

            {/* Interactive Setup Checklist Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="#info-pribadi"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border transition ${
                  hasWhatsapp
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70"
                }`}
              >
                <span>{hasWhatsapp ? "✓" : "!"}</span>
                <span>WhatsApp {hasWhatsapp ? "Aktif" : "Belum Diisi"}</span>
              </a>

              <a
                href="#zoom-settings"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border transition ${
                  hasZoom
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70"
                }`}
              >
                <span>{hasZoom ? "✓" : "!"}</span>
                <span>Zoom {hasZoom ? "Terhubung" : "Belum Diatur"}</span>
              </a>

              <a
                href="#tanda-tangan"
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-bold border transition ${
                  hasSignature
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100/70"
                }`}
              >
                <span>{hasSignature ? "✓" : "!"}</span>
                <span>Tanda Tangan {hasSignature ? "Aktif" : "Belum Ada"}</span>
              </a>
            </div>
          </div>

          {/* 4-Item Instructor Account Snapshot Strip */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-[#EFE7DC] bg-[#FBF6F1]/80 p-3.5 sm:p-4">
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Skema Bagi Hasil
              </p>
              <p className="m-0 mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559]">
                {sharePct}% Revenue
              </p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Kelas Aktif
              </p>
              <p className="m-0 mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559]">
                {stats.publishedCount} Kelas
              </p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Total Siswa
              </p>
              <p className="m-0 mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559]">
                {stats.enrolledTotal} Siswa
              </p>
            </div>
            <div>
              <p className="m-0 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Bergabung Sejak
              </p>
              <p className="m-0 mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559] truncate">
                {joinedDate}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BALANCED 2-COLUMN WORKSPACE: INFORMASI PRIBADI & ZOOM */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <div id="info-pribadi" className="flex flex-col">
          <ProfileForm
            initialName={userName}
            initialEmail={userEmail}
            initialWhatsapp={whatsappNumber}
          />
        </div>

        <InstructorZoomForm initialZoomLink={zoomLink} />
      </section>

      {/* 3. FULL-WIDTH DIGITAL SIGNATURE CARD */}
      <section>
        <InstructorSignatureForm
          initialSignatureUrl={signatureUrl}
          instructorName={userName}
        />
      </section>
    </main>
  );
}
