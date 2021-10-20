const JWT = require("jsonwebtoken");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const asyncHandler = require("./async.js");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  //Token via bearer token in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  //Token via cookie
  // else if (req.cookies.token) {
  //   token = req.cookies.token;
  // }

  //Make sure token exists
  if (!token) {
    return next(new ErrorResponse("Not Authorized to Access This Route", 401));
  }

  //Verify the token
  try {
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    console.log(decoded);
    req.user = await User.findById(decoded.id);
    next();
  } catch (error) {
    console.log(error);
    return next(new ErrorResponse("Not Authorized to Access This Route", 401));
  }
});

//Give access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
