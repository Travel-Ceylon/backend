import express from "express";
import { auth } from "../middleware/auth.js";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import {
    bookRoom,
    changeBookingState,
    deleteRoom,
    getAllStays,
    getAvailableStays,
    getStaysProfile,
    registerStays,
    updateRoom,
    updateStays
} from "../controllers/staysController.js";
import { addRoom } from "../controllers/staysController.js";

const router = express.Router();
router.route("/")
  .post(auth, upload.fields([{ name: "images" }, { name: "profilePic", maxCount: 1 }]), registerStays)
  .put(auth, updateStays)
  .get(getAllStays);

router.route("/profile").get(auth, getStaysProfile);

router.route("/rooms").post(auth, addRoom);
router.route("/rooms/:roomId").put(auth, updateRoom);
router.route("/rooms/:roomId").delete(auth, deleteRoom);

router.route("/available").get(getAvailableStays);
router.route("/booking").post(auth, bookRoom);
router.route("/booking/:bookingId").put(auth,changeBookingState);

export default router