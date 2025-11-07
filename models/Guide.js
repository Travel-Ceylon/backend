import mongoose from "mongoose";

const GuideSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nic: { type: String, required: true },
  contact: { type: [String], required: true },
  profilePic: { type: String },
  images: { type: [String] },
  email: { type: String },
  specializeArea: {
    history: {
      type: Boolean
    },
    wildLife: {
      type: Boolean
    },
    adventure: {
      type: Boolean
    }
  },
  province: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  languages: {
    sinhala: {
      type: Boolean
    },
    english: {
      type: Boolean
    },
    tamil: {
      type: Boolean
    },
    german: {
      type: Boolean
    },
    french: {
      type: Boolean
    }
  },
  guideLicenceImg: { type: String },
  policeClearanceImg: { type: String },
  price: { type: Number, required: true },
});

const guide = mongoose.model("Guide", GuideSchema);

export default guide;