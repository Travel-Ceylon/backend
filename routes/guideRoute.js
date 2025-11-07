import express from "express"
import { auth } from "../middleware/auth.js";
import { changeBookingState, createGuideBooking, getAllGuides, getAvailableGuides, getGuideProfile, getGuideProfilePublic, guideRegister, updateGuide } from "../controllers/guideController.js";

const router = express.Router();

router.route("/")
    .post(auth, guideRegister)
    .get(getAllGuides)
    .put(auth, updateGuide);

router.route("/public").get(getGuideProfilePublic);

router.route("/profile").get(auth, getGuideProfile);

router.route("/available").get(getAvailableGuides);
router.route("/booking").post(auth, createGuideBooking);
router.route("/booking/:bookingId").put(auth,changeBookingState)

export default router;