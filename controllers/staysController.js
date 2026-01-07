import staysModel from "../models/Stays.js";
import roomModel from "../models/Room.js";
import serviceProviderModel from "../models/ServiceProvider.js";
import staysBookingModel from "../models/Bookings/StaysBooking.js";

// ------------------------- Stays -------------------------
export const registerStays = async (req, res) => {
  try {
    if (!req?.user || req?.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to register a guide.",
      });
    }

    const provider = await serviceProviderModel.findById(req.user);
    if (!provider) {
      return res.status(404).json({
        success: false,
        message:
          "Your service provider account could not be found. Please contact support.",
      });
    }

    if (provider.serviceId) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a registered service. Multiple services under one account are not allowed.",
      });
    }

    const newStays = await staysModel.create(req.body);

    provider.serviceId = newStays._id;
    provider.serviceType = "Stays";
    await provider.save();

    res.status(201).json({
      success: true,
      message: "Stays registered successfully.",
      data: newStays,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateStays = async (req, res) => {
  try {
    if (!req?.user)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    const stay = await staysModel.findById(provider?.serviceId);
    if (!stay)
      return res
        .status(404)
        .json({ success: false, message: "Stay not found" });

    const fields = [
      "name",
      "location",
      "contact",
      "website",
      "facilities",
      "images",
      "description",
      "profilePic",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) stay[field] = req.body[field];
    });

    await stay.save();
    res.status(200).json({
      success: true,
      message: "Stay updated successfully",
      data: stay,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getStaysProfile = async (req, res) => {
  try {
    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    const stay = await staysModel
      .findById(provider.serviceId)
      .populate("rooms");
    if (!stay)
      return res
        .status(404)
        .json({ success: false, message: "Stay profile not found" });

    res.status(200).json({ success: true, data: stay });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const getAllStays = async (req, res) => {
  try {
    const stays = await staysModel.find({});
    res.status(200).json({ success: true, count: stays.length, data: stays });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ------------------------- Rooms -------------------------
export const addRoom = async (req, res) => {
  try {
    if (req.role !== "provider")
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed" });

    const { roomType, price, maxGuest, bedType, images, features } = req.body;
    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    const stay = await staysModel
      .findById(provider.serviceId)
      .populate("rooms");
    if (!stay)
      return res
        .status(404)
        .json({ success: false, message: "Stay not found" });

    const newRoom = await roomModel.create({
      roomType,
      price,
      maxGuest,
      bedType,
      images,
      features,
    });
    stay.rooms.push(newRoom._id);
    await stay.save();

    res.status(201).json({
      success: true,
      message: "Room added successfully",
      data: { room: newRoom, stay },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    if (req.role !== "provider")
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed" });

    const { roomId } = req.params;
    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    const stay = await staysModel.findById(provider.serviceId);
    if (!stay || !stay.rooms.some((id) => id.toString() === roomId.toString()))
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    const updatedRoom = await roomModel.findByIdAndUpdate(roomId, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: updatedRoom,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    if (req.role !== "provider")
      return res
        .status(403)
        .json({ success: false, message: "You are not allowed" });

    const { roomId } = req.params;
    const provider = await serviceProviderModel.findById(req.user);
    if (!provider)
      return res
        .status(404)
        .json({ success: false, message: "Service provider not found" });

    const stay = await staysModel.findById(provider.serviceId);
    if (!stay || !stay.rooms.some((id) => id.toString() === roomId.toString()))
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });

    await roomModel.findByIdAndDelete(roomId);
    stay.rooms = stay.rooms.filter((id) => id.toString() !== roomId.toString());
    await stay.save();

    res
      .status(200)
      .json({ success: true, message: "Room deleted successfully" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// ------------------------- Booking -------------------------
export const getAvailableStays = async (req, res) => {
  try {
    const {
      start_date,
      end_date,
      location,
      minPrice,
      maxPrice,
      numberOfGuest,
      numberOfRooms,
      staysFacilities,
      roomFacilities,
    } = req.query;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: "Please provide location",
      });
    }

    const guestCount = numberOfGuest ? parseInt(numberOfGuest) : 1;
    const roomCount = numberOfRooms ? parseInt(numberOfRooms) : 1;
    const minPriceFilter = minPrice ? parseFloat(minPrice) : null;
    const maxPriceFilter = maxPrice ? parseFloat(maxPrice) : null;

    const staysFilters = {};
    if (location) {
      staysFilters.location = { $regex: location.trim(), $options: "i" };
    }
    if (staysFacilities && staysFacilities.length > 0) {
      staysFilters.facilities = {
        $all: Array.isArray(staysFacilities)
          ? staysFacilities
          : [staysFacilities],
      };
    }

    // if dates are not provided, return stays list filtered by location/facilities
    if (!start_date || !end_date) {
      const stays = await staysModel.find(staysFilters).lean();
      return res
        .status(200)
        .json({ success: true, count: stays.length, data: stays });
    }

    // parse roomFacilities into array if provided
    const roomFacilitiesArr = roomFacilities
      ? Array.isArray(roomFacilities)
        ? roomFacilities
        : [roomFacilities]
      : [];

    const roomsFilters = { path: "rooms" };
    if (roomFacilitiesArr.length > 0)
      roomsFilters.match = { features: { $all: roomFacilitiesArr } };

    const allStays = await staysModel.find(staysFilters).populate(roomsFilters);

    // bookings overlapping requested dates
    const bookings = await staysBookingModel
      .find({
        status: { $in: ["pending", "confirmed"] },
        start_date: { $lte: new Date(end_date) },
        end_date: { $gte: new Date(start_date) },
      }).select("serviceId roomId");

    const result = allStays
      .map((stay) => {
        const bookedRoomIds = bookings
          .filter((b) => b.serviceId.toString() === stay._id.toString())
          .map((b) => b.roomId?.toString())
          .filter(Boolean);

        let availableRooms = stay.rooms.filter(
          (room) => !bookedRoomIds.includes(room._id.toString())
        );

        if (minPriceFilter !== null || maxPriceFilter !== null) {
          availableRooms = availableRooms.filter((room) => {
            const price = room.price || 0;
            return (
              (minPriceFilter === null || price >= minPriceFilter) &&
              (maxPriceFilter === null || price <= maxPriceFilter)
            );
          });
        }

        if (availableRooms.length < roomCount) return null;

        availableRooms.sort((a, b) => (b.maxGuest || 0) - (a.maxGuest || 0));
        const selectedRooms = availableRooms.slice(0, roomCount);
        const totalCapacity = selectedRooms.reduce(
          (sum, room) => sum + (room.maxGuest || 0),
          0
        );
        if (totalCapacity < guestCount) return null;

        const lowestPrice = Math.min(
          ...availableRooms.map((r) => r.price || 0)
        );
        return {
          stay,
          rooms: availableRooms,
          totalAvailableRooms: availableRooms.length,
          starting_from: lowestPrice,
        };
      })
      .filter(Boolean);

    res.status(200).json({ success: true, count: result.length, data: result });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

export const bookRoom = async (req, res) => {
  try {
    if (req.role !== "user")
      return res.status(403).json({
        success: false,
        message: "You are not allowed to book services",
      });

    const { stayId, roomId, start_date, end_date } = req.body;
    if (!stayId || !roomId || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide stayId, roomId, start_date and end_date",
      });
    }

    const stay = await staysModel.findById(stayId).populate("rooms");
    if (!stay)
      return res
        .status(404)
        .json({ success: false, message: "Stay not found" });

    if (!stay.rooms.some((r) => r._id.toString() === roomId)) {
      return res
        .status(400)
        .json({ success: false, message: "Room does not belong to this stay" });
    }

    const conflict = await staysBookingModel.findOne({
      serviceId: stayId,
      roomId,
      status: { $in: ["pending", "confirmed"] },
      $or: [
        {
          start_date: { $lte: new Date(end_date), $gte: new Date(start_date) },
        },
        { end_date: { $lte: new Date(end_date), $gte: new Date(start_date) } },
        {
          start_date: { $lte: new Date(start_date) },
          end_date: { $gte: new Date(end_date) },
        },
      ],
    });

    if (conflict)
      return res.status(400).json({
        success: false,
        message: "Room is already booked for these dates",
      });

    const newBooking = await staysBookingModel.create({
      user: req.user,
      serviceId: stayId,
      roomId,
      start_date,
      end_date,
      status: "pending",
    });
    res
      .status(201)
      .json({ success: true, message: "Booking successful", data: newBooking });
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
        .json({ success: false, message: "Service provider not found" });

    const booking = await staysBookingModel.findById(bookingId);
    if (
      !booking ||
      booking.serviceId.toString() !== provider.serviceId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this booking",
      });
    }

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid booking status" });
    }

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
