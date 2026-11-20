const PROGRAM_TRACKS = [
  {
    eyebrow: "Speak",
    title: "Ready to Speak",
    description: "Berani bicara dan lancar di percakapan sehari-hari dan kerja sederhana.",
    startFrom: "Mulai dari: Starter–Warming Up",
    featured: false,
    href: "#harga",
  },
  {
    eyebrow: "Connect",
    title: "Ready for Work",
    description:
      "Wawancara, rapat, email, dan presentasi. Jalur: Interview Prep, Business English, STEM.",
    startFrom: "Mulai dari: Ready to Speak",
    featured: true,
    href: "#harga",
  },
  {
    eyebrow: "Connect",
    title: "Ready to Go",
    description: "Persiapan beasiswa, IELTS, dan wawancara studi ke luar negeri.",
    startFrom: "Mulai dari: Ready to Speak",
    featured: false,
    href: "#harga",
  },
  {
    eyebrow: "Contribute",
    title: "Ready for the World",
    description:
      "Komunikasi lintas budaya, menyampaikan pendapat, dan memimpin diskusi global.",
    startFrom: "Mulai dari: Ready to Connect",
    featured: false,
    href: "#harga",
  },
];

export function ProgramSection() {
  return (
    <section
      id="program"
      className="border-y border-[#E6DED4] bg-white scroll-mt-20"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-14 sm:px-6 sm:py-[72px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[38px]">
            Program sesuai tujuanmu
          </h2>
          <a
            href="#harga"
            className="text-[16px] font-bold text-[#C2530A] transition-colors hover:text-[#0B2559]"
          >
            Lihat semua program →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PROGRAM_TRACKS.map((track) => (
            <a
              key={track.title}
              href={track.href}
              className={`flex flex-col gap-2.5 rounded-[20px] bg-[#FBF6F1] p-6 text-[#0B2559] no-underline transition hover:-translate-y-0.5 hover:shadow-md ${
                track.featured
                  ? "ring-2 ring-[#0B2559]"
                  : "border border-[#E6DED4]/60"
              }`}
            >
              <div className="text-xs font-bold uppercase tracking-[0.1em] text-[#C2530A]">
                {track.eyebrow}
              </div>
              <div className="text-[22px] font-extrabold leading-snug text-[#0B2559]">
                {track.title}
              </div>
              <p className="m-0 text-[15px] leading-[1.55] text-[#3D4760]">
                {track.description}
              </p>
              <div className="mt-auto pt-1 text-[13px] font-bold text-[#4A5468]">
                {track.startFrom}
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

