import express from "express";
import { Sheets } from "../sheets";
import { getMentors } from "./util";

// Router for functions related to creating, updating,
// and removing mentors from the system
export function createMentorRouter(sheets: Sheets) {
  const router = express.Router();

  // Get all the mentors in the system
  router.get("/api/mentors", async (req, res) => {
    const mentors = await getMentors(sheets);
    return res.json({
      mentors,
    });
  });

  // Get only mentors who are available to talk
  router.get("/api/mentors/available", async (req, res) => {
    const now = new Date();
    const mentors = await getMentors(sheets);
    const availableMentors = mentors.filter(
      (mentor) => mentor.doNotDisturb === "off" && mentor.client === null
    );

    return res.json({
      mentors: availableMentors,
    });
  });

  // Sign up a new mentor in the system
  router.post("/api/mentors", async (req, res, next) => {
    const userID = req.body.userID;
    if (userID === undefined) {
      return next(new Error("JSON missing property: userID"));
    }
    const mentors = await getMentors(sheets);
    for (const mentor of mentors) {
      if (mentor.userID === userID) {
        return res.json({
          status: "already-signed-up",
        });
      }
    }
    await sheets.appendRow("Mentors", [userID, "off", "null"]);
    return res.json({
      status: "ok",
      mentor: {
        userID,
        doNotDisturb: "off",
        client: null,
      },
    });
  });

  // Withdraw a mentor from the system
  router.delete("/api/mentors", async (req, res, next) => {
    const userID = req.body.userID;
    if (userID === undefined) {
      return next(new Error("JSON missing property: userID"));
    }
    const mentors = await getMentors(sheets);
    for (let i = 0; i < mentors.length; i++) {
      const mentor = mentors[i];
      if (mentor.userID === userID) {
        await sheets.deleteRow("Mentors", i);
        return res.json({
          status: "ok",
        });
      }
    }
    return res.json({
      status: "id-does-not-exist",
    });
  });

  return router;
}
