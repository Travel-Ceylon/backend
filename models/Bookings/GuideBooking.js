import mongoose from "mongoose";

const guideBookingSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Guide" },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    requests: { type: String },
    amount: { type: Number },
    status: { type: String, default: "pending", enum: ["pending", "confirmed", "cancelled", "completed"] },
});

const booking = mongoose.model("GuideBooking", guideBookingSchema);

export default booking;