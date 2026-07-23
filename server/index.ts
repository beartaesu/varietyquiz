import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = new Set([
  "https://varietyquizquiz.com",
  "https://www.varietyquizquiz.com",
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  ...String(process.env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean),
]);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (app.get("env") === "production") res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use((req, res, next) => {
  if (app.get("env") !== "production") return next();
  try {
    const normalizedPath = decodeURIComponent(req.path).replace(/\\/g, "/");
    const sensitive = /(^|\/)(?:\.env(?:\.|$)|\.git(?:\/|$)|server(?:\/|$)|shared(?:\/|$)|client\/src(?:\/|$)|src(?:\/|$)|node_modules(?:\/|$)|server-simple\.js$|package(?:-lock)?\.json$|tsconfig\.json$|vite\.config\.[jt]s$)/i;
    if (normalizedPath.includes("..") || sensitive.test(normalizedPath)) return res.status(404).send("Not found");
    next();
  } catch {
    res.status(400).send("Bad request");
  }
});

// 필요한 서비스 출처에만 API 접근을 허용합니다.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = !origin || allowedOrigins.has(origin);
  if (origin && allowed) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Vary", "Origin");
  }
  if (req.method === 'OPTIONS') {
    if (!allowed) return res.sendStatus(403);
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // static 파일 서빙 설정 (개발/프로덕션 모두)
  app.use(express.static(path.resolve(process.cwd(), 'dist/public')));
  app.use('/images', express.static(path.resolve(process.cwd(), 'dist/public/images')));
  
  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // API 우선순위 확보를 위한 미들웨어
    app.use('/api/*', (req, res, next) => {
      console.log(`⚠️ [PRODUCTION] API 요청이 static 핸들러에 도달: ${req.path}`);
      res.status(404).json({ message: `API route not found: ${req.path}` });
    });
    
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    ...(process.platform === "win32" ? {} : { reusePort: true }),
  }, () => {
    log(`serving on port ${port}`);
  });
})();
