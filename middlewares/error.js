const ErrorResponse = require("../utils/errorResponse");

const errorHandler = (err, req, res, next) => {
  /*Copying original err into error variable so that if we pass in any custom error response from
  controller, it still works*/
  let error = { ...err };
  error.message = err.message;

  console.log(err.stack.red.bold);

  //Mongoose Cast Error
  if (err.name === "CastError") {
    const message = `Resource not found`;
    error = new ErrorResponse(message, 404);
  }

  //Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const message = `Duplicate value entered`;
    error = new ErrorResponse(message, 400);
  }

  //Mongoose Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors); //Getting all the messages from the error array
    error = new ErrorResponse(message, 400);
  }

  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Server Error",
  });
};

module.exports = errorHandler;
