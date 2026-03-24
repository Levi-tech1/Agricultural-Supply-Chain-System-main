import app, { PORT } from "./app.js";
import { connectDB } from "./db.js";
import { seedOwner } from "./seedOwner.js";
import { seedSampleUsers } from "./seedSampleUsers.js";

if (process.env.VERCEL !== "1") {
  connectDB()
    .then(() => seedOwner().catch((err) => console.warn("Seed owner failed at startup:", err.message)))
    .then(() => seedSampleUsers().catch((err) => console.warn("Seed sample users failed at startup:", err.message)))
    .then(() => {
      const server = app.listen(PORT, () => {
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        console.log(`\n  Backend API:  http://localhost:${PORT}`);
        console.log(`  Frontend app: ${frontendUrl}\n  Open in browser: ${frontendUrl}\n`);
      });

      server.on("error", (err) => {
        if (err?.code === "EADDRINUSE") {
          console.error(`Port ${PORT} is already in use. Stop the other backend process or run with a different PORT.`);
        } else {
          console.error("Server startup error:", err);
        }
        process.exit(1);
      });
    })
    .catch((err) => {
      console.error("Startup error:", err);
      process.exit(1);
    });
}

export default app;
