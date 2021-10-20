const express = require("express");
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courses");

const { protect, authorize } = require("../middlewares/auth");
const advancedResults = require("../middlewares/advancedResults");

const Course = require("../models/Course");

//Mergeparams is true to be able to take reroute requests from bootcamp routes
const router = express.Router({ mergeParams: true }); //

//All the courses routes
router
  .route("/")
  .get(
    advancedResults(Course, {
      path: "bootcamp",
      select: "name description",
    }),
    getCourses
  )
  .post(protect, authorize("publisher", "admin"), createCourse);

//Single course route
router
  .route("/:id")
  .get(getCourse)
  .put(protect, authorize("publisher", "admin"), updateCourse)
  .delete(protect, authorize("publisher", "admin"), deleteCourse);

module.exports = router;
