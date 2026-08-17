export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/qd-icon.webp?v=2"
      width={size}
      height={size}
      alt=""
      className={`rounded-full object-cover ${className}`}
      aria-hidden
    />
  );
}
