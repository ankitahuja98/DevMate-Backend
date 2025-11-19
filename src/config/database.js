const mongoose = require("mongoose");

async function connectDB() {
  await mongoose.connect(process.env.MongoUrl);
}

module.exports = connectDB;
