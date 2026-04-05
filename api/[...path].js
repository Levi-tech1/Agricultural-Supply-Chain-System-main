/**
 * Single Vercel project: serve the Express API at /api/* (no BACKEND_URL proxy).
 * Same pattern as backend/api/[...path].js but imports from the workspace backend package.
 */
import app from "../backend/src/app.js";

export default app;
