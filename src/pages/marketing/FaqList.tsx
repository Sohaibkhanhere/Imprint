import { Link } from "react-router-dom";
import type { FaqItem } from "../../seo/brand";

export function FaqList({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-stone-300 border-y border-stone-300">
      {items.map((item) => (
        <details key={item.q} className="group py-4">
          <summary className="cursor-pointer list-none text-base font-semibold text-stone-900 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-start justify-between gap-4">
              {item.q}
              <span className="text-amber-500 group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-stone-600">{item.a}</p>
        </details>
      ))}
      <p className="sr-only">
        <Link to="/app">Open the builder</Link>
      </p>
    </div>
  );
}
