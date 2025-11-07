import express from "express"
import { auth } from "../middleware/auth.js"
import {
    addReview,
    deleteReview,
    getAllReviews,
    updateReview
} from "../controllers/reviewController.js";

const router = express.Router();

router.route("/").post(auth, addReview)
router.route("/:id/review").put(auth, updateReview)
router.route("/:id/review").put(auth, deleteReview)
router.route("/:serviceType/:serviceId").get(getAllReviews)

export default router;