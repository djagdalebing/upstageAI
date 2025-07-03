import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch";
import FormData from "form-data";

const app = express();
const upload = multer();
const PORT = 4000;

const API_KEY = "up_DYMaQNy182Y6aGaRJNQxXnvTcQ5di";

app.use(cors());

app.post("/api/parse-document", upload.single("file"), async (req, res) => {
  console.log("Step 1: Received request to /api/parse-document");
  
  if (!req.file) {
    console.log("Step 2: No file uploaded - returning error");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log("Step 2: File received:", {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  try {
    console.log("Step 3: Creating FormData for Upstage API");
    const formData = new FormData();
    formData.append("document", req.file.buffer, req.file.originalname);
    formData.append("ocr", "auto");
    formData.append("coordinates", "true");
    formData.append("model", "document-parse");

    console.log("Step 4: FormData created with parameters:", {
      document: req.file.originalname,
      ocr: "auto",
      coordinates: "true",
      model: "document-parse"
    });

    console.log("Step 5: Making request to Upstage API");
    const response = await fetch("https://api.upstage.ai/v1/document-digitization", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    console.log("Step 6: Received response from Upstage API:", {
      status: response.status,
      statusText: response.statusText
    });

    const result = await response.json();
    console.log("Step 7: Parsed response JSON:", {
      success: response.ok,
      resultKeys: Object.keys(result)
    });

    if (!response.ok) {
      console.log("Step 8: API request failed with error:", result);
    } else {
      console.log("Step 8: API request successful");
    }

    res.status(response.status).json(result);
  } catch (err) {
    console.error("Step X: Proxy error occurred:", err);
    res.status(500).json({ error: "Proxy request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});