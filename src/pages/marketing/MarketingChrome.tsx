import { Link, NavLink } from "react-router-dom";
import type { ReactNode } from "react";
import { BrandMark } from "../../components/BrandMark";
import { BRAND, MAKER, MAKER_URL } from "../../seo/brand";

export function MarketingChrome({ children }: { children: ReactNode }) {
  return (
    <div className="qd-marketing-page min-h-[100dvh] bg-stone-100 text-stone-900">
      <header className="border-b border-stone-300 bg-stone-50">
        <div className="masthead-rule" />
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="group flex min-w-0 items-center gap-2.5">
            <BrandMark size={36} />
            <span className="qd-lockup">
              <span className="qd-lockup-name">Resume Maker</span>
              <span className="qd-lockup-by">by QD</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-1 sm:gap-2" aria-label="Site">
            <NavLink to="/why" className={navClass}>
              Why
            </NavLink>
            <NavLink to="/compare" className={navClass}>
              Compare
            </NavLink>
            <NavLink to="/app" className={navClass}>
              Builder
            </NavLink>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-stone-300 bg-stone-50">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <p>
            Resume Maker by{" "}
            <a
              className="font-semibold text-stone-800 underline decoration-amber-500/60 underline-offset-2 hover:text-amber-600"
              href={MAKER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              {MAKER}
            </a>
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <a className="text-stone-700 hover:text-amber-600" href={MAKER_URL} target="_blank" rel="noopener noreferrer">
              {MAKER}
            </a>
            <Link className="text-stone-700 hover:text-amber-600" to="/">
              Home
            </Link>
            <Link className="text-stone-700 hover:text-amber-600" to="/why">
              Why choose {BRAND}
            </Link>
            <Link className="text-stone-700 hover:text-amber-600" to="/compare">
              Comparisons
            </Link>
            <Link className="text-stone-700 hover:text-amber-600" to="/app">
              Builder
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

function navClass({ isActive }: { isActive: boolean }) {
  return `inline-flex min-h-10 items-center px-2 text-sm font-medium ${
    isActive ? "text-amber-600" : "text-stone-500 hover:text-stone-900"
  }`;
}
