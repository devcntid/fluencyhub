import { InstructorMobileNav, InstructorSidebar } from "@/components/instructor/InstructorSidebar";
import { TopbarSignOut } from "@/components/layout/TopbarSignOut";
import { auth } from "@/lib/session";
import { getUserById } from "@/lib/db/users.queries";

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  
  let dbUser = null;
  if (session?.user?.id) {
    dbUser = await getUserById(Number(session.user.id));
  }
  
  const share = String(Number(dbUser?.revenueSharePct ?? session?.user.revenueSharePct ?? "70")).replace(/\.00$/, "");

  return (
    <div className="dash-shell">
      <InstructorSidebar
        name={dbUser?.name ?? session?.user.name ?? "Instructor"}
        email={dbUser?.email ?? session?.user.email ?? ""}
        avatarUrl={dbUser?.avatarUrl ?? session?.user.image ?? null}
        sharePct={share}
      />
      <div className="dash-main">
        <div className="topbar">
          <div className="flex items-center gap-2">
            <InstructorMobileNav
              name={dbUser?.name ?? session?.user.name ?? "Instructor"}
              email={dbUser?.email ?? session?.user.email ?? ""}
              avatarUrl={dbUser?.avatarUrl ?? session?.user.image ?? null}
              sharePct={share}
            />
            <span className="badge badge-inst" style={{ fontSize: 10 }}>
              Instructor Mode
            </span>
          </div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dbUser?.avatarUrl || session?.user.image || "https://i.pravatar.cc/80?img=15"}
              alt=""
              className="avatar avatar-ring-i h-8 w-8"
            />
            <TopbarSignOut />
          </div>
        </div>
        <div className="dash-content pb-24 md:pb-0">{children}</div>
      </div>
    </div>
  );
}
