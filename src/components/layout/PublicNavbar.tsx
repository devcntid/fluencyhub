import Link from "next/link";
import { ProfileDropdown } from "@/components/auth/ProfileDropdown";
import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";
import { ReadyCheckTrigger } from "@/components/landing/ReadyCheckTrigger";
import { PublicNavbarMobileMenu } from "@/components/layout/PublicNavbarActions";
import { auth } from "@/lib/session";
import { listEnrollmentsForUser } from "@/lib/db/enrollments.queries";
import { getUserById } from "@/lib/db/users.queries";

export const dynamic = "force-dynamic";

export async function PublicNavbar() {
  const session = await auth();

  let user = session?.user;
  if (session?.user?.id) {
    try {
      const dbUser = await getUserById(Number(session.user.id));
      if (dbUser) {
        user = {
          ...session.user,
          name: dbUser.name,
          email: dbUser.email,
          image: dbUser.avatarUrl,
        };
      }
    } catch (err) {
      console.warn("[PublicNavbar] Failed to load dbUser, fallback to session:", err);
    }
  }

  let hasDashboardAccess = false;
  if (user) {
    if (user.role === "admin" || user.role === "instructor") {
      hasDashboardAccess = true;
    } else {
      try {
        const enrollments = await listEnrollmentsForUser(Number(user.id));
        hasDashboardAccess = enrollments.length > 0;
      } catch (err) {
        console.warn("[PublicNavbar] Failed to load enrollments, fallback to false:", err);
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#E6DED4] bg-white print:hidden">
      <div className="relative mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="English Ready, beranda"
        >
          <EnglishReadyLogo height={34} />
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-6 text-[15px] font-semibold md:flex"
        >
          <Link
            href="/#program"
            className="text-[#0B2559] transition-colors hover:text-[#C2530A]"
          >
            Program
          </Link>
          <Link
            href="/#ready-score"
            className="text-[#0B2559] transition-colors hover:text-[#C2530A]"
          >
            Ready Score
          </Link>
          <Link
            href="/#podcast"
            className="text-[#0B2559] transition-colors hover:text-[#C2530A]"
          >
            Podcast
          </Link>
          <Link
            href="/#konsultasi"
            className="text-[#0B2559] transition-colors hover:text-[#C2530A]"
          >
            Konsultasi
          </Link>
          <Link
            href="/#faq"
            className="text-[#0B2559] transition-colors hover:text-[#C2530A]"
          >
            FAQ
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
          {user ? (
            <>
              {!hasDashboardAccess && (
                <ReadyCheckTrigger
                  label="Cek Ready Score"
                  isLoggedIn={true}
                  className="hidden sm:inline-flex cursor-pointer whitespace-nowrap rounded-[12px] bg-[#C2530A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#a84507]"
                />
              )}
              <ProfileDropdown
                user={user}
                profileUrl="/profile"
                hasDashboardAccess={hasDashboardAccess}
              />
            </>
          ) : (
            <>
              <Link
                href="/auth/signin"
                className="hidden text-[15px] font-semibold text-[#0B2559] transition-colors hover:text-[#C2530A] sm:inline-flex"
              >
                Masuk
              </Link>
              <ReadyCheckTrigger
                label="Cek Ready Score"
                isLoggedIn={false}
                className="cursor-pointer whitespace-nowrap rounded-[12px] bg-[#C2530A] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-[#a84507] sm:px-5 sm:py-3 sm:text-[15px]"
              />
            </>
          )}
          <PublicNavbarMobileMenu
            isLoggedIn={Boolean(user)}
            hasDashboardAccess={hasDashboardAccess}
          />
        </div>
      </div>
    </header>
  );
}
