import { getDistanceORS } from "../config/calculateDistance.js";
import { generateToken } from "../config/generateToken.js";
import userModel from "../models/User.js";
import bcrypt from "bcryptjs";

// ------------------------- User Registration -------------------------
export const register = async (req, res) => {
  try {
    const { name, email, password, profilePic, phone } = req.body;

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = await userModel.create({ name, email, password: hashPassword, phone, profilePic });

    // Generate token
    const token = generateToken(user._id, "user");

    // Send token as secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        role: "user"
      }
    );

  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ------------------------- User Login -------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid email or password" });

    const token = generateToken(user._id, "user");

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profilePic: user.profilePic,
        role: "user"
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ------------------------- Logout -------------------------
export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
    });

    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ------------------------- Get Current User -------------------------
export const getMe = async (req, res) => {
  try {
    const user = await userModel.findById(req.user).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "Profile not found" });

    res.status(200).json(
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user?.phone,
        profilePic: user?.profilePic,
        role: "user"
      }
    );
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// ------------------------- Update User -------------------------
export const updateUser = async (req, res) => {
  try {
    const { name, email, password, profilePic, phone } = req.body;
    const user = await userModel.findById(req.user);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (profilePic) user.profilePic = profilePic;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser?.phone,
        profilePic: updatedUser?.profilePic
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
