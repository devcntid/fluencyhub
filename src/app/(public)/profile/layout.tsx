"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { label: "Profil", href: "/profile", icon: "User" },
    { label: "E-learning", href: "/profile/elearning", icon: "BookOpen" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/30 w-full">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <aside className="w-full md:w-64 shrink-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold text-blue-900">Menu</h3>
            </div>
            <nav className="flex flex-col py-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition ${
                      isActive 
                        ? "bg-zinc-50 text-blue-700 border-r-4 border-blue-600 font-bold" 
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                  >
                    <LandingIcon name={item.icon} color="currentColor" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <div className="flex-1 w-full min-w-0">
            {children}
          </div>

        </div>
      </div>
    </div>
  );
}
