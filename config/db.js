const mongoose = require("mongoose");
const colors = require("colors");

const connectDB = async () => {
  conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
  });

  console.log(
    `MongoDB Connected ${conn.connection.host}`.brightWhite.underline.bold
  );
};

module.exports = connectDB;
