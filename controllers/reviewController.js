import reviewModel from "../models/Review.js";
import userModel from "../models/User.js";
import PlatformReviewModel from "../models/PlatformReview.js" 

export const addReview = async (req, res) => {
  try {
    const user = await userModel.findById(req.user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const { serviceId, serviceType, comment, rating } = req.body;

    if (!serviceId || !serviceType || rating === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: serviceId, serviceType, and rating are required.",
      });
    }

    const existingReview = await reviewModel.findOne({
      user: user._id,
      serviceId,
      serviceType,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this service.",
      });
    }

    const newReview = await reviewModel.create({
      user: user._id,
      serviceId,
      serviceType,
      comment,
      rating,
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully.",
      data: newReview,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to add review. Please try again later.",
      error: error.message,
    });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating } = req.body;

    const review = await reviewModel.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (review.user.toString() !== req.user) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own review.",
      });
    }

    if (comment !== undefined) review.comment = comment;
    if (rating !== undefined) review.rating = rating;

    await review.save();

    return res.status(200).json({
      success: true,
      message: "Review updated successfully.",
      data: review,
    });
  } catch (error) {
    console.error("Error updating review:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update review. Please try again later.",
      error: error.message,
    });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await reviewModel.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (review.user.toString() !== req.user) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own review.",
      });
    }

    await review.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete review. Please try again later.",
      error: error.message,
    });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const { serviceId, serviceType } = req.params;

    if (!serviceId || !serviceType) {
      return res.status(400).json({
        success: false,
        message: "serviceId and serviceType are required.",
      });
    }

    const reviews = await reviewModel.find({ serviceId, serviceType });

    return res.status(200).json({
      success: true,
      message: "Reviews fetched successfully.",
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch reviews. Please try again later.",
      error: error.message,
    });
  }
};


const addPlatformReview = async (req,res) => {
  try {
    const obj = req.body;
    obj.user = req.user;
    
    await PlatformReviewModel.create(req.body)
  } catch (error) {

  }
}