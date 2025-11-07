import guideModel from "../models/Guide.js";
import serviceProviderModel from "../models/ServiceProvider.js";
import guideBookingModel from "../models/Bookings/GuideBooking.js";

export const guideRegister = async (req, res) => {
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
        message: "Your service provider account could not be found. Please contact support.",
      });
    }

    if (provider.serviceId) {
      return res.status(400).json({
        success: false,
        message: "You already have a registered service. Multiple services under one account are not allowed.",
      });
    }

    const newGuide = await guideModel.create(req.body);

    provider.serviceId = newGuide._id;
    provider.serviceType = "Guide";
    await provider.save();

    res.status(201).json({
      success: true,
      message: "Guide registered successfully.",
      data: newGuide,
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({
      success: false,
      message: "Something went wrong while registering the guide. Please try again later.",
    });
  }
};

export const getGuideProfile = async (req, res) => {
  try {
    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const guide = await guideModel.findById(serviceProvider?.serviceId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "We couldn't find your guide profile. Please register first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Guide profile fetched successfully.",
      data: guide,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to fetch guide profile at the moment. Please try again later.",
    });
  }
};

export const getGuideProfilePublic = async (req, res) => {
  try {
    const guide = await serviceProviderModel
      .find({ serviceType: "Guide" }) // fixed from "Stays" to "Guide"
      .populate({
        path: "serviceId",
      })
      .select("-password");

    return res.status(200).json({
      success: true,
      message: "Public guide profiles fetched successfully.",
      data: guide,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to fetch public guide profiles. Please try again later.",
    });
  }
};

export const getAllGuides = async (req, res) => {
  try {
    const guides = await guideModel.find({});

    return res.status(200).json({
      success: true,
      message: "All guides fetched successfully.",
      count: guides.length,
      data: guides,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to fetch guides at the moment. Please try again later.",
    });
  }
};

export const updateGuide = async (req, res) => {
  try {
    if (req?.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update this guide.",
      });
    }

    const serviceProvider = await serviceProviderModel.findById(req.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const guide = await guideModel.findById(serviceProvider.serviceId);
    if (!guide) {
      return res.status(404).json({
        success: false,
        message: "Guide account not found. Please register first.",
      });
    }

    const {
      name,
      profilePic,
      images,
      specializeArea,
      province,
      district,
      city,
      languages,
      contact,
    } = req.body;

    if (name) guide.name = name;
    if (contact) guide.contact = contact;
    if (profilePic) guide.profilePic = profilePic;
    if (images) guide.images = images;
    if (specializeArea) guide.specializeArea = specializeArea;
    if (province) guide.province = province;
    if (district) guide.district = district;
    if (city) guide.city = city;
    if (languages) guide.languages = languages;

    await guide.save();

    res.status(200).json({
      success: true,
      message: "Guide profile updated successfully.",
      data: guide,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to update guide profile at the moment. Please try again later.",
    });
  }
};

export const getAvailableGuides = async (req, res) => {
  try {
    const { date, time, city, minPrice, maxPrice, languages, specializeArea } =
      req.query;

    if (!date || !time || !city) {
      return res.status(400).json({
        success: false,
        message: "Please provide date, city, and time to check availability.",
      });
    }

    const bookedGuides = await guideBookingModel
      .find({
        date: new Date(date),
        status: { $in: ["pending", "confirmed"] },
      })
      .select("serviceId");

    const bookedGuideIds = bookedGuides.map((b) => b.serviceId.toString());

    const filters = {};
    if (city) filters.city = city;
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = Number(minPrice);
      if (maxPrice) filters.price.$lte = Number(maxPrice);
    }
    if (specializeArea) filters.specializeArea = specializeArea;
    if (languages) filters.languages = { $all: languages };

    const availableGuides = await guideModel.find({
      ...filters,
      _id: { $nin: bookedGuideIds },
    });

    res.status(200).json({
      success: true,
      message: "Available guides fetched successfully.",
      count: availableGuides.length,
      data: availableGuides,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to fetch available guides right now. Please try again later.",
    });
  }
};

export const createGuideBooking = async (req, res) => {
  try {
    if (req.role !== "user") {
      return res.status(401).json({
        success: false,
        message: "Only users are allowed to book guides.",
      });
    }

    const { serviceId, date, time, requests } = req.body;
    const userId = req.user;

    const existingBooking = await guideBookingModel.findOne({
      serviceId,
      date: new Date(date),
      time,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: "This guide is already booked for the selected time. Please choose another slot.",
      });
    }

    const newBooking = await guideBookingModel.create({
      user: userId,
      serviceId,
      date,
      time,
      requests,
    });

    res.status(201).json({
      success: true,
      message: "Guide booking created successfully.",
      data: newBooking,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to create booking at the moment. Please try again later.",
    });
  }
};

export const changeBookingState = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (req?.role !== "provider") {
      return res.status(401).json({
        success: false,
        message: "You are not authorized to update booking status.",
      });
    }

    const serviceProvider = await serviceProviderModel.findById(req?.user);
    if (!serviceProvider) {
      return res.status(404).json({
        success: false,
        message: "Your service provider account could not be found.",
      });
    }

    const bookings = await guideBookingModel.find({
      serviceId: serviceProvider?.serviceId,
    });
    const bookingIds = bookings?.map((b) => b?._id.toString());

    if (!bookingIds.includes(bookingId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this booking.",
      });
    }

    // Correct status validation
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid booking status. Allowed values: pending, confirmed, cancelled, completed.",
      });
    }

    const booking = await guideBookingModel.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    booking.status = status;
    await booking.save();

    res.status(200).json({
      success: true,
      message: "Booking status updated successfully.",
      data: booking,
    });
  } catch {
    res.status(500).json({
      success: false,
      message: "Unable to update booking status at the moment. Please try again later.",
    });
  }
};
