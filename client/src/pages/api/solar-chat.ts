// pages/api/solar-chat.ts
import type { NextApiRequest, NextApiResponse } from "next";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "up_DYMaQNy182Y6aGaRJNQxXnvTcQ5di",
  baseURL: "https://api.upstage.ai/v1",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { messages, reasoningEffort } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }

    const completion = await openai.chat.completions.create({
      model: "solar-pro2-preview",
      messages,
      reasoning_effort: reasoningEffort || "high",
      stream: false,
    });

    return res.status(200).json(completion);
  } catch (error: any) {
    console.error("API error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
