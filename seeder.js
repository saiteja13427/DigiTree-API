const fs = require("fs");
const mongoose = require("mongoose");
const colors = require("colors");
const dotenv = require("dotenv").config({ path: "./config/config.env" });

//Load The Bootcamp Model
const Bootcamp = require("./models/Bootcamp");
const Course = require("./models/Course");
const User = require("./models/User");
const Review = require("./models/Review");

//Connecting db
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
});

//Read JSON file
const bootcamps = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/bootcamps.json`, "utf-8")
);
const courses = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/courses.json`, "utf-8")
);
const users = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/users.json`, "utf-8")
);

const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/_data/reviews.json`, "utf-8")
);

//Import data into db
const importData = async () => {
  try {
    await Bootcamp.create(bootcamps);
    await Course.create(courses);
    await User.create(users);
    await Review.create(reviews);
    console.log("Data Imported..".green.inverse);
    process.exit(); //Exiting explicitly as we don't want to run anything else
  } catch (err) {
    console.error(err);
  }
};

//Destroy data in db completely
const destroyData = async () => {
  try {
    await Bootcamp.deleteMany();
    await Course.deleteMany();
    await User.deleteMany();
    await Review.deleteMany();
    console.log("Data Destroyed..".red.inverse);
    process.exit(); //Exiting explicitly as we don't want to run anything else
  } catch (err) {
    console.error(err);
  }
};

//@script Import Data => noder seeder -i
//@script Destroy Data => noder seeder -d
if (process.argv[2] === "-i") {
  importData();
} else if (process.argv[2] === "-d") {
  destroyData();
} else {
  consol.log("Enter either -i or -d as argument");
}
