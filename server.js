const path = require("path");
const express = require("express");
const fileUpload = require("express-fileupload");
//configuring here itself aboce requiring routes, otherwise geoCoder is not able to import the process variables
const dotenv = require("dotenv").config({ path: "./config/config.env" });
const colors = require("colors");
var cookieParser = require("cookie-parser");

//Error Handler Middleware function
const errorHandler = require("./middlewares/error");

//Express mongo sanitize
const mongoSanitize = require("express-mongo-sanitize");

//Helmet security Headers
const helmet = require("helmet");

//XSS Prevention
const xss = require("xss-clean");

//Rate Limiting
const rateLimit = require("express-rate-limit");

//cross origin resource sharing
var cors = require("cors");

//http parameter pollution protection
var hpp = require("hpp");

//Requiring routes
const bootcamps = require("./routes/bootcamps");
const auth = require("./routes/auth");
const courses = require("./routes/courses");
const users = require("./routes/users");
const reviews = require("./routes/reviews");

//Requiring logger middleware morgan
const morgan = require("morgan");

//Loading env variables

//Initialising app with express
const app = express();

//Middleware to use req.body i.e body parser
app.use(express.json());

//Cookie Parser
app.use(cookieParser());

//MongoDB connection variable
const connectDB = require("./config/db");

//Connect to db
connectDB();

//Dev logging middleware
if (process.env.NODE_ENV == "development") {
  app.use(morgan("combined"));
}

//Enable cross origin resource sharing i.e a different domain can request to our api.
app.use(cors());

//HPP http parameter pollution attack protection
app.use(hpp());

//Rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

//  apply to all requests
app.use(limiter);

//Security Headers
app.use(helmet());

//Prevent XSS
app.use(xss());

//Mongo Sanitize Data
app.use(mongoSanitize());

//File Upload Middleware
app.use(fileUpload());

//Set static folder
app.use(express.static(path.join(__dirname, "public")));

//Using bootcamp routes and connecting them with bootcamp uri
app.use("/api/v1/bootcamps", bootcamps);
app.use("/api/v1/courses", courses);
app.use("/api/v1/auth", auth);
app.use("/api/v1/users", users);
app.use("/api/v1/reviews", reviews);

//Using error handler middleware
app.use(errorHandler);

//Port to run on rnv port or 5000 if env port is not available
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`.yellow.bold);
});

//Handling unhandled promise rejections

process.on("unhandledRejection", (err, promise) => {
  //Logging error message
  console.log(`Error: ${err.message}`.red);
  //Closing server and exiting the process/application
  server.close(() => process.exit(1));
});
