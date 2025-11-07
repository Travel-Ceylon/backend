import express from "express";
import { auth } from "../middleware/auth.js";
import { addVehicle, changeBookingState, createRentBooking, deleteVehicle, getAllRents, getAvailableVehicles, getRentProfile, rentRegister, updateRent, updateVehicle } from "../controllers/rentController.js";


const router = express.Router();

router.route("/")
    .post(auth, rentRegister)
    .put(auth, updateRent)
    .get(getAllRents);

router.route("/profile").get(auth, getRentProfile);

router.route("/vehicle").post(auth, addVehicle);
router.route("/vehicle/:vehicleId").put(auth, updateVehicle);
router.route("/vehicle/:vehicleId").delete(auth, deleteVehicle);

router.route("/available").get(getAvailableVehicles);
router.route("/booking").post(auth,createRentBooking);
router.route("/booking/:bookingId").put(auth,changeBookingState);

export default router