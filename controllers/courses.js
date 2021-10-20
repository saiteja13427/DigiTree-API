const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const Course = require("../models/Course");
const Bootcamp = require("../models/Bootcamp");

//@desc     Get Courses
//@route    GET /api/v1/courses
//@route    GET /api/v1/bootcamps/:bootcampid/courses
//@access   Public

exports.getCourses = asyncHandler(async (req, res, next) => {
  //For the /api/v1/bootcamps/:bootcampid/courses route
  if (req.params.bootcampid) {
    const courses = await Course.find({ bootcamp: req.params.bootcampid });
    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
    //For the /api/v1/courses route
  } else {
    res.status(200).json(res.advancedResults);
  }
});

//@desc     Get a single Course
//@route    GET /api/v1/courses/:id
//@access   Public

exports.getCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id).populate({
    path: "bootcamp",
    select: "name description",
  });

  if (!course) {
    next(
      new ErrorResponse(`Course with the id ${req.params.id} not found`, 400)
    );
  } else {
    res.status(200).json({
      success: true,
      data: course,
    });
  }
});

//@desc     Create a single Course
//@route    POST /api/v1/bootcamps/:bootcampid/courses
//@access   Private

exports.createCourse = asyncHandler(async (req, res, next) => {
  req.body.bootcamp = req.params.bootcampid;
  req.body.user = req.user.id;

  const bootcamp = await Bootcamp.findById(req.params.bootcampid);

  if (!bootcamp) {
    return next(
      new ErrorResponse(
        `Bootcamp with the id ${req.params.bootcampid} not found`,
        400
      )
    );
  }

  //Check if publisher is authorized owner of the bootcamp before letting him create a course
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to create a course in bootcamp with id ${bootcamp._id}`,
        401
      )
    );
  }

  const course = await Course.create(req.body);

  res.status(200).json({
    success: true,
    data: course,
  });
});

//@desc     Update a Course
//@route    PUT /api/v1/courses/:id
//@access   Private

exports.updateCourse = asyncHandler(async (req, res, next) => {
  let course = await Course.findById(req.params.id);

  if (!course) {
    return next(
      new ErrorResponse(`Course with the id ${req.params.id} not found`, 404)
    );
  }

  //Check if publisher is authorized owner of the course before letting him update a course
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to update this course`,
        401
      )
    );
  }

  course = await Course.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //To get the updated data
    runValidators: true, //To run the validators on the data
  });

  //To trigger the middlewares
  await course.save();

  res.status(201).json({
    success: true,
    data: course,
  });
});

//@desc     Delete a Course
//@route    DELETE /api/v1/courses/:id
//@access   Private

exports.deleteCourse = asyncHandler(async (req, res, next) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    return next(
      new ErrorResponse(`Course with the id ${req.params.id} not found`, 404)
    );
  }

  //Check if publisher is authorized owner of the course before letting him delete a course
  if (course.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to delete this course`,
        401
      )
    );
  }

  await course.remove();
  res.status(200).json({
    success: true,
    data: [],
  });
});
