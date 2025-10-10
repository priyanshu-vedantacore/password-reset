import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  logger.error(`${req.method} ${req.originalUrl} -> ${status}`, err.stack || err.message);
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

