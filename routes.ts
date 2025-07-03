import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const apiKey = process.env.UPSTAGE_API_KEY || "up_DYMaQNy182Y6aGaRJNQxXnvTcQ5di";
  
  console.log("Upstage API Key configured:", apiKey ? "✓" : "✗");

  // Document Parse endpoint
  app.post("/api/document-parse", upload.single('document'), async (req, res) => {
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

      // Create FormData for the API request
      const formData = new FormData();
      
      // Convert buffer to Blob then to File
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      const file = new File([blob], req.file.originalname || 'document', {
        type: req.file.mimetype
      });
      
      formData.append('document', file);
      formData.append('model', 'document-parse');
      // Removed output_format as it's not a valid field for Upstage API

      console.log("Making request to Upstage API...");
      
      const response = await fetch('https://api.upstage.ai/v1/document-digitization', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
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

  // Information Extract endpoint
  app.post("/api/information-extract", upload.single('document'), async (req, res) => {
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

      // Convert file to base64 using Node.js Buffer
      const base64Data = req.file.buffer.toString('base64');
      
      const requestBody = {
        model: 'information-extract',
        messages: [{
          role: 'user',
          content: [{
            type: 'image_url',
            image_url: {
              url: `data:${req.file.mimetype};base64,${base64Data}`
            }
          }]
        }],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'extraction_schema',
            schema: JSON.parse(schema)
          }
        }
      };

      console.log("Making request to Upstage Information Extract API...");

      const response = await fetch('https://api.upstage.ai/v1/information-extraction/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
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

  // Solar LLM Chat endpoint
  app.post("/api/solar-chat", async (req, res) => {
    try {
      console.log("Solar LLM chat request received");
      
      const { messages, reasoningEffort = 'medium', stream = false } = req.body;

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages format" });
      }

      console.log("Messages count:", messages.length);
      console.log("Reasoning effort:", reasoningEffort);

      const requestBody = {
        model: 'solar-pro2-preview',
        messages: messages,
        reasoning_effort: reasoningEffort,
        stream: stream,
        temperature: 0.1,
        max_tokens: 4000
      };

      console.log("Making request to Upstage Solar LLM API...");

      const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      upstageApiConfigured: !!apiKey,
      apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : "not configured",
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}