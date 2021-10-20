const mongoose = require("mongoose");
//Bcrypt package causes issues so better use bcryptjs
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    require: [true, "Please add a name"],
  },
  email: {
    type: String,
    required: [true, "Please add an email"],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  role: {
    type: String,
    enum: ["user", "publisher"], //Only these two roles can be assigned via register. Admin has to be created from db
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please add a password"],
    minlength: 6,
    select: false, //By default on GET you won't get the password.
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  confirmEmailToken: String,
  isEmailConfirmed: {
    type: Boolean,
    default: false,
  },
  twoFactorCode: String,
  twoFactorCodeExpire: Date,
  twoFactorEnable: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now, //Automatically inserts date on creation
  },
});

//Encrypt Password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10); //10 is the number of rounds
  this.password = await bcrypt.hash(this.password, salt);
});

//Sign and return JWT tokens
userSchema.methods.getSignedJWTTokens = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRY,
  });
};

//Check entered password with existing password for login
userSchema.methods.checkPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Generate and hash reset password token
userSchema.methods.getResetToken = async function () {
  //Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  //hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  return this.resetPasswordToken;
};

module.exports = mongoose.model("User", userSchema);
