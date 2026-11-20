const MONTH_ID_MAP: Record<string, string> = {
  Jan: "Jan",
  Feb: "Feb",
  Mar: "Mar",
  Apr: "Apr",
  May: "Mei",
  Jun: "Jun",
  Jul: "Jul",
  Aug: "Agu",
  Sep: "Sep",
  Oct: "Okt",
  Nov: "Nov",
  Dec: "Des",
};

export function EnrollmentBars({
  points,
}: {
  points: Array<{ month: string; count: number }>;
}) {
  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DFD5C8] bg-[#FBF6F1]/60 py-10 px-4 text-center">
        <p className="text-sm font-bold text-[#0B2559]">Belum ada pendaftaran 6 bulan terakhir</p>
        <p className="mt-1 text-xs text-zinc-500 max-w-xs">
          Grafik pertumbuhan siswa akan otomatis tampil saat peserta mulai mendaftar di kelasmu.
        </p>
      </div>
    );
  }

  const maxVal = Math.max(1, ...points.map((p) => p.count));
  const totalCount = points.reduce((sum, p) => sum + p.count, 0);
  const peakPoint = points.reduce(
    (best, p) => (p.count > best.count ? p : best),
    points[0]
  );
  const latestPoint = points[points.length - 1];
  const midVal = Math.ceil(maxVal / 2);

  return (
    <div className="space-y-4">
      {/* Mini 3-stat insight row */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-[#FBF6F1] border border-[#EFE7DC] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Total 6 Bln
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559]">
            {totalCount} <span className="text-[11px] font-semibold text-zinc-500">siswa</span>
          </p>
        </div>
        <div className="rounded-xl bg-[#FFF4EC]/70 border border-[#F26A12]/20 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#C2530A]">
            Tertinggi
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559] truncate">
            {MONTH_ID_MAP[peakPoint.month] || peakPoint.month}{" "}
            <span className="text-[11px] font-bold text-[#C2530A]">({peakPoint.count})</span>
          </p>
        </div>
        <div className="rounded-xl bg-blue-50/70 border border-blue-200/60 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#0062D1]">
            Terbaru
          </p>
          <p className="mt-0.5 text-sm sm:text-base font-extrabold text-[#0B2559] truncate">
            {MONTH_ID_MAP[latestPoint.month] || latestPoint.month}{" "}
            <span className="text-[11px] font-bold text-[#0062D1]">({latestPoint.count})</span>
          </p>
        </div>
      </div>

      {/* Bar Chart Area with Y-axis guides & value labels */}
      <div className="relative pt-2">
        <div className="flex gap-3">
          {/* Y-Axis Scale */}
          <div className="flex flex-col justify-between pb-7 pt-4 text-[10px] font-bold text-zinc-400 select-none w-6 text-right shrink-0">
            <span>{maxVal}</span>
            <span>{midVal}</span>
            <span>0</span>
          </div>

          {/* Bars + Gridlines */}
          <div className="relative flex-1 min-w-0">
            {/* Horizontal dashed guide lines */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-4 bottom-7 flex flex-col justify-between"
            >
              <div className="border-t border-dashed border-[#E6DED4]" />
              <div className="border-t border-dashed border-[#EFE7DC]" />
              <div className="border-t border-[#E6DED4]" />
            </div>

            <div className="relative z-10 flex items-end justify-around gap-2 sm:gap-4 h-48 pt-4">
              {points.map((p) => {
                const isPeak = p.month === peakPoint.month && p.count > 0;
                const pct = Math.max(8, Math.round((p.count / maxVal) * 100));
                const monthLabel = MONTH_ID_MAP[p.month] || p.month;

                return (
                  <div
                    key={p.month}
                    className="group flex flex-1 flex-col items-center justify-end h-full min-w-0"
                  >
                    <div className="flex flex-col items-center justify-end w-full flex-1 pb-1">
                      <span
                        className={`mb-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-extrabold transition ${
                          isPeak
                            ? "bg-[#FFF4EC] text-[#C2530A] border border-[#F26A12]/25"
                            : "text-[#0B2559]"
                        }`}
                      >
                        {p.count}
                      </span>
                      <div
                        className={`w-full max-w-[44px] rounded-t-xl transition-all duration-300 group-hover:opacity-90 ${
                          isPeak
                            ? "bg-gradient-to-t from-[#D65507] to-[#F26A12] shadow-sm shadow-[#F26A12]/25"
                            : "bg-gradient-to-t from-[#0B2559] to-[#0073F5] shadow-xs shadow-[#0073F5]/20"
                        }`}
                        style={{ height: `${pct}%` }}
                        title={`${monthLabel}: ${p.count} siswa mendaftar`}
                      />
                    </div>
                    <span className="mt-1.5 text-[11px] font-bold text-zinc-600 truncate">
                      {monthLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
