import { lazy, Suspense, useEffect, useLayoutEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

const App = lazy(() => import("./App").then((m) => ({ default: m.App })));
const LandingPage = lazy(() => import("./pages/marketing/LandingPage").then((m) => ({ default: m.LandingPage })));
const WhyPage = lazy(() => import("./pages/marketing/WhyPage").then((m) => ({ default: m.WhyPage })));
const CompareHubPage = lazy(() => import("./pages/marketing/ComparePage").then((m) => ({ default: m.CompareHubPage })));
const ComparePage = lazy(() => import("./pages/marketing/ComparePage").then((m) => ({ default: m.ComparePage })));

function RouteEffects() {
  const location = useLocation();

  useLayoutEffect(() => {
    const app = location.pathname === "/app";
    document.documentElement.classList.toggle("qd-app", app);
    document.documentElement.classList.toggle("qd-marketing", !app);
    document.getElementById("geo-static")?.remove();
  }, [location.pathname]);

  useEffect(() => {
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.pathname, location.hash]);

  return null;
}

function Fallback() {
  return <div className="min-h-[40vh] bg-stone-100" />;
}

export function Root() {
  return (
    <BrowserRouter>
      <RouteEffects />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/why" element={<WhyPage />} />
          <Route path="/compare" element={<CompareHubPage />} />
          <Route path="/vs/:slug" element={<ComparePage />} />
          <Route path="/app" element={<App />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
