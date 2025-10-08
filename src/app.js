import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.middleware.js";

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Connect DB
connectDB().catch((err) => {
  console.error("Failed to connect to DB:", err);
  process.exit(1);
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
