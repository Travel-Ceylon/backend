import serviceProviderModel from "../models/ServiceProvider.js";
import taxiModel from "../models/Taxi.js";
import taxiBookingModel from "../models/Bookings/TaxiBooking.js";
import { getDistanceORS } from "../config/calculateDistance.js";

//resiter a taxi
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
      chasyNo,
      vehicleNo,
      province,
      vehicleType,
      images,
      city,
      model,
      fuelType,
    } = req.body;

    console.log("req body", req.body);

    const taxiUser = await taxiModel.create({
      providerId: req.user,
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
      chasyNo,
      vehicleNo,
      province,
      vehicleType,
      images,
      city,
      model,
      fuelType,
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

//get a taxi profile
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

//update taxi details
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
      "city",
      "model",
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
    const { date, drop, time, vehicleType, pickup } = req.query;
    if (!date || !vehicleType || !pickup || !time || !drop)
      return res.status(400).json({
        success: false,
        message: "Please provide necessory details",
      });

    const bookedTaxis = await taxiBookingModel
      .find({
        status: { $nin: ["cancelled", "completed"] },
        date: new Date(date),
      })
      .select("serviceId");

    const bookedvehicleIds = bookedTaxis.map((b) => b.serviceId.toString());

    const filters = {
      //exclude the booked taxis
      _id: { $nin: bookedvehicleIds },
      vehicleType,
      city: pickup,
    };

    const available = await taxiModel.find(filters);
    return res
      .status(200)
      .json({ success: true, count: available.length, data: available });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//make a booking ny the user
export const createTaxiBooking = async (req, res) => {
  try {
    if (req.role !== "user")
      return res.status(403).json({
        success: false,
        message: "You are not allowed to book services",
      });

    // Assuming you have fixed the 'pick' vs 'pick' issue based on the previous response
    const { vehicleId, pick, drop, date, time } = req.body;

    if (!vehicleId || !pick || !drop || !date)
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });

    // Checking if the taxi is unavailable (in 'contacted' state)
    const existingBooking = await taxiBookingModel.findOne({
      status: { $in: ["contacted"] },
      serviceId: vehicleId,
      date: new Date(date),
    });

    if (existingBooking)
      return res.status(400).json({
        success: false,
        message:
          "Taxi is currently requested for this date. Please try another.",
      });

    const selectedTaxi = await taxiModel.findById(vehicleId); // Used later for potential amount calculation

    const newBooking = await taxiBookingModel.create({
      user: req.user,
      serviceId: vehicleId,
      pickup: pick,
      dropup: drop,
      time: time,
      date: date,
      status: "contacted",
    });

    return res.status(201).json({
      success: true,
      message: "Taxi contact request successfully sent",
      data: newBooking,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

//change booking state when a user cancal a request
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

//get booking history
export const getBookingHistory = async (req, res) => {
  try {
    // Get user ID from the authentication middleware (req.user is typically set here)
    const userId = req.user;

    const bookings = await taxiBookingModel
      .find({ user: userId })
      .sort({ date: -1, time: -1 }) // Sort by newest first
      .lean(); // Use .lean() for faster query performance
    const bookingsWithVehicle = await Promise.all(
      bookings.map(async (booking) => {
        const vehicle = await taxiModel
          .findById(
            booking.serviceId,
            "driverName contact perKm images vehicleType model city vehicleNo "
          )
          .lean();
        return {
          ...booking,
          vehicleDetails: {
            model: vehicle?.model || "Unknown Taxi",
            image: vehicle?.images?.[0] || "default_image_url",
            vehicleType: vehicle?.vehicleType || "Car",
            contact1: vehicle?.contact?.[0] || "",
            contact2: vehicle?.contact?.[1] || "",
            city: vehicle?.city,
            perKm: vehicle?.perKm,
            driverName: vehicle?.driverName,
            vehicleNo: vehicle?.vehicleNo,
          },
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: bookingsWithVehicle,
    });
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};
//user can cancel his booking if he want
export const cancelBookingWithStatusUpdate = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    // Find the booking
    const booking = await taxiBookingModel.findOne({
      _id: bookingId,
      user: userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or you don't have permission to cancel it",
      });
    }

    // Check if booking can be cancelled
    if (booking.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a completed booking",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // Update status to cancelled
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        bookingId: bookingId,
        status: "cancelled",
        cancelledAt: booking.cancelledAt,
      },
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel booking",
      error: error.message,
    });
  }
};

// Controller to get all bookings for a provider's taxis
export const getProviderBookings = async (req, res) => {
  try {
    const providerId = req.user;

    console.log("🔍 Provider ID from req.user:", providerId);

    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Provider not authenticated." });
    }

    // Find all vehicles owned by this provider
    const providerVehicles = await taxiModel
      .find({ providerId: providerId })
      .lean();

    const vehicleIds = providerVehicles.map((vehicle) => vehicle._id);

    if (vehicleIds.length === 0) {
      console.log("⚠️ No vehicles found for this provider");
      return res.status(200).json({
        success: true,
        data: [],
        message: "No vehicles registered yet",
      });
    }

    // Find all bookings associated with those vehicle IDs and populate user
    const bookings = await taxiBookingModel
      .find({
        serviceId: { $in: vehicleIds },
      })
      .populate({
        path: "user",
        select: "name email phone profilePic",
      })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    // Format the response
    const formattedBookings = bookings.map((booking) => ({
      _id: booking._id,
      pickup: booking.pickup,
      dropup: booking.dropup,
      time: booking.time,
      date: booking.date,
      status: booking.status,
      additionalInfo: booking.additionalInfo || "",
      user: {
        name: booking.user?.name || "Unknown User",
        email: booking.user?.email || "N/A",
        phone: booking.user?.phone || "N/A",
        profilePic: booking.user?.profilePic || "/default-avatar.jpg",
      },
    }));

    return res.status(200).json({
      success: true,
      data: formattedBookings,
    });
  } catch (error) {
    console.error("Error fetching provider bookings:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Controller for marking booking as completed
export const markBookingComplete = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const providerId = req.user;

    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Provider not authenticated." });
    }

    // Find the booking
    const booking = await taxiBookingModel.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // Verify that this booking belongs to one of the provider's vehicles
    const providerVehicles = await taxiModel
      .find({ providerId: providerId }, "_id")
      .lean();

    const vehicleIds = providerVehicles.map((v) => v._id.toString());

    if (!vehicleIds.includes(booking.serviceId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to modify this booking.",
      });
    }

    // Update status to completed
    booking.status = "completed";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking marked as completed.",
      data: booking,
    });
  } catch (error) {
    console.error("Error marking booking complete:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

// Controller for cancelling booking
export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const providerId = req.user;

    if (!providerId) {
      return res
        .status(401)
        .json({ success: false, message: "Provider not authenticated." });
    }

    // Find the booking
    const booking = await taxiBookingModel.findById(bookingId);

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found." });
    }

    // Verify that this booking belongs to one of the provider's vehicles
    const providerVehicles = await taxiModel
      .find({ providerId: providerId }, "_id")
      .lean();

    const vehicleIds = providerVehicles.map((v) => v._id.toString());

    if (!vehicleIds.includes(booking.serviceId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to modify this booking.",
      });
    }

    // Update status to cancelled
    booking.status = "cancelled";
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking cancelled.",
      data: booking,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};
