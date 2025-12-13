const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
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

    profilePhoto: { type: String, default: "" },
    tagline: { type: String, maxLength: 100 },
    bio: { type: String, maxLength: 500 },
    location: { type: String },

    currentRole: { type: String },
    experience: {
      type: Number,
    },
    lookingForTitle: {
      type: String,
      enum: [
        "cofounder",
        "collaborator",
        "mentor",
        "team-member",
        "freelance-partner",
      ],
    },
    lookingForDesc: {
      type: String,
      maxlength: 500,
    },
    availability: {
      type: String,
      enum: ["full-time", "part-time", "weekends", "flexible"],
    },
    techStack: {
      type: [String],
    },
    projects: [
      {
        title: String,
        description: String,
        techUsed: [String],
        role: String,
        githubUrl: String,
        liveUrl: String,
      },
    ],
    socialLinks: {
      github: String,
      linkedin: String,
      portfolio: String,
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
