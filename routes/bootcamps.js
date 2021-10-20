const express = require("express");
const router = express.Router();
const {
  getBootcamp,
  getBootcamps,
  createBootcamp,
  updateBootcamp,
  deleteBootcamp,
  getBootcampsInRadius,
  uploadBootcampPhoto,
} = require("../controllers/bootcamps");

const { protect, authorize } = require("../middlewares/auth");
const advancedResults = require("../middlewares/advancedResults");

const Bootcamp = require("../models/Bootcamp");

//Get the Course Router
const courseRouter = require("./courses");

//Get the Review Router
const reviewRouter = require("./reviews");

//All the bootcamp routes
router
  .route("/")
  .get(advancedResults(Bootcamp, "courses"), getBootcamps) //Using Advanced Results middleware for get all route
  .post(protect, authorize("publisher", "admin"), createBootcamp);
//Using protect middleware to let only auth users to do this action
//Using authorize middleware after protect (req.user) is set to give access to publisher and admin to create a bootcamp

router
  .route("/:id")
  .get(getBootcamp)
  .put(protect, authorize("publisher", "admin"), updateBootcamp)
  .delete(protect, authorize("publisher", "admin"), deleteBootcamp);

router
  .route("/:id/photo")
  .put(protect, authorize("publisher", "admin"), uploadBootcampPhoto);

router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius);

//Rerouting to courses when all the courses in a bootcamp are requested
//@Url /api/v1/bootcamps/:bootcampid/courses
router.use("/:bootcampid/courses", courseRouter);

//Rerouting to review when all the review in a bootcamp are requested
//@Url /api/v1/bootcamps/:bootcampid/reviews
router.use("/:bootcampid/reviews", reviewRouter);

module.exports = router;
