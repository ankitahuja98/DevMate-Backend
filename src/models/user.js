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
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      minlength: 1,
      maxlength: 50,
      default: "",
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email id: " + value);
        }
      },
    },
    age: {
      type: Number,
      required: false,
      min: 18,
      default: null,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 4,
      maxlength: 200,
      default: "",
    },

    profilePhoto: { type: String, default: "" },
    tagline: { type: String, maxLength: 100, default: "" },
    bio: { type: String, maxLength: 500, default: "" },
    location: { type: String, default: "" },

    currentRole: { type: String, default: "" },
    experience: {
      type: Number,
      default: null,
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
      default: null,
    },
    lookingForDesc: {
      type: String,
      maxlength: 500,
      default: "",
    },
    availability: {
      type: String,
      enum: ["full-time", "part-time", "weekends", "flexible"],
      default: null,
    },
    techStack: {
      type: [String],
      default: [],
    },
    interests: { type: [String], default: [] },
    projects: {
      type: [
        {
          title: String,
          description: String,
          techUsed: [String],
          role: String,
          githubUrl: String,
          liveUrl: String,
        },
      ],
      default: [],
    },
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      portfolio: { type: String, default: "" },
    },
    isNewUser: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isUserProfileCompleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      default: "",
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpAttempts: {
      type: Number,
    },
    otpResendCount: {
      type: Number,
    },
    otpLastSentAt: {
      type: Date,
    },
  },

  { timestamps: true },
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

userSchema.methods.validateOtp = async function (otp) {
  const ValidateOtp = await bcrypt.compare(otp, this.otpHash);

  return ValidateOtp;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
