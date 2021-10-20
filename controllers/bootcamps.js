const path = require("path");
const asyncHandler = require("../middlewares/async");
const geocoder = require("../utils/geoCoder");
const ErrorResponse = require("../utils/errorResponse");
const Bootcamp = require("../models/Bootcamp");
const { protect } = require("../middlewares/auth");

//@desc     Get all Bootcamps
//@route    GET /api/v1/bootcamps
//@access   Public

exports.getBootcamps = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

//@desc     Get single Bootcamp
//@route    GET /api/v1/bootcamps/:id
//@access   Public

exports.getBootcamp = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  //Check to return a 400 if we don't find a bootcamp with the requested id.
  if (!bootcamp) {
    //Correct format id but not there in db
    next(
      new ErrorResponse(`Bootcamp with the id ${req.params.id} not found`, 404)
    );
  } else {
    res.status(200).json({
      success: true,
      data: bootcamp,
    });
  }
});

//@desc     Create a Bootcamp
//@route    POST /api/v1/bootcamps
//@access   Private

exports.createBootcamp = asyncHandler(async (req, res, next) => {
  //Inserting user id which comes from protect middleware into req.body
  req.body.user = req.user.id;

  //Check for published bootcamps
  const createdBootcamps = await Bootcamp.find({ user: req.user.id });

  //Allow publisher to create a bootcamp only if he/she haven't done it before
  if (createdBootcamps.length !== 0 && req.user.role == "publisher") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} can't create more than 1 Bootcamps`,
        400
      )
    );
  }

  //Using await as it is an asynchronous function
  const bootcamp = await Bootcamp.create(req.body);
  //Passing a 201 update successful status and sending success true message with the promise returned by create
  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

//@desc     Update a Bootcamp
//@route    PUT /api/v1/bootcamps/:id
//@access   Private

exports.updateBootcamp = asyncHandler(async (req, res, next) => {
  let bootcamp = await Bootcamp.findById(req.params.id);

  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp with the id ${req.params.id} not found`, 404)
    );
  }

  //Check if publisher is authorized owner of the bootcamp before letting him update
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to update this bootcamp`,
        401
      )
    );
  }

  bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
    new: true, //To get the updated data
    runValidators: true, //To run the validators on the data
  });

  res.status(201).json({
    success: true,
    data: bootcamp,
  });
});

//@desc     Delete a Bootcamp
//@route    DELETE /api/v1/bootcamps/:id
//@access   Private

exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
  //Using findById and then remove so that mongoose pre remove middleware gets triggered
  //findByIdAndDelete doesn't trigger mongoose middlewares as it is a builting mongodb method
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp with the id ${req.params.id} not found`, 404)
    );
  }

  //Check if publisher is authorized owner of the bootcamp before letting him delete
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to delete this bootcamp`,
        401
      )
    );
  }

  bootcamp.remove();
  res.status(200).json({
    success: true,
    data: [],
  });
});

//@desc     Get bootcamps in a radius
//@route    GET /api/v1/bootcamps/radius/:zipcode/:distance
//@access   Private

exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  //Get lat/longited from zip using geocoder await is important
  const loc = await geocoder.geocode(zipcode);
  const lng = loc[0].longitude;
  const lat = loc[0].latitude;

  //Calculating the radius in radians using distance
  //Dividing distance with radius of earth = 3958 miles;

  const radius = distance / 3968;

  //Getting bootcamps using $geoWithin
  //$centerSphere: Defines a circle for a geospatial query that uses spherical geometry
  //$geoWithin: Selects documents with geospatial data that exists entirely within a specified shape
  //await is important
  const bootcamps = await Bootcamp.find({
    location: {
      $geoWithin: { $centerSphere: [[lng, lat], radius] },
    },
  });

  res.status(200).json({
    success: true,
    count: bootcamps.length,
    data: bootcamps,
  });
});

//@desc     Upload a Bootcamp Photo
//@route    PUT /api/v1/bootcamps/:id/photo
//@access   Private

exports.uploadBootcampPhoto = asyncHandler(async (req, res, next) => {
  const bootcamp = await Bootcamp.findById(req.params.id);
  if (!bootcamp) {
    return next(
      new ErrorResponse(`Bootcamp with the id ${req.params.id} not found`, 404)
    );
  }

  //Check if publisher is authorized owner of the bootcamp before letting him upload a photo
  if (bootcamp.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User with ID ${req.user.id} is not authorized to upoad a photo to this bootcamp`,
        401
      )
    );
  }

  if (!req.files) {
    next(new ErrorResponse(`Please upload an image`, 404));
  } else {
    const file = req.files.file;

    //Check if it is an image
    if (!file.mimetype.startsWith("image")) {
      next(new ErrorResponse(`Please upload an image file`, 404));
    }

    //Check size
    if (file.size > process.env.MAX_FILE_UPLOAD) {
      next(
        new ErrorResponse(
          `Please upload a file less than ${process.env.MAX_FILE_UPLOAD}`,
          404
        )
      );
    }

    //Create custom file name
    file.name = `photo_${bootcamp._id}${path.parse(file.name).ext}`;
    file.mv(
      `${process.env.FILE_UPLOAD_PATH}/${file.name}`,
      async function (err) {
        if (err) {
          console.error(err);
          next(new ErrorResponse(`Upload problem`, 500));
        }

        //Updating photo
        await Bootcamp.findByIdAndUpdate(bootcamp._id, { photo: file.name });
        res.status(200).json({
          success: true,
          data: file.name,
        });
      }
    );
  }
});
