const mongoose = require("mongoose");
const slugify = require("slugify");
const geocoder = require("../utils/geoCoder");

const BootcampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      unique: true,
      trim: true,
      maxlenght: [50, "Please give a name with less than 50 characters"],
    },
    slug: String,
    description: {
      type: String,
      required: [true, "Please add description"],
      trim: true,
      maxlenght: [
        500,
        "Please give a description with less than 500 characters",
      ],
    },
    website: {
      type: String,
      match: [
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
        "Please use a valid URL with HTTP or HTTPS",
      ],
    },
    phone: {
      type: String,
      match: [/[0-9]{10}/, "Please give your correct 10 digit phone number"],
    },

    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    address: {
      type: String,
      required: [true, "Please add an address"],
    },
    location: {
      // GeoJSON Point which is somethinig we will fetch from the MapQuest API
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
      formattedAddress: String,
      street: String,
      city: String,
      state: String,
      zipcode: String,
      country: String,
    },
    careers: {
      // Array of strings
      type: [String],
      required: true,
      //These are the only values it can have
      enum: [
        "Web Development",
        "Mobile Development",
        "UI/UX",
        "Data Science",
        "Business",
        "Other",
      ],
    },
    averageRating: {
      type: Number,
      min: [1, "Rating can't be less than 1"],
      max: [10, "Rating cam't be more than 10"],
    },
    averageCost: Number,
    photo: {
      type: String,
      default: "no_photo.jpg",
    },
    housing: {
      type: Boolean,
      default: false,
    },
    jobAssistance: {
      type: Boolean,
      default: false,
    },
    jobGuarantee: {
      type: Boolean,
      default: false,
    },
    acceptGi: {
      type: Boolean,
      default: false,
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    //enbling virtual
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//Cascade delete courses when a bootcamp is deleted
BootcampSchema.pre("remove", async function (next) {
  console.log("Courses being removed in bootcamp " + this.name);
  await this.model("Course").deleteMany({ bootcamp: this._id });
  next();
});

//Create Bootcamp slug from the name
BootcampSchema.pre("save", function (next) {
  //Converting name to slug and adding it to the slug field
  this.slug = slugify(this.name, { lower: true });
  //next so that the control is passed to the next middleware which will be error handling middleware here
  next();
});

//Geocode and create location from address
BootcampSchema.pre("save", async function (next) {
  console.log(process.env.GEOCODER_API_KEY);
  const loc = await geocoder.geocode(this.address);
  this.location = {
    type: "Point",
    coordinates: [loc[0].longitude, loc[0].latitude],
    formattedAddress: loc[0].formattedAddress,
    street: loc[0].streetName,
    city: loc[0].city,
    state: loc[0].stateCode,
    zipcode: loc[0].zipcode,
    country: loc[0].countrycode,
  };
  //Do not save address in db
  this.address = undefined;
  next();
});

//Creating course virtual
BootcampSchema.virtual("courses", {
  ref: "Course",
  localField: "_id",
  foreignField: "bootcamp",
  justOne: false,
});

module.exports = mongoose.model("Bootcamp", BootcampSchema);
