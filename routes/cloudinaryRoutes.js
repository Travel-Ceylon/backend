import express from "express";
import { imageUpload } from "../controllers/cloudinaryController.js"
import { upload } from "../middleware/cloudinaryMiddleware.js";

const router = express.Router();

router.route("/").post(upload.single("my_file"), imageUpload);

export default router;