import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const port = Number(process.env.PORT || 3000);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    let relativePath = decodeURIComponent(requestUrl.pathname);
    if (relativePath === "/") {
      relativePath = "/index.html";
    }

    const filePath = path.resolve(rootDir, "." + relativePath);
    if (filePath !== rootDir && !filePath.startsWith(rootDir + path.sep)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Доступ запрещён");
      return;
    }

    let targetPath = filePath;
    let stat = await fs.stat(targetPath);
    if (stat.isDirectory()) {
      targetPath = path.join(targetPath, "index.html");
      stat = await fs.stat(targetPath);
    }

    const content = await fs.readFile(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store",
    });
    res.end(content);
  } catch (error) {
    if (error?.code === "ENOENT") {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Файл не найден (404). Если вы делаете лабораторную, проверьте, что файл lab.html сохранён в корне проекта.");
      return;
    }
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Внутренняя ошибка сервера");
  }
});

server.listen(port, () => {
  console.log(`Сервер запущен: http://localhost:${port}`);
  console.log("Для лабораторной создайте lab.html в корне проекта и откройте /lab.html");
});
