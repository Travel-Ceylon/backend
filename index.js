import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./config/db.js";
import userRouter from "./routes/userRoute.js";
import serviceProviderRouter from "./routes/serviceProviderRoute.js";
import taxiRouter from "./routes/taxiRoute.js";
import staysRouter from "./routes/staysRoute.js";
import guideRouter from "./routes/guideRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import cloudinaryRouter from "./routes/cloudinaryRoutes.js";

dotenv.config();

// Add error handling for DB connection
connectDB().catch((err) => {
  console.error("Failed to connect to DB:", err);
  process.exit(1);
});

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://travel-ceylon-eta.vercel.app",
    ],
    credentials: true,
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "hello" });
});

// API routes
app.use("/api/user", userRouter);
app.use("/api/service-provider", serviceProviderRouter);
app.use("/api/service/taxi", taxiRouter);
app.use("/api/service/stays", staysRouter);
app.use("/api/service/guide", guideRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/upload", cloudinaryRouter);

const port = process.env.PORT || 5001;

// Better error handling for server startup
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${port}`);
  console.log(`Access from network: http://0.0.0.0:${port}`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});