import mongoose from "mongoose";
import { logger } from "./logger.js";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected");
  } catch (error) {
    logger.error("DB Connection Failed", error.message);
    process.exit(1);
  }
};

