import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "serviceType" },
    serviceType: { type: String, required: true, enum: ["Taxi", "Stays", "Guide", "Rent"] },
    comment: String,
    rating: { type: Number, min: 0, max: 5 },
}, { timestamps: true });

const review = mongoose.model("Review", reviewSchema);

export default review;