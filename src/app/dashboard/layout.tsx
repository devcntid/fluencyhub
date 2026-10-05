import { Suspense } from "react";
import { DashboardChrome } from "@/components/layout/DashboardChrome";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  let user = session?.user;
  if (session?.user?.id) {
    const dbUser = await getUserById(Number(session.user.id));
    if (dbUser) {
      user = {
        ...session.user,
        name: dbUser.name,
        email: dbUser.email,
        image: dbUser.avatarUrl,
      };
    }
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafafa]">Loading...</div>}>
      <DashboardChrome user={user}>{children}</DashboardChrome>
    </Suspense>
  );
}
