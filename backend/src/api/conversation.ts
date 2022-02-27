import express from "express";
import { Sheets } from "../sheets";
import { getMentors } from "./util";

// Router for conversation system
export function createConversationRouter(sheets: Sheets) {
  const router = express.Router();

  // See who a user is currently talking to
  // Works for both mentors and clients
  router.get("/api/mentors/conversation/lookup/:id", async (req, res, next) => {
    const id = req.params.id;

    const mentors = await getMentors(sheets);
    for (const mentor of mentors) {
      if (mentor.userID === id && mentor.client !== null) {
        return res.json({
          status: "ok",
          isMentor: false,
          userID: mentor.client,
        });
      }
      if (mentor.client === id) {
        return res.json({
          status: "ok",
          isMentor: true,
          userID: mentor.userID,
        });
      }
    }
    return res.json({
      status: "not-in-conversation",
    });
  });

  // Set the person that a mentor is having a conversation with
  router.post("/api/mentors/conversation", async (req, res, next) => {
    const userID = req.body.userID;
    if (userID === undefined) {
      return next(new Error("JSON missing parameter: userID"));
    }
    const client = req.body.client;
    if (client === undefined) {
      return next(new Error("JSON missing parameter: client"));
    }

    // Retrieve the mentor from the database
    const mentors = await getMentors(sheets);
    const index = mentors.findIndex((m) => m.userID === userID);
    if (index === -1) {
      return res.json({
        status: "not-a-mentor",
      });
    }
    const mentor = mentors[index];

    if (client !== null) {
      // Check if mentor has a client
      if (mentor.client !== null) {
        return res.json({
          status: "mentor-in-conversation",
        });
      }
      // Check if client in conversation
      const foundMentor = mentors.find((m) => m.client === client);
      if (foundMentor !== undefined) {
        return res.json({
          status: "client-in-conversation",
        });
      }
      // Check if mentor is on do not disturb
      if (mentor.doNotDisturb !== "off") {
        return res.json({
          status: "mentor-is-dnd",
        });
      }
      // Check if client is a mentor
      const foundMentorClient = mentors.find((m) => m.userID === client);
      if (foundMentorClient !== undefined) {
        return res.json({
          status: "client-is-mentor",
        });
      }
      // Success!
      await sheets.updateCell("Mentors", index, 2, client);
      return res.json({
        status: "ok",
        mentor: {
          userID: mentor.userID,
          doNotDisturb: mentor.doNotDisturb,
          client,
        },
      });
    } else {
      // Check if the mentor is already not in a conversation
      if (mentor.client === null) {
        return res.json({
          status: "not-in-conversation",
        });
      }
      // Success!
      await sheets.updateCell("Mentors", index, 2, "null");
      return res.json({
        status: "ok",
        mentor: {
          userID: mentor.userID,
          doNotDisturb: mentor.doNotDisturb,
          client: null,
        },
      });
    }
  });

  return router;
}
