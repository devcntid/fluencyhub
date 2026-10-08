/* eslint-disable @next/next/no-img-element */
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";
import { ProfileForm } from "@/app/dashboard/profile/ProfileForm";
import { AvatarUploader } from "@/app/dashboard/profile/AvatarUploader";
import { InstructorZoomForm } from "./InstructorZoomForm";

export default async function InstructorProfilePage() {
  const session = await auth();
  
  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await getUserById(Number(session.user.id));
  }

  const userName = dbUser?.name || session?.user?.name || "Instructor";

  return (
    <main className="w-full px-6 py-8 md:px-10 flex flex-col gap-10">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Profil & Pengaturan
          </h1>
          <p className="text-sm text-zinc-500">
            Atur informasi profil dan Link Zoom untuk kelas Anda
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card p-6 shadow-sm border border-zinc-200/60 rounded-2xl bg-white">
        <div className="flex items-center gap-4">
          {dbUser?.avatarUrl || session?.user?.image ? (
            <img src={dbUser?.avatarUrl || session?.user?.image || ""} alt={userName} className="h-24 w-24 rounded-full border-4 border-white shadow-sm object-cover" />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-sm bg-zinc-100 text-3xl font-bold text-zinc-500">
              {userName[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xl font-bold text-zinc-900">{userName}</span>
            <span className="text-sm text-zinc-500">{dbUser?.email || session?.user?.email || "email@tidak-tersedia.com"}</span>
          </div>
        </div>
        
        <div>
          <AvatarUploader />
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Card Kiri: Informasi Pribadi (Client Component Form) */}
        <div className="flex flex-col w-full rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">Informasi Pribadi</h2>
          <ProfileForm 
            initialName={userName} 
            initialWhatsapp={dbUser?.whatsappNumber || ""} 
          />
        </div>

        {/* Card Kanan: Pengaturan Zoom */}
        <div className="flex flex-col w-full rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm">
          <InstructorZoomForm />
        </div>

      </div>
    </main>
  );
}
