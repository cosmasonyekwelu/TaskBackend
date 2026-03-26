const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      index: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
      index: true
    },
    deletedAt: {
      type: Date,
      select: false
    }
  },
  { timestamps: true }
);

productSchema.index({ isDeleted: 1, createdAt: -1 });
productSchema.index({ createdBy: 1, isDeleted: 1, createdAt: -1 });
productSchema.index({ title: "text", description: "text" });

productSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);
