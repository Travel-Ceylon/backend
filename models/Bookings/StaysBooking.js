import mongoose from "mongoose";

const staysBookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Stays" },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  roomId: { type: mongoose.Types.ObjectId, required: true, ref: "Room" },
  amount: { type: Number },
  status: { type: String, default: "pending", enum: ["pending", "confirmed", "cancelled", "completed"] },
});

const booking = mongoose.model("StaysBooking", staysBookingSchema);

export default booking;