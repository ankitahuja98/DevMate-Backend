const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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
      minlength: 1,
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
      maxlength: 200,
    },
  },
  { timestamps: true }
);

userSchema.methods.getJWT = async function () {
  const token = await jwt.sign({ _id: this._id }, process.env.JWT_SecretKey, {
    expiresIn: process.env.JWT_ExpiresIn,
  });
  return token;
};

userSchema.methods.ValidatePassword = async function (password) {
  const ValidatePassword = await bcrypt.compare(password, this.password);

  return ValidatePassword;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
