import "dotenv/config";
import express from "express";
import cors from "cors";
import githubRouter from "./routes/github.js";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// In production, lock this down to your deployed frontend origin via
// the CORS_ORIGIN env var. Falls back to "*" for local development.
const allowedOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/github", githubRouter);

// Fallback 404 for unknown API routes — no internal detail leaked.
app.use("/api", (_req, res) => {
  res.status(404).json({ error: "Not found." });
});

app.listen(PORT, () => {
  console.log(`GitHub Contribution Widget API listening on port ${PORT}`);
});
