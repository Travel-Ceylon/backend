import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  images: [String],
  chasyNo: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  province: { required: true, type: String },
  vehicleType: { type: String, required: true },
  area: { type: String, required: true },
  perDay: { type: Number, required: true }
});

const vehicle = mongoose.model("Vehicle", vehicleSchema)

export default vehicle;