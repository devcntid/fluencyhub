"use client";

import { LandingIcon } from "@/components/landing/LandingIcon";
import type { StudentProgressSummary } from "@/types/db";

export function StudentProgressTab({
  summary,
  onStartPractice,
}: {
  summary: StudentProgressSummary;
  onStartPractice: () => void;
}) {
  const hasZeroSessions = summary.sessionsCount === 0;
  const readyScore = summary.readyScore;
  const levelTitle =
    hasZeroSessions || readyScore === 0
      ? "Belum Ada Skor"
      : readyScore >= 85
      ? "Ready for Work (CEFR C1)"
      : readyScore >= 70
      ? "Ready to Connect (CEFR B2)"
      : "Ready to Speak (CEFR B1)";

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Ready Score */}
        <div className="rounded-[18px] sm:rounded-[20px] bg-white p-3.5 sm:p-5 border border-[#E6DED4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#4A5468] mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate">Ready Score</span>
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-[#EFE7DD] text-[#0B2559] shrink-0">
                <LandingIcon name="Award" size={15} color="currentColor" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2559]">
                {readyScore > 0 ? readyScore : "-"}
              </span>
              <span className="text-[11px] sm:text-xs text-[#4A5468] font-medium">/ 100</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-[11px] font-bold text-[#0B2559] bg-[#EFE7DD] px-2 py-0.5 rounded-full inline-block border border-[#E6DED4] truncate mt-1">
            {levelTitle}
          </div>
        </div>

        {/* Card 2: Total Ready Points */}
        <div className="rounded-[18px] sm:rounded-[20px] bg-white p-3.5 sm:p-5 border border-[#E6DED4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#4A5468] mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate">Ready Points</span>
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-[#F9D9C3] text-[#C2530A] shrink-0">
                <LandingIcon name="Sparkles" size={15} color="currentColor" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#C2530A]">
                {summary.totalPoints.toLocaleString("id-ID")}
              </span>
              <span className="text-[11px] sm:text-xs text-[#4A5468] font-medium">Pts</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#4A5468] font-medium truncate mt-1">
            Dari latihan bicara
          </p>
        </div>

        {/* Card 3: Streak Latihan */}
        <div className="rounded-[18px] sm:rounded-[20px] bg-white p-3.5 sm:p-5 border border-[#E6DED4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#4A5468] mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate">Streak Hari</span>
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-[#F9D9C3] text-[#C2530A] shrink-0">
                <LandingIcon name="Calendar" size={15} color="currentColor" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2559]">
                🔥 {summary.streakDays}
              </span>
              <span className="text-[11px] sm:text-xs text-[#4A5468] font-medium">Hari</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#4A5468] font-medium truncate mt-1">
            {summary.streakDays > 0 ? "Streak aktif!" : "Mulai hari ini!"}
          </p>
        </div>

        {/* Card 4: Total Sesi Latihan */}
        <div className="rounded-[18px] sm:rounded-[20px] bg-white p-3.5 sm:p-5 border border-[#E6DED4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[#4A5468] mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider truncate">Total Sesi</span>
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg sm:rounded-xl bg-[#EFE7DD] text-[#0B2559] shrink-0">
                <LandingIcon name="Bot" size={15} color="currentColor" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0B2559]">{summary.sessionsCount}</span>
              <span className="text-[11px] sm:text-xs text-[#4A5468] font-medium">Sesi</span>
            </div>
          </div>
          <p className="text-[10px] sm:text-[11px] text-[#0B2559] font-medium truncate mt-1">
            Terakumulasi
          </p>
        </div>
      </div>

      {/* 4 Pillars Breakdown & Progress Graph (Screen 07 Style) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left: 4 Pillars Average */}
        <div className="rounded-[20px] bg-white p-4 sm:p-6 border border-[#E6DED4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#0B2559]">
                Rata-rata 4 Pilar Berbicara
              </h4>
              <span className="text-[11px] text-[#4A5468]">Skor 0 - 100</span>
            </div>

            {hasZeroSessions ? (
              <div className="py-8 sm:py-10 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-[#EFE7DD] flex items-center justify-center text-[#0B2559] mb-3">
                  <LandingIcon name="Award" size={22} color="currentColor" />
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-[#0B2559]">
                  Belum Ada Data Penilaian 4 Pilar
                </p>
                <p className="text-[11px] sm:text-xs text-[#4A5468] max-w-xs mt-1 leading-relaxed">
                  Selesaikan sesi latihan pertamamu untuk mengukur Kelancaran, Pelafalan, Tata Bahasa, dan Kosakata!
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Fluency */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#3D4760]">Kelancaran (Fluency & Pace)</span>
                    <span className="text-[#0B2559]">{summary.fluencyAvg} / 100</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#EFE7DD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B2559] rounded-full"
                      style={{ width: `${summary.fluencyAvg}%` }}
                    />
                  </div>
                </div>

                {/* Pronunciation */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#3D4760]">Pelafalan (Pronunciation)</span>
                    <span className="text-[#0B2559]">{summary.pronunciationAvg} / 100</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#EFE7DD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B2559] rounded-full"
                      style={{ width: `${summary.pronunciationAvg}%` }}
                    />
                  </div>
                </div>

                {/* Grammar */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#3D4760]">Ketepatan Bahasa (Grammar)</span>
                    <span className="text-[#0B2559]">{summary.grammarAvg} / 100</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#EFE7DD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B2559] rounded-full"
                      style={{ width: `${summary.grammarAvg}%` }}
                    />
                  </div>
                </div>

                {/* Vocabulary */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <span className="text-[#3D4760]">Kosakata Kerja (Vocabulary)</span>
                    <span className="text-[#0B2559]">{summary.vocabularyAvg} / 100</span>
                  </div>
                  <div className="h-2.5 w-full bg-[#EFE7DD] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0B2559] rounded-full"
                      style={{ width: `${summary.vocabularyAvg}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#E6DED4] text-[11px] sm:text-xs text-[#4A5468] flex items-center justify-between">
            <span>Standar Benchmark: 80+</span>
            <span className="text-[#C2530A] font-bold">Siap Kerja</span>
          </div>
        </div>

        {/* Right: Trendline Points */}
        <div className="rounded-[20px] bg-white p-4 sm:p-6 border border-[#E6DED4] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h4 className="text-xs sm:text-sm font-extrabold text-[#0B2559]">
                Tren Kenaikan Ready Score
              </h4>
              <span className="text-[11px] text-[#C2530A] font-bold">Progres</span>
            </div>

            {hasZeroSessions || summary.weeklyTrend.length === 0 ? (
              <div className="py-8 sm:py-10 text-center flex flex-col items-center justify-center">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl bg-[#F9D9C3] flex items-center justify-center text-[#C2530A] mb-3">
                  <LandingIcon name="Sparkles" size={22} color="currentColor" />
                </div>
                <p className="text-xs sm:text-sm font-extrabold text-[#0B2559]">
                  Grafik Tren Belum Tersedia
                </p>
                <p className="text-[11px] sm:text-xs text-[#4A5468] max-w-xs mt-1 leading-relaxed">
                  Grafik tren peningkatan Ready Score akan muncul setelah kamu menyelesaikan sesi latihan bicara!
                </p>
              </div>
            ) : (
              /* Visual Bar Trend */
              <div className="h-36 sm:h-44 flex items-end justify-between gap-2 sm:gap-3 pt-4 sm:pt-6 px-1 sm:px-2 border-b border-[#E6DED4] pb-2">
                {summary.weeklyTrend.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0">
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-[#0B2559]">{item.score}</span>
                    <div
                      className="w-full max-w-[36px] bg-[#0B2559] rounded-t-lg transition-all duration-500 shadow-2xs hover:bg-[#C2530A]"
                      style={{ height: `${Math.max(15, (item.score / 100) * 100)}%` }}
                    />
                    <span className="text-[9px] sm:text-[10px] font-semibold text-[#4A5468] truncate max-w-full text-center">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-3 sm:mt-4 pt-3 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-[#4A5468]">
              {hasZeroSessions
                ? "Skor akan mulai dicatat di sesi pertama."
                : "Hasil terbukti naik dari awal bergabung."}
            </span>
            <button
              type="button"
              onClick={onStartPractice}
              className="py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-[12px] bg-[#C2530A] hover:bg-[#a64508] text-white text-[11px] sm:text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>{hasZeroSessions ? "Mulai Latihan" : "Latihan Lagi"}</span>
              <LandingIcon name="ArrowRight" size={12} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-[20px] bg-white p-4 sm:p-6 border border-[#E6DED4] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-[#0B2559]">
              Riwayat Sesi Latihan Bicara & Evaluasi AI
            </h4>
            <p className="text-[11px] sm:text-xs text-[#4A5468] mt-0.5">
              Catatan topik percakapan dan perolehan poin latihanmu.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartPractice}
            className="py-1.5 px-3 rounded-[12px] bg-[#0B2559] text-white text-xs font-bold hover:bg-[#12367c] transition cursor-pointer self-start sm:self-auto"
          >
            + Mulai Sesi Baru
          </button>
        </div>

        {summary.recentSessions.length === 0 ? (
          <div className="p-6 sm:p-8 text-center border border-dashed border-[#E6DED4] rounded-2xl bg-[#FBF6F1]">
            <div className="mx-auto mb-2 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#EFE7DD] text-[#0B2559]">
              <LandingIcon name="Bot" size={18} color="currentColor" />
            </div>
            <p className="text-xs font-bold text-[#0B2559]">Belum ada sesi latihan bicara yang tersimpan.</p>
            <p className="text-[11px] text-[#4A5468] mt-1 max-w-xs mx-auto">
              Buka tab &quot;Latihan Bicara&quot; dan selesaikan sesi pertamamu bersama AI Speaking Partner untuk melihat riwayat di sini!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-[#E6DED4] text-[10px] sm:text-[11px] font-extrabold uppercase text-[#4A5468]">
                  <th className="pb-2.5 sm:pb-3">Tanggal</th>
                  <th className="pb-2.5 sm:pb-3">Skenario Topik</th>
                  <th className="pb-2.5 sm:pb-3">Durasi</th>
                  <th className="pb-2.5 sm:pb-3">Ready Score</th>
                  <th className="pb-2.5 sm:pb-3 text-right">Poin Didapat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DED4]/60">
                {summary.recentSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FBF6F1] transition-colors">
                    <td className="py-3 text-[#4A5468] font-medium">
                      {new Date(s.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <div className="font-bold text-[#0B2559]">{s.scenarioTitle}</div>
                      <div className="text-[10px] text-[#4A5468] capitalize">{s.scenarioId.replace("_", " ")}</div>
                    </td>
                    <td className="py-3 text-[#4A5468] font-medium">
                      {Math.floor(s.durationSeconds / 60)}m {s.durationSeconds % 60}s
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-[#EFE7DD] text-[#0B2559] border border-[#E6DED4]">
                        {s.overallReadyScore} / 100
                      </span>
                    </td>
                    <td className="py-3 text-right font-extrabold text-[#C2530A]">
                      +{s.pointsAwarded} Pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
