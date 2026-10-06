import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";
import { auth } from "@/lib/session";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { getUserById } from "@/lib/db/users.queries";

export const dynamic = "force-dynamic";

export async function PublicNavbar() {
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

  let hasDashboardAccess = false;
  if (user) {
    if (user.role === "admin" || user.role === "instructor") {
      hasDashboardAccess = true;
    } else {
      const enrollments = await listEnrollmentsForUser(Number(user.id));
      hasDashboardAccess = enrollments.length > 0;
    }
  }

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="mx-auto flex h-[62px] max-w-[1200px] items-center justify-between gap-4 px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--r-md)] bg-[var(--brand)]">
            <LandingIcon name="MessageCircle" color="#fff" />
          </span>
          <span className="font-[family-name:var(--font-heading)] text-lg font-extrabold tracking-tight">
            Fluency<span className="text-[var(--brand)]">Hub</span>
          </span>
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/#masalah" className="nav-link">Masalah</Link>
          <Link href="/#metode" className="nav-link">Metode</Link>
          <Link href="/#harga" className="nav-link">Harga</Link>
          <Link href="/#testimoni" className="nav-link">Testimoni</Link>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <ProfileDropdown user={user} profileUrl="/profile" hasDashboardAccess={hasDashboardAccess} />
          ) : (
            <>
              <Link href="/auth/signin" className="btn btn-secondary btn-default hidden md:inline-flex">
                <LandingIcon name="LogIn" color="var(--text-2)" /> Log in
              </Link>
              <Link href="/#harga" className="btn btn-primary btn-default">
                Mulai Gratis
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
