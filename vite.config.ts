import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function servePdfjsFonts(): Plugin {
  const fontsDir = path.resolve(__dirname, "node_modules/pdfjs-dist/standard_fonts");
  const mime = (file: string) =>
    file.endsWith(".ttf") ? "font/ttf" : file.endsWith(".pfb") ? "application/x-font-type1" : "application/octet-stream";
  const handle = (url: string, res: { setHeader: (k: string, v: string) => void; end: (b?: Buffer) => void; statusCode: number }, next: () => void) => {
    const rel = decodeURIComponent((url || "/").split("?")[0]).replace(/^\/+/, "");
    if (!rel || rel.includes("..")) return next();
    const file = path.join(fontsDir, rel);
    if (!file.startsWith(fontsDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return next();
    res.setHeader("Content-Type", mime(file));
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(fs.readFileSync(file));
  };
  return {
    name: "pdfjs-standard-fonts",
    configureServer(server) {
      server.middlewares.use("/standard_fonts", (req, res, next) => handle(req.url || "", res, next));
    },
    configurePreviewServer(server) {
      server.middlewares.use("/standard_fonts", (req, res, next) => handle(req.url || "", res, next));
    },
    closeBundle() {
      if (!fs.existsSync(fontsDir)) return;
      const dest = path.resolve(__dirname, "dist/standard_fonts");
      fs.mkdirSync(dest, { recursive: true });
      for (const f of fs.readdirSync(fontsDir)) {
        fs.copyFileSync(path.join(fontsDir, f), path.join(dest, f));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), servePdfjsFonts()],
  server: { port: 5173 },
  build: { target: "es2020" },
});
