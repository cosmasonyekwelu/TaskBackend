const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/env");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user", index: true },
    isActive: { type: Boolean, default: true, index: true },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    deletedAt: { type: Date, select: false }
  },
  { timestamps: true }
);

userSchema.index({ isActive: 1, createdAt: -1 });

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(config.bcryptRounds);
    this.password = await bcrypt.hash(this.password, salt);
    if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  }

  next();
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.deletedAt;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
