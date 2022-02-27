import express from "express";
import fetch from "node-fetch";
import { URL } from "url";
import env from "../env";

// Router for machine-learning related tasks
export function createMLRouter() {
  const router = express.Router();

  // API to determine whether or not a message is unhealthy (at risk)
  router.post("/api/is-message-unhealthy", async (req, res, next) => {
    const message = req.body.message;
    if (message === undefined) {
      return next(new Error("JSON missing property: message"));
    }

    // Makes an API call to the python ML evaluation server
    const url = new URL(env.mlServer);
    url.searchParams.append("message", message);
    const result = await fetch(url).then((x) => x.text());

    return res.json({
      status: "ok",
      result: result === "true" ? true : false,
    });
  });

  return router;
}
