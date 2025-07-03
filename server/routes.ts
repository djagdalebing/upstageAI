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

  // Document Parse endpoint - now uses Information Extract API
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

      // Convert file to base64 using Node.js Buffer
      const base64Data = req.file.buffer.toString('base64');
      
      // Define a comprehensive schema for contract information extraction
      const contractSchema = {
        type: "object",
        properties: {
          documentText: {
            type: "string",
            description: "Complete extracted text content from the document"
          },
          contractType: {
            type: "object",
            properties: {
              category: {
                type: "string",
                description: "Main contract category (Real Estate, Employment, Service Agreement, Lease, Purchase, Partnership, NDA, License, Other)"
              },
              subcategory: {
                type: "string", 
                description: "Specific contract subtype"
              },
              description: {
                type: "string",
                description: "Brief description of what this contract governs"
              }
            }
          },
          parties: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "Full legal name of party" },
                role: { type: "string", description: "Role in contract (Landlord, Tenant, Buyer, Seller, etc.)" },
                contact: { type: "string", description: "Contact information if available" }
              }
            }
          },
          financialTerms: {
            type: "object",
            properties: {
              totalValue: { type: "string", description: "Total contract value with currency" },
              currency: { type: "string", description: "Currency used" },
              paymentSchedule: { type: "string", description: "Payment schedule and frequency" },
              penalties: { type: "string", description: "Late fees, penalties, or liquidated damages" },
              deposits: { type: "string", description: "Security deposits or advance payments" }
            }
          },
          importantDates: {
            type: "object",
            properties: {
              effectiveDate: { type: "string", description: "Contract start date" },
              expirationDate: { type: "string", description: "Contract end date" },
              renewalDate: { type: "string", description: "Renewal or extension dates" },
              noticePeriod: { type: "string", description: "Required notice period for termination" },
              keyMilestones: {
                type: "array",
                items: { type: "string" },
                description: "Important deadlines and milestones"
              }
            }
          },
          keyTerms: {
            type: "object",
            properties: {
              terminationClause: { type: "string", description: "How the contract can be terminated" },
              liabilityLimits: { type: "string", description: "Liability limitations and caps" },
              intellectualProperty: { type: "string", description: "IP ownership and usage rights" },
              confidentiality: { type: "string", description: "Confidentiality terms" },
              disputeResolution: { type: "string", description: "How disputes will be resolved" },
              governingLaw: { type: "string", description: "Which jurisdiction's laws apply" }
            }
          },
          obligations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                party: { type: "string", description: "Party name" },
                obligations: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific obligations and responsibilities"
                },
                deliverables: {
                  type: "array", 
                  items: { type: "string" },
                  description: "What must be delivered"
                },
                deadlines: {
                  type: "array",
                  items: { type: "string" },
                  description: "When deliverables are due"
                }
              }
            }
          }
        },
        required: ["documentText", "contractType", "parties", "financialTerms", "importantDates", "keyTerms", "obligations"]
      };

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
            name: 'contract_extraction_schema',
            schema: contractSchema
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
      
      // Extract the content from the response
      const extractedContent = result.choices?.[0]?.message?.content;
      
      if (!extractedContent) {
        throw new Error("No content extracted from document");
      }

      // Parse the extracted JSON content
      let parsedContent;
      try {
        parsedContent = JSON.parse(extractedContent);
      } catch (e) {
        console.error("Failed to parse extracted content as JSON:", e);
        throw new Error("Failed to parse extracted content");
      }

      // Return the parsed content in a format compatible with the frontend
      res.json({
        elements: [{
          content: {
            text: parsedContent.documentText || "No text content extracted"
          }
        }],
        content: {
          text: parsedContent.documentText || "No text content extracted"
        },
        extractedData: parsedContent
      });
      
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