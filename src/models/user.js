const mongoose = require("mongoose");
const validator = require("validator");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      minlength: 4,
      maxlength: 50,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email id: " + value);
        }
      },
    },
    age: {
      type: Number,
      required: false,
      trim: true,
      min: 18,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 50,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
