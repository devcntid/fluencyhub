import type { LandingPainPoint } from "@/types/db";

const MOCKUP_PAIN_POINTS = [
  {
    id: "grammar",
    title: "Takut salah grammar",
    description: "Terlalu sibuk memikirkan tenses sampai lupa menyampaikan maksud.",
  },
  {
    id: "forum",
    title: "Ragu di forum global",
    description:
      "Bingung cara menyela, memberi pendapat, atau menolak dengan sopan dalam rapat lintas negara.",
  },
  {
    id: "measure",
    title: "Belajar tanpa ukuran",
    description:
      "Sudah ikut kursus, tapi tidak tahu sudah sesiap apa untuk wawancara atau presentasi.",
  },
];

export function ProblemSection({
  items,
  settings,
}: {
  items?: LandingPainPoint[];
  settings?: Record<string, string>;
}) {
  const title = settings?.problem_title?.trim() || "Bisa baca, tapi belum berani bicara?";
  const subtitle =
    settings?.problem_subtitle?.trim() ||
    "Kamu tidak sendirian. Speaking adalah kemampuan bahasa Inggris terlemah orang Indonesia: skor 447, di bawah reading 491 (EF EPI 2025).";

  const painPoints =
    items && items.length > 0
      ? items
          .filter((p) => p.isActive)
          .map((p) => ({
            id: String(p.id),
            title: p.title,
            description: p.description,
          }))
      : MOCKUP_PAIN_POINTS;

  return (
    <section
      id="masalah"
      className="border-y border-[#E6DED4] bg-white scroll-mt-20"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16">
        <div className="flex max-w-[760px] flex-col gap-2.5">
          <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[38px]">
            {title}
          </h2>
          <p className="m-0 text-[16px] leading-[1.6] text-[#3D4760] sm:text-[18px]">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {painPoints.map((p) => (
            <div
              key={p.id}
              className="flex flex-col gap-2.5 rounded-[20px] bg-[#FBF6F1] p-6 sm:p-7"
            >
              <h3 className="m-0 text-[20px] font-extrabold text-[#0B2559]">{p.title}</h3>
              <p className="m-0 text-[15.5px] leading-[1.6] text-[#3D4760] sm:text-[16px]">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
