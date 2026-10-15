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
    <main className="w-full px-4 py-6 sm:px-6 md:px-8 lg:px-10 flex flex-col gap-8 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 transition">
          <div className="rotate-180">
            <LandingIcon name="ArrowRight" color="currentColor" />
          </div>
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900">
            Welcome, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Here is your profile information
          </p>
        </div>
      </div>

      {/* Avatar Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-4">
          {dbUser?.avatarUrl || session?.user?.image ? (
            <img src={dbUser?.avatarUrl || session?.user?.image || ""} alt={userName} className="h-16 w-16 sm:h-20 sm:w-20 rounded-full border-4 border-zinc-100 shadow-sm object-cover" />
          ) : (
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-full border-4 border-zinc-100 shadow-sm bg-zinc-100 text-2xl sm:text-3xl font-bold text-zinc-500">
              {userName[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <span className="text-lg sm:text-xl font-bold text-zinc-900 truncate">{userName}</span>
            <span className="text-xs sm:text-sm text-zinc-500 truncate">{dbUser?.email || session?.user?.email || "email@unavailable.com"}</span>
          </div>
        </div>
        
        <div className="self-start sm:self-auto shrink-0">
          <AvatarUploader />
        </div>
      </div>

      {/* Cards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        
        {/* Left Card: Personal Information (Client Component Form) */}
        <ProfileForm 
          initialName={userName} 
          initialWhatsapp={dbUser?.whatsappNumber || ""} 
        />

        {/* Right Card: Account Information */}
        <div className="flex flex-col w-full rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="mb-6 text-xl font-bold text-zinc-900">Account Information</h2>
          
          <div className="flex flex-col w-full gap-4 rounded-xl bg-blue-50 p-5 border border-blue-100">
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm font-semibold text-blue-900">Membership Type</span>
              <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white text-right">
                {dbUser?.role === 'admin' ? 'Admin' : dbUser?.role === 'instructor' ? 'Instructor' : 'Hybrid Pro'}
              </span>
            </div>
            <div className="flex justify-between items-center gap-4">
              <span className="text-sm font-semibold text-blue-900">Joined Since</span>
              <span className="text-sm font-bold text-blue-900 text-right">
                {dbUser?.createdAt ? new Date(dbUser.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'September 2026'}
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
