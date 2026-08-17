export function AtsScoreRing({
  value,
  size = 72,
  className = "",
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  const stroke = Math.max(7, size * 0.145);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const disc = size - stroke * 1.08;
  const font = Math.max(11, size * 0.22);

  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`ATS Compatibility Score ${pct} percent. Not a guarantee.`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block -rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e0e0e0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#32cd32"
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct / 100)}
          strokeLinecap="butt"
          style={{ transition: "stroke-dashoffset 220ms cubic-bezier(0.23, 1, 0.32, 1)" }}
        />
      </svg>
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 flex items-center justify-center rounded-full bg-white"
        style={{
          width: disc,
          height: disc,
          transform: "translate(-50%, -50%)",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.16)",
        }}
      >
        <span className="font-sans font-bold leading-none text-black tabular-nums" style={{ fontSize: font }}>
          {pct}%
        </span>
      </span>
    </div>
  );
}
