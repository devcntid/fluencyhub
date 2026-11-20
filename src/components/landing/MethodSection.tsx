import type { LandingMethodItem } from "@/types/db";

const STEPS = [
  {
    num: 1,
    accent: false,
    title: "Cek Ready Score",
    description:
      "Tes 10 menit: mendengar, bahasa dalam konteks, dan dua tugas bicara. Hasilnya skor 0–100 dan level kesiapanmu.",
  },
  {
    num: 2,
    accent: false,
    title: "Ikuti program cohort",
    description:
      "Belajar bersama satu angkatan, live roleplay setiap minggu, dan Ready Pulse untuk memantau kemajuan.",
  },
  {
    num: 3,
    accent: true,
    title: "Buktikan kemajuanmu",
    description:
      "Tes Exit di akhir program menunjukkan kenaikan skormu dari Baseline, lengkap dengan Ready Certificate.",
  },
];

const READINESS_LEVELS = [
  {
    range: "0–20 · A1",
    name: "Starter",
    bg: "bg-[#EFE7DD] text-[#0B2559]",
    subText: "text-[#4A5468]",
  },
  {
    range: "21–40 · A2",
    name: "Warming Up",
    bg: "bg-[#E3D7C8] text-[#0B2559]",
    subText: "text-[#4A5468]",
  },
  {
    range: "41–60 · B1",
    name: "Ready to Speak",
    bg: "bg-[#0B2559] text-white",
    subText: "text-[#D5DDEE]",
  },
  {
    range: "61–80 · B2",
    name: "Ready to Connect",
    bg: "bg-[#0B2559] text-white",
    subText: "text-[#D5DDEE]",
  },
  {
    range: "81–100 · C1+",
    name: "Ready to Contribute",
    bg: "bg-[#C2530A] text-white",
    subText: "text-[#FBE3D2]",
  },
];

export function MethodSection({
  items,
  imageUrl,
}: {
  items?: LandingMethodItem[];
  imageUrl?: string;
}) {
  void imageUrl;

  const displaySteps =
    items && items.length > 0
      ? items
          .filter((i) => i.isActive)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item, idx) => ({
            num: idx + 1,
            accent: idx === items.length - 1,
            title: item.title,
            description: item.description,
          }))
      : STEPS;

  return (
    <section
      id="ready-score"
      className="mx-auto flex max-w-[1200px] flex-col gap-9 px-4 py-14 scroll-mt-20 sm:px-6 sm:py-[72px]"
    >
      <h2 className="m-0 text-[28px] font-extrabold leading-tight tracking-[-0.02em] text-[#0B2559] sm:text-[38px]">
        Cara kerjanya: ukur, latih, buktikan
      </h2>

      {/* 3 Steps */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {displaySteps.map((step) => (
          <div
            key={step.num}
            className="flex flex-col gap-3 rounded-[20px] border border-[#E6DED4] bg-white p-6 sm:p-7"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-[12px] text-xl font-extrabold text-white ${
                step.accent ? "bg-[#C2530A]" : "bg-[#0B2559]"
              }`}
            >
              {step.num}
            </div>
            <h3 className="m-0 text-[21px] font-extrabold text-[#0B2559] sm:text-[22px]">
              {step.title}
            </h3>
            <p className="m-0 text-[15.5px] leading-[1.6] text-[#3D4760] sm:text-[16px]">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Lima level kesiapan */}
      <div className="flex flex-col gap-4 rounded-[20px] border border-[#E6DED4] bg-white p-6 sm:p-7">
        <div className="text-[18px] font-extrabold text-[#0B2559]">Lima level kesiapan</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {READINESS_LEVELS.map((lvl) => (
            <div key={lvl.name} className={`rounded-[12px] p-3.5 ${lvl.bg}`}>
              <div className={`text-[13px] ${lvl.subText}`}>{lvl.range}</div>
              <div className="text-[16px] font-extrabold">{lvl.name}</div>
            </div>
          ))}
        </div>
        <div className="text-[13px] text-[#4A5468]">
          Setara CEFR bersifat indikatif dan dikalibrasi berkala.
        </div>
      </div>
    </section>
  );
}
