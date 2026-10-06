import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { formatIdr } from "@/lib/utils/cn";
import type { PublishedCourseCard } from "@/types/db";

export function PricingSection({ courses, enrolledCourseIds = [] }: { courses: PublishedCourseCard[], enrolledCourseIds?: number[] }) {
  return (
    <section id="harga" className="px-5 py-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-10 text-center">
          <p className="section-label">Pilihan Kelas</p>
          <h2 className="heading-lg mb-3">Investasi Terbaik untuk Karir Anda</h2>
          <p className="text-[15px] text-[var(--text-3)]">Akses seumur hidup. Tidak ada biaya tersembunyi.</p>
        </div>
        <div className="grid-3">
          {courses.map((c) => {
            const isEnrolled = enrolledCourseIds.includes(c.id);
            return (
            <article key={c.id} className={`pricing-card${c.isFeatured ? " featured" : ""}`}>
              <div className="relative">
                {c.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.thumbnailUrl} alt="" className="aspect-video w-full object-cover" />
                ) : null}
                <div className="absolute top-2.5 left-2.5">
                  <span className={`badge ${c.isFeatured ? "badge-primary" : "badge"}`}>{c.marketingTag ?? c.level}</span>
                </div>
                {c.isFeatured ? (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="badge badge-warning">Most Popular</span>
                  </div>
                ) : null}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="mb-2 flex items-center gap-1.5">
                  <span className="badge badge-primary">{c.level}</span>
                  <span className="text-xs text-[var(--text-4)]">· {c.enrollmentCount} siswa</span>
                </div>
                <h3 className="mb-1 font-[family-name:var(--font-heading)] text-[15px] font-bold leading-snug">{c.title}</h3>
                <p className="mb-3.5 text-xs text-[var(--text-4)]">by {c.instructorName}</p>
                
                {isEnrolled ? (
                  <div className="mb-4 flex items-baseline gap-2 h-[33px]">
                    <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600 border border-blue-100">
                      Sudah Terdaftar
                    </span>
                  </div>
                ) : (
                  <div className="mb-4 flex items-baseline gap-2 h-[33px]">
                    <span className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold">{formatIdr(c.price)}</span>
                    {c.originalPrice ? (
                      <span className="text-xs text-[var(--text-4)] line-through">{formatIdr(c.originalPrice)}</span>
                    ) : null}
                  </div>
                )}

                <Link 
                  href={isEnrolled ? `/dashboard/videos?c=${c.id}` : `/courses/${c.slug}`} 
                  className={`btn btn-full btn-default mt-auto ${c.isFeatured ? "btn-primary" : "btn-secondary"}`}
                >
                  {isEnrolled ? "Lanjut Belajar" : "Daftar Sekarang"} 
                  <LandingIcon name="ArrowRight" color={c.isFeatured ? "#fff" : "var(--text-2)"} />
                </Link>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
