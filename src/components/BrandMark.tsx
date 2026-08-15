export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="#1c1b17" />
      <rect x="8" y="8" width="14" height="18" rx="1.5" fill="#e8e2d4" />
      <rect x="11" y="6" width="14" height="18" rx="1.5" fill="#faf9f6" />
      <rect x="14" y="11" width="8" height="1.6" rx="0.8" fill="#1c1b17" />
      <rect x="14" y="15" width="6" height="1.6" rx="0.8" fill="#1c1b17" />
      <rect x="14" y="19" width="7" height="1.6" rx="0.8" fill="#1c1b17" />
      <rect x="22" y="22" width="6" height="6" rx="1.2" fill="#b0302a" />
    </svg>
  );
}
