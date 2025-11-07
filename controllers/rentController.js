import rentModel from "../models/Rent.js";
import serviceProviderModel from "../models/ServiceProvider.js";
import vehicleModel from "../models/Vehicle.js";
import rentBookingModel from "../models/Bookings/RentBooking.js";

export const rentRegister = async (req, res) => {
  try {
    if (!req?.user || req.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to register a rent service.",
      });
    }

    const provider = await serviceProviderModel.findById(req.user);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    if (provider.serviceId) {
      return res.status(400).json({
        success: false,
        message: "You already have a registered service. Multiple services under one account are not allowed.",
      });
    }

    const newRent = await rentModel.create({
      name: req.body.name,
      contact: req.body.contact || [],
      profilePic: req.body.profilePic,
      nic: req.body.nic,
      nicImg: req.body.nicImg,
      vehicles: req.body.vehicles || [],
    });

    provider.serviceId = newRent._id;
    provider.serviceType = "Rent";
    await provider.save();

    return res.status(201).json({
      success: true,
      message: "Rent service registered successfully.",
      data: newRent,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Something went wrong while registering the rent service. Please try again later.",
    });
  }
};

export const getRentProfile = async (req, res) => {
  try {
    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const rent = await rentModel.findById(serviceProvider?.serviceId);
    if (!rent) {
      return res.status(404).json({
        success: false,
        message: "Rent profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Rent profile fetched successfully.",
      data: rent,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch rent profile. Please try again later.",
    });
  }
};

export const getAllRents = async (req, res) => {
  try {
    const rents = await rentModel.find({});
    return res.status(200).json({
      success: true,
      message: "All rent services fetched successfully.",
      count: rents.length,
      data: rents,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch rent services. Please try again later.",
    });
  }
};

export const updateRent = async (req, res) => {
  try {
    if (!req?.user || req.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update this rent service.",
      });
    }

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const rent = await rentModel.findById(serviceProvider.serviceId);
    if (!rent) {
      return res.status(404).json({
        success: false,
        message: "Rent profile not found.",
      });
    }

    const { name, contact, profilePic } = req.body;
    if (name) rent.name = name;
    if (contact) rent.contact = contact;
    if (profilePic) rent.profilePic = profilePic;

    await rent.save();

    return res.status(200).json({
      success: true,
      message: "Rent profile updated successfully.",
      data: rent,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update rent profile. Please try again later.",
    });
  }
};

export const addVehicle = async (req, res) => {
  try {
    if (req.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to add vehicles.",
      });
    }

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const rent = await rentModel.findById(serviceProvider.serviceId);
    if (!rent) {
      return res.status(404).json({
        success: false,
        message: "Rent service not found for this account.",
      });
    }

    const { images, chasyNo, vehicleNo, province, vehicleType, perDay, area } = req.body;

    const newVehicle = await vehicleModel.create({
      images: images || [],
      chasyNo,
      vehicleNo,
      province,
      vehicleType,
      perDay,
      area,
    });

    rent.vehicles.push(newVehicle._id);
    await rent.save();

    return res.status(201).json({
      success: true,
      message: "Vehicle added successfully.",
      data: newVehicle,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to add vehicle. Please try again later.",
    });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    if (req.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update vehicles.",
      });
    }

    const { vehicleId } = req.params;

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const rent = await rentModel.findById(serviceProvider.serviceId);
    if (!rent) {
      return res.status(404).json({
        success: false,
        message: "Rent service not found for this account.",
      });
    }

    if (!rent.vehicles.includes(vehicleId)) {
      return res.status(403).json({
        success: false,
        message: "This vehicle does not belong to your rent service.",
      });
    }

    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const { images, province, perDay, area } = req.body;
    if (images) vehicle.images = images;
    if (province) vehicle.province = province;
    if (perDay) vehicle.perDay = perDay;
    if (area) vehicle.area = area;

    await vehicle.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully.",
      data: vehicle,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle. Please try again later.",
    });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    if (req.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to delete vehicles.",
      });
    }

    const { vehicleId } = req.params;

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const rent = await rentModel.findById(serviceProvider.serviceId);
    if (!rent) {
      return res.status(404).json({
        success: false,
        message: "Rent service not found for this account.",
      });
    }

    if (!rent.vehicles.includes(vehicleId)) {
      return res.status(403).json({
        success: false,
        message: "This vehicle does not belong to your rent service.",
      });
    }

    const deletedVehicle = await vehicleModel.findByIdAndDelete(vehicleId);
    if (!deletedVehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    rent.vehicles = rent.vehicles.filter(id => id.toString() !== vehicleId);
    await rent.save();

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully.",
      data: deletedVehicle,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to delete vehicle. Please try again later.",
    });
  }
};

export const getAvailableVehicles = async (req, res) => {
  try {
    const { pickup, returnDate, area, vehicleType, minPrice, maxPrice } = req.query;

    if (!pickup || !returnDate || !area || !vehicleType) {
      return res.status(400).json({
        success: false,
        message: "Please provide pickup date, return date, area, and vehicle type.",
      });
    }

    const pickupDate = new Date(pickup);
    const return_Date = new Date(returnDate);

    if (pickupDate >= return_Date) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date.",
      });
    }

    const conflictingBookings = await rentBookingModel.find({
      $or: [{ pickup: { $lte: return_Date }, return: { $gte: pickupDate } }],
      status: { $in: ["pending", "confirmed"] },
    });

    const bookedVehicleIds = conflictingBookings.map(b => b.serviceId.toString());

    const filter = { vehicleType, area };
    if (minPrice && maxPrice) {
      filter.perDay = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    }

    const allVehicles = await vehicleModel.find(filter);
    const availableVehicles = allVehicles.filter(v => !bookedVehicleIds.includes(v._id.toString()));

    return res.status(200).json({
      success: true,
      message: "Available vehicles fetched successfully.",
      count: availableVehicles.length,
      data: availableVehicles,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch available vehicles. Please try again later.",
    });
  }
};

export const createRentBooking = async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(401).json({
        success: false,
        message: "Only users can create rent bookings.",
      });
    }

    const { vehicleId, pickup, returnDate, area } = req.body;
    if (!vehicleId || !pickup || !returnDate || !area) {
      return res.status(400).json({
        success: false,
        message: "vehicleId, pickup, returnDate, and area are required.",
      });
    }

    const pickupDate = new Date(pickup);
    const return_Date = new Date(returnDate);
    if (pickupDate >= return_Date) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date.",
      });
    }

    const vehicle = await vehicleModel.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found.",
      });
    }

    const conflict = await rentBookingModel.findOne({
      serviceId: vehicleId,
      status: { $in: ["pending", "confirmed"] },
      $or: [{ pickup: { $lte: return_Date }, return: { $gte: pickupDate } }],
    });

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: "Vehicle is not available for the selected dates.",
      });
    }

    const booking = await rentBookingModel.create({
      user: req.user,
      serviceId: vehicleId,
      pickup: pickupDate,
      return: return_Date,
      area,
      status: "pending",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      data: booking,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to create booking. Please try again later.",
    });
  }
};

export const changeBookingState = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (req.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update booking status.",
      });
    }

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Service provider account not found.",
      });
    }

    const bookings = await rentBookingModel.find({ serviceId: serviceProvider.serviceId });
    const bookingIds = bookings.map(b => b._id.toString());

    if (!bookingIds.includes(bookingId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this booking.",
      });
    }

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status. Allowed values: pending, confirmed, cancelled, completed.",
      });
    }

    const booking = await rentBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update booking status. Please try again later.",
    });
  }
};
