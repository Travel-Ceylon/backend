import serviceProviderModel from "../models/ServiceProvider.js";
import taxiModel from "../models/Taxi.js";
import taxiBookingModel from "../models/Bookings/TaxiBooking.js";
import { getDistanceORS } from "../config/calculateDistance.js";

// ------------------------- Taxi -------------------------

export const registerTaxi = async (req, res) => {
  try {
    if (!req?.user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });
    if (req.role !== "provider")
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed" });

    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });
    if (provider.serviceId)
      return res.status(400).json({
        success: false,
        message: "Can't create multiple services using a single account",
      });

    const {
      driverName,
      driverBio,
      description,
      nic,
      drivingId,
      nicImg,
      drivingIdImg,
      contact,
      website,
      profilePic,
      perKm,
      location,
      chasyNo,
      vehicleNo,
      province,
      vehicleType,
      images,
    } = req.body;

    const taxiUser = await taxiModel.create({
      driverName,
      driverBio,
      description,
      nic,
      drivingId,
      nicImg,
      drivingIdImg,
      contact,
      website,
      profilePic,
      perKm,
      location,
      chasyNo,
      vehicleNo,
      province,
      vehicleType,
      images,
    });

    provider.serviceId = taxiUser._id;
    provider.serviceType = "Taxi";
    await provider.save();

    res.status(201).json({
      success: true,
      message: "Taxi registered successfully",
      data: taxiUser,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getTaxiProfile = async (req, res) => {
  try {
    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    const taxi = await taxiModel.findById(provider.serviceId);
    if (!taxi)
      return res
        .status(404)
        .json({ success: false, message: "Taxi profile not found" });

    return res.status(200).json({ success: true, data: taxi });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAllTaxi = async (req, res) => {
  try {
    const taxis = await taxiModel.find({});
    res.status(200).json({ success: true, count: taxis.length, data: taxis });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateTaxi = async (req, res) => {
  try {
    if (req.role !== "provider")
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed" });

    const provider = await serviceProviderModel.findById(req.user);
    const taxi = await taxiModel.findById(provider.serviceId);
    if (!taxi)
      return res
        .status(404)
        .json({ success: false, message: "Taxi not found" });

    const fields = [
      "driverName",
      "contact",
      "website",
      "profilePic",
      "location",
    ];
    fields.forEach((f) => {
      if (req.body[f] !== undefined) taxi[f] = req.body[f];
    });

    await taxi.save();
    res.status(200).json({
      success: true,
      message: "Taxi updated successfully",
      data: taxi,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ------------------------- Taxi Availability & Booking -------------------------

export const getAvailableTaxis = async (req, res) => {
  try {
    const { date, minPrice, maxPrice, vehicleType, pickup } = req.query;
    if (!date || !vehicleType || !pickup)
      return res.status(400).json({
        success: false,
        message: "Please provide date, vehicleType and pickup location",
      });

    const bookedTaxis = await taxiBookingModel
      .find({
        status: { $in: ["pending", "confirmed"] },
        date: new Date(date),
      })
      .select("serviceId");

    const bookedTaxiIds = bookedTaxis.map((b) => b.serviceId.toString());

    const filters = {
      _id: { $nin: bookedTaxiIds },
      vehicleType,
      location: pickup,
    };

    if (minPrice || maxPrice) {
      filters.perKm = {};
      if (minPrice) filters.perKm.$gte = Number(minPrice);
      if (maxPrice) filters.perKm.$lte = Number(maxPrice);
    }

    const available = await taxiModel.find(filters);
    res
      .status(200)
      .json({ success: true, count: available.length, data: available });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const createTaxiBooking = async (req, res) => {
  try {
    if (req.role !== "user")
      return res.status(403).json({
        success: false,
        message: "You are not allowed to book services",
      });

    const { taxiId, pickup, dropup, date, time } = req.body;
    if (!taxiId || !pickup || !dropup || !date)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });

    const distance = await getDistanceORS(pickup, dropup);
    if (distance === -1)
      return res.status(400).json({
        success: false,
        message: "Please check your pickup & dropup location names",
      });

    const existingBooking = await taxiBookingModel.findOne({
      status: { $in: ["pending", "confirmed"] },
      serviceId: taxiId,
      date: new Date(date),
    });
    if (existingBooking)
      return res.status(400).json({
        success: false,
        message: "Taxi is already booked for this date",
      });

    const selectedTaxi = await taxiModel.findById(taxiId);
    const newBooking = await taxiBookingModel.create({
      user: req.user,
      serviceId: taxiId,
      pickup,
      dropup,
      distance,
      amount: distance * (selectedTaxi?.perKm || 0),
      time,
      date: new Date(date),
      status: "pending",
    });

    res.status(201).json({
      success: true,
      message: "Taxi booked successfully",
      data: newBooking,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const changeBookingState = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (req.role !== "provider")
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service account not found" });

    const booking = await taxiBookingModel.findById(bookingId);
    if (
      !booking ||
      booking.serviceId.toString() !== provider.serviceId.toString()
    )
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });

    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status))
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking status" });

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
      data: booking,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
