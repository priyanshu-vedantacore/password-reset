import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { logger } from "./config/logger.js";
import { validateEnv } from "./config/env.js";

dotenv.config();
const app = express();

// Validate environment configuration early
try {
  validateEnv();
} catch (e) {
  logger.error(e.message);
  process.exit(1);
}

// Security & core middlewares
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "*",
  credentials: true,
}));
app.use(express.json({ limit: "10kb" }));

// Rate limit auth endpoints to mitigate brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/api/auth", authLimiter, authRoutes);

// Connect DB
connectDB().catch((err) => {
  logger.error(`Failed to connect to DB: ${err.message}`);
  process.exit(1);
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
