/* This code only serves for the porpuse of running a local dev server */
import http from "http";
import { IncomingMessage, ServerResponse } from "http";

import fs from "fs";
import path from "path";

const envFile = path.join(__dirname, ".env.local");
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, "utf8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key?.trim() && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
  console.log("✓ Loaded .env.local");
} else {
  console.warn("⚠️  No .env.local found — GROQ_API_KEY will be missing");
}

import handler from "./api/generate";

const PORT = process.env.PORT || 3001;

function createVercelMocks(req: IncomingMessage, res: ServerResponse) {
  let body = "";

  const vercelReq: any = req;
  const vercelRes: any = res;

  // mock .status().json() / .end()
  vercelRes.status = (code: number) => {
    res.statusCode = code;
    return {
      json: (data: any) => {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(data));
      },
      end: () => res.end(),
    };
  };
  vercelRes.json = (data: any) => {
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };
  vercelRes.setHeader = res.setHeader.bind(res);

  return new Promise<void>((resolve) => {
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        vercelReq.body = body ? JSON.parse(body) : {};
      } catch {
        vercelReq.body = {};
      }
      await handler(vercelReq, vercelRes);
      resolve();
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = req.url ?? "/";

  if (url === "/api/generate" || url === "/api/generate/") {
    await createVercelMocks(req, res);
  } else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: `No route for ${url}` }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Polish API running locally`);
  console.log(`   POST http://localhost:${PORT}/api/generate`);
  console.log(`\n   Test with:`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/generate \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"prompt":"make it dark and moody"}'\n`);
});
