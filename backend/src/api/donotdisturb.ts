import express from "express";
import { Sheets } from "../sheets";
import { parseDate } from "chrono-node";
import { getMentors } from "./util";

// Pretty format a date
function prettyDate(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Toronto",
  });
}

// Router for the do not disturb system
export function createDoNotDisturbRouter(sheets: Sheets) {
  const router = express.Router();

  // Update a mentor's do-not disturb status
  router.post("/api/mentors/do-not-disturb", async (req, res, next) => {
    const userID = req.body.userID;
    if (userID === undefined) {
      return next(new Error("JSON missing property: userID"));
    }
    const doNotDisturb = req.body.doNotDisturb;
    if (doNotDisturb === undefined) {
      return next(new Error("JSON missing property: doNotDisturb"));
    }

    // Find the mentor from the database
    const mentors = await getMentors(sheets);
    let index: number | null = null;
    for (let i = 0; i < mentors.length; i++) {
      const mentor = mentors[i];
      if (mentor.userID === userID) {
        index = i;
        break;
      }
    }
    if (index === null) {
      return res.json({
        status: "not-a-mentor",
      });
    }
    const mentor = mentors[index];

    // Special case if doNotDisturb is "always" or "off"
    if (doNotDisturb === "always" || doNotDisturb === "off") {
      await sheets.updateCell("Mentors", index, 1, doNotDisturb);
      return res.json({
        status: "ok",
        mentor: {
          userID: mentor.userID,
          doNotDisturb,
          client: mentor.client,
        },
        date: null,
      });
    }

    // Try to parse date using chrono-node
    const date = parseDate(
      doNotDisturb,
      { timezone: "EDT" },
      { forwardDate: true }
    );
    if (date === null) {
      return res.json({
        status: "invalid-date",
      });
    } else {
      await sheets.updateCell("Mentors", index, 1, date.toISOString());
      return res.json({
        status: "ok",
        mentor: {
          userID: mentor.userID,
          doNotDisturb: date.toISOString(),
          client: mentor.client,
        },
        date: prettyDate(date),
      });
    }
  });

  return router;
}
