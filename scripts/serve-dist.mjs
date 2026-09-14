import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { base } from "../site.config.mjs";

const root = resolve("dist");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".pdf": "application/pdf",
  ".woff": "font/woff", ".woff2": "font/woff2", ".png": "image/png" };
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith(base)) throw new Error("Outside project base");
    let file = resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
    if (file !== root && !file.startsWith(root + sep)) throw new Error("Outside dist");
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith("/")) {
        res.writeHead(301, { Location: `${url.pathname}/${url.search}` }); res.end(); return;
      }
      file = resolve(file, "index.html");
    }
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" });
    res.end(req.method === "HEAD" ? undefined : body);
  } catch { res.writeHead(404, { "Content-Type": "text/plain" }); res.end("Not found"); }
}).listen(Number(process.env.PORT ?? 4321), "127.0.0.1");
