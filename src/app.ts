import { Hono } from "hono";

export function createApp() {

  const app = new Hono();

  // Routes
  app.get("/health", (c) => {
    c.status(200);
    return c.json({ status: "ok" });
  });

  app.onError((err, c) => {
    console.error("Error:", err);
    return c.text("Internal Server Error", 500);
  });

  return app;
};
