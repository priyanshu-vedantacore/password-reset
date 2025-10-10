// src/services/auth.service.js
import User from "../models/user.model.js";
import { generateTokens } from "../utils/generateTokens.js";

export const registerUser = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const user = await User.create({ name, email, password });
  const tokens = generateTokens(user._id);
  return { user, tokens };
};
