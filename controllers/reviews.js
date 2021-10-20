const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const Bootcamp = require("../models/Bootcamp");
const User = require("../models/User");
const Review = require("../models/Review");

//@desc     Get reviews
//@route    GET /api/v1/reviews
//@route    GET /api/v1/bootcamps/:bootcampid/reviews
//@access   Public

exports.getReviews = asyncHandler(async (req, res, next) => {
  //For the /api/v1/bootcamps/:bootcampid/reviews route
  if (req.params.bootcampid) {
    const reviews = await Review.find({ bootcamp: req.params.bootcampid });
    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
    //For the /api/v1/reviews route
  } else {
    res.status(200).json(res.advancedResults);
  }
});

//@desc     Get a single Review
//@route    GET /api/v1/reviews/:id
//@access   Public

exports.getReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!review) {
    return next(
      new ErrorResponse(`Review with the id ${req.params.id} not found`, 404)
    );
  } else {
    res.status(200).json({
      success: true,
      data: review,
    });
  }
});

//@desc     Add a Review
//@route    POST /api/v1/bootcamps/:bootcampid/reviews
//@access   Private/User

exports.addReview = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampid;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampid);
  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp with ID ${req.params.id} not found, cannot add the review`,
        404
      )
    );
  }
  const review = await Review.create(req.body);

  res.status(201).json({
    success: true,
    data: review,
  });
});

//@desc     Update a Review
//@route    PUT /api/v1/reviews/:id
//@access   Private/User

exports.updateReview = asyncHandler(async (req, res, next) => {
  let review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`Review with ID ${req.params.id} not found`, 404)
    );
  }

  //Make sure the review belong to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`User not authorized to update this review`, 401)
    );
  }

  review = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  //To trigger the middlewares
  await review.save();

  res.status(200).json({
    success: true,
    data: review,
  });
});

//@desc     Delete a Review
//@route    DELETE /api/v1/reviews/:id
//@access   Private/User

exports.deleteReview = asyncHandler(async (req, res, next) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    return next(
      new ErrorResponse(`Review with ID ${req.params.id} not found`, 404)
    );
  }

  //Make sure the review belong to user or user is admin
  if (review.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(`User not authorized to update this review`, 401)
    );
  }

  await review.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});
