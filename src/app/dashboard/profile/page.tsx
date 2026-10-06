/* eslint-disable @next/next/no-img-element */
 
import { auth } from "@/lib/session";
import { LandingIcon } from "@/components/landing/LandingIcon";
import Link from "next/link";
import { getUserById } from "@/lib/db/users.queries";
import { ProfileForm } from "./ProfileForm";
import { AvatarUploader } from "./AvatarUploader";

export default async function ProfilePage() {
  const session = await auth();
  
  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await getUserById(Number(session.user.id));
  }

  const userName = dbUser?.name || session?.user?.name || "User";

  return (
    <main className="w-full px-6 py-8 md:px-10 flex flex-col gap-10">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition">
          <div className="rotate-180">
            <LandingIcon name="ArrowRight" color="currentColor" />
          </div>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">
            Welcome, {userName}
          </h1>
          <p className="text-sm text-zinc-500">
            Berikut informasi mengenai profil kamu
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
        <ProfileForm 
          initialName={userName} 
          initialWhatsapp={dbUser?.whatsappNumber || ""} 
        />

        {/* Card Kanan: Informasi Akun */}
        <div className="flex flex-col w-full rounded-3xl border border-zinc-200 bg-white p-6 md:p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">Informasi Akun</h2>
          
          <div className="flex flex-col w-full gap-4 rounded-xl bg-blue-50 p-5 border border-blue-100">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm font-semibold text-blue-900">Tipe Member</span>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white text-right">
                {dbUser?.role === 'admin' ? 'Admin' : dbUser?.role === 'instructor' ? 'Instructor' : 'Hybrid Pro'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm font-semibold text-blue-900">Bergabung Sejak</span>
              <span className="text-sm font-bold text-blue-900 text-right">
                {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'September 2026'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
