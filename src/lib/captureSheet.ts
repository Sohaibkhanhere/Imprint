import { PAGE_DIMS } from "../templates/shared";

function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  ).then(() => undefined);
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function captureCanvas(sheet: HTMLElement, pageW: number, pageH: number): Promise<HTMLCanvasElement> {
  const host = document.createElement("div");
  host.setAttribute("data-sheet-capture", "true");
  host.style.cssText = "position:absolute;left:-200vw;top:0;pointer-events:none;";
  const clone = sheet.cloneNode(true) as HTMLElement;
  clone.style.transform = "none";
  clone.style.width = `${pageW}px`;
  clone.style.maxWidth = `${pageW}px`;
  clone.style.height = `${pageH}px`;
  clone.style.minHeight = `${pageH}px`;
  clone.style.maxHeight = `${pageH}px`;
  clone.style.overflow = "hidden";
  clone.style.margin = "0";
  clone.style.boxShadow = "none";
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    await document.fonts.ready;
    await waitForImages(clone);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

    const { toCanvas } = await import("html-to-image");
    const source = await withTimeout(
      toCanvas(clone, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#ffffff",
        skipAutoScale: true,
        width: pageW,
        height: pageH,
        canvasWidth: Math.round(pageW * 2),
        canvasHeight: Math.round(pageH * 2),
        style: { transform: "none", width: `${pageW}px`, height: `${pageH}px`, overflow: "hidden" },
        filter: (node) => !node.classList?.contains("no-print"),
        onImageErrorHandler: () => undefined,
      }),
      20000,
      "Export timed out while capturing the resume.",
    );

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = Math.round(pageW * 2);
    pageCanvas.height = Math.round(pageH * 2);
    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Could not draw the resume page.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(source, 0, 0, pageCanvas.width, pageCanvas.height);
    return pageCanvas;
  } finally {
    host.remove();
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("Could not encode the resume page."));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function captureSheetPng(sheet: HTMLElement, pageW: number, pageH: number): Promise<Uint8Array> {
  const canvas = await captureCanvas(sheet, pageW, pageH);
  const blob = await canvasToBlob(canvas, "image/png");
  return new Uint8Array(await blob.arrayBuffer());
}

export async function captureSheetJpeg(sheet: HTMLElement, pageW: number, pageH: number): Promise<{ data: Uint8Array; width: number; height: number }> {
  const canvas = await captureCanvas(sheet, pageW, pageH);
  const blob = await canvasToBlob(canvas, "image/jpeg", 0.92);
  return { data: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
}

export function sheetPageSize(pageSize: "a4" | "letter" | undefined) {
  return PAGE_DIMS[pageSize ?? "a4"] ?? PAGE_DIMS.a4;
}
