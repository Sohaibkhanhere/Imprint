export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/qd-icon.webp"
      width={size}
      height={size}
      alt=""
      className={`rounded-full object-cover ring-1 ring-amber-500/35 ${className}`}
      aria-hidden
    />
  );
}
