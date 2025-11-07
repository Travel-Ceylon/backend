import express from "express";
import { getMe, login, logout, register, updateServiceProvider } from "../controllers/serviceProviderController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.route("/")
    .post(register)
    .put(auth, updateServiceProvider);

router.route("/me").get(auth, getMe)
router.route("/login").post(login);
router.route("/logout").post(logout);

export default router