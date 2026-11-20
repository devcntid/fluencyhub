"use client";

import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminSignOut } from "@/components/admin/AdminSignOut";

export type AdminNavGroup = { title: string; items: Array<{ href: string; label: string }> };

export function AdminSidebar({
  base,
  name,
  email,
  avatarUrl,
  groups,
}: {
  base: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  groups: AdminNavGroup[];
}) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <Link href={base} className="flex items-center gap-2">
          <EnglishReadyLogo height={28} mode="dark" />
        </Link>
      </div>
      <div className="sidebar-profile">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl || "https://i.pravatar.cc/80?img=22"}
          alt=""
          className="avatar avatar-ring-a h-9 w-9"
        />
        <div className="min-w-0">
          <p className="truncate font-[family-name:var(--font-heading)] text-xs font-bold text-white">{name}</p>
          <p className="text-[10px] font-medium text-[var(--sidebar-active-admin)]">Super Administrator</p>
          <p className="truncate text-[10px] text-zinc-500">{email}</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="sidebar-group">{group.title}</p>
            {group.items.map((item) => {
              const exactOnly = item.href === base || item.href === `${base}/payments` || item.href === `${base}/cms`;
              const active = exactOnly
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link key={item.href} href={item.href} className={`sidebar-item${active ? " active-a" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="sidebar-footer">
        <AdminSignOut />
      </div>
    </aside>
  );
}
