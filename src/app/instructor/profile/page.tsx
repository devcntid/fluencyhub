/* eslint-disable @next/next/no-img-element */
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";
import { ProfileForm } from "@/app/dashboard/profile/ProfileForm";
import { AvatarUploader } from "@/app/dashboard/profile/AvatarUploader";
import { InstructorZoomForm } from "./InstructorZoomForm";
import { InstructorSignatureForm } from "./InstructorSignatureForm";

export default async function InstructorProfilePage() {
  const session = await auth();
  
  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await getUserById(Number(session.user.id));
  }

  const userName = dbUser?.name || session?.user?.name || "Instructor";

  return (
    <main className="w-full flex flex-col gap-6 sm:gap-8">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
            Profile & Settings
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Manage your personal profile, certificate signature, and Zoom meeting link
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 p-5 sm:p-6 shadow-xs border border-zinc-200 bg-white rounded-3xl">
        <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
          {dbUser?.avatarUrl || session?.user?.image ? (
            <img 
              src={dbUser?.avatarUrl || session?.user?.image || ""} 
              alt={userName} 
              className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-full border-4 border-zinc-100 shadow-sm object-cover" 
            />
          ) : (
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full border-4 border-zinc-100 shadow-sm bg-zinc-100 text-2xl sm:text-3xl font-bold text-zinc-500">
              {userName[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-lg sm:text-xl font-bold text-zinc-900 truncate">{userName}</span>
            <span 
              className="text-xs sm:text-sm text-zinc-500 truncate" 
              title={dbUser?.email || session?.user?.email || "email@not-available.com"}
            >
              {dbUser?.email || session?.user?.email || "email@not-available.com"}
            </span>
          </div>
        </div>
        
        <div className="shrink-0 self-start sm:self-auto">
          <AvatarUploader />
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        
        {/* Card Kiri: Informasi Pribadi (Client Component Form) */}
        <ProfileForm 
          initialName={userName} 
          initialWhatsapp={dbUser?.whatsappNumber || ""} 
        />

        {/* Card Kanan: Pengaturan Zoom */}
        <div className="flex flex-col w-full rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <InstructorZoomForm />
        </div>

        {/* Card Bawah: Tanda Tangan Sertifikat */}
        <div className="lg:col-span-2 flex flex-col w-full rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <InstructorSignatureForm 
            initialSignatureUrl={dbUser?.signatureUrl ?? null}
            instructorName={userName}
          />
        </div>

      </div>
    </main>
  );
}
