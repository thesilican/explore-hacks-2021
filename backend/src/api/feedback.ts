import express from "express";
import { Sheets } from "../sheets";

// Router for the user feedback/testimonial system
export function createFeedbackRouter(sheets: Sheets) {
  const router = express.Router();

  // Gets all user feedback messages (anonymized)
  router.get("/api/feedback", async (req, res) => {
    const rows = await sheets.readSheet("Feedback");
    const messages = rows.map((row) => row[1]);

    return res.json({ messages });
  });

  // Post a new piece of user feedback
  router.post("/api/feedback", async (req, res, next) => {
    const userID = req.body.userID;
    if (userID === undefined) {
      return next(new Error("JSON missing property: userID"));
    }
    const message = req.body.message;
    if (message === undefined) {
      return next(new Error("JSON missing property: message"));
    }

    await sheets.appendRow("Feedback", [userID, message]);

    return res.json({ status: "ok" });
  });

  // Get a random user feedback message
  router.get("/api/feedback/random", async (req, res) => {
    const rows = await sheets.readSheet("Feedback");
    const messages = rows.map((row) => row[1]);
    if (messages.length === 0) {
      return res.json({
        message: "",
      });
    }
    const message = messages[Math.floor(Math.random() * messages.length)];
    return res.json({ message });
  });
  return router;
}
