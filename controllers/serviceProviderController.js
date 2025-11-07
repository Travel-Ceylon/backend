import { generateToken } from "../config/generateToken.js";
import serviceProviderModel from "../models/ServiceProvider.js";
import bcrypt from "bcryptjs";

export const register = async (req, res) => {
  try {
    const { email, password, serviceType, serviceId, verify } = req.body;

    const existingUser = await serviceProviderModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    const user = await serviceProviderModel.create({
      email,
      password: hashPassword,
      serviceType,
      serviceId,
      verify,
    });

    const token = generateToken(user._id, "provider");

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "Service provider registered successfully.",
      data: {
        _id: user._id,
        email: user.email,
        serviceType: user.serviceType,
        serviceId: user.serviceId,
        verify: user.verify,
        role: "provider",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};

export const updateServiceProvider = async (req, res) => {
  try {
    if (req.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this endpoint.",
      });
    }

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Service provider account not found.",
      });
    }

    if (req.body.email) serviceProvider.email = req.body.email;
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      serviceProvider.password = await bcrypt.hash(req.body.password, salt);
    }

    await serviceProvider.save();

    return res.status(200).json({
      success: true,
      message: "Service provider profile updated successfully.",
      data: {
        _id: serviceProvider._id,
        email: serviceProvider.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await serviceProviderModel.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id, "provider");

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        _id: user._id,
        email: user.email,
        serviceType: user.serviceType,
        serviceId: user.serviceId,
        verify: user.verify,
        role: "provider",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    if (req.role !== "provider") {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this endpoint.",
      });
    }

    const provider = await serviceProviderModel.findById(req.user).select("-password");
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: {
        profile: provider,
        role: "provider",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error.",
    });
  }
};
