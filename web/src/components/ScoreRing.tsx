export function ScoreRing({ value, label }: { value: number; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
  return (
    <figure className="flex flex-col items-center gap-2">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`${label}: ${value} of 100`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke="#C9A15B" strokeWidth="10"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="76" textAnchor="middle" fill="currentColor" fontSize="28" fontFamily="Fraunces, Georgia, serif">
          {value}
        </text>
      </svg>
      <figcaption className="text-sm opacity-70">{label}</figcaption>
    </figure>
  );
}
