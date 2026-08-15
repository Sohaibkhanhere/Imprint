import type { Resume } from "../lib/types";
import { exportFilename } from "./date";

const PRINT_STYLE_ID = "rs-print-style";

export function applyPageStyle(size: "a4" | "letter") {
  let style = document.getElementById(PRINT_STYLE_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = PRINT_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = `@page { size: ${size === "a4" ? "A4" : "Letter"}; margin: 0; }`;
}

export function exportPdf(resume: Resume): void {
  applyPageStyle(resume.theme.pageSize);
  const prevTitle = document.title;
  document.title = exportFilename(resume.contact);
  requestAnimationFrame(() => {
    window.print();
    requestAnimationFrame(() => {
      document.title = prevTitle;
    });
  });
}
