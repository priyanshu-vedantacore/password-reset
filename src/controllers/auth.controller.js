import { registerUser } from "../services/auth.service.js";
import User from "../models/user.model.js";
import { generateTokens } from "../utils/generateTokens.js";
import crypto from "crypto";

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: result.user._id,
        email: result.user.email,
        name: result.user.name,
      },
      tokens: result.tokens,
    });
  } catch (err) {
    next(err); // centralized error handling
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: "Invalid credentials" });

  const tokens = generateTokens(user._id);

  res.status(200).json({
    message: "Login successful",
    user: { id: user._id, name: user.name, email: user.email },
    tokens,
  });
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(404).json({ message: "No user with that email" });

  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  const message = `You requested a password reset. Click here: ${resetUrl}`;

  try {
    // TODO: replace with nodemailer logic
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: message,
    });

    res.status(200).json({ message: "Reset email sent" });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    next(error);
  }
};

// POST /api/auth/reset-password/:token
export const resetPassword = async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password)
    return res.status(400).json({ message: "Password is required" });

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user)
    return res.status(400).json({ message: "Invalid or expired reset token" });

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();
  res.status(200).json({ message: "Password reset successful" });
};
