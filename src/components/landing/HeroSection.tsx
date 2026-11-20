import { ReadyCheckTrigger } from "@/components/landing/ReadyCheckTrigger";

const SAMPLE_DIMENSIONS = [
  { label: "Kelancaran & keberanian", score: 44 },
  { label: "Pelafalan & kejelasan", score: 50 },
  { label: "Pemahaman mendengar", score: 64 },
  { label: "Ketepatan bahasa", score: 56 },
  { label: "Komunikasi lintas budaya", score: 48 },
];

export interface UserReadyCheckSummary {
  overallScore: number;
  levelTitle: string;
  cefrEstimate?: string;
  dimensions?: {
    kelancaran: number;
    pelafalan: number;
    mendengar: number;
    ketepatan: number;
    lintasBudaya: number;
  } | null;
  targetProgramSlug: string;
  createdAt: string;
}

export function HeroSection({
  settings,
  isLoggedIn = false,
  userReadyCheck = null,
  userName = null,
}: {
  settings?: Record<string, string>;
  isLoggedIn?: boolean;
  userReadyCheck?: UserReadyCheckSummary | null;
  userName?: string | null;
}) {
  const eyebrow = settings?.hero_eyebrow?.trim() || "English readiness untuk orang Indonesia";
  const title = settings?.hero_title?.trim() || "Seberapa siap bahasa Inggrismu?";
  const subtitle =
    settings?.hero_subtitle?.trim() ||
    "Bukan sekadar grammar. Kami ukur dan latih kesiapanmu untuk bicara, berelasi, berbisnis, dan berkontribusi di mana pun, tanpa batas negara.";
  const socialProof = settings?.hero_social_proof?.trim() || "Speak. Connect. Contribute.";

  const displayName = userName?.trim() ? userName.split(" ")[0] : "Sobat Ready";

  // Score gauge computation for real user score
  const userScore = userReadyCheck?.overallScore ?? 0;
  const userDash = Math.min(340, Math.round((userScore / 100) * 340));

  const dimensionsList = userReadyCheck?.dimensions
    ? [
        { label: "Kelancaran & keberanian", score: userReadyCheck.dimensions.kelancaran },
        { label: "Pelafalan & kejelasan", score: userReadyCheck.dimensions.pelafalan },
        { label: "Pemahaman mendengar", score: userReadyCheck.dimensions.mendengar },
        { label: "Ketepatan bahasa", score: userReadyCheck.dimensions.ketepatan },
        { label: "Komunikasi lintas budaya", score: userReadyCheck.dimensions.lintasBudaya },
      ]
    : SAMPLE_DIMENSIONS;

  return (
    <section className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-10 px-4 pb-16 pt-12 sm:px-6 lg:gap-12 lg:pb-16 lg:pt-[72px]">
      {/* Left Column */}
      <div className="flex min-w-0 flex-[1_1_500px] flex-col gap-5">
        <div className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#C2530A] sm:text-[14px]">
          {eyebrow}
        </div>
        <h1 className="m-0 text-[38px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#0B2559] sm:text-[50px] lg:text-[60px]">
          {title}
        </h1>
        <p className="m-0 max-w-[560px] text-[17px] leading-[1.55] text-[#3D4760] sm:text-[20px]">
          {subtitle}
        </p>

        <div className="mt-2 flex flex-wrap gap-3">
          <ReadyCheckTrigger
            label={userReadyCheck ? "Tes Ulang Ready Score · 10 menit" : "Cek Ready Score gratis · 10 menit"}
            isLoggedIn={isLoggedIn}
            className="w-full cursor-pointer rounded-[14px] bg-[#C2530A] px-6 py-4 text-center text-base font-bold text-white transition hover:bg-[#a84507] sm:w-auto sm:px-7 sm:py-[18px] sm:text-lg"
          />
          <a
            href="#program"
            className="w-full rounded-[14px] border-2 border-[#0B2559] bg-white px-6 py-4 text-center text-base font-bold text-[#0B2559] transition hover:bg-[#F5ECE3] sm:w-auto sm:px-7 sm:py-[18px] sm:text-lg"
          >
            Lihat program
          </a>
        </div>

        <div className="text-[14px] text-[#4A5468]">
          Gratis, tanpa kartu kredit. Hasil langsung keluar.
        </div>
        <div className="mt-2 text-[18px] font-extrabold tracking-[-0.01em] text-[#0B2559]">
          {socialProof}
        </div>
      </div>

      {/* Right Column: Dynamic Ready Check Card */}
      <div
        id="skor-kamu"
        className="flex min-w-0 flex-[1_1_360px] flex-col gap-5 rounded-[24px] bg-white p-6 shadow-[0_1px_0_#E6DED4,0_12px_32px_rgba(11,37,89,0.08)] sm:p-7 scroll-mt-24 border border-[#E6DED4]/60"
      >
        {userReadyCheck ? (
          /* CASE 1: User has completed Ready Check */
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#4A5468] block">Hasil Evaluasi Resmi</span>
                <h3 className="text-base font-extrabold text-[#0B2559]">Skor Ready Check Kamu</h3>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Tersimpan di Profil
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-1">
              <svg
                width="128"
                height="128"
                viewBox="0 0 128 128"
                role="img"
                aria-label={`Ready Score ${userScore} dari 100`}
                className="h-28 w-28 shrink-0 sm:h-32 sm:w-32"
              >
                <circle cx="64" cy="64" r="54" fill="none" stroke="#EFE7DD" strokeWidth="12" />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="#F26A12"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${userDash} 340`}
                  transform="rotate(-90 64 64)"
                />
                <text
                  x="64"
                  y="72"
                  textAnchor="middle"
                  fontSize="34"
                  fontWeight="800"
                  fill="#0B2559"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  {userScore}
                </text>
              </svg>

              <div className="flex min-w-0 flex-col gap-1">
                <div className="text-[13px] font-bold text-[#4A5468]">Level kesiapanmu</div>
                <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[26px]">
                  {userReadyCheck.levelTitle}
                </div>
                <div className="text-sm font-semibold text-[#0073F5]">
                  Setara CEFR {userReadyCheck.cefrEstimate || "B1"} (Terverifikasi)
                </div>
              </div>
            </div>

            {/* 5 Dimensions Progress */}
            <div className="flex flex-col gap-2.5 text-[13px] sm:text-sm pt-1">
              {dimensionsList.map((dim) => (
                <div
                  key={dim.label}
                  className="grid grid-cols-[minmax(135px,170px)_minmax(0,1fr)_28px] items-center gap-2.5"
                >
                  <span className="truncate text-[#0B2559] sm:overflow-visible sm:whitespace-normal font-medium">
                    {dim.label}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EFE7DD]">
                    <div
                      className="h-2 rounded-full bg-[#0B2559]"
                      style={{ width: `${Math.min(100, Math.max(5, dim.score))}%` }}
                    />
                  </div>
                  <span className="text-right font-bold tabular-nums text-[#0B2559]">
                    {dim.score}
                  </span>
                </div>
              ))}
            </div>

            {/* Recommendations & Quick Action */}
            <div className="pt-2 border-t border-[#E6DED4] flex flex-col gap-2">
              <a
                href="#program"
                className="w-full rounded-xl bg-[#0B2559] hover:bg-[#0073F5] text-white py-2.5 px-4 text-xs font-bold text-center transition flex items-center justify-center gap-1.5"
              >
                Lihat Rekomendasi Paket Kelas Sesuai Skor
                <span>&rarr;</span>
              </a>
              <div className="flex items-center justify-between text-xs text-[#4A5468] pt-1">
                <span>Ingin menaikkan skormu?</span>
                <ReadyCheckTrigger
                  label="Tes Ulang (10 mnt)"
                  isLoggedIn={true}
                  className="text-xs font-bold text-[#F26A12] hover:underline cursor-pointer"
                />
              </div>
            </div>
          </>
        ) : isLoggedIn ? (
          /* CASE 2: User is logged in, but hasn't completed Ready Check yet */
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#4A5468] block">Akun Terhubung</span>
                <h3 className="text-base font-extrabold text-[#0B2559]">Halo, {displayName}! 👋</h3>
              </div>
              <div className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-bold text-amber-700">
                Belum Ada Skor
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#FBF6F1] border border-[#E6DED4] flex flex-col gap-2.5">
              <div className="text-sm font-bold text-[#0B2559]">
                Kamu belum mengambil tes Ready Check
              </div>
              <p className="text-xs leading-relaxed text-[#3D4760]">
                Cukup 10 menit untuk mengetahui kesiapan bicaramu di level global (skor 0–100, setara CEFR), serta rekomendasi kelas yang paling tepat untukmu.
              </p>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#4A5468]">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Tes 4 tahap: audio, konteks kerja, dan 2 tugas bicara AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Hasil instan keluar dan langsung tersimpan di akunmu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>100% Gratis, tanpa kartu kredit</span>
              </div>
            </div>

            <ReadyCheckTrigger
              label="Mulai Tes Ready Check Sekarang (10 Menit) &rarr;"
              isLoggedIn={true}
              className="w-full cursor-pointer rounded-xl bg-[#F26A12] hover:bg-[#C2530A] px-4 py-3 text-center text-sm font-bold text-white shadow-sm transition"
            />
          </>
        ) : (
          /* CASE 3: Guest / Not logged in (Mockup Sample) */
          <>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-bold text-[#4A5468]">Contoh hasil Ready Check</div>
              <div className="rounded-full bg-[#FBF6F1] px-2.5 py-1.5 text-xs font-bold text-[#0B2559]">
                Contoh
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <svg
                width="128"
                height="128"
                viewBox="0 0 128 128"
                role="img"
                aria-label="Ready Score 52 dari 100"
                className="h-28 w-28 shrink-0 sm:h-32 sm:w-32"
              >
                <circle cx="64" cy="64" r="54" fill="none" stroke="#EFE7DD" strokeWidth="12" />
                <circle
                  cx="64"
                  cy="64"
                  r="54"
                  fill="none"
                  stroke="#F26A12"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray="176 340"
                  transform="rotate(-90 64 64)"
                />
                <text
                  x="64"
                  y="72"
                  textAnchor="middle"
                  fontSize="34"
                  fontWeight="800"
                  fill="#0B2559"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  52
                </text>
              </svg>

              <div className="flex min-w-0 flex-col gap-1">
                <div className="text-[13px] font-bold text-[#4A5468]">Level kamu</div>
                <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[#0B2559] sm:text-[26px]">
                  Ready to Speak
                </div>
                <div className="text-sm text-[#4A5468]">Setara CEFR B1 (indikatif)</div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5 text-[13px] sm:text-sm">
              {SAMPLE_DIMENSIONS.map((dim) => (
                <div
                  key={dim.label}
                  className="grid grid-cols-[minmax(135px,170px)_minmax(0,1fr)_28px] items-center gap-2.5"
                >
                  <span className="truncate text-[#0B2559] sm:overflow-visible sm:whitespace-normal">
                    {dim.label}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-[#EFE7DD]">
                    <div
                      className="h-2 rounded-full bg-[#0B2559]"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                  <span className="text-right font-bold tabular-nums text-[#0B2559]">
                    {dim.score}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
