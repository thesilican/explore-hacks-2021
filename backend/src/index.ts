import env from "./env";
import express from "express";
import { Sheets } from "./sheets";
import { createMLRouter } from "./api/ml";
import { createMentorRouter } from "./api/mentor";
import { createDoNotDisturbRouter } from "./api/donotdisturb";
import { createConversationRouter } from "./api/conversation";
import { createFeedbackRouter } from "./api/feedback";
import path from "path";

async function main() {
  // Connect to Google Sheets
  const sheets = new Sheets(env.googleAuth, env.sheetsID);
  await sheets.connect();

  // Create HTTP server
  const app = express();
  app.use(express.json());

  // Ping
  app.get("/api/ping", (req, res) => {
    res.type("txt").send("Pong!");
  });

  // APIs
  app.use(createMLRouter());
  app.use(createMentorRouter(sheets));
  app.use(createDoNotDisturbRouter(sheets));
  app.use(createConversationRouter(sheets));
  app.use(createFeedbackRouter(sheets));

  // Website
  app.use("/", express.static(path.join(process.cwd(), "../frontend/")));
  app.use("/", (req, res) => {
    res.sendFile(path.join(process.cwd(), "../frontend/index.html"));
  });

  // Start server
  const server = app.listen(8080, () => {
    console.log("Starting server on port 8080");
  });

  // Handle exit signals (e.g. Ctrl-C)
  function handleExit() {
    server.close();
  }
  process.on("SIGINT", handleExit);
  process.on("SIGTERM", handleExit);
}

main();
