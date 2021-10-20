const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a title for the review"],
    maxlength: 100,
  },
  text: {
    type: String,
    required: [true, "Please add some text"],
  },
  rating: {
    type: Number,
    required: [true, "Please add a rating between 1 and 10"],
    min: 1,
    max: 10,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  bootcamp: {
    type: mongoose.Schema.ObjectId,
    ref: "Bootcamp",
    required: true,
  },
});

//Prevent user from submitting more than 1 review per bootcamp
reviewSchema.index({ bootcamp: 1, user: 1 }, { unique: true });

//Static method to calculate average cost of a bootcamp i.e all courses in a bootcamp
reviewSchema.statics.getAverageRating = async function (bootcampid) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampid },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageRating: { $avg: "$rating" },
      },
    },
  ]);
  if (obj.length !== 0) {
    try {
      await this.model("Bootcamp").findByIdAndUpdate(bootcampid, {
        averageRating: obj[0].averageRating,
      });
    } catch (err) {
      console.error(err);
    }
  } else {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampid, {
      averageRating: null,
    });
  }
};

//Calculate and save average cost of a bootcamp on addition of every course
reviewSchema.post("save", async function (next) {
  await this.constructor.getAverageRating(this.bootcamp);
});

//Calculate and save average cost of a bootcamp on deletion of every course
reviewSchema.post("remove", async function () {
  await this.constructor.getAverageRating(this.bootcamp);
});

module.exports = mongoose.model("Review", reviewSchema);
