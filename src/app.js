import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import authRoutes from "./routes/authRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

dotenv.config();
console.log("NEW DEPLOY CHECK")

export function createApp() {
    const app = express();

    app.use(
        cors({
          origin: "*",
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization"],
        })
      );
    app.options("*",cors());
    app.use(express.json());
    app.use("/uploads", express.static(path.resolve("uploads")));

    app.get("/api/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    app.use("/api/auth", authRoutes);
    app.use("/api/analyses", analysisRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
