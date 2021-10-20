const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    required: [true, "Please add a course title"],
  },
  description: {
    type: String,
    required: [true, "Please add a description"],
  },
  weeks: {
    type: String,
    required: [true, "Please add number of weeks"],
  },
  tuition: {
    type: Number,
    required: [true, "Please add a tuition cost"],
  },
  minimumSkill: {
    type: String,
    required: [true, "Please add a minimum skill"],
    enum: ["beginner", "intermediate", "advanced"],
  },
  scholarshipAvailable: {
    type: Boolean,
    default: false,
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

//Static method to calculate average cost of a bootcamp i.e all courses in a bootcamp
courseSchema.statics.getAverageCost = async function (bootcampid) {
  const obj = await this.aggregate([
    {
      $match: { bootcamp: bootcampid },
    },
    {
      $group: {
        _id: "$bootcamp",
        averageCost: { $avg: "$tuition" },
      },
    },
  ]);
  if (obj.length !== 0) {
    try {
      await this.model("Bootcamp").findByIdAndUpdate(bootcampid, {
        averageCost: Math.ceil(obj[0].averageCost),
      });
    } catch (err) {
      console.error(err);
    }
  } else {
    await this.model("Bootcamp").findByIdAndUpdate(bootcampid, {
      averageCost: undefined,
    });
  }
};

//Calculate and save average cost of a bootcamp on addition of every course
courseSchema.post("save", async function (next) {
  await this.constructor.getAverageCost(this.bootcamp);
});

//Calculate and save average cost of a bootcamp on deletion of every course
courseSchema.post("remove", async function () {
  await this.constructor.getAverageCost(this.bootcamp);
});

module.exports = mongoose.model("Course", courseSchema);
