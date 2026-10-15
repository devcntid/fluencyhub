export function EnrollmentBars({ points }: { points: Array<{ month: string; count: number }> }) {
  const mx = Math.max(1, ...points.map((p) => p.count));
  if (points.length === 0) {
    return <p className="text-sm text-[var(--text-3)]">No enrollments in the last 6 months.</p>;
  }
  return (
    <div className="bar-chart">
      {points.map((p) => (
        <div key={p.month} className="bar-col">
          <div className="bar-fill w-full max-w-[48px] mx-auto" style={{ height: `${(p.count / mx) * 90}px` }} />
          <p className="text-[10px] font-semibold text-[var(--text-4)]">{p.month}</p>
        </div>
      ))}
    </div>
  );
}
