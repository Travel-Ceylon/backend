import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
  roomType: { type: String, required: true },
  price: { type: Number, required: true },
  maxGuest: { type: Number, required: true },
  bedType: { type: String, required: true },
  facilites: {
    AC: { type: Boolean, default: false },
    WIFI: { type: Boolean, default: false }
  },
  images: {type:[String]}
});

const room = mongoose.model("Room", RoomSchema);

export default room