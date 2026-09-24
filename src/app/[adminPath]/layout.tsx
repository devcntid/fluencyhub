import { notFound } from "next/navigation";
import { AdminMobileNav } from "@/components/admin/AdminMobileNav";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { TopbarSignOut } from "@/components/layout/TopbarSignOut";
import { getAdminPath } from "@/lib/auth";
import { auth } from "@/lib/session";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ adminPath: string }>;
}) {
  const { adminPath } = await params;
  const expected = getAdminPath();
  if (adminPath !== expected) notFound();
  const session = await auth();
  const base = `/${expected}`;
  const groups = [
    {
      title: "Main",
      items: [
        { href: base, label: "Overview" },
        { href: `${base}/courses`, label: "Courses" },
        { href: `${base}/users`, label: "Users" },
        { href: `${base}/audit`, label: "Audit Logs" },
      ],
    },
    {
      title: "Payments",
      items: [
        { href: `${base}/payments`, label: "Transaksi" },
        { href: `${base}/payments/verify`, label: "Verify" },
        { href: `${base}/payments/methods`, label: "Methods" },
        { href: `${base}/coupons`, label: "Coupons" },
      ],
    },
    {
      title: "Landing CMS",
      items: [
        { href: `${base}/cms`, label: "Settings" },
        { href: `${base}/cms/pain-points`, label: "Pain points" },
        { href: `${base}/cms/methods`, label: "Method copy" },
        { href: `${base}/cms/testimonials`, label: "Testimonials" },
        { href: `${base}/cms/faqs`, label: "FAQs" },
      ],
    },
  ];
  const flat = groups.flatMap((g) => g.items);

  return (
    <div className="dash-shell">
      <AdminSidebar
        base={base}
        name={session?.user.name ?? "Admin"}
        email={session?.user.email ?? ""}
        avatarUrl={session?.user.image ?? null}
        groups={groups}
      />
      <div className="dash-main">
        <div className="topbar">
          <span className="badge badge-danger" style={{ fontSize: 10 }}>
            ADMIN MODE
          </span>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session?.user.image || "https://i.pravatar.cc/80?img=22"}
              alt=""
              className="avatar h-8 w-8"
            />
            <TopbarSignOut />
          </div>
        </div>
        <div className="dash-content">
          <AdminMobileNav items={flat} />
          {children}
        </div>
      </div>
    </div>
  );
}
