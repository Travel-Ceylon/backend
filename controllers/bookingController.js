import guideBookingModel from "../models/Bookings/GuideBooking.js";
import staysBookingModel from "../models/Bookings/StaysBooking.js";
import taxiBookingModel from "../models/Bookings/TaxiBooking.js"

export const getUserAllBookings = async (req, res) => {
    try {
        // Assuming req.user contains the user ID
        const userId = req.user;

        // Fetch bookings for the logged-in user
        const guideBookings = await guideBookingModel.find({ user: userId }).populate("serviceId");
        const staysBookings = await staysBookingModel.find({ user: userId }).populate("serviceId roomId");
        const taxiBookings = await taxiBookingModel.find({ user: userId }).populate("serviceId")
        // Send all bookings in a single response
        res.status(200).json({
            success: true,
            bookings: {
                guide: guideBookings,
                stays: staysBookings,
                taxi:taxiBookings
            },
        });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch bookings",
            error: error.message,
        });
    }
};
