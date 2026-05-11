import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist/public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Serve uploaded files from uploads directory
  const uploadsPath = path.resolve(__dirname, "../uploads");
  app.use("/uploads", express.static(uploadsPath));

  // fall through to index.html if the file doesn't exist, but only for non-API routes
  app.use((req, res, next) => {
    // Don't intercept API routes
    if (req.path.startsWith("/api")) {
      return next();
    }

    // Send index.html for all other routes
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
