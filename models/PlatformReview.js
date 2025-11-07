import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    comment: String,
    rating: { type: Number, min: 0, max: 5 },
}, { timestamps: true });

const review = mongoose.model("PlatformReview", reviewSchema);

export default review;