import express from "express"
import { auth } from "../middleware/auth.js";
import {
  getAllTaxi,
  createTaxiBooking,
  getAvailableTaxis,
  getTaxiProfile,
  registerTaxi,
  updateTaxi,
  changeBookingState,
  getBookingHistory,
  cancelBookingWithStatusUpdate,
  getProviderBookings,
  markBookingComplete,
  cancelBooking,
} from "../controllers/TaxiController.js";


const router = express.Router();

router.route("/")
    .post(auth, registerTaxi)
    .put(auth, updateTaxi)
    .get(getAllTaxi);

router.route("/profile").get(auth, getTaxiProfile);

router.route("/available").get(getAvailableTaxis);
router.route("/booking").post(auth, createTaxiBooking);
router.route("/booking/:bookingId").put(auth, changeBookingState);
router.route("/my-bookings").get(auth, getBookingHistory);
router
  .route("/bookings/:bookingId")
  .delete(auth, cancelBookingWithStatusUpdate);

router.route("/bookings").get(auth, getProviderBookings);
router.route("/bookings/:bookingId/complete").patch(auth, markBookingComplete);
router.route("/bookings/:bookingId/cancel").patch(auth, cancelBooking);

export default router;