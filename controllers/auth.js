const crypto = require("crypto");
const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

//@desc     Register a User
//@route    POST /api/v1/auth/register
//@access   Public

exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role } = req.body;

  const user = await User.create({
    name,
    email,
    password,
    role,
  });

  sendTokenResponse(user, 200, res);
});

//@desc     Login a User
//@route    POST /api/v1/auth/login
//@access   Public

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  //Validate
  if (!email || !password) {
    next(new ErrorResponse("Please provide an email and password", 400));
  }

  //Check for user
  const user = await User.findOne({
    email,
  }).select("+password");

  if (!user) {
    next(new ErrorResponse("Invalid Credentials", 401));
  } else {
    const checkPassword = await user.checkPassword(password);
    if (!checkPassword) {
      next(new ErrorResponse("Invalid Credentials", 400));
    } else {
      sendTokenResponse(user, 200, res);
    }
  }
});

//@desc     Log out a user
//@route    GET /api/v1/auth/logout
//@access   Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.cookie("token", "none", {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
  });
});

//@desc     Get a logged in user
//@route    GET /api/v1/auth/me
//@access   Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc     Update user details
//@route    PUT /api/v1/auth/updatedetails
//@access   Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const newDetails = {};

  if (req.body.email) {
    newDetails.email = req.body.email;
  }

  if (req.body.name) {
    newDetails.name = req.body.name;
  }
  const user = await User.findByIdAndUpdate(req.user.id, newDetails, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

//@desc     Update password
//@route    PUT /api/v1/auth/updatepassword
//@access   Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  if (!(await user.checkPassword(req.body.currentPassword))) {
    return next(new ErrorResponse("Wrong Password", 401));
  }

  user.password = req.body.newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

//@desc     Forgot Password
//@route    POST /api/v1/auth/password
//@access   Private
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(
      new ErrorResponse(`No user found with email ${req.body.email}`, 404)
    );
  }

  const resetToken = await user.getResetToken();

  await user.save({ validateBeforeSave: false });

  //create reset url
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/auth/resetpassword/${resetToken}`;

  //Message for email
  const message = `You are recieving this email as you or someone has requested a reset of a password. 
  Please make a PUT request to this url ${resetURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Token",
      message: message,
    });

    res.status(200).json({
      success: true,
      data: "Email Sent",
    });
  } catch (err) {
    console.error(err);
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    user.save();

    return next(new ErrorResponse(`Email could not be sent`, 500));
  }
});

//@desc     Reset Password
//@route    POST /api/v1/auth/resetpassword/:token
//@access   Private
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = req.params.token;

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse(`Invalid reset password token`, 404));
  }

  user.password = req.body.newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.save();

  sendTokenResponse(user, 200, res);
});

//Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJWTTokens();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV == "production") {
    options.secure = true;
  }

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};
