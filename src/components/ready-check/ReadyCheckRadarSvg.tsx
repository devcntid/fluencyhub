import type { ReadyCheckDimensions } from "@/lib/ready-check/types";

export function ReadyCheckRadarSvg({
  dimensions,
}: {
  dimensions: ReadyCheckDimensions;
}) {
  const cx = 180;
  const cy = 138;
  const maxR = 92;

  // 5 angles starting at top (-90 deg) clockwise by 72 deg each
  const axes = [
    { key: "kelancaran", val: dimensions.kelancaran, angleDeg: -90 },
    { key: "pelafalan", val: dimensions.pelafalan, angleDeg: -18 },
    { key: "mendengar", val: dimensions.mendengar, angleDeg: 54 },
    { key: "ketepatan", val: dimensions.ketepatan, angleDeg: 126 },
    { key: "lintasBudaya", val: dimensions.lintasBudaya, angleDeg: 198 },
  ] as const;

  const pt = (r: number, deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return {
      x: Number((cx + r * Math.cos(rad)).toFixed(1)),
      y: Number((cy + r * Math.sin(rad)).toFixed(1)),
    };
  };

  const ringPoints = (ratio: number) =>
    axes
      .map((a) => {
        const p = pt(maxR * ratio, a.angleDeg);
        return `${p.x},${p.y}`;
      })
      .join(" ");

  const dataPoints = axes
    .map((a) => {
      const clamped = Math.max(12, Math.min(100, a.val));
      const p = pt((clamped / 100) * maxR, a.angleDeg);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg
      width="100%"
      viewBox="0 0 360 272"
      role="img"
      aria-label={`Grafik radar: kelancaran ${dimensions.kelancaran}, pelafalan ${dimensions.pelafalan}, mendengar ${dimensions.mendengar}, ketepatan ${dimensions.ketepatan}, lintas budaya ${dimensions.lintasBudaya}`}
      className="mx-auto w-full max-w-[360px] select-none"
    >
      <defs>
        <linearGradient id="rcRadarFill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0073F5" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#0B2559" stopOpacity="0.14" />
        </linearGradient>
      </defs>

      {/* Concentric Web Rings */}
      <polygon points={ringPoints(1)} fill="#FBF6F1" fillOpacity="0.7" stroke="#E2D9CE" strokeWidth="1.2" />
      <polygon points={ringPoints(0.66)} fill="none" stroke="#E6DED4" strokeWidth="1" strokeDasharray="3 3" />
      <polygon points={ringPoints(0.33)} fill="none" stroke="#E6DED4" strokeWidth="1" strokeDasharray="2 3" />

      {/* Spokes */}
      {axes.map((a) => {
        const end = pt(maxR, a.angleDeg);
        return (
          <line
            key={a.key}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="#E2D9CE"
            strokeWidth="1"
          />
        );
      })}

      {/* Data Polygon */}
      <polygon
        points={dataPoints}
        fill="url(#rcRadarFill)"
        stroke="#0073F5"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />

      {/* Data Vertices */}
      {axes.map((a) => {
        const clamped = Math.max(12, Math.min(100, a.val));
        const p = pt((clamped / 100) * maxR, a.angleDeg);
        return (
          <circle
            key={a.key}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="#F26A12"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        );
      })}

      {/* Top: Kelancaran */}
      <text
        x="180"
        y="22"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fill="#0B2559"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        Kelancaran
      </text>
      <text
        x="180"
        y="36"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="800"
        fill="#C2530A"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {dimensions.kelancaran}
      </text>

      {/* Right: Pelafalan */}
      <text
        x="278"
        y="106"
        textAnchor="start"
        fontSize="11.5"
        fontWeight="700"
        fill="#0B2559"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        Pelafalan
      </text>
      <text
        x="278"
        y="121"
        textAnchor="start"
        fontSize="11.5"
        fontWeight="800"
        fill="#C2530A"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {dimensions.pelafalan}
      </text>

      {/* Bottom Right: Mendengar */}
      <text
        x="244"
        y="234"
        textAnchor="start"
        fontSize="11.5"
        fontWeight="700"
        fill="#0B2559"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        Mendengar
      </text>
      <text
        x="244"
        y="249"
        textAnchor="start"
        fontSize="11.5"
        fontWeight="800"
        fill="#C2530A"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {dimensions.mendengar}
      </text>

      {/* Bottom Left: Ketepatan */}
      <text
        x="116"
        y="234"
        textAnchor="end"
        fontSize="11.5"
        fontWeight="700"
        fill="#0B2559"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        Ketepatan
      </text>
      <text
        x="116"
        y="249"
        textAnchor="end"
        fontSize="11.5"
        fontWeight="800"
        fill="#C2530A"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {dimensions.ketepatan}
      </text>

      {/* Left: Lintas Budaya */}
      <text
        x="82"
        y="102"
        textAnchor="end"
        fontSize="11.5"
        fontWeight="700"
        fill="#0B2559"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        Lintas
      </text>
      <text
        x="82"
        y="116"
        textAnchor="end"
        fontSize="11.5"
        fontWeight="700"
        fill="#0B2559"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        budaya
      </text>
      <text
        x="82"
        y="131"
        textAnchor="end"
        fontSize="11.5"
        fontWeight="800"
        fill="#C2530A"
        fontFamily="Plus Jakarta Sans, sans-serif"
      >
        {dimensions.lintasBudaya}
      </text>
    </svg>
  );
}
