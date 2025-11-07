import mongoose from "mongoose";

const StaySchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  contact: [{
    type: String
  }],
  website: { type: String },
  facilities: {
    breakfast: { type: Boolean, default: false },
    roomService: { type: Boolean, default: false },
    bar: { type: Boolean, default: false },
    airportShuttle: { type: Boolean, default: false },
    fitnessCenter: { type: Boolean, default: false },
    garden: { type: Boolean, default: false },
    parking: { type: Boolean, default: false },
    familyRooms: { type: Boolean, default: false },
    freeWifi: { type: Boolean, default: false },
    airConditioning: { type: Boolean, default: false },
    spa: { type: Boolean, default: false },
    swimmingPool: { type: Boolean, default: false },
    waterPark: { type: Boolean, default: false }
  },
  rooms: [{
    room: {
      type: mongoose.Types.ObjectId,
      ref: "room"
    }
  }],
  images: [{
    type: String
  }],
  description: { type: String },
  profilePic: { type: String },
},
  { timestamps: true });

const stays = mongoose.model("Stays", StaySchema);

export default stays;
