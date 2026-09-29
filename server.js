import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { HindsightClient } from "@vectorize-io/hindsight-client";

dotenv.config();

const app = express();

const PORT = 5000;
const BANK_ID = "contentdna-demo";

app.use(cors());
app.use(express.json());

const hindsight = new HindsightClient({
  baseUrl: process.env.HINDSIGHT_BASE_URL || "http://localhost:8888",
  apiKey: process.env.HINDSIGHT_API_KEY || undefined,
});

/* =========================
   TEST BACKEND
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "ContentDNA backend is running",
  });
});

/* =========================
   SAVE MEMORY
========================= */

app.post("/api/agent/learn", async (req, res) => {
  try {
    const {
      posts = [],
      brandVoice = "",
      topics = [],
      feedback = "",
    } = req.body;

    const memoryContent = `
ContentDNA Creator Information

Brand Voice:
${brandVoice || "Not provided"}

Topics:
${Array.isArray(topics) ? topics.join(", ") : "Not provided"}

Published Content:
${JSON.stringify(posts, null, 2)}

Creator Feedback:
${feedback || "No additional feedback provided"}
`;

    await hindsight.retain(
      BANK_ID,
      memoryContent
    );

    res.json({
      success: true,
      message: "Memory saved successfully in Hindsight.",
    });
  } catch (error) {
    console.error("LEARN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save memory.",
      error: error.message,
    });
  }
});

/* =========================
   ASK AI AGENT
========================= */

app.post("/api/agent/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const result = await hindsight.reflect(
      BANK_ID,
      question.trim()
    );

    res.json({
      success: true,
      answer:
        result?.text ||
        "The agent could not generate a response.",
    });
  } catch (error) {
    console.error("ASK ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get agent response.",
      error: error.message,
    });
  }
});

/* =========================
   GET MEMORIES
========================= */

app.get("/api/agent/memories", async (req, res) => {
  try {
    const result = await hindsight.recall(
      BANK_ID,
      "ContentDNA creator content strategy brand voice topics performance"
    );

    const memories = Array.isArray(result?.results)
      ? result.results
          .map((item) => item.text)
          .filter(Boolean)
          .slice(0, 20)
      : [];

    res.json({
      success: true,
      memories,
    });
  } catch (error) {
    console.error("MEMORIES ERROR:", error);

    res.status(500).json({
      success: false,
      memories: [],
      message: "Failed to load memories.",
      error: error.message,
    });
  }
});

/* =========================
   START SERVER
========================= */

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("      ContentDNA Backend");
  console.log("=================================");
  console.log(`Backend:  http://localhost:${PORT}`);
  console.log(
    `Hindsight: ${
      process.env.HINDSIGHT_BASE_URL || "http://localhost:8888"
    }`
  );
  console.log(`Memory Bank: ${BANK_ID}`);
  console.log("=================================");
  console.log("");
});