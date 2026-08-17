export function BrandMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <img
      src="/qd-icon.webp?v=3"
      width={size}
      height={size}
      alt=""
      className={`rounded-[7px] object-contain ${className}`}
      aria-hidden
    />
  );
}
