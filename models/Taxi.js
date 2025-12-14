import mongoose from "mongoose";

const TaxiSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ServiceProvider",
    required: true,
  },
  driverName: { type: String, required: true },
  driverBio: { type: String }, //field about the driver's bio
  description: { type: String }, //vehicle description
  nic: { type: String, required: true },
  drivingId: { type: String, required: true },
  profilePic: { type: String },
  nicImg: String,
  drivingIdImg: String,
  contact: [String],
  website: String,
  images: [String],
  chasyNo: { type: String, required: true },
  vehicleNo: { type: String, required: true },
  province: String,
  vehicleType: { type: String, required: true },
  perKm: { type: Number, required: true },
  model: { type: String, required: true },
  city: {
    type: String,
    required: true,
    trim: true,
  },
  fuelType: { type: String, required: true },
});

const taxi = mongoose.model("Taxi", TaxiSchema);

export default taxi;
