// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import multer from "multer";
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024
    // 50MB limit
  }
});
async function registerRoutes(app2) {
  const apiKey = process.env.UPSTAGE_API_KEY || "up_DYMaQNy182Y6aGaRJNQxXnvTcQ5di";
  console.log("Upstage API Key configured:", apiKey ? "\u2713" : "\u2717");
  app2.post("/api/document-parse", upload.single("document"), async (req, res) => {
    try {
      console.log("Document parse request received");
      if (!req.file) {
        console.log("No file provided");
        return res.status(400).json({ error: "No document file provided" });
      }
      console.log("File details:", {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      const file = new File([blob], req.file.originalname || "document", {
        type: req.file.mimetype
      });
      formData.append("document", file);
      formData.append("model", "document-parse");
      console.log("Making request to Upstage API...");
      const response = await fetch("https://api.upstage.ai/v1/document-digitization", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`
        },
        body: formData
      });
      console.log("Upstage API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upstage API error:", errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log("Document parse successful, elements count:", result.elements?.length || 0);
      res.json(result);
    } catch (error) {
      console.error("Document parse error:", error);
      res.status(500).json({
        error: "Failed to parse document",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/information-extract", upload.single("document"), async (req, res) => {
    try {
      console.log("Information extract request received");
      if (!req.file) {
        return res.status(400).json({ error: "No document file provided" });
      }
      const { schema } = req.body;
      if (!schema) {
        return res.status(400).json({ error: "No schema provided" });
      }
      console.log("File details:", {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype
      });
      const base64Data = req.file.buffer.toString("base64");
      const requestBody = {
        model: "information-extract",
        messages: [{
          role: "user",
          content: [{
            type: "image_url",
            image_url: {
              url: `data:${req.file.mimetype};base64,${base64Data}`
            }
          }]
        }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "extraction_schema",
            schema: JSON.parse(schema)
          }
        }
      };
      console.log("Making request to Upstage Information Extract API...");
      const response = await fetch("https://api.upstage.ai/v1/information-extraction/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      console.log("Upstage API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upstage API error:", errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log("Information extract successful");
      res.json(result);
    } catch (error) {
      console.error("Information extract error:", error);
      res.status(500).json({
        error: "Failed to extract information",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.post("/api/solar-chat", async (req, res) => {
    try {
      console.log("Solar LLM chat request received");
      const { messages, reasoningEffort = "medium", stream = false } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }
      console.log("Messages count:", messages.length);
      console.log("Reasoning effort:", reasoningEffort);
      const requestBody = {
        model: "solar-pro2-preview",
        messages,
        reasoning_effort: reasoningEffort,
        stream,
        temperature: 0.1,
        max_tokens: 4e3
      };
      console.log("Making request to Upstage Solar LLM API...");
      const response = await fetch("https://api.upstage.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      console.log("Upstage API response status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upstage API error:", errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();
      console.log("Solar LLM chat successful");
      res.json(result);
    } catch (error) {
      console.error("Solar LLM chat error:", error);
      res.status(500).json({
        error: "Failed to chat with Solar LLM",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
  app2.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      upstageApiConfigured: !!apiKey,
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : "not configured",
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 8e3;
  server.listen({
    port,
    host: "127.0.0.1",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
