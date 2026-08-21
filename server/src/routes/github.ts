import { Router } from "express";
import { getContributions, GitHubServiceError } from "../services/github.js";

const router = Router();

router.get("/contributions", async (req, res) => {
  try {
    const yearParam = req.query.year;
    let year: number | undefined;

    if (typeof yearParam === "string" && yearParam.trim() !== "") {
      const parsed = Number.parseInt(yearParam, 10);
      const currentYear = new Date().getUTCFullYear();
      if (
        Number.isNaN(parsed) ||
        parsed < 2005 ||
        parsed > currentYear
      ) {
        res.status(400).json({ error: "Invalid year parameter." });
        return;
      }
      year = parsed;
    }

    const data = await getContributions(year);
    res.json(data);
  } catch (err) {
    // Log full detail server-side only; the client always gets a generic message.
    console.error("[github/contributions] failed:", err);

    if (err instanceof GitHubServiceError) {
      res.status(err.status).json({ error: "Unable to load GitHub contributions." });
      return;
    }
    res.status(500).json({ error: "Unable to load GitHub contributions." });
  }
});

export default router;
