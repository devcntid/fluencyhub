"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LandingIcon } from "@/components/landing/LandingIcon";

// Based on the type inferred from page.tsx
export type ResourceItem = {
  id: number;
  title: string;
  description: string | null;
  courseTitle: string;
  courseId: number;
  documentUrl: string | null;
  textContent: string | null;
};

export function ResourceList({ resources }: { resources: ResourceItem[] }) {

  const searchParams = useSearchParams();
  const c = searchParams.get("c");
  
  const defaultSelectedCourse = c 
    ? resources.find((r) => r.courseId === Number(c))?.courseTitle || "all" 
    : "all";

  const [selectedCourse, setSelectedCourse] = useState<string>(defaultSelectedCourse);

  const courses = Array.from(new Set(resources.map((r) => r.courseTitle)));

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const title = e.target.value;
    setSelectedCourse(title);
    if (title === "all") {
      window.history.replaceState(null, '', "/dashboard/resources");
    } else {
      const cid = resources.find((r) => r.courseTitle === title)?.courseId;
      if (cid) window.history.replaceState(null, '', `/dashboard/resources?c=${cid}`);
    }
  };

  const filteredResources =
    selectedCourse === "all"
      ? resources
      : resources.filter((r) => r.courseTitle === selectedCourse);

  const getResourceMeta = (url: string | null) => {
    const isPdf = url?.toLowerCase().endsWith(".pdf");
    const isDoc = url?.toLowerCase().match(/\.(doc|docx)$/);
    const isXls = url?.toLowerCase().match(/\.(xls|xlsx|csv)$/);
    
    if (isPdf) {
      return { icon: "FileText", bg: "bg-red-50", color: "#dc2626" }; // red
    }
    if (isDoc) {
      return { icon: "FileCheck", bg: "bg-green-50", color: "#16a34a" }; // green
    }
    if (isXls) {
      return { icon: "Layers", bg: "bg-green-50", color: "#16a34a" }; // green
    }
    // Default / general
    return { icon: "Layers", bg: "bg-blue-50", color: "#2563eb" }; // blue
  };

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
          <LandingIcon name="BookOpen" color="currentColor" />
        </div>
        <h3 className="mb-2 font-[family-name:var(--font-heading)] text-lg font-bold text-zinc-900">
          Belum Ada Resource
        </h3>
        <p className="max-w-sm text-sm text-zinc-500">
          Anda belum memiliki materi atau modul latihan karena Anda belum terdaftar di kelas manapun yang memiliki dokumen tambahan.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Dropdown */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-sm font-medium text-zinc-500">
          Menampilkan {filteredResources.length} dokumen
        </p>
        <div className="relative w-full md:w-auto min-w-[200px]">
          <select
            value={selectedCourse}
            onChange={handleSelect}
            className="w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2.5 pl-4 pr-10 text-sm font-semibold text-zinc-700 shadow-[0_1px_2px_rgba(0,0,0,0.04)] outline-none transition-all hover:bg-zinc-50 focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-50)] cursor-pointer"
          >
            <option value="all">Semua Kelas</option>
            {courses.map((course) => (
              <option key={course} value={course}>
                Kelas: {course}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 py-12 text-center text-zinc-500">
          Tidak ada resource untuk kelas ini.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((res) => {
            const meta = getResourceMeta(res.documentUrl);
            return (
              <div 
                key={res.id} 
                className="group flex flex-col rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-zinc-200 hover:shadow-md"
              >
                <div className="flex justify-between items-start mb-4 gap-3">
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
                    <LandingIcon name={meta.icon} color={meta.color} />
                  </div>
                  <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-indigo-600 border border-indigo-100 text-right line-clamp-2 max-w-[65%] leading-tight shrink break-words">
                    {res.courseTitle}
                  </span>
                </div>
                
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-sm font-bold text-zinc-900 leading-snug">
                  {res.title}
                </h3>
                <p className="mb-4 flex-1 text-xs text-zinc-500 leading-relaxed line-clamp-3">
                  {res.description}
                </p>
                
                {res.documentUrl ? (
                  <div className="flex w-full gap-2 mt-auto">
                    <a
                      href={res.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-xs font-bold text-blue-700 shadow-sm transition hover:bg-blue-100"
                    >
                      <LandingIcon name="Eye" size={14} color="currentColor" />
                      Lihat
                    </a>
                    <a
                      href={res.documentUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-bold text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    >
                      <LandingIcon name="Download" size={14} color="currentColor" />
                      Download
                    </a>
                  </div>
                ) : res.textContent ? (
                  <div className="mt-auto">
                    <Link
                      href={`/dashboard/resources/${res.id}`}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
                    >
                      <LandingIcon name="BookOpen" size={16} color="currentColor" />
                      Baca Teks Materi
                    </Link>
                  </div>
                ) : (
                  <div className="mt-auto">
                    <button
                      disabled
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 text-sm font-semibold text-zinc-400"
                    >
                      Kosong
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
